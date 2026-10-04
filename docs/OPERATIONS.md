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
- [ ] Schedule a POST to `send-notification-emails` every 1–2 minutes with header `x-cron-secret` (step-by-step: §2a).
- [ ] Send one real ticket email and one approval email to a team inbox; check links (`SITE_URL`), QR attachment and reply-to.
- [ ] Watch Admin → Email delivery for failures for the first days.

Until then: nothing is sent and nothing crashes; queued emails wait (`scripts/test-email-config.mjs` checks this). Email bodies never contain message text, payment details or booking answers.

## 2a. Production runbook — scheduled jobs and the email queue

Project `ohyjqxbsgdkzytfnlitf`. Every step is done by a person in the Supabase
dashboard or with the Supabase CLI; nothing here re-runs a migration or changes
RLS, policies, functions, triggers or the schema. Two schedules matter:

- **`tangy-platform-jobs`** (pg_cron, every 5 min) → `run_platform_jobs()`:
  expires unpaid checkout holds (releasing seats), waitlist offers and artist
  requests, sends reminders and notices. Without it, seats held by abandoned
  checkouts are only released when someone else starts a checkout.
- **The email drain** (every 1–2 min) → Edge Function `send-notification-emails`,
  which sends what `notify()` queued in `email_outbox`. Without it, in-app
  notifications work but **no notification email is ever sent**.

### Step 0 — look before changing anything

Run `supabase/ops/scheduled_jobs_and_email.readonly.sql` in the SQL editor
(one SELECT; it can be wrapped in `begin transaction read only; … rollback;`).
It reports pg_cron / pg_net, both schedules and their recent runs, the job-run
log and the outbox by status. It never shows addresses, email content or a
cron job's command (which holds the cron secret). Note rows 1, 3 and 8.

### Step 1 — platform jobs (`tangy-platform-jobs`)

- Row 3 shows `*/5 * * * * (active)` → nothing to do; after 10 minutes row 5
  shows successes and row 7 a recent `last finished`.
- Row 3 shows **pg_cron not installed** or **MISSING**: enable `pg_cron` under
  Database → Extensions, then create the same job 0020 creates — either
  Integrations → Cron → *Create job* → name `tangy-platform-jobs`, schedule
  `*/5 * * * *`, type *SQL snippet* `select public.run_platform_jobs()`; or in
  the SQL editor:
  `select cron.schedule('tangy-platform-jobs', '*/5 * * * *', 'select public.run_platform_jobs()');`
  (re-running it with the same name updates the job instead of adding one).
- Row 4 (`tangy-log-expired-access`, 0018) may or may not exist; it is
  redundant with `run_platform_jobs()` and harmless either way.

### Step 2 — email secrets

Prerequisite: a Resend account with the sending domain verified (SPF, DKIM,
DMARC). Then, with the CLI linked to the project (`supabase link --project-ref
ohyjqxbsgdkzytfnlitf`), set the Edge Function secrets — never as `VITE_`
variables, never in Git:

```
openssl rand -hex 32          # → the CRON_SECRET value; keep it in your password manager
supabase secrets set EMAIL_PROVIDER=resend RESEND_API_KEY=re_… \
  EMAIL_FROM="Tangy Sessions <hello@your-verified-domain>" SITE_URL=https://<production site> \
  CRON_SECRET=<the value above>
# optional: EMAIL_REPLY_TO=…
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by Supabase; do
not set them. Without `RESEND_API_KEY` the function answers
`{"configured": false}` and leaves the queue untouched.

### Step 3 — deploy the function

```
supabase functions deploy send-notification-emails --no-verify-jwt
```

`--no-verify-jwt` is required: the scheduler authenticates with the
`x-cron-secret` header, which the function checks itself (end-user sessions are
always refused). Deployed *with* JWT verification, the platform gateway rejects
every scheduled call with 401 before the function runs.

### Step 4 — smoke-test by hand

Read the secret without leaving it in shell history, then call the function:

```
read -rs CRON_SECRET
URL=https://ohyjqxbsgdkzytfnlitf.supabase.co/functions/v1/send-notification-emails
curl -s -X POST "$URL" -H "x-cron-secret: $CRON_SECRET" -H 'Content-Type: application/json' -d '{}'
#   → {"claimed":0,"sent":0,"failed":0}  (configured; {"configured":false} means RESEND_API_KEY is missing)
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$URL" -d '{}'          # → 403 (no secret)
curl -s -o /dev/null -w '%{http_code}\n' "$URL"                          # → 405 (GET)
unset CRON_SECRET
```

### Step 5 — schedule the drain

Integrations → Cron → *Create job* (enable `pg_net` when the dashboard asks):

| Field | Value |
| --- | --- |
| Name | `tangy-email-drain` |
| Schedule | `* * * * *` (or `*/2 * * * *`) |
| Type | *Supabase Edge Function* (or *HTTP request* to the URL above) |
| Method / function | `POST` / `send-notification-emails` |
| Headers | `x-cron-secret: <CRON_SECRET>` (plus `Content-Type: application/json`) |
| Body | `{}` |

Each run sends at most 25 emails; overlapping runs never send one twice. The
secret is stored in the job's command (`cron.job`, readable only by
database-owner roles): after rotating `CRON_SECRET`, edit the job too.
An external scheduler that POSTs the same request every 1–2 minutes works as
well.

### Step 6 — verify

1. Re-run the Step 0 check: row 8 lists `tangy-email-drain (active)`, row 9
   shows successes, row 13 shows 2xx responses and no 4xx (a 401 means the
   function was deployed with JWT verification; a 403 means the header or
   secret is wrong).
2. End to end: as Super Admin, open another active team member's account in
   Admin → Users and send them a custom notification (the form is not shown on
   your own account). Within two minutes it reaches their inbox, row 10 shows
   it as `sent`, and the link opens `SITE_URL`.
3. For the first days, check Admin → More operations → Email delivery for
   `failed` rows (row 12 shows the latest error, addresses masked).

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
| `admin-invite-user` | Creates a console invitation (hashed single-use token, 72 h) and emails the link; the role is applied only when the recipient accepts at `/invitation` | `SITE_URL`, email settings (section 2) | inviter's JWT — `create_account_invitation` checks `roles.manage` (Super Admin / Admin) or `staff.invite` (Staff) in Postgres; no service role key | E2E invitations (invite → email → accept, single use, wrong account, revoke, manager limited to Staff), sweep (staff refused 403) |
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

`scripts/demo-data.sh seed | remove | status` loads `supabase/demo/demo_seed.sql` (operations: bookings, check-ins, partners, threads) and `demo_seed_history.sql` (a fictional archive). Totals: 35 sessions (26 past, 2022–2026, incl. cancelled), 27 artists, 8 programmes, 22 albums / 88 photos, 15 Tangy TV records (published, draft, archived), 21 diary posts, 12 announcements, 8 sponsors, 8 vendors, 6 venue hosts, 15 volunteers, 64 accounts, 40 bookings, 129 tickets, 15 waitlist entries. Local-only (refuses non-localhost URLs); every record is identifiable (`de300000-…` ids, `@demo.tangy.local` emails, "(demo)" venue / partner names, example.com links).

**Artist portal demo** (`demo_seed_artist_portal.sql`): 12 artist applications in every state, 16 booking requests, artist media and availability — see `docs/ARTIST_PORTAL.md`.

**Images.** Fictional people and nights use generated artwork from `public/media/demo/` (monogram portraits, abstract covers marked "DEMO IMAGE"). The real Tangy posters and performer photos in `public/media/artists` and `public/media/gallery` are never attached to fictional artists or sessions — the only real photos in the demo data are two empty-venue shots. Sign in as any demo account; codes arrive in Mailpit (http://127.0.0.1:54324).
