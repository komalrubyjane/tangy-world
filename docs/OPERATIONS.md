# Tangy World — operations guide

Everything here has been verified on the **local** stack only. Nothing has been
deployed, no production migration has been applied, and no production secret
has been configured. Values below are intentionally left empty.

## 1. Scheduled jobs

| Work | Where it runs | Schedule | Idempotent / safe to retry | Audited |
| --- | --- | --- | --- | --- |
| Expire unpaid checkout holds (`expire_stale_bookings`) — releases seats, notifies the customer, offers seats to the waitlist | `run_platform_jobs()` (also runs before every new checkout) | pg_cron every 5 min (0020) | yes — only `pending` rows past the hold are touched | `booking.expired` audit rows, `platform_job_runs` |
| Expire waitlist offers (`expire_waitlist_offers`) — notifies the holder, offers the seats onwards | `run_platform_jobs()` | every 5 min | yes — `offered` rows past `offer_expires_at` only; `FOR UPDATE SKIP LOCKED` | `waitlist.offered` audits, run log |
| Expire unanswered artist booking requests | `run_platform_jobs()` | every 5 min | yes | run log |
| Event reminders | `run_platform_jobs()` | every 5 min | yes — `event_reminders_sent` de-duplicates | run log |
| Overdue task / expiring volunteer access notices | `run_platform_jobs()` | every 5 min | yes — `overdue_notified_at` / `expiring_notified_at` markers | run log |
| Log expired temporary check-in access | `run_platform_jobs()` | every 5 min | yes — `expiry_logged_at` marker | `access.expired` audits |
| Send queued emails (`email_outbox`) | Edge Function `send-notification-emails` | external scheduler / Supabase Cron HTTP, every 1–2 min, header `x-cron-secret` | yes — rows claimed with `FOR UPDATE SKIP LOCKED`, retried up to 5×; **without an email provider the queue is left untouched** | per-row status + error in `email_outbox` (Admin → More operations → Email delivery) |
| Scheduled publishing (TV, diary, gallery, announcements) | none needed — visibility is `status = 'published' and published_at <= now()` evaluated at read time | — | — | content audits |
| Payment reconciliation | none on a schedule — `razorpay-webhook` is the source of truth and calls `settle_payment()` idempotently; mismatches go to finance review | on each webhook | yes | `payment.*` audits, `payment_webhook_events` |

`run_platform_jobs(source)` (0029) takes a transaction-scoped advisory lock: a run that overlaps another is **skipped and recorded**, never doubled. Every run is written to `platform_job_runs` (readable with `operations.manage`).

Local: `scripts/run-jobs.sh` (add `emails` to also drain the outbox). Tests: `supabase/tests/media_realtime_jobs.test.sql` (run once, run twice, expired and already-processed records) and `scripts/test-concurrency.sh` (overlapping runs, last-seat race, offer race across two real sessions).

Production: confirm pg_cron is enabled (0020 schedules `tangy-platform-jobs`); otherwise call `select public.run_platform_jobs('scheduler')` every 5 minutes with the service role. Schedule the email function separately (section 2).

## 2. Email — production configuration (not done yet)

Edge Function secrets (`supabase secrets set …`), never `VITE_` variables:

```
EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=
SITE_URL=
CRON_SECRET=
```

- [ ] Create the Resend account and verify the sending domain (SPF, DKIM, DMARC records).
- [ ] Set the secrets above; `EMAIL_FROM` must use the verified domain.
- [ ] Deploy `send-notification-emails` (`--no-verify-jwt`; it checks the service key / `CRON_SECRET` itself), `send-ticket-email`, `send-approval-email`.
- [ ] Schedule a POST to `send-notification-emails` every 1–2 minutes with header `x-cron-secret`.
- [ ] Send one real ticket email and one approval email to a team inbox; check links (`SITE_URL`), QR attachment and reply-to.
- [ ] Watch Admin → Email delivery for failures for the first days.

Until then: nothing is sent and nothing crashes; queued emails wait (`scripts/test-email-config.mjs` checks this). Email bodies never contain message text, payment details or booking answers.

## 3. Razorpay — production checklist (not done yet)

Secrets: `RAZORPAY_KEY_ID=` `RAZORPAY_KEY_SECRET=` `RAZORPAY_WEBHOOK_SECRET=` (all empty today). Without the key pair checkout answers 503 and releases the seats; without the webhook secret the webhook refuses every call (503) — a missing secret is never used as a key.

Architecture (verified locally): the server prices every booking (`booking_quote`, the browser's amount is ignored); ticket-type and event capacity are enforced under the event row lock; held waitlist seats count against capacity; `settle_payment()` confirms idempotently and sends late / wrong-amount / cancelled / expired-and-resold payments to finance review (`payment.review` alert) instead of over-selling; webhook deliveries are de-duplicated by event id; signatures are HMAC-SHA256 compared in constant time. No automatic refunds are made.

When real test-mode credentials exist, run and record each of these (none has been run against Razorpay yet):

1. [ ] Successful payment → booking confirmed once, tickets issued, ticket email queued.
2. [ ] Failed payment → nothing confirmed; retry works.
3. [ ] Abandoned checkout → hold expires after `bookings.pending_timeout_minutes`, seats released (and offered to the waitlist).
4. [ ] Duplicate webhook delivery → processed once (`payment_webhook_events`).
5. [ ] Delayed webhook (verify-payment first, webhook later) → single confirmation.
6. [ ] Wrong amount (edit the order amount in test mode) → `needs_review`, finance alerted.
7. [ ] Late payment after the hold expired, seats still free → confirmed with `payment.late_accepted` audit.
8. [ ] Payment for a booking cancelled by an admin → `needs_review`.
9. [ ] Two customers racing for the last seat → one checkout, one "sold out".
10. [ ] Waitlist seat collision: a held seat cannot be bought by someone else; a late payment cannot take it.
11. [ ] Subscribe the webhook to `payment.captured`, `order.paid`, `payment.failed`, `payment.authorized`, `refund.processed`, `refund.created`; compare payload fields with Razorpay's "recent deliveries".
12. [ ] A refund made in the Razorpay dashboard is recorded in Tangy (`admin_record_refund`) and mirrored by the webhook.

## 4. Edge Functions

| Function | Purpose | Env vars | Auth | Local result |
| --- | --- | --- | --- | --- |
| `razorpay-create-order` | Validates the booking, creates the pending booking at the server price, creates the Razorpay order | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SITE_URL`/`ALLOWED_ORIGINS` | user JWT | E2E: validation, pricing, 503 without keys (checkout, groupcheckin suites) |
| `razorpay-verify-payment` | Verifies the checkout signature, calls `settle_payment` | `RAZORPAY_KEY_SECRET` | user JWT, own booking only | syntax + shared crypto unit tests; refuses (503) without the secret; not exercised end to end (no Razorpay checkout locally) |
| `razorpay-webhook` | Source of truth for payments; HMAC-verified, idempotent | `RAZORPAY_WEBHOOK_SECRET` | signature (deploy with `--no-verify-jwt`) | E2E: success / duplicate / failure / forged signature (checkout suite) |
| `send-ticket-email` | Ticket email with the booking QR | email vars | user JWT (own booking) or admin | E2E via Mailpit |
| `send-approval-email` | "Application approved" email | email vars, `SITE_URL` | admin JWT | E2E via Mailpit |
| `send-notification-emails` | Drains `email_outbox` | email vars, `CRON_SECRET`, `SITE_URL` | service key or `x-cron-secret` | E2E + `scripts/run-jobs.sh emails` |
| `admin-invite-user` | Super Admin invites a console user | `SITE_URL` | super admin JWT (checked in Postgres under that JWT) | E2E sweep: super admin invites (200), staff refused (403) |
| `_shared/*` | email provider, CORS allowlist, HMAC | — | — | `scripts/test-email-config.mjs`, `scripts/test-edge-shared.mjs` |

CORS: set `ALLOWED_ORIGINS` (or `SITE_URL`) to the production origin; list the canonical origin first (JSON responses use it; preflights echo any listed origin). Every browser-called function also checks the caller's JWT. Deno is not installed on this machine: functions were syntax-checked with esbuild and exercised through `supabase functions serve` in the E2E suites.

Deployment (later, not done): `supabase functions deploy <name>` for all seven, `razorpay-webhook` and `send-notification-emails` with `--no-verify-jwt`.

## 5. Media storage

| Bucket | Visibility | Who writes | Notes |
| --- | --- | --- | --- |
| `content-media` | **private** (0029) | content editors (area rights), session editors | files are referenced as `/storage/content-media/<path>` and shown through 1-hour signed URLs; visitors can sign only files used by published content |
| `artist-media` | private | the artist (own folder) | signed URLs; curators review |
| `artist-avatars` | public | the artist (own folder) | profile photos are public by design |
| `event-documents`, `sponsor-assets` | private | per-document audience / the sponsor | signed URLs |

Size/type limits: content-media 50 MB, images + MP4/WebM only (no HTML/SVG).

## 6. Live seat availability

`event_availability_signal` (0029) holds a version number per session that changes whenever seats may have changed; the session page subscribes to it over Supabase Realtime and re-reads `event_availability()`. It carries no booking data. The page also refreshes on focus, after every booking/payment action, and every two minutes. Capacity is still decided only by the server at checkout.

## 7. Waitlist allocation

Setting `waitlist.allocation` (Admin → Settings):
- `strict_order` (default) — released seats go to the head of the queue only; if that party is bigger than what's free, nobody behind them is offered yet (the free seats remain bookable by anyone).
- `first_fit` — offer to the earliest waiting party that fits.
Offers are held for `waitlist.offer_hold_minutes` (default 120).

## 8. Local demo dataset

`scripts/demo-data.sh seed | remove | status` — 10 sessions, 12 artists, 35 demo accounts, 40 bookings, 129 tickets, partial check-ins, 7 waitlist entries, 4 partner threads, content. Local-only (refuses non-localhost URLs); every record is identifiable (`de300000-…` ids, `@demo.tangy.local` emails, "(demo)" partner names, example.com links). Sign in as any demo account; codes arrive in Mailpit (http://127.0.0.1:54324).
