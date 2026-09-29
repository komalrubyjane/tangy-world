# Tangy Sessions — Supabase setup

## 1. Apply the migrations

In the Supabase dashboard SQL editor (`https://supabase.com/dashboard/project/<ref>/sql/new`),
run these files **in order**, each as its own query:

1. `migrations/0001_schema.sql` — tables
2. `migrations/0002_rls.sql` — row-level security policies (authorization is enforced here, not just in the frontend)
3. `migrations/0003_role_security.sql` — closes two privilege-escalation gaps left open by 0002 (a signed-in user could otherwise PATCH their own `profiles.role` or `artists.status` directly)
4. `migrations/0004_seed_events.sql` — seeds the events table with the site's existing editorial content so Sessions/Archive/Booking/Calendar aren't empty on first load
5. `migrations/0005_extend_roles.sql` — adds vendor/sponsor/volunteer/crew to `user_role`, rounds out `profiles` (avatar_url, bio, organization_name, updated_at), links applications (collaborations/crew_applications/private_enquiries) to an optional `user_id`
6. `migrations/0006_role_profiles.sql` — `vendor_profiles` / `sponsor_profiles` / `volunteer_profiles` / `crew_profiles`, plus self-read policies on the application tables above
7. `migrations/0007_payments.sql` — `bookings.razorpay_signature_verified`, `payment_webhook_events` for idempotent webhook processing
8. `migrations/0008_conversations_and_assignments.sql` — real chat (conversations/messages) and the admin → artist session assignment request workflow
9. `migrations/0009_waitlist_self_read.sql` — lets a signed-in patron see their own waitlist entries
10. `migrations/0010_venue_role.sql` — adds `venue` to `user_role` (own file — a new enum value can't be used in the same transaction that adds it)
11. `migrations/0011_role_portals.sql` — real crew/volunteer/vendor/sponsor/venue portal backend: `venue_profiles`, `events.venue_partner_id`, `event_assignments` + `event_tasks` (shared by crew/volunteer/vendor event staffing), `sponsor_deliverables`, a `category` column on `crew_applications` distinguishing crew from volunteer, and the `approve_crew_application`/`approve_collaboration` RPCs that provision a role + profile row atomically on admin approval
12. `migrations/0012_artist_availability.sql` — real self-managed artist availability calendar (`available`/`tentative`/`unavailable`); `booked` is always derived from confirmed performances, never self-settable
13. `migrations/0013_artist_media.sql` — a private `artist-media` Storage bucket plus the `artist_media` metadata table backing real demo-track/photo uploads in the Artist Portal (replaces a previous fully-fake "simulate upload" button), and a public `artist-avatars` bucket for real avatar uploads (replaces a previous `URL.createObjectURL` blob that was being saved straight into `artists.avatar_url`, which only ever worked in the uploading browser's own tab)
14. `migrations/0014_artist_spotify.sql` — `artists.spotify`, matching the existing `instagram`/`soundcloud` columns (the portal's Links tab had a Spotify field with no backing column)
15. `migrations/0015_application_lifecycle.sql` — closes the anonymous-application gap on `collaborations`/`crew_applications` (insert now requires `auth.uid() = user_id`; `artists` requires a non-null `user_id` instead, see the file's own note on why), adds `application_notifications` (idempotent approval-email tracking), extends `approve_collaboration`/`approve_crew_application` to queue a notification row, and adds `approve_artist_application`/`reject_artist_application` RPCs (replacing the admin UI's previous direct `.update()` on `artists`)
16. `migrations/0016_payments_tickets_checkin.sql` — closes the fake-confirmed-booking RLS gap (removes client INSERT on `bookings` entirely), adds `create_pending_booking()` (atomic, capacity-checked pending booking creation — the actual overselling protection), a `tickets` table (one row per admission, each with its own random `token` — never a database id or PII — used as the QR credential) plus `confirm_booking_and_issue_tickets()` (idempotent ticket issuance on payment confirmation), moves `checkins` to per-ticket (`checkins.ticket_id`, `unique(ticket_id)`, dropping the old `unique(booking_id)`) with a new `check_in_ticket()` RPC doing full server-side validation atomically, adds `bookings.tier`, the `'failed'` booking status, and `bookings.ticket_email_status/_error/_sent_at` for idempotent ticket-email delivery tracking

## 2. Bootstrap your first admin account

RLS deliberately blocks everyone — including admins — from ever promoting their *own*
account's role (see 0003). That means there is no in-app way to create the first admin;
it has to be done once, directly, by whoever owns the Supabase project:

1. Sign up for a normal account on the live site (via the "LOGIN" button / patron modal, or the `/admin` sign-in form — both create the same kind of account).
2. In the Supabase dashboard → Table Editor → `profiles`, find that row and set `role` to `admin` (or `super_admin`).
3. Sign in at `/admin` with that account from then on.

Every admin after the first can be promoted from inside `/admin` → Users tab, by an existing admin.

## 2a. Temporary team demo admin

For internal team demonstration, use **one** dedicated Supabase Auth account with `admin` or
`super_admin` — not a shared personal account, and not a fake/mock one. It's provisioned exactly
like any other admin (step 2 above), nothing special:

1. Have one team member sign up for a normal account (patron modal or `/admin` sign-in form).
2. In the Supabase dashboard → Table Editor → `profiles`, set that row's `role` to `admin`.
3. Share the login **credentials out-of-band** (password manager, not chat/email/repo).

**Credentials are intentionally not stored in this repository** — not in source, not in
migrations, not in `.env.local`/`VITE_*` vars, not in commit messages, not here. The account is a
normal Supabase Auth user; its authorization comes entirely from `profiles.role`, the same as
every other admin. There is nothing hardcoded in the frontend to find or leak.

**Before production**, whoever owns the Supabase project should:

- [ ] Delete or disable the temporary demo account (Supabase dashboard → Authentication → Users)
- [ ] Create real production admin account(s) for the actual team
- [ ] Rotate/retire the demo password if it was ever shared beyond the immediate team
- [ ] Re-verify admin-scoped RLS policies (`is_admin()`/`is_staff_or_admin()` — see 0002/0003/0011)
- [ ] Stand up real audit logging for admin preview/approval actions (not implemented yet — see
      `src/pages/admin/AdminPortalPreview.jsx` and `AdminEntitySelector.jsx`)
- [ ] Re-verify every privileged RPC (`approve_crew_application`, `approve_collaboration`, `approve_artist_application`, etc.)

## 2b. Enable email OTP (required — dashboard setting, not code)

Account creation/login now uses real Supabase Auth email OTP everywhere except `/admin`
(`src/components/auth/EmailOtpAuth.jsx` — `supabase.auth.signInWithOtp()` /
`verifyOtp()`, no custom OTP code anywhere in this repo). For the email Supabase sends to
actually contain a 6-digit code (not a magic-link URL), the project's email template must
include `{{ .Token }}`:

1. Supabase dashboard → **Authentication → Email Templates → Magic Link**.
2. Make sure the body includes `{{ .Token }}` (Supabase's newer default templates already do —
   if this project's template still only has `{{ .ConfirmationURL }}`, add the token, e.g.
   `Your code is {{ .Token }}`).
3. **Authentication → Providers → Email** — confirm "Enable email OTP" / the relevant OTP toggle
   is on for the project (naming varies by Supabase Auth UI version).

Without this, `verifyOtp({ token, type: 'email' })` will fail for anyone who never had a code to
type in. This could not be verified against a live project in this environment — treat it as an
explicit deployment checklist item, not something already confirmed working.

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Project Settings → API in the Supabase dashboard.
- `VITE_RAZORPAY_KEY_ID` — not yet used by the app; ticketing currently confirms bookings directly without capturing payment (see `src/lib/bookingService.js`) until a Supabase Edge Function is written to create/verify Razorpay orders server-side with the secret key.

## 4. Deploy the Razorpay Edge Functions

Real payment capture now has a working implementation — three Edge Functions under `supabase/functions/`:

- `razorpay-create-order` — verifies the caller's real Supabase session, computes the authoritative amount from the event's DB price + ticket tier (never trusts a client-sent amount), creates the Razorpay order, and inserts a `bookings` row as `pending`.
- `razorpay-verify-payment` — verifies the Razorpay HMAC signature server-side before flipping a booking to `confirmed`.
- `razorpay-webhook` — Razorpay calls this directly; it's the source of truth regardless of whether the client-side verify call ever completes, and is idempotent via `payment_webhook_events`.

Deploy and configure:

```
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-verify-payment
supabase functions deploy razorpay-webhook --no-verify-jwt   # Razorpay calls this with no Supabase auth header
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=xxx RAZORPAY_WEBHOOK_SECRET=xxx
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — don't set those yourself.

In the Razorpay dashboard (Settings → Webhooks), add the `razorpay-webhook` function's URL, subscribe to at least `payment.captured` and `order.paid`, and set a webhook secret matching `RAZORPAY_WEBHOOK_SECRET` above. **Before going live**, confirm the webhook payload's event-id field and event names against Razorpay's current webhook reference in the dashboard's "recent deliveries" panel — noted as a TODO in `razorpay-webhook/index.ts` since it couldn't be verified against live docs while writing this.

This payment flow requires a **real** Supabase session (`AUTH_MODE = 'real'` in `src/config/auth.js`, or at minimum a real signed-in user at checkout) — there's no mock equivalent, since the Edge Functions verify a real JWT. While `AUTH_MODE` stays `'mock'`, `BookingPage.jsx` keeps using the old direct-confirm test path automatically.

## 5. Deploy the approval-email Edge Function

Automatic "your application is approved" emails — one Edge Function:

- `send-approval-email` — re-verifies the caller is a real admin, re-fetches the application and the applicant's *authenticated account* email (never the applicant-typed email on the application row), and sends via Resend. Never sends twice for the same application unless explicitly told to (`force: true`, the admin "RESEND EMAIL" action) — see `application_notifications` in `0015_application_lifecycle.sql`.

Deploy and configure:

```
supabase functions deploy send-approval-email
supabase secrets set RESEND_API_KEY=re_xxx SITE_URL=https://tangysessions.com
# optional — defaults to "Tangy Sessions <hello@tangysessions.com>"
supabase secrets set RESEND_FROM_EMAIL="Tangy Sessions <hello@tangysessions.com>"
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically. `RESEND_API_KEY` must be a real Resend API key with a verified sending domain — until both are set, the function fails closed (records the notification as `failed` with "Email service not configured", the application's approval itself is unaffected) rather than silently pretending to send.

This has been **code-reviewed and build-tested, not live-tested** — no Resend account/API key was available in this environment. Before relying on it in production: trigger one real approval end-to-end and confirm the email actually arrives, renders correctly in at least Gmail + Apple Mail, and that the portal link works.

## 6. Deploy the updated Razorpay functions + the new ticket email function

`razorpay-create-order`, `razorpay-verify-payment`, and `razorpay-webhook` all changed in this
pass (capacity-safe booking creation, ticket issuance, `payment.failed` handling) — redeploy all
three, plus the new `send-ticket-email`:

```
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-verify-payment
supabase functions deploy razorpay-webhook --no-verify-jwt
supabase functions deploy send-ticket-email
```

`send-ticket-email` needs the same `RESEND_API_KEY` (and optional `RESEND_FROM_EMAIL`) secrets as
`send-approval-email` — see that function's own section above; if already set, nothing further is
needed. It additionally imports `qrcode` from esm.sh to render each ticket's QR server-side for
the email attachment — **this import was not live-tested** (no Deno runtime available in this
environment); verify a real send renders/attaches correctly before relying on it.

**Before going live**, double check in the Supabase dashboard (Table Editor → `checkins` →
constraints) that the old `unique(booking_id)` constraint this migration tries to drop
(`checkins_booking_id_key`) is actually gone and `unique(ticket_id)` is in its place — the
`drop constraint if exists` in 0016 assumes Postgres's default auto-generated name for that
original unnamed constraint, which wasn't verified against a live database.
17. `migrations/0017_admin_system.sql` — role-based admin system: `role_permissions` (Super Admin / Admin / Staff permission matrix, `has_permission()` / `my_permissions()`), append-only `audit_logs`, event-scoped staff access (fixes staff previously having global access), `venues`, `announcements`, `system_settings`, admin booking/refund/ticket RPCs, `check_in_ticket()` event authorization, and dashboard/report RPCs. Reverse: `rollbacks/0017_admin_system.down.sql`.
18. `migrations/0018_operations_platform.sql` — operations platform: partner portal data (`event_member_kind()`, `my_portal_events()`, private `event_artist_details`, `event_requirements`, link-based `event_documents`, partner/volunteer announcement audiences — and closes the old `audience <> 'staff'` public-read policy), central `notifications` with triggers, partner ↔ admin messaging (`start_partner_conversation` / `send_message` / inboxes; no user-to-user messaging), time-boxed volunteer check-in (`temporary_access`, `access_requests`, grant/revoke/request RPCs; `check_in_ticket()` honours an active grant for that event only), artist approval now activates the `artist` role, event command center, platform analytics, and `set_role_permission()`. Reverse: `rollbacks/0018_operations_platform.down.sql`. **Optional:** with the `pg_cron` extension enabled, 0018 schedules `log_expired_access()` every 5 minutes to write `access.expired` audit rows; access itself ends at `expires_at` regardless.

19. `migrations/0019_platform_enum_values.sql` — adds `'expired'` to `booking_status` and `assignment_status` (own file: a new enum value can't be used in the transaction that adds it). Reverse: `rollbacks/0019_platform_enum_values.down.sql` (a no-op by design — Postgres can't drop an enum value; 0020's rollback moves every row off `'expired'` first).
20. `migrations/0020_platform_finalization.sql` — platform finalization (additive; no historical migration edited, no existing row deleted). Reverse: `rollbacks/0020_platform_finalization.down.sql`. Details in [0019–0022 in detail](#0019-0022-in-detail) below.
21. `migrations/0021_canonical_admin_links.sql` — new notifications and queued emails link to `/admin-portal/...` instead of the legacy `/admin/...`. Reverse: `rollbacks/0021_canonical_admin_links.down.sql`.
22. `migrations/0022_artist_storage_policies.sql` — fixes the artist-media / artist-avatars ownership policies from 0013 (artists could not use their own files). Reverse: `rollbacks/0022_artist_storage_policies.down.sql`.

Database tests live in `tests/` (`admin_system`, `operations_platform`, `platform_finalization`, `canonical_links`, `artist_storage`) and run against a **local** stack with `scripts/test-db.sh` — each file is one transaction that rolls back. Never run them against production.

### Production application order (0017 → 0022)

None of these have been applied to production as part of this work. Apply in order, each file as its own query, after taking a database backup:

1. `0017_admin_system.sql` → 2. `0018_operations_platform.sql` → 3. `0019_platform_enum_values.sql` (must be committed before 0020 runs) → 4. `0020_platform_finalization.sql` → 5. `0021_canonical_admin_links.sql` → 6. `0022_artist_storage_policies.sql`

Then deploy the Edge Functions and secrets in [section 7](#7-notification-emails-and-scheduled-jobs-0020). Rollbacks run by hand in **reverse** order (`0022` → `0021` → `0020` → `0019` → …), each only after the one above it.

### 0019–0022 in detail

**0020 — platform finalization**

- **Schema / features**: `system_settings` for checkout hold, reminder lead time and booking-request deadline; `events.timezone` and `events.doors_at`; private `artist_private_profiles` (phone, rider, hospitality — never public) and admin-only `artist_admin_notes`; server-computed `artist_profile_completion()`; the `public_artists` view (the public site reads this — it **closes the old public read of artist email**); structured artist logistics on `event_artist_details`; artist media curation (`media_type`, `uploaded → under_review → approved/rejected`, `archived`; the `guard_artist_media` trigger stops artists approving their own media); booking requests with proposed slot, fee offer, deadline and expiry (`create_booking_request`, `respond_to_booking_request`, `my_booking_requests`); requirement priority, close and attachments; document categories, descriptions and expiry; sponsor package, deliverable kinds and `sponsor_assets`; vendor/venue setup, breakdown, loading/venue access and on-site contact; event-scoped volunteer teams and team-targeted announcements; event-level tasks with blocked/urgent states and a completion trail; `partner_invoices` (drafts internal; partners see only their own issued/paid/void rows); conversation priority and assignment; server-side expiry of stale pending checkouts (`expire_stale_bookings`), payment states and late-payment reconciliation (`flag_late_payment`, `record_webhook_failure`); rule-based `event_health()`, `admin_operations_overview()` and `admin_search()`.
- **Notifications**: `notifications.category` / `priority`; per-user `notification_preferences` (in-app and email per category, plus a master email switch) checked server-side by `notify()` — critical notices (cancellations, revoked access, payment failures) are always delivered in-app; `email_outbox` queue with de-duplication (chat: one email per thread per 15 min), drained by the `send-notification-emails` Edge Function; new triggers for schedule, document, booking-request, requirement, media-review, sponsor-asset and invoice events; `notify()` is callable only by `service_role` and SECURITY DEFINER code.
- **Storage** (private buckets, 25 MB limit, served only through short-lived signed URLs — Storage signs a URL only for callers passing the bucket's SELECT policy):
  - `event-documents` — `events/<event_id>/...` written by `events.manage` holders; `requirements/<requirement_id>/...` written by the requirement's recipient while it's open. Read = `can_read_event_file()`: the same audience rules as the `event_documents` row (one person / everyone on the event / one member kind), honouring `expires_at`.
  - `sponsor-assets` — `<sponsor_user_id>/...`; a sponsor uploads and reads only their own folder; `entities.manage` holders review.
  - `artist-media` — adds a curator read policy (`entities.manage`) so curators can preview.
- **Scheduled jobs**: `run_platform_jobs()` (service_role only) expires stale checkouts and unanswered booking requests, sends event reminders, overdue-task and expiring-access notices, and logs expired access. If `pg_cron` is available 0020 schedules it every 5 minutes as `tangy-platform-jobs`; otherwise schedule `select public.run_platform_jobs()` externally. Every job is idempotent.
- **Rollback**: `rollbacks/0020_platform_finalization.down.sql` restores every function/policy 0020 replaced to its 0011/0016/0018 definition and **drops** 0020's tables (private artist profiles, admin notes, sponsor assets, partner invoices, notification preferences, email outbox, reminder log — export them first if needed). Rows that only exist because of 0020 are adjusted so older constraints fit (expired bookings/requests → cancelled, closed requirements → accepted, blocked tasks → pending, urgent → high, event-level tasks and storage-backed documents deleted, media statuses mapped back). The `event-documents` and `sponsor-assets` buckets stay (private, with no policies — inaccessible); remove their objects through the Storage API/dashboard before deleting them. Run 0022's and 0021's rollbacks first.

**0021 — canonical console links.** Every in-app notification and queued email goes through `notify()`; 0021 rewrites `/admin`, `/admin/...`, `/admin?...` and `/admin#...` links to `/admin-portal/...` there (helper `canonical_console_link()`), which covers the 0018 generators that still built legacy links (assignment, task, application, message, volunteer access request). Existing rows are **not** rewritten; the app's `/admin/*` → `/admin-portal/*` redirect keeps them working. Rollback restores 0020's `notify()` and drops the helper.

**0022 — artist storage ownership.** 0013's "self" policies on `artist-media` and `artist-avatars` compared the first path segment with `artists.name` (the unqualified `name` inside the subquery resolved to the artist's display name, not the object path), so artists could never upload, preview (sign) or delete their own media or avatar. It failed closed — no one else gained access. 0022 recreates the six policies with `objects.name` qualified (`<artist_id>/<file>`, artist row owned by `auth.uid()`), scoped to `authenticated`, and adds an owner SELECT policy on the **public** avatars bucket so upsert/remove work (no new visibility — avatars are public by design). Admin and curator policies are unchanged. Rollback restores 0013's definitions exactly — i.e. the broken behaviour.

## What's NOT covered by these migrations

- Diary and Archive content are still static/editorial (`src/data/mockData.js` and the section components) — no CMS tables were added for them in this pass, since the existing authored content was already complete and doesn't need frequent editing.
- Messaging is partner ↔ Tangy admin (0018), protected by TLS in transit and RLS at rest. It is deliberately **not** end-to-end encrypted — authorized admins read and reply. There is no partner-to-partner messaging and no file attachments inside chat (documents are shared through the event's Documents tab, 0020).
- **Pending-booking expiry** is handled since 0020 (`expire_stale_bookings()`, run by `run_platform_jobs()` and before every new checkout) — but only if the jobs are actually scheduled (pg_cron or an external scheduler, see 0020 above).
- **Refunds**: 0017 records refunds made in the Razorpay dashboard (`admin_record_refund`); it does not move money through the Razorpay API. The webhook (0020) only mirrors the refunded amount and payment state for reporting.
- **Ticket cancellation**: available to admins since 0017 (`admin_cancel_ticket`).
- **Notification email** needs `send-notification-emails` deployed and scheduled (section 7); until then `email_outbox` rows simply wait and in-app notifications still work.

## 7. Notification emails and scheduled jobs (0020)

`send-notification-emails` drains `email_outbox` (claimed with `FOR UPDATE SKIP LOCKED`, retried up to 5 times, then marked `failed` for admins to see in the email delivery log). It never accepts an end-user session: callers must send either `Authorization: Bearer <service_role key>` or `x-cron-secret: <CRON_SECRET>`.

```
supabase functions deploy send-notification-emails --no-verify-jwt   # it checks the service key / CRON_SECRET itself
supabase secrets set CRON_SECRET=<long random string> SITE_URL=https://tangysessions.com
# RESEND_API_KEY / RESEND_FROM_EMAIL as in section 5 (shared by every email function)
```

Schedule a `POST` to the function every minute or two (Supabase dashboard → Integrations → Cron → HTTP request, or any external scheduler) with the `x-cron-secret` header. Links in emails are `SITE_URL` + the notification's path.

`EMAIL_PROVIDER` (default `resend`) and `MAILPIT_URL` exist **only for local verification** (`EMAIL_PROVIDER=mailpit` delivers to the local stack's Mailpit inbox) — never set them in production.

`run_platform_jobs()` (expiries, reminders, overdue/expiring notices) is scheduled by 0020 itself when `pg_cron` is available; otherwise call `select public.run_platform_jobs()` every 5 minutes with the service role.

Also redeploy `razorpay-webhook` (changed in this pass: records `payment.authorized`, mirrors `refund.processed`/`refund.created`, stores processing failures on the event via `record_webhook_failure()` and alerts `payments.view` holders instead of only logging them). Subscribe the Razorpay webhook to those events too. As before, confirm payload field names against Razorpay's live "recent deliveries" before going live.
