# 27 — Deployment Architecture

The repository proves the **frontend build is designed for Vercel**:

- `vercel.json` SPA rewrite
- `vite.config.js` reads `VERCEL_ENV`
- commit history: *"Fix Vercel 404s on direct route navigation"* (16 Aug), *"build on Vercel's Linux — lowercase archive folder, lockfile for npm 10"* (2 Oct)

The **backend deployment is not done**. `docs/OPERATIONS.md` §3a: *"Nothing here has been deployed yet: the repository has no `supabase/config.toml`, no linked project ref, no CI and no deploy script, so every step below is an operator action."* `supabase/production-bootstrap/README.md`: *"Nothing here has been applied to production."*

## Deployment model

```mermaid
---
title: Deployment — what is code, what is operator action
---
flowchart LR
  classDef code fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  classDef op fill:#fde3c8,stroke:#b8560a,color:#3a1a00
  classDef ext fill:#efe0f5,stroke:#6b3d87,color:#222
  classDef nd fill:#eeeeee,stroke:#888,color:#444,stroke-dasharray: 4 3
  GH["GitHub ·<br/>komalrubyjane/tangy-world<br/>source of truth"]:::code
  GH --> CI["CI / GitHub Actions<br/>NOT PRESENT"]:::nd
  GH --> VB["Vercel build: vite build<br/>assertBackendConfigured ·<br/>assertNoSecretInBrowserEnv<br/>demo/review/dev tools compiled<br/>out"]:::code
  VB --> VE["Vercel env (PRODUCTION<br/>CONFIGURATION)<br/>VITE_SUPABASE_URL ·<br/>VITE_SUPABASE_PUBLISHABLE_KEY"]:::op
  VB --> HOST["Vercel hosting · vercel.json<br/>rewrite /(.*) → /index.html"]:::code
  HOST --> DOM["Domain → SITE_URL<br/>NOT DETERMINABLE FROM<br/>REPOSITORY<br/>(tangysessions.com appears<br/>only as a default sender /<br/>fallback)"]:::nd
  GH --> PB["supabase/production-bootstrap/<br/>35 SQL files + SHA256SUMS +<br/>inventory check"]:::code
  PB --> SP[("Supabase project<br/>ohyjqxbsgdkzytfnlitf<br/>apply in order — operator, NOT<br/>APPLIED")]:::op
  SP --> OTP["Auth: email OTP template with<br/>token<br/>PRODUCTION CONFIGURATION"]:::op
  SP --> CRON["pg_cron tangy-platform-jobs<br/>(auto if extension available)"]:::op
  GH --> EFD["supabase functions deploy × 7<br/>webhook + email drain with<br/>--no-verify-jwt<br/>operator, NOT DEPLOYED"]:::op
  EFD --> SEC["supabase secrets set<br/>RAZORPAY_* · RESEND_API_KEY ·<br/>EMAIL_FROM · SITE_URL ·<br/>CRON_SECRET"]:::op
  EFD --> RZ["Razorpay dashboard: webhook<br/>URL<br/>/functions/v1/razorpay-webhook<br/>+ secret<br/>test mode first · auto-capture"]:::ext
  EFD --> RS["Resend: verify sending domain<br/>(SPF, DKIM, DMARC)"]:::ext
  EFD --> SCH["Scheduler: POST<br/>send-notification-emails every<br/>1–2 min"]:::op
  SP --> FIRST["Bootstrap first Super Admin<br/>via SQL (supabase/README.md<br/>§2)"]:::op
```

## Hosting references, labelled

| Reference | Evidence | Label |
|---|---|---|
| Vercel | `vercel.json`; `VERCEL_ENV` checks in `vite.config.js`; deploy-fix commits; review deploys as "Vercel Preview" (`docs/EVENT_WORKFLOW.md`) | **CURRENT** (frontend hosting target) |
| Vercel Preview + disposable review Supabase project | `teamReview.js`, `docs/EVENT_WORKFLOW.md` "Team review deployment" | **PREVIEW** |
| Supabase hosted project `ohyjqxbsgdkzytfnlitf` | `docs/OPERATIONS.md` §2a/§3a, webhook URL | **CURRENT target, NOT APPLIED** |
| Local Supabase (Docker) | `supabase/README.md`, `e2e/README.md`, scripts | **LOCAL** |
| `tangy-world.html` (legacy static page at the repo root) | `App.jsx` comment: it collides with a `/tangy-world` route in dev | **LEGACY** |
| Azure, Netlify, Cloudflare, GitHub Pages | not found | **NOT USED** |

## Ordered production checklist (from the runbooks)

1. Apply `supabase/production-bootstrap/*` in order to the empty project; verify with `checks/production_inventory.readonly.sql` (`scripts/test-production-bootstrap.sh` validates the package locally).
2. Create the first Super Admin by SQL (`supabase/README.md` §2). Invite the rest through the console.
3. Configure the Auth email OTP template (`{{ .Token }}`).
4. Confirm `pg_cron` / `tangy-platform-jobs` exists, or schedule `run_platform_jobs()` externally every 5 min.
5. Set Edge Function secrets; deploy the 7 functions with the documented JWT flags.
6. Razorpay: webhook URL + secret (`payment.captured`, `order.paid`, `payment.failed`, `payment.authorized`, `refund.processed`, `refund.created`), auto-capture, test keys first.
7. Resend: verify the domain; set `EMAIL_FROM`; schedule the email drain.
8. Vercel: set `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`; deploy; set `SITE_URL` to the canonical origin.
9. Verify in test mode: a booking, the ticket email, an approval email, the email delivery log, the webhook log.

None of these steps can be confirmed as done from the repository.
