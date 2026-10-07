# Tangy World — Architecture Documentation Package

This folder is a reverse-engineered, code-verified description of the Tangy World / Tangy Sessions platform as it exists in this repository at commit `cbd1151` (4 Oct 2026). Every table, RPC, Edge Function, route and workflow named here was found in the source. Nothing was inferred from naming alone.

**Start with** [`TANGY_WORLD_COMPLETE_ARCHITECTURE.md`](TANGY_WORLD_COMPLETE_ARCHITECTURE.md) (index) or the PDF `TANGY_WORLD_COMPLETE_ARCHITECTURE.pdf`.

## Status labels used throughout

| Label | Meaning |
|---|---|
| **IMPLEMENTED** | Present in code and wired end-to-end (frontend → service → database / Edge Function). |
| **PARTIALLY IMPLEMENTED** | Some of the path exists; a step is missing or manual. |
| **NOT IMPLEMENTED** | No code for it in the repository. |
| **DEMO / LOCAL ONLY** | Exists only for local development, the demo dataset or review builds; compiled out of / refused for production. |
| **DOCUMENTED BUT NOT VERIFIED IN CODE** | Described in a doc/runbook but the repository cannot prove it (e.g. a dashboard setting). |
| **PRODUCTION CONFIGURATION** | Needs an operator action (secret, dashboard setting, scheduler) rather than code. |
| **LEGACY** | Old route / service kept for compatibility, not the current path. |

## How the facts were gathered

- **Frontend:** `src/App.jsx` routes, `src/admin/AdminApp.jsx` routes, every `supabase.from()/rpc()/functions.invoke()/storage.from()/channel()` call grouped by file (see [31-who-calls-what.md](31-who-calls-what.md)).
- **Database:** all 36 migrations in `supabase/migrations/`. The *final* RLS policy set was computed by replaying every `create policy` / `drop policy`. Key functions were read from their *latest* definition (the file each is quoted from is named).
- **Edge Functions:** the 7 functions and 4 shared modules in `supabase/functions/` were read in full.
- **Operations:** `docs/OPERATIONS.md`, `supabase/README.md`, `supabase/production-bootstrap/README.md`, `scripts/`, `vite.config.js`, `vercel.json`, `.env.example`.

## Files

| # | File | Topic |
|---|---|---|
| 01 | [01-system-overview.md](01-system-overview.md) | What Tangy World is; system context diagram |
| 02 | [02-user-roles.md](02-user-roles.md) | Every role, its login, routes, permissions, RLS |
| 03 | [03-website-map.md](03-website-map.md) | Visual sitemap of every route group |
| 04 | [04-frontend-architecture.md](04-frontend-architecture.md) | Providers, router, shells, services |
| 05 | [05-authentication.md](05-authentication.md) | OTP / password sign-in, profile, role & permission resolution, invitations |
| 06 | [06-admin-architecture.md](06-admin-architecture.md) | The admin "control room" section by section |
| 07 | [07-artist-architecture.md](07-artist-architecture.md) | Artist lifecycle and portal |
| 08 | [08-artist-application.md](08-artist-application.md) | `/artist/apply` 8-step wizard + admin review |
| 09 | [09-event-lifecycle.md](09-event-lifecycle.md) | Event from draft to archive |
| 10 | [10-event-artist-workflow.md](10-event-artist-workflow.md) | Availability, line-up, booking requests, locks |
| 11 | [11-booking-workflow.md](11-booking-workflow.md) | Customer journey from session page to check-in |
| 12 | [12-payment-architecture.md](12-payment-architecture.md) | Razorpay order, verify, webhook, settlement |
| 13 | [13-ticket-workflow.md](13-ticket-workflow.md) | Ticket issuance and QR |
| 14 | [14-checkin-workflow.md](14-checkin-workflow.md) | Scanner, group check-in, temporary access |
| 15 | [15-waitlist-workflow.md](15-waitlist-workflow.md) | Waitlist, offers, expiry |
| 16 | [16-notification-architecture.md](16-notification-architecture.md) | `notify()`, preferences, in-app + email queue |
| 17 | [17-email-architecture.md](17-email-architecture.md) | Every email path, outbox drain, Resend |
| 18 | [18-messaging-architecture.md](18-messaging-architecture.md) | Conversations, participants, RLS |
| 19 | [19-content-architecture.md](19-content-architecture.md) | CMS: TV, diary, gallery, programmes, announcements |
| 20 | [20-storage-architecture.md](20-storage-architecture.md) | Every Storage bucket and its policies |
| 21 | [21-database-architecture.md](21-database-architecture.md) | Domain map, ER diagrams, table catalogue |
| 22 | [22-rpc-function-map.md](22-rpc-function-map.md) | RPCs used by the frontend / Edge Functions |
| 23 | [23-edge-functions.md](23-edge-functions.md) | All 7 Edge Functions |
| 24 | [24-scheduled-jobs.md](24-scheduled-jobs.md) | pg_cron + email drain |
| 25 | [25-security-architecture.md](25-security-architecture.md) | Layered security model, keys, secrets |
| 26 | [26-demo-local-architecture.md](26-demo-local-architecture.md) | Local stack, demo data, dev role switcher, review mode |
| 27 | [27-deployment-architecture.md](27-deployment-architecture.md) | Vercel + Supabase + Razorpay + Resend |
| 28 | [28-environment-architecture.md](28-environment-architecture.md) | Local / dev / review / production |
| 29 | [29-failure-recovery.md](29-failure-recovery.md) | Failure branches for every critical flow |
| 30 | [30-data-flow.md](30-data-flow.md) | 12 data-flow diagrams |
| 31 | [31-who-calls-what.md](31-who-calls-what.md) | Page → service → RPC/table → function → external |
| 32 | [32-complete-business-flow.md](32-complete-business-flow.md) | End-to-end business lifecycle |
| 33 | [33-explaining-tangy.md](33-explaining-tangy.md) | Plain-language explanation |
| 34 | [34-presentation-guide.md](34-presentation-guide.md) | Recommended 15–30 minute presentation order |

`diagrams/` holds every Mermaid diagram from these files as a standalone `.mmd` source plus a rendered `.svg`.

## Scope rules this package follows

- No application code, migration, Edge Function, configuration or secret was changed — only `docs/architecture/` was added.
- No secret values appear anywhere. Secret **names** are listed because the code reads them.
- "Deployed" is never claimed: the repository's own runbook (`docs/OPERATIONS.md` §3a) states the backend has not been deployed and production secrets are not configured.
