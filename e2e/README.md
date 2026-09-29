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
Screenshots and logs go to `e2e/shots/`. The run needs Google Chrome (set `CHROME_PATH` if
it isn't in `/Applications`) and `ffmpeg` for the fake-camera videos.

| Suite | Covers |
| --- | --- |
| `superadmin.mjs` | Dashboard, approve/reject applications, all 15 event tabs, event creation, bookings drawer, every module page, command palette, logout |
| `manager.mjs` | Manager nav and forbidden routes, create → publish → cancel event, assign staff, staff announcement, blocked API calls (audit, roles, settings) |
| `staff.mjs` | Staff dashboard and nav, forbidden routes, event-scoped attendees, tasks, direct REST attacks with the staff JWT, mobile QR scan (valid / duplicate / wrong event / invalid), manual check-in |
| `session.mjs` | Idle timeout sign-out, unauthenticated deep links, wrong OTP, patron refused |
| `platform.mjs` | Artist ↔ admin messaging with notifications and read receipts, requirements, artist/vendor logistics, event-scoped vendor notice, sponsor isolation (UI + API), volunteer request → grant → mobile check-in → revoke → refused, command center counts, live permission change |

### Development role selector

`e2e/devmode.mjs` checks the dev-only role selector against two `vite` dev servers on the local stack
(without `TANGY_DEV_TOOLS=off`): `DEV_MOCK_BASE` (no service key → mock-only) and `DEV_LOCAL_BASE`
(with `SUPABASE_SERVICE_ROLE_KEY` from `supabase status` → real local sessions). Run `node e2e/devmode.mjs`.

Database-level RBAC/RLS tests live in `supabase/tests/admin_system.test.sql` (`scripts/test-db.sh`).
