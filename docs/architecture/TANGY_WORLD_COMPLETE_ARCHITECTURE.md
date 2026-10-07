# Tangy World — Complete Architecture

**Repository:** `komalrubyjane/tangy-world` · **Commit documented:** `cbd1151` (4 Oct 2026) · **Package generated:** 7 Oct 2026

This is the master index of the architecture package. Every statement in the linked documents was traced to source code, migrations, Edge Functions or the repository's own runbooks. Status labels are explained in [00-README.md](00-README.md). The same content, with all diagrams rendered, is in `TANGY_WORLD_COMPLETE_ARCHITECTURE.pdf`. Standalone diagram sources and SVGs are in [`diagrams/`](diagrams/).

## Contents

| Part | Documents |
|---|---|
| **Overview** | [01 System overview](01-system-overview.md) · [02 User roles](02-user-roles.md) · [03 Website map](03-website-map.md) · [04 Frontend architecture](04-frontend-architecture.md) · [05 Authentication](05-authentication.md) |
| **Operations** | [06 Admin architecture](06-admin-architecture.md) |
| **Artists** | [07 Artist architecture](07-artist-architecture.md) · [08 Artist application](08-artist-application.md) |
| **Events** | [09 Event lifecycle](09-event-lifecycle.md) · [10 Event ↔ artist workflow](10-event-artist-workflow.md) |
| **Commerce** | [11 Booking workflow](11-booking-workflow.md) · [12 Payment architecture](12-payment-architecture.md) · [13 Ticket workflow](13-ticket-workflow.md) · [14 Check-in workflow](14-checkin-workflow.md) · [15 Waitlist workflow](15-waitlist-workflow.md) |
| **Communication** | [16 Notifications](16-notification-architecture.md) · [17 Email](17-email-architecture.md) · [18 Messaging](18-messaging-architecture.md) |
| **Content & files** | [19 Content / CMS](19-content-architecture.md) · [20 Storage](20-storage-architecture.md) |
| **Backend** | [21 Database](21-database-architecture.md) · [22 RPC map](22-rpc-function-map.md) · [23 Edge Functions](23-edge-functions.md) · [24 Scheduled jobs](24-scheduled-jobs.md) · [25 Security](25-security-architecture.md) |
| **Environments** | [26 Demo / local](26-demo-local-architecture.md) · [27 Deployment](27-deployment-architecture.md) · [28 Environments](28-environment-architecture.md) |
| **Cross-cutting** | [29 Failure & recovery](29-failure-recovery.md) · [30 Data flow](30-data-flow.md) · [31 Who calls what](31-who-calls-what.md) · [32 Complete business flow](32-complete-business-flow.md) |
| **Explaining it** | [33 Explaining Tangy (non-technical)](33-explaining-tangy.md) · [34 Presentation guide](34-presentation-guide.md) |

## The system in one paragraph

Tangy World is a React 19 single-page app, built with Vite and configured for Vercel, on top of Supabase. All rules live in Postgres:

- 61 tables, about 228 functions, about 240 RLS policies
- prices, seat holds, waitlist offers and settlement decided under row locks
- roles and permissions in a table, with self-promotion blocked by a trigger
- an append-only audit log

Seven Deno Edge Functions handle Razorpay (order, signature verification, webhook) and email through Resend (ticket, notification drain, approval, invitation). Customers book on the session page and get one QR per booking. Staff, or volunteers with time-boxed access, admit attendees by name. Artists apply through an 8-step application, set their availability, and accept requests that the database protects against double-booking.

## Key findings

### Major workflows documented

Every workflow below has a diagram:

- authentication and invitations
- role provisioning
- the artist application and review loop
- artist availability
- line-up and booking requests
- the event lifecycle
- customer booking
- Razorpay payment (browser and webhook paths)
- settlement decisions
- ticket issuance and QR
- group check-in and volunteer temporary access
- waitlist offers and expiry
- notifications and preferences
- the ticket and notification email queue
- approval and invitation email
- messaging (support, partner, private)
- content publishing
- storage uploads and signed reads
- scheduled jobs
- local demo and review environments
- deployment
- failure and recovery
- data flows
- the end-to-end business lifecycle

### Production vs repository

| Item | Repository | Production |
|---|---|---|
| Database | 36 migrations + a validated production bootstrap package | **Not applied** (`production-bootstrap/README.md`) |
| Edge Functions | 7 functions, deploy flags documented | **Not deployed**; no `supabase/config.toml`, no CI (`docs/OPERATIONS.md` §3a) |
| Razorpay | full integration | keys, webhook URL and secret **not configured**; payload fields to verify against a live webhook |
| Email | Resend provider module, outbox, drain | `RESEND_API_KEY`, verified domain and the **drain scheduler** not set up |
| Auth OTP | `signInWithOtp` / `verifyOtp` | email template must contain the token: unverified |
| Frontend | Vercel-ready build with guards | canonical domain / `SITE_URL` **not determinable** from the repo |

### Architecture inconsistencies found

1. **Artist approval email gap.** Approving through *Artist Applications* (`review_artist_application`) sends only an in-app notice. The branded `send-approval-email` runs only from the generic *Applications* drawer. See [07](07-artist-architecture.md).
2. **Ticket holders get no reminders and no cancellation notices.** `send_event_reminders` and `notify_on_event_change` target event *members* only. Cancelling an event does not touch bookings. See [09](09-event-lifecycle.md).
3. **Event `sold-out` / `past` statuses are manual.** Capacity is enforced automatically, but the status flags are not updated by any trigger.
4. **Role-string checks in two Edge Functions.** `send-ticket-email` (staff/admin/super_admin) and `send-approval-email` (admin/super_admin) authorize by `profiles.role`, not `has_permission()`, unlike the rest of the system.
5. **Stale documentation.** `.env.example` still calls `content-media` public (private since 0029). The 0017 comment says `role_permissions` is "never changed from the app", but `set_role_permission` (0018) now allows it.
6. **Redundant cron job.** `tangy-log-expired-access` (0018) duplicates work already in `run_platform_jobs`. It is only created if pg_cron pre-existed.
7. **Unused legacy code.**
   - The mock services behind `isMockAuth` (always false).
   - `assignmentRequestService` / `create_assignment_request` (0008).
   - `adminApi.createBookingRequest` / `create_booking_request` (0020).
   - `VITE_RAZORPAY_KEY_ID` (listed in `.env.example`, never read).
8. **No security headers / CSP** in `vercel.json` or `index.html`.
9. **The repository README** is still the default Vite template.

### Undocumented / uncertain areas

- **Live configuration:**
  - Razorpay payload field names (the webhook source carries its own "verify before going live" note)
  - payment auto-capture
  - Supabase Auth rate limits and the OTP template
  - whether `pg_cron` is available in the production project
- **No ownership information:** the repository has no deployment or monitoring setup for Vercel environments.
- **Tangy AI:** the public assistant is a knowledge-base lookup; the admin AI page is a placeholder.

## Diagram inventory

90 Mermaid diagrams (flowcharts, sequence diagrams, state diagrams and ER diagrams), each with a title. All of them validated by rendering with Mermaid 11 in headless Chromium.
