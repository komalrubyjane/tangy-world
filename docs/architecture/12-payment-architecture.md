# 12 — Payment Architecture (Razorpay)

**Code: IMPLEMENTED.** **Production: PRODUCTION CONFIGURATION, NOT DONE.** Still to do: Razorpay keys and webhook secret as Edge Function secrets, the webhook URL configured in the Razorpay dashboard, and test-mode verification (`docs/OPERATIONS.md` §3, §3a).

## Components

| Component | File | Notes |
|---|---|---|
| Checkout UI | `src/pages/BookingPage.jsx` | Loads `https://checkout.razorpay.com/v1/checkout.js` on demand; retries with the same details reuse the same order (`orderRef` fingerprint) |
| Client service | `src/lib/bookingService.js` | `createPaymentOrder`, `verifyPayment`, `sendTicketEmail` (all `functions.invoke`) |
| Order creation | `supabase/functions/razorpay-create-order` | JWT check → validation → `create_pending_booking` (service role) → Razorpay Orders API |
| Checkout verification | `supabase/functions/razorpay-verify-payment` | JWT + ownership + HMAC → `settle_payment('verify')` |
| Webhook | `supabase/functions/razorpay-webhook` | HMAC on raw body → dedupe in `payment_webhook_events` → `settle_payment('webhook')` / failure / refund mirror |
| Pricing | `booking_quote()` (0026) | Ticket price × quantity + tax at `bookings.tax_percent` (default 18) |
| Seat hold | `create_pending_booking()` (latest 0027) | Event row lock; capacity = confirmed + pending + live waitlist holds |
| Settlement | `settle_payment()` (latest 0027) | The only place a paid booking is confirmed |
| Hold expiry | `expire_stale_bookings()` (0020) | Pending > `bookings.pending_timeout_minutes` (default 30) → `expired` |
| Crypto | `_shared/crypto.ts` | `hmacSha256Hex`, `timingSafeEqual`, `requireSecret` (≥ 8 chars, never `"undefined"`) |

## End-to-end architecture

```mermaid
---
title: Razorpay architecture — order, checkout, verify, webhook, settle
---
sequenceDiagram
  autonumber
  actor C as Customer browser
  participant BS as bookingService
  participant CO as razorpay-create-order
  participant DB as Postgres
  participant RZ as Razorpay API
  participant CK as Razorpay Checkout.js
  participant VP as razorpay-verify-payment
  participant WH as razorpay-webhook
  C->>BS: Pay (eventId, tierId, qty, names, details)
  BS->>CO: functions.invoke + user JWT
  CO->>CO: auth.getUser() · validate qty 1–50, name, email, Indian mobile, names = qty, tier code
  CO->>DB: read event (service role) · status on-sale, or sold-out with live waitlist offer
  CO->>DB: rpc create_pending_booking(..., p_amount null)
  DB->>DB: expire_stale_bookings() · lock event · validate type, answers · capacity check
  DB->>DB: amount = booking_quote(total) · insert bookings pending
  DB-->>CO: booking (amount in rupees)
  CO->>RZ: POST /v1/orders amount × 100 paise, receipt registration_code
  RZ-->>CO: order id
  CO->>DB: bookings.razorpay_order_id = order id
  CO-->>C: order_id, amount, currency INR, key_id, booking_id
  C->>CK: open checkout(order_id, key_id, prefill)
  CK->>RZ: customer pays
  RZ-->>CK: razorpay_payment_id, razorpay_signature
  CK->>VP: handler → verifyPayment
  VP->>VP: auth.getUser() · booking owner · order match · HMAC(order|payment) constant-time
  VP->>DB: settle_payment(order, payment, null, 'verify')
  DB-->>VP: confirmed / already_confirmed / needs_review
  VP->>DB: enqueueTicketEmail (email_outbox)
  VP-->>C: booking + tickets → confirmation + booking QR
  RZ-)WH: webhook payment.captured / order.paid (signed)
  WH->>WH: HMAC(raw body, webhook secret) constant-time
  WH->>DB: insert payment_webhook_events(event_id unique)
  WH->>DB: settle_payment(order, payment, amount_paise, 'webhook')
  WH->>DB: enqueueTicketEmail · mark event processed
  WH-->>RZ: 200 (or 500 to request redelivery)
```

`settle_payment` is the **final source of truth**, because the webhook runs whether or not the browser completes. Both paths converge on it, under row locks on the event and the booking.

## settle_payment decision tree

```mermaid
---
title: settle_payment(order, payment, amount, source)
---
flowchart TD
  classDef dec fill:#fff3c4,stroke:#b38600,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef res fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  S(["settle_payment"]) --> V{"valid source verify/webhook,<br/>order + payment ids?"}:::dec
  V -- no --> X["raise Invalid settlement<br/>request"]:::err
  V -- yes --> F{"booking with this order?"}:::dec
  F -- no --> NF["result not_found<br/>(webhook: permanent failure<br/>recorded)"]:::err
  F -- yes --> L["lock events row · lock<br/>booking row"]:::db
  L --> C{"already confirmed?"}:::dec
  C -- yes --> AC["already_confirmed<br/>(idempotent)"]:::res
  C -- no --> AM{"webhook amount ≠ booking<br/>total?"}:::dec
  AM -- yes --> RV["needs_review: wrong amount"]:::err
  AM -- no --> CA{"booking cancelled /<br/>refunded?"}:::dec
  CA -- yes --> RV2["needs_review: paid for a<br/>cancelled booking"]:::err
  CA -- no --> EXP{"booking expired / failed<br/>(late payment)?"}:::dec
  EXP -- yes --> SEAT{"seats still free incl.<br/>waitlist holds?"}:::dec
  SEAT -- no --> RV3["needs_review: hold expired,<br/>seats gone"]:::err
  SEAT -- yes --> OK
  EXP -- no --> PEN{"status pending?"}:::dec
  PEN -- no --> RV4["needs_review: unexpected<br/>state"]:::err
  PEN -- yes --> OK["status confirmed · payment<br/>captured · signature<br/>verified<br/>confirm_booking_and_issue_tickets<br/>late → audit<br/>payment.late_accepted"]:::res
  RV & RV2 & RV3 & RV4 --> NR["payment_status needs_review<br/>· audit payment.needs_review<br/>notify payments.view holders<br/>(payment.review, urgent,<br/>emailed)<br/>refund or reseat manually"]:::db
```

## Special cases (all supported by code)

| Case | What happens | Where |
|---|---|---|
| **Failed payment** | Checkout `payment.failed` → UI error. Webhook `payment.failed` → booking `failed` / `payment_status failed` **only while still pending** (never overwrites confirmed). Seats are released, and the `waitlist_on_booking_release` trigger offers them onwards | `BookingPage`, `razorpay-webhook` |
| **Payment succeeds, browser closes** | The webhook settles and queues the ticket email; the customer sees the booking in `/dashboard` | `razorpay-webhook` |
| **Duplicate webhook** | `payment_webhook_events.event_id` (`<event>:<payment id>`) is unique. A duplicate of a processed event → `200 ok (duplicate)`. A duplicate of a recorded-but-unfinished event is processed now | `razorpay-webhook` |
| **Invalid signature** | `400 Invalid signature`, nothing recorded | `razorpay-webhook`, `razorpay-verify-payment` |
| **Missing secret** | create-order: `503` and the hold is released (`status failed`). verify: `503`. webhook: `503` | functions |
| **Razorpay order API fails** | `502`; the booking is marked `failed` so the seats are freed | `razorpay-create-order` |
| **Late payment** (paid after the 30-min hold expired) | Accepted if seats are still free (audit `payment.late_accepted`), else `needs_review`. A second trigger `flag_late_payment` audits and alerts on any expired → confirmed change | `settle_payment`, `flag_late_payment` |
| **Wrong amount** | Webhook amount (paise) ≠ booking total → `needs_review` | `settle_payment` |
| **Refund** | **Issued manually in the Razorpay dashboard.** Webhook `refund.processed` / `refund.created` mirrors `refunded_amount` and `payment_status` `refunded` / `partially_refunded`. The admin records the refund (`admin_record_refund` with the Razorpay reference), which sets the booking `refunded` and cancels tickets | `razorpay-webhook`, 0017 |
| **Partial refund** | Mirrored as `payment_status = partially_refunded` (amount refunded < total) | `razorpay-webhook` |
| **Retry / redelivery** | A transient DB error returns `500` so Razorpay retries. A permanent failure is stored (`record_webhook_failure` → `processing_error` + `payment.webhook_failed` alert) and acknowledged with `200` | `razorpay-webhook` |
| **Idempotency** | settle (`already_confirmed`), ticket issuance (exists check), ticket email (dedupe key), webhook events (unique id) | — |
| **Hold expiry** | `expire_stale_bookings` (every 5 min via `run_platform_jobs`, and before every new checkout): pending, unpaid, older than 30 min → `expired`, customer notified (`booking_payment.expired`, in-app), audit `booking.expired`, seats → waitlist | 0020 |
| **payment.authorized** | Status mirror only (`payment_status authorized`) | `razorpay-webhook` |
| **Manual capture accounts** | **DOCUMENTED BUT NOT VERIFIED IN CODE.** The code never calls Razorpay's capture API; the runbook requires automatic capture | `docs/OPERATIONS.md` §3a |

## Payment status values

| Column | Values |
|---|---|
| `bookings.status` (enum `booking_status`) | `pending`, `confirmed`, `cancelled`, `refunded`, `expired`, `failed` |
| `bookings.payment_status` | `created`, `authorized`, `captured`, `failed`, `refunded`, `partially_refunded`, `not_required`, `needs_review` (constraint 0026) |
| `bookings.source` | `online` (checkout), `complimentary` (admin comp booking) |
