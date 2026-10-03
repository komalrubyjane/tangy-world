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

17. `migrations/0017_security_lockdown.sql` — Phase 1 security lockdown. **Run `preflight/0017_security_lockdown_preflight.sql` first** (read-only). See [§ 1a](#1a-0017-security-lockdown) below.

## 1a. 0017 security lockdown

What it closes (each has a test in `tests/security_lockdown.test.sql`):

- **Free tickets / arbitrary bookings** — `create_pending_booking` and `confirm_booking_and_issue_tickets` were executable by anyone through `/rest/v1/rpc` (PostgreSQL grants `EXECUTE` to `PUBLIC`, and Supabase's default privileges grant it to `anon`/`authenticated`). Every `SECURITY DEFINER` and trigger function now has least-privilege grants: those two are `service_role` only (the `razorpay-*` Edge Functions), client RPCs are `authenticated` only (each checks role/ownership inside), and only the RLS helper predicates stay callable by `anon`.
- **Self-approved artists** — artist inserts must be by the account itself (`user_id = auth.uid()`) and start `pending`; one artist row per account (unique `artists.user_id`).
- **Self-approved applications** — `collaborations` / `crew_applications` / `private_enquiries` inserts must be `pending` (`contact_enquiries`: `new`); `private_enquiries` can only be filed as yourself or anonymously.
- **Profile email spoofing** — `profiles.email` / `passport_id` / `member_since` can no longer be changed through the API; `profiles.email` is kept in sync from `auth.users`, and the waitlist self-read policy now uses the email in the signed JWT.
- **Super admin** — only a `super_admin` can grant or revoke `super_admin`, and the last one can't be demoted. The project owner (SQL editor / Table Editor, no API JWT) is no longer blocked, so the first-admin bootstrap below actually works (0003's guard used to reject it).
- **Event delete destroying history** — `bookings`/`tickets`/`checkins` foreign keys to `events` (and to each other) are `ON DELETE RESTRICT` instead of `CASCADE`, and staff/admin can no longer `DELETE` those rows through the API. Deleting an event that has bookings now fails; events with no bookings can still be deleted.
- **Portal authorization** — only approved artists can be requested for (or accept) a session; conversations can only be assigned to staff/admin accounts; `artist_availability` is public only for approved artists.

How to apply safely:

1. Take a backup (Dashboard → Database → Backups).
2. Run `preflight/0017_security_lockdown_preflight.sql` in the SQL editor. It only reads. Result 1 must show `has_0016 = true`, `has_platform_finalization = false`. Result 2 must be empty — if any account has several artist rows, decide by hand which one it keeps (0017 stops rather than choosing for you). Results 5–9 list rows that *may* be traces of these holes having been used — 0017 doesn't touch them; review them yourself.
3. Paste `migrations/0017_security_lockdown.sql` as one query. It runs in one transaction: if a preflight check inside it fails, nothing is changed.
4. Re-run result 3 of the preflight: only `current_role_name`, `is_admin`, `is_staff_or_admin`, `is_participant`, `is_own_assignment` should show `anon = true`.

Rollback: `rollbacks/0017_security_lockdown.down.sql` restores the 0016 policies/functions/foreign keys (re-opening those holes) but deliberately keeps the function privileges locked down.

**Not for the platform-finalization branch.** `origin/feat/platform-finalization` has its own `0017_admin_system.sql … 0034`. This 0017 refuses to run on a database that already has those (it checks for `public.role_permissions`), because it would overwrite functions they redefine. If that branch is the one going to production, these fixes need porting onto its 0034 schema instead.

### Running the security tests

```
supabase/tests/run_local.sh              # 0001–0017, then every tests/*.test.sql
UP_TO=0016 supabase/tests/run_local.sh   # the pre-lockdown schema: shows what 0017 fixes
```

This starts a **throwaway local PostgreSQL 16** (needs the server binaries and `pgcrypto`), loads `tests/local/supabase_shim.sql` (the `anon`/`authenticated`/`service_role` roles, `auth.uid()`/`auth.role()`/`auth.jwt()`, Supabase's default privileges, storage stubs), applies the migrations, and runs the tests by impersonating API requests the way PostgREST does. It never connects to a Supabase project. It does not exercise GoTrue, PostgREST, Storage or the Edge Functions themselves — only the database's own enforcement. The shim must never be run against a real project.

## 2. Bootstrap your first admin account

RLS deliberately blocks everyone — including admins — from ever promoting their *own*
account's role (see 0003). That means there is no in-app way to create the first admin;
it has to be done once, directly, by whoever owns the Supabase project:

1. Sign up for a normal account on the live site (the "LOGIN" button / patron modal — email one-time code; the `/admin` form only signs in, it can't create accounts).
2. `/admin` signs in with email + **password**, and OTP accounts have none: while signed in, set one under Profile → change password.
3. In the Supabase dashboard → Table Editor → `profiles`, find that row and set `role` to `super_admin` for the owner account (`admin` for others). Before 0017 the role guard rejected this edit too; 0017 allows it for the project owner's own tools.
4. Sign in at `/admin` with that account from then on.

After 0017, admins can grant `staff`/`admin` from `/admin` → Users, but only a `super_admin` can grant or revoke `super_admin`, and the last `super_admin` can't be demoted.

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

## What's NOT covered by these migrations

- Diary and Archive content are still static/editorial (`src/data/mockData.js` and the section components) — no CMS tables were added for them in this pass, since the existing authored content was already complete and doesn't need frequent editing.
- User↔admin messaging (conversations/messages, real E2E encryption) — designed but not yet built; a separate pass.
- **Pending-booking expiry**: `create_pending_booking()` counts `pending` bookings against capacity (correctly, to reserve inventory during checkout) but nothing ever expires an abandoned pending booking — someone who starts checkout and never pays holds that inventory indefinitely. No cron/scheduled Edge Function was added for this pass; a real fix needs one (e.g. expire pending bookings older than ~30 minutes, matching the "pending booking expiration if already supported" note in the spec this was built against — it wasn't already supported, and wasn't added here).
- **Refunds**: deliberately not implemented — Admin Payments is read-only this pass, as scoped.
- **Ticket cancellation**: no admin action cancels an individual ticket (`tickets.status = 'cancelled'` is modeled in the schema/check-in logic but nothing currently sets it) — a real refund/cancellation workflow would need to.
