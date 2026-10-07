# 14 — Check-in Workflow

**Status: IMPLEMENTED.** `src/admin/TangyWorldCheckInPage.jsx` (route `/check-in`), `src/lib/checkinService.js`, RPC `check_in_ticket` (latest in 0023), `can_checkin_event` / `has_active_access` (0018). Verified locally by `e2e/groupcheckin.mjs`, `e2e/staff.mjs` (mobile QR via a fake camera, `e2e/make-cam.mjs`) and `supabase/tests/named_group_checkin.test.sql`.

## Who can check in

| Who | How the right is granted | Scope |
|---|---|---|
| Super Admin, Admin | `checkin.perform` + `events.view_all` | every event |
| Staff | `checkin.perform` + `is_assigned_to_event(event)` | assigned events only (otherwise `not_assigned`) |
| Volunteer | live `temporary_access` row (`has_active_access`), added to `my_permissions()` as `checkin.perform` | that event, for the granted window (30 min – 12 h) |
| Manual (typed code) | allowed unless setting `checkin.allow_manual` is false | — |

## Check-in flow

```mermaid
---
title: Check-in part 1 — sign-in, scan and authorization
---
flowchart TD
  classDef start fill:#1f6f43,color:#fff
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef dec fill:#fff3c4,stroke:#b38600,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  O(["/check-in"]):::start --> G["StaffAuthGate<br/>(checkin.perform)<br/>email OTP · my_permissions"]:::proc
  G --> EV["my_checkin_events()<br/>pick event · event_checkin_stats()"]:::db
  EV --> SC["Camera (html5-qrcode)<br/>or typed code"]:::proc
  SC --> OFF{"offline?"}:::dec
  OFF -- yes --> OE["'Reconnect and<br/>scan again'"]:::err
  OFF -- no --> P["parseCheckinCode<br/>BOOKING / TICKET / bare"]:::proc
  P --> PRE["check_in_ticket<br/>(token, event, preview)"]:::db
  PRE --> A{"checkin.perform or<br/>active temporary access?"}:::dec
  A -- "grant ended" --> AE["access_expired"]:::err
  A -- no --> NP["no permission"]:::err
  A -- yes --> B{"can_checkin_event?"}:::dec
  B -- no --> NA["not_assigned"]:::err
  B -- yes --> M{"manual and manual<br/>check-in disabled?"}:::dec
  M -- yes --> MD["manual_disabled"]:::err
  M -- no --> K{"token resolves to?"}:::dec
  K -- neither --> NF["not_found"]:::err
  K -- "booking" --> PART2["→ part 2: group admission"]:::proc
  K -- "ticket" --> TK{"right event · not cancelled ·<br/>paid · not already in?"}:::dec
  TK -- fail --> TF["wrong_event / cancelled /<br/>payment_not_confirmed /<br/>already_checked_in"]:::err
  TK -- ok --> TW["insert checkins · ticket<br/>checked_in · audit → valid"]:::db
```

```mermaid
---
title: Check-in part 2 — group admission by name
---
flowchart TD
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef dec fill:#fff3c4,stroke:#b38600,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef res fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  GB{"booking for this event?<br/>status confirmed?"}:::dec
  GB -- "other event" --> WE["wrong_event"]:::err
  GB -- "cancelled / refunded" --> CX["cancelled"]:::err
  GB -- "unpaid" --> PN["payment_not_confirmed"]:::err
  GB -- ok --> RD{"anyone left to admit?"}:::dec
  RD -- no --> AC["already_checked_in<br/>+ attendee list"]:::res
  RD -- yes --> LIST["ready: attendee list<br/>booking_attendees_state"]:::res
  LIST --> SEL["Staff tick names present<br/>check_in_ticket(…, attendee_ids)"]:::proc
  SEL --> V{"selection valid ·<br/>all in THIS booking ·<br/>all still valid?"}:::dec
  V -- "bad selection" --> IS["invalid_selection /<br/>invalid_attendee"]:::err
  V -- "some already in" --> AAI["attendee_already_<br/>checked_in (names)"]:::err
  V -- yes --> W["insert checkins (shared batch_id)<br/>tickets checked_in<br/>audit checkin.scan / manual"]:::db
  W --> OK["valid: admitted names<br/>checked_in / remaining"]:::res
```

The browser never decides validity, counts or writes `checkins`. It only renders the `result` the RPC returns (comment at the top of `checkinService.js`).

## Concurrency

- `check_in_ticket` locks the ticket (`for update`), the booking (`for update`) and exactly the selected attendee tickets (`for update`).
- A forged or foreign attendee id is missing from the locked set, so the whole request is refused.
- `checkins` has `unique(ticket_id)`, so a double scan cannot create two rows.

## Group check-in

One QR per booking (0023):

1. Scanning shows every named attendee with their state.
2. Staff admit the people present now. Each admission is one atomic batch (`batch_id`).
3. Late arrivals are admitted later from the same QR (partial check-in).

`booking_checkin_history` returns the batches for the admin booking drawer.

## History and audit

- `get_checkin_history(event, mine, limit, offset)` feeds `/admin-portal/check-ins` (`checkin.history`).
- Every admission writes `audit_logs` with `via = role` or `via = temporary_access`.
- Expired volunteer grants are logged by `log_expired_access()` (platform job) as `access.expired`.
