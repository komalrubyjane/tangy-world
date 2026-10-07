# 29 — Failure and Recovery Flows

Each flow shows the **normal path**, the **error path** and the **recovery path** as implemented.

## Payments

```mermaid
---
title: Payment failures — failed, browser closed, duplicate, bad signature
---
flowchart LR
  classDef ok fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef rec fill:#fff3c4,stroke:#b38600,color:#222
  N1["NORMAL: pay → verify → settle → tickets → email queued"]:::ok
  E1["ERROR: payment fails in checkout"]:::err --> R1["RECOVERY: UI 'payment did not go through'; retry with same details reuses the order<br/>webhook payment.failed marks the pending booking failed → seats released → waitlist offered<br/>untouched holds expire after 30 min"]:::rec
  E2["ERROR: paid, but browser closed before verify"]:::err --> R2["RECOVERY: razorpay-webhook settles independently · ticket email queued<br/>booking appears in /dashboard"]:::rec
  E3["ERROR: webhook delivered twice"]:::err --> R3["RECOVERY: unique payment_webhook_events.event_id → 200 duplicate<br/>settle_payment already_confirmed · email dedupe key"]:::rec
  E4["ERROR: webhook signature invalid"]:::err --> R4["400, nothing recorded or changed · Razorpay keeps its delivery log"]:::rec
  E5["ERROR: DB error during webhook processing"]:::err --> R5["500 → Razorpay redelivers · recorded-but-unprocessed event is processed on retry"]:::rec
  E6["ERROR: paid after hold expired and seats gone / wrong amount / cancelled booking"]:::err --> R6["needs_review · customer told (409) · payments.view alerted (urgent, emailed)<br/>admin refunds in Razorpay dashboard + admin_record_refund, or reseats"]:::rec
  E7["ERROR: Razorpay secrets missing"]:::err --> R7["create-order 503 and hold released · verify 503 · webhook 503 (Razorpay retries after config)"]:::rec
  E8["ERROR: settlement RPC fails in verify"]:::err --> R8["500 'contact support with your payment ID' · webhook still settles"]:::rec
```

## Email

```mermaid
---
title: Email failures
---
flowchart LR
  classDef ok fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef rec fill:#fff3c4,stroke:#b38600,color:#222
  N["NORMAL: email_outbox queued → drain → Resend → sent"]:::ok
  A["ERROR: provider not configured"]:::err --> AR["drain leaves the queue untouched · ticket/approval show 'Email is not configured yet.'<br/>RECOVERY: set RESEND_API_KEY → queue drains"]:::rec
  B["ERROR: Resend rejects / network"]:::err --> BR["complete_email → queued again, up to 5 attempts → failed with last_error<br/>RECOVERY: Admin → Email delivery shows it · admin 'Resend email' (force)"]:::rec
  C["ERROR: worker dies mid-send"]:::err --> CR["row stuck in sending → reclaimed after 10 min by claim_email_batch"]:::rec
  D["ERROR: no account email"]:::err --> DR["ticket_email_status failed 'No linked account email on file.' — visible to admin"]:::rec
  E["ERROR: approval email fails"]:::err --> ER["toast 'Approved, but the email failed' · application_notifications failed<br/>RECOVERY: Resend from the application drawer"]:::rec
  F["ERROR: invitation email fails"]:::err --> FR["response returns the invite link once · email_status failed / not_configured<br/>RECOVERY: deliver the link by hand"]:::rec
```

## Artist workflow

```mermaid
---
title: Artist request failures
---
flowchart LR
  classDef ok fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef rec fill:#fff3c4,stroke:#b38600,color:#222
  N["NORMAL: request → accept → confirm → session"]:::ok
  A["ERROR: artist declines"]:::err --> AR["status declined + reason · requester notified booking.declined<br/>RECOVERY: request another artist (find_available_artists)"]:::rec
  B["ERROR: artist busy (confirmed slot overlaps)"]:::err --> BR["save_event_lineup / create_artist_request refuse with a human message (hint tangy:user)"]:::rec
  C["ERROR: artist marked unavailable"]:::err --> CR["direct assign refused unless explicit override (audited) · a request is allowed — the artist decides"]:::rec
  D["ERROR: artist becomes unavailable after the request"]:::err --> DR["pending request stays · artist_day_status shows unavailable/tentative to the team<br/>artist may still accept (own mark doesn't block) · a clashing confirmed booking does block"]:::rec
  E["ERROR: request expires unanswered"]:::err --> ER["expire_booking_requests (job or on respond) → expired · requester notified<br/>artist sees 'This request has expired. Message Tangy…'"]:::rec
  F["ERROR: two admins book the same artist/day"]:::err --> FR["per-artist-per-day advisory lock serializes · second one re-checked → busy"]:::rec
  G["ERROR: event cancelled"]:::err --> GR["open requests cancelled · line-up kept as history · artists notified"]:::rec
```

## Waitlist, uploads, authorization, sessions, roles, jobs

| Failure | Error path | Recovery path |
|---|---|---|
| **Waitlist offer expires** | hold lapses (default 120 min) | `expire_waitlist_offers` → `expired`, holder notified, seats offered to the next party; the person can rejoin |
| **Two people race for the last seat** | concurrent checkouts | event row lock in `create_pending_booking`; the loser gets `SOLD_OUT` (409) and the page refreshes availability (tested by `scripts/test-concurrency.sh`) |
| **Upload rejected** | storage policy, size or type limit | `uploadWithProgress` maps to *"You don't have permission to upload here." / "That file is too large." / "A file with that name already exists."*; client caps 25 MB (50 MB for artist media / video) |
| **Media rejected by curator** | `artist_media.status = rejected` + note | artist notified (`media.reviewed`); can resubmit (`rejected → under_review` allowed by `guard_artist_media`) |
| **Unauthorized admin action** | route guard → Forbidden; RPC raises 42501 / exception; RLS update → 0 rows | `friendlyError` → *"You don't have permission to do that."*; nothing changes; no partial write |
| **Direct API attack** (forged REST / RPC call) | RLS + definer checks + revoked EXECUTE | denied (e2e suites include direct API authorization attempts) |
| **Session expires** | JWT refresh fails / signed out elsewhere | `onAuthStateChange` → `user = null` → `ProtectedRoute` redirects to `/join/login?next=…`; Edge Functions answer 401 *"Sign in required."*; console idle timeout signs out with a reason on the login card |
| **Role changes while signed in** | server stops honouring the old role immediately | client re-reads `role, is_active` every 60 s / on focus → menus, guards and dashboard follow; `role.changed` notification |
| **Account deactivated** | `current_role_name()` → null | console shows *"Account deactivated"*; every RPC / RLS check fails |
| **Volunteer access ends mid-shift** | `check_in_ticket` → `access_expired` | `access.expiring` warning beforehand; admin grants a new window |
| **Scheduled job step errors** | `run_platform_jobs()` runs as one transaction: an error aborts the run and its log row | next 5-minute run retries (all steps idempotent); checkout calls `expire_stale_bookings` itself; pg_cron's own run history records the failure (platform feature) |
| **Overlapping job runs** | two schedulers fire | advisory lock: the second is recorded as `skipped` |
| **Supabase not configured in a build** | — | `vite build` fails (cannot ship a bundle with no backend); in dev the app shows empty / error states |
| **Profile row missing after sign-in** | `profiles` select fails | `profileError` shown; user treated as `user`; console explains *"profile could not be loaded"* |
| **Booking form invalid** | client + Edge Function + `create_pending_booking` validation | specific 400 messages (`INVALID_DETAILS`, `INVALID_QUANTITY`, `INVALID_TICKET_TYPE`, `INVALID_ATTENDEE_NAMES`) |
