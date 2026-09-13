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

## 2. Bootstrap your first admin account

RLS deliberately blocks everyone — including admins — from ever promoting their *own*
account's role (see 0003). That means there is no in-app way to create the first admin;
it has to be done once, directly, by whoever owns the Supabase project:

1. Sign up for a normal account on the live site (via the "LOGIN" button / patron modal, or the `/admin` sign-in form — both create the same kind of account).
2. In the Supabase dashboard → Table Editor → `profiles`, find that row and set `role` to `admin` (or `super_admin`).
3. Sign in at `/admin` with that account from then on.

Every admin after the first can be promoted from inside `/admin` → Users tab, by an existing admin.

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

## What's NOT covered by these migrations

- Diary and Archive content are still static/editorial (`src/data/mockData.js` and the section components) — no CMS tables were added for them in this pass, since the existing authored content was already complete and doesn't need frequent editing.
- User↔admin messaging (conversations/messages, real E2E encryption) — designed but not yet built; a separate pass.
