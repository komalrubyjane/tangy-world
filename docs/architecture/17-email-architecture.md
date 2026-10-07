# 17 — Email Architecture

All email leaves through **one module**: `supabase/functions/_shared/email.ts`. It is the only place email secrets are read. Provider is chosen by `EMAIL_PROVIDER`:

| Provider | Behaviour | Environment |
|---|---|---|
| `resend` (default) | `POST https://api.resend.com/emails` with `RESEND_API_KEY`; supports attachments | **production** (needs the key and a verified domain: **PRODUCTION CONFIGURATION, not done**, `docs/OPERATIONS.md` §2) |
| `mailpit` | `POST $MAILPIT_URL/api/v1/send` | **LOCAL ONLY** |
| `log` | Logs recipient + subject only, reports "sent" | development |
| `disabled` / missing key | `notConfigured`: **nothing is sent and nothing is marked failed**; queued emails wait | — |

## The four email paths

| Email | Trigger | Sender | Idempotency |
|---|---|---|---|
| **Ticket confirmation** (with `booking-pass.png` QR) | `settle_payment` confirmed a booking → `enqueueTicketEmail` in `razorpay-verify-payment` **and** `razorpay-webhook` | `email_outbox` row of type `ticket.confirmed` → `send-notification-emails` drain → `sendTicketRow` | unique `dedupe_key = ticket.confirmed:<booking id>`; `bookings.ticket_email_status` (`pending`/`sent`/`failed`) |
| **Notification emails** (54-type catalogue, those with `email = true`) | `notify()` | `email_outbox` → `send-notification-emails` → `notificationHtml` | `dedupe_key` per user + type + link + title hour (15-min bucket for chat) |
| **Application approved** (branded) | Admin approves on the generic Applications screen | browser → `send-approval-email` directly (not queued) | `application_notifications (source_table, source_id, 'approval')` unique row; `status` sent/failed; `force` to resend |
| **Console invitation** | Users & Roles → invite | browser → `admin-invite-user` directly (not queued) | Invitation row; `email_status` sent / failed / not_configured; link returned once if email fails |

## Ticket email: the actual implementation

Since commit `cbd1151` (*"ticket email is queued server-side on settlement, not sent by the browser"*), the ticket email no longer depends on the customer's browser.

```mermaid
---
title: Ticket email — queue, dedupe, drain, fallbacks
---
flowchart TD
  classDef start fill:#1f6f43,color:#fff
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef dec fill:#fff3c4,stroke:#b38600,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef ext fill:#efe0f5,stroke:#6b3d87,color:#222
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef res fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  P(["settle_payment → confirmed<br/>(verify path and/or<br/>webhook path)"]):::start --> EQ["enqueueTicketEmail(booking)"]:::proc
  EQ --> C1{"booking confirmed?"}:::dec
  C1 -- no --> NQ["not queued (ok)"]:::res
  C1 -- yes --> C2{"ticket_email_status =<br/>sent?"}:::dec
  C2 -- yes --> AS["already sent (ok)"]:::res
  C2 -- no --> C3{"account email<br/>(profiles.email)?"}:::dec
  C3 -- no --> NE["mark failed 'No linked<br/>account email on file.'"]:::err
  C3 -- yes --> IN["insert email_outbox<br/>type ticket.confirmed ·<br/>dedupe_key<br/>ticket.confirmed:booking"]:::db
  IN -- "23505 duplicate" --> DUP["already queued (ok) —<br/>second path or redelivery"]:::res
  IN --> Q[("email_outbox status queued")]:::db
  SCH(["Scheduler every 1–2 min<br/>POST<br/>send-notification-emails<br/>x-cron-secret or service<br/>key"]):::start --> CFG{"provider configured?"}:::dec
  CFG -- no --> WAIT["return configured:false ·<br/>queue untouched"]:::err
  CFG -- yes --> CL["claim_email_batch(25)<br/>FOR UPDATE SKIP LOCKED ·<br/>status sending ·<br/>attempts+1"]:::db
  Q --> CL
  CL --> TR{"ticket.confirmed row?"}:::dec
  TR -- yes --> CH{"booking found, confirmed,<br/>not already sent?"}:::dec
  CH -- no --> SKP["status skipped (reason)"]:::res
  CH -- yes --> BT["buildTicketEmail: tickets<br/>· event · account email<br/>QR<br/>TANGY:BOOKING:group_token<br/>→ booking-pass.png"]:::proc
  BT --> SEND["sendEmail → Resend"]:::ext
  TR -- no --> NH["notificationHtml(title,<br/>body, SITE_URL + link)"]:::proc --> SEND
  SEND --> RES{"ok?"}:::dec
  RES -- yes --> DONE["complete_email ok → sent<br/>bookings.ticket_email_status<br/>sent"]:::res
  RES -- no --> RET["complete_email fail →<br/>queued again<br/>(attempts < 5) else failed<br/>· last_error"]:::err
  RET --> CL
  BR["Browser after verify:<br/>send-ticket-email(booking)"]:::proc --> BQ{"already sent or queued /<br/>sending?"}:::dec
  BQ -- yes --> NOOP["no-op (queued:true /<br/>already_sent)"]:::res
  BQ -- no --> DIRECT["direct send fallback ·<br/>mark sent / failed"]:::proc
  AD["Admin 'Resend email' ·<br/>send-ticket-email<br/>force=true<br/>caller role<br/>staff/admin/super_admin"]:::proc --> DIRECT
```

### Cases

| Case | Behaviour |
|---|---|
| Browser closed right after paying | Webhook path queues the email; drain sends it |
| Both verify and webhook ran | Same `dedupe_key`: one row, one email |
| Provider not configured | Drain returns `{configured:false}`; rows stay `queued` (not failed) and go out once configured |
| Provider error | Retried by later drain runs, up to 5 attempts, then `failed` with `last_error` (visible in Admin → Email delivery) |
| Stuck `sending` row | Reclaimed after 10 minutes (`claim_email_batch`) |
| Already emailed (admin resend or fallback first) | Drain marks the queued row `skipped` ("Ticket email already sent.") |
| Admin resend | `send-ticket-email` with `force:true` always sends; only `bookings.ticket_email_*` changes, never payment or tickets |
| No account email | `ticket_email_status = failed` with the reason; nothing queued |

## Notification email drain

`send-notification-emails` (`--no-verify-jwt`):

1. Accepts only `Authorization: Bearer <service role key>` or `x-cron-secret: <CRON_SECRET>`. It never accepts an end-user JWT.
2. Claims up to 25 rows.
3. Renders each one: ticket rows through `sendTicketRow`, everything else through `notificationHtml`. The action label comes from `ACTION_LABEL[type]` and the link is `SITE_URL + link`.
4. Calls `complete_email` for each row.

Response: `{claimed, sent, failed, skipped}`.

**Scheduling the drain is PRODUCTION CONFIGURATION.** No migration schedules it. `docs/OPERATIONS.md` §2a Step 5 asks the operator to create a Supabase Cron / external HTTP job every 1–2 minutes. Locally: `scripts/run-jobs.sh emails`.

## Approval email

```mermaid
---
title: send-approval-email
---
sequenceDiagram
  autonumber
  participant AP as ApplicationsPage
  participant EF as send-approval-email
  participant DB as Postgres (service role)
  participant RS as Resend
  AP->>EF: invoke(source_table, source_id[, force]) with admin JWT
  EF->>EF: auth.getUser()
  EF->>DB: profiles.role in (admin, super_admin)? else 403
  EF->>DB: application_notifications (approval) row? else 404
  alt status sent and not force
    EF-->>AP: already_sent
  else
    EF->>DB: read application + applicant profiles.email (never the typed email)
    EF->>RS: "You're officially part of Tangy — <Role> Application Approved" + portal link
    EF->>DB: application_notifications.status sent / failed (+ error)
    EF-->>AP: success / error → toast
  end
```

## What never goes into an email

- message text: `message.new` gets *"You have a new message on Tangy…"*
- payment details or booking answers (`docs/OPERATIONS.md` §2)
- user-typed attendee emails: the recipient is always the **account** email from `profiles`
