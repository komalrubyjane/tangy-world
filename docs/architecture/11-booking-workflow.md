# 11 — Customer Booking Workflow

**Status: IMPLEMENTED in code**, verified locally by `e2e/checkout.mjs`, `e2e/groupcheckin.mjs` and `supabase/tests/pricing_settlement.test.sql`. Live payments need the Razorpay secrets (**PRODUCTION CONFIGURATION, not done**, `docs/OPERATIONS.md` §3).

## Customer journey

```mermaid
---
title: Customer journey — session to check-in
---
flowchart TD
  classDef start fill:#1f6f43,color:#fff
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef dec fill:#fff3c4,stroke:#b38600,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef ext fill:#efe0f5,stroke:#6b3d87,color:#222
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef res fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  S(["/sessions → pick a session"]):::start --> D["/sessions/:slug · BookingPage<br/>useSessionDetail: event · line-up · ticket types · event_availability<br/>Realtime event_availability_signal + refresh on focus / 2 min"]:::proc
  D --> T["Select ticket type + quantity (event min–max)<br/>booking_quote() → subtotal + tax (bookings.tax_percent, 18) = total"]:::db
  T --> AV{"Seats available?"}:::dec
  AV -- no --> WL["Join waitlist (15)"]:::proc
  AV -- yes --> LI{"Signed in?"}:::dec
  LI -- no --> LM["openLoginModal('TO BOOK THIS SESSION') · email OTP"]:::proc --> LI
  LI -- yes --> FM["Booking form: name · email · 10-digit mobile · one name per attendee<br/>event questions · Instagram · note · collaboration interests"]:::proc
  FM --> CO["bookingService.createPaymentOrder → razorpay-create-order"]:::proc
  CO --> HOLD["create_pending_booking (service role)<br/>event row lock · capacity incl. pending + waitlist holds · price from DB<br/>bookings status pending = SEAT HOLD"]:::db
  HOLD -- "SOLD_OUT / INVALID_*" --> E1["400 / 409 message · page refreshes availability"]:::err
  HOLD --> RO["Razorpay Orders API · order id attached to booking"]:::ext
  RO --> CK["Razorpay Checkout.js modal in browser<br/>key_id returned by the function"]:::ext
  CK --> PAY{"Customer pays"}:::dec
  PAY -- "dismissed / failed" --> E2["pay status dismissed / failed<br/>hold expires after bookings.pending_timeout_minutes (30)"]:::err
  PAY -- success --> VP["handler → razorpay-verify-payment<br/>HMAC(order_id | payment_id)"]:::proc
  VP --> SET["settle_payment(source verify)<br/>→ confirmed + tickets"]:::db
  CK -. "in parallel, independent of the browser" .-> WH["Razorpay webhook → razorpay-webhook<br/>settle_payment(source webhook)"]:::ext
  WH --> SET
  SET --> TK["confirm_booking_and_issue_tickets<br/>one ticket per named attendee"]:::db
  TK --> EQ["enqueueTicketEmail → email_outbox (dedupe ticket.confirmed:booking)"]:::db
  TK --> QR["Browser shows confirmation + ONE booking QR<br/>TANGY:BOOKING:group_token (generated client-side)"]:::res
  EQ --> EM["send-notification-emails (scheduler) → Resend<br/>email with booking-pass.png"]:::ext
  QR --> DASH["/dashboard → bookings · tickets · QR"]:::res
  DASH --> DAY["Event day · staff scan QR · check in attendees by name (14)"]:::res
```

## The two payment paths

| | Browser verification path | Webhook path |
|---|---|---|
| Trigger | Razorpay Checkout `handler` callback in `BookingPage` | Razorpay → `POST /functions/v1/razorpay-webhook` |
| Function | `razorpay-verify-payment` (JWT required; caller must own the booking; order id must match) | `razorpay-webhook` (no JWT; `X-Razorpay-Signature` over the raw body) |
| Secret | `RAZORPAY_KEY_SECRET` | `RAZORPAY_WEBHOOK_SECRET` |
| Settles via | `settle_payment(order, payment, amount null, 'verify')` | `settle_payment(order, payment, amount_paise, 'webhook')` (amount checked) |
| Works if the browser closes | No | **Yes** |
| Source of truth | Fast path for the UI | **Final source of truth** (function header: *"this is the source of truth for payment status"*) |

Both paths are **idempotent**:

- `settle_payment` returns `already_confirmed` for a second call.
- `confirm_booking_and_issue_tickets` issues tickets only if none exist.
- The ticket email is queued once per booking (unique `dedupe_key`).

## What gets created

| Step | Rows written |
|---|---|
| Order | `bookings` (status `pending`, `payment_status` default `created`, `registration_code` `TS-XXXXXXXX`, `attendee_names[]`, `booking_answers`, `razorpay_order_id`, `group_token`) |
| Payment | `payment_webhook_events` (webhook path) |
| Settlement | `bookings.status = confirmed`, `payment_status = captured`, `razorpay_payment_id`, `razorpay_signature_verified = true`; `tickets` × quantity (`ticket_number` `TS-…-01`, random 20-byte hex `token`, `attendee_name`) |
| Email | `email_outbox` row (`ticket.confirmed`) → later `bookings.ticket_email_status = sent / failed` |
| Audit | `audit_logs` (`booking.*` system audit via `bookings_system_audit`, `payment.*` on review / late) |
| Availability | `event_availability_signal` version bump (trigger) → Realtime → open session pages refresh |
| Waitlist | If the booking came from an offer: `waitlist.status = converted`, `booking_id` set |

## What the customer sees vs what the admin sees

| | Customer | Admin |
|---|---|---|
| During checkout | Ticket type, live remaining seats, quote incl. tax, form validation, Razorpay modal | — |
| After payment | Confirmation, named attendees, one booking QR, email (when configured) | Bookings list: confirmed, payment captured, ticket email status |
| Payment problem | "We received your payment, but these seats are no longer available…" (409 `review`) | Notification `payment.review` to `payments.view` holders; booking `payment_status = needs_review`; audit `payment.needs_review` |
| Later | `/dashboard` bookings + tickets + QR; passport | Cancel, record refund, cancel ticket, resend email, comp booking |

## Not implemented for customers

- **Self-service cancellation or refund: NOT IMPLEMENTED.** Only `admin_cancel_booking` / `admin_record_refund`. Refunds themselves are issued **manually in the Razorpay dashboard** (webhook mirrors `refund.processed` / `refund.created` amounts).
- **Reminder emails to ticket holders: NOT IMPLEMENTED** (`send_event_reminders` targets event members only).
- **Automatic notification when an event is cancelled: NOT IMPLEMENTED** for ticket holders.
