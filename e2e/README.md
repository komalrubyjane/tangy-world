# Admin system E2E tests

Browser tests that drive the real admin UI: Email OTP login, RBAC for all three
roles, applications, events, team assignments, announcements, direct API
authorization attempts, session timeout, and mobile QR check-in through a
fake camera. They run **only against a local Supabase stack** and never touch
production.

## One-time setup

1. Start a local stack from any scratch folder (`npx supabase init && npx supabase start`).
   To make OTP codes readable, give the magic-link email a code template in its
   `supabase/config.toml`, then restart:

   ```toml
   [auth.email.template.magic_link]
   subject = "Your Tangy sign-in code"
   content_path = "./supabase/templates/magic_link.html"   # contains: Your code is {{ .Token }}
   ```

2. Apply the migrations: `scripts/test-db.sh --apply`
3. Export the local stack's keys (from the stack folder): `eval "$(npx supabase status -o env)"`.
   This sets `ANON_KEY` and `SERVICE_ROLE_KEY`; no keys are stored in this repo.
4. Seed the test accounts and synthetic data: `e2e/setup.sh` (runs `seed.sql`, then `seed_platform.sql` for the approved partner/volunteer accounts)

## Running

Start the dev server against the local stack (these env vars override `.env.local`).
`TANGY_DEV_TOOLS=off` hides the development role selector so the real sign-in is tested:

```sh
VITE_SUPABASE_URL=http://127.0.0.1:54321 \
VITE_SUPABASE_ANON_KEY="$ANON_KEY" \
VITE_DEMO_ADMIN_ENABLED=false TANGY_DEV_TOOLS=off npx vite --host 127.0.0.1 --port 5173
```

Then run `e2e/run.sh` (with `ANON_KEY` still exported; set `E2E_BASE` for another port). Each suite resets its data first, so the run is repeatable.
The local auth server allows 30 sign-ins per 5 minutes per IP; the full run signs in more often, so `otpLogin` waits and retries when a code is refused (the log shows "otp send refused … waiting 60s").
Screenshots and logs go to `e2e/shots/`. The run needs Google Chrome (set `CHROME_PATH` if
it isn't in `/Applications`) and `ffmpeg` for the fake-camera videos.

| Suite | Covers |
| --- | --- |
| `superadmin.mjs` | Dashboard, approve/reject applications, all 15 event tabs, event creation, bookings drawer, every module page, command palette, logout |
| `manager.mjs` | Manager nav and forbidden routes, create → publish → cancel event, assign staff, staff announcement, blocked API calls (audit, roles, settings) |
| `staff.mjs` | Staff dashboard and nav, forbidden routes, event-scoped attendees, tasks, direct REST attacks with the staff JWT, mobile QR scan (valid / duplicate / wrong event / invalid), manual check-in |
| `session.mjs` | Idle timeout sign-out, unauthenticated deep links, wrong OTP, patron refused |
| `platform.mjs` | Artist ↔ admin messaging with notifications and read receipts, requirements, artist/vendor logistics, event-scoped vendor notice, sponsor isolation (UI + API), volunteer request → grant → mobile check-in → revoke → refused, command center counts, live permission change |
| `portals.mjs` | Artist workspace (dashboard, booking request → accept, calendar month/week/agenda, availability, event drawer, public vs private profile + avatar, media upload/archive/submit/signed-URL preview/curator approval, settings + notification preferences, no marketing pop-up on workspace pages), sponsor (events, deliverables, brand assets + review, invoices, notifications, messages), vendor (logistics, requirements, invoices, notifications, messages), venue host (doors/logistics, event-change notice, messages), and isolation: private storage buckets, signed URLs, cross-role documents, cross-partner messages. Deliberate refusals are listed separately under EXPECTED REFUSALS |
| `mobile.mjs` | 390 × 844 touch: admin (drawer nav, global search → event, tabs, tables as cards, tasks list/board/new, volunteers, reports, partners, invoices, reviews, notification panel, message thread), artist (menu, agenda calendar + drawer, workspace tabs, compose/reply, requests, media upload, profile save, settings), sponsor / vendor / venue host / volunteer portals, and the staff check-in terminal — no horizontal overflow, dialogs and drawers fit, buttons reachable |
| `groupcheckin.mjs` | Named attendees + one booking QR (0023): scan → tick who's here (3), same QR later (2), full, refresh, single attendee, wrong event, invalid; manual lookup by attendee name → same engine; QR by a second staff member; per-attendee history; attendee list / reports count attendees; server contract with each role's JWT (foreign / cross-event / forged / duplicate / already-in attendees refused whole, concurrent gates on the same person, overlapping bursts); cancelled booking; customer / volunteer refused; blank attendee name refused by the Edge Function |
| `checkout.mjs` | Booking form (0024) at 390px: admin configures the event's form; customer goes Your details → Who's coming (5 named people) → Requirements → Review & pay with per-step validation and no data loss; the real `razorpay-create-order` stores the booking; payment failure + retry confirm nothing; payment success / duplicate / failure arrive as HMAC-signed webhooks through the real `razorpay-webhook`; booking management, admin booking view, collaboration lead, named check-in (2 then 3), wrong event, customer refused. **Needs** `RAZORPAY_WEBHOOK_SECRET_LOCAL` = the local stack's `RAZORPAY_WEBHOOK_SECRET` (a random local-only value in the `--env-file` given to `supabase functions serve`). No Razorpay account exists locally, so the hosted checkout and Razorpay's order API are not exercised — the suite attaches an order id where Razorpay would |
| `enquiries.mjs` | Auth-first enquiries (0025) at 390px: contact / private sessions / crew / sponsor forms gated for signed-out visitors (inline OTP keeps them on the page), prefill, stored against the account, receipt + team alert, duplicate message explained, anonymous and spoofed inserts refused by the database, `?next=` kept and off-site values ignored, admin sees the enquiry |
| `waitlist.mjs` | Waitlist (0027) at 390px: sold-out session shows the waitlist, sign-in returns to the session, join for 2 → position 1, direct inserts / self-offers / offer engine / double join refused, a cancellation offers the seats (notification, held-seat banner, checkout) while others still see sold out, dashboard and admin views, lapsed hold released back on sale |
| `content.mjs` | Content CMS (0028): manager drafts → publishes a diary post (draft is a 404 for visitors), renames a Tangy TV video (every visitor sees it; old ops/tv redirects), builds a gallery album (alt text required); ticket types edited in the event's Tickets tab reach the public session page; staff get no content nav and the database refuses their writes; 404, FAQ and artist pages |
| `responsive.mjs` | Public pages at 390×844, 375×812 and 412×915: no sideways scroll, one visible h1, image alt attributes, named controls, per-page titles |
| `devmode.mjs` | Development role selector (run by `run.sh` last; needs the two dev-tools servers below) |

### Development role selector

`e2e/devmode.mjs` (also run by `run.sh`) checks the dev-only role selector against two `vite` dev servers on the local stack
(without `TANGY_DEV_TOOLS=off`): `DEV_MOCK_BASE` (no service key → mock-only) and `DEV_LOCAL_BASE`
(with `SUPABASE_SERVICE_ROLE_KEY` from `supabase status` → real local sessions). Run `node e2e/devmode.mjs`.

Database-level RBAC/RLS tests live in `supabase/tests/admin_system.test.sql` (`scripts/test-db.sh`).
