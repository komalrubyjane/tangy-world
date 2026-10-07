# 10 — Event ↔ Artist Workflow (Availability, Line-up, Booking Requests)

Source: migrations `0033_artist_portal.sql`, `0034_event_artist_workflow.sql` and the repository guide `docs/EVENT_WORKFLOW.md`. **Status: IMPLEMENTED.**

## One source of truth for availability

`artist_day_status(artist, date, start, end, exclude_event)` (0034) is the single function that decides an artist's status for a date and optional time window. It combines three inputs:

- the artist's own calendar (`artist_availability`)
- confirmed line-ups (`event_artists` + `event_artist_details` times)
- pending requests (`assignment_requests` with status `pending`)

| Computed status | Rule (checked in this order) |
|---|---|
| **unavailable** | Artist marked the day unavailable and the time windows overlap (or no window) |
| **busy** | A confirmed line-up slot on that date overlaps the window |
| **tentative** | Booked elsewhere that day (no overlap), *or* marked tentative, *or* a pending request exists, *or* available only for part of the window |
| **available** | Marked available covering the window |
| **unknown** ("No availability set") | Nothing recorded |

A pending request **never counts as a booking** (busy). It only makes the day tentative. The artist stores only `available` / `tentative` / `unavailable` (`set_artist_availability`); `busy` and `unknown` are computed.

```mermaid
---
title: artist_day_status decision
---
flowchart TD
  classDef dec fill:#fff3c4,stroke:#b38600,color:#222
  classDef res fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef warn fill:#fde3c8,stroke:#b8560a,color:#3a1a00
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  IN["inputs: artist_availability · event_artists + event_artist_details · pending assignment_requests"]:::db --> A{"marked unavailable<br/>and window overlaps?"}:::dec
  A -- yes --> UN["unavailable"]:::err
  A -- no --> B{"confirmed slot overlaps window?"}:::dec
  B -- yes --> BU["busy"]:::err
  B -- no --> C{"booked elsewhere that day?"}:::dec
  C -- yes --> T1["tentative"]:::warn
  C -- no --> D{"marked tentative?"}:::dec
  D -- yes --> T2["tentative"]:::warn
  D -- no --> E{"pending request that day?"}:::dec
  E -- yes --> T3["tentative"]:::warn
  E -- no --> F{"marked available?"}:::dec
  F -- "yes, window covered" --> AV["available"]:::res
  F -- "yes, partial window" --> T4["tentative"]:::warn
  F -- no --> UK["unknown · No availability set"]:::db
```

The same data feeds:

- `find_available_artists()`: the admin's artist picker for an event date
- `artist_calendar()`: the shared calendar component used by the artist portal, the admin artist page and the event editor drawer
- `artist_availability_summary()`, `admin_calendar()`, `artist_day_summary()`
- `artist_schedule_check()`: pre-send check of other sessions that day

## Artist availability workflow

```mermaid
---
title: Artist sets availability → admin sees it in the event editor
---
sequenceDiagram
  autonumber
  actor AR as Artist
  participant AV as /artist/availability
  participant DB as Postgres
  actor AD as Admin (events.manage)
  participant ED as Event editor · ArtistAvailability drawer
  AR->>AV: select a day or a range · status · note · optional time window
  AV->>DB: set_artist_availability(from, to, status, note, start, end)
  DB->>DB: approved artist only · range ≤ 366 days
  DB->>DB: upsert artist_availability per day<br/>skip days with a confirmed performance
  DB-->>AV: rows changed
  AD->>ED: pick date / slot for a session
  ED->>DB: find_available_artists(event, date, start, end)
  DB->>DB: artist_day_status for every approved artist
  DB-->>ED: available / tentative / unavailable / busy / unknown + conflicts
  AD->>ED: decide line-up (assign or request)
```

## Event ↔ artist booking workflow

```mermaid
---
title: Line-up and booking requests — with race protection
---
sequenceDiagram
  autonumber
  actor AD as Admin (events.manage)
  participant EP as EventDetailPage / EventEditor
  participant DB as Postgres
  actor AR as Artist
  participant RP as /artist/requests
  AD->>EP: select artist(s) + set times · mode assign or request
  EP->>DB: save_event_lineup(event, items) or create_artist_request(event, artist, details, send)
  DB->>DB: lock events row (save_event_lineup)
  DB->>DB: approved artist (request: must also have an account)
  DB->>DB: lock_artist_day → pg_advisory_xact_lock(artist, date)
  DB->>DB: assert_artist_bookable: busy → refuse · unavailable → refuse unless override or request
  DB->>DB: assert_no_slot_overlap within this event
  alt assign
    DB->>DB: event_artists + event_artist_details · notify_lineup_artist (only if event published)
  else request
    DB->>DB: assignment_requests status pending (or draft) · expires_at default now + artists.request_default_days (7)
    DB-->>AR: notify booking.requested (in-app + email)
  end
  AR->>RP: open request → mark_artist_request_viewed
  AR->>RP: Accept or Decline (+ reason)
  RP->>DB: respond_to_booking_request(id, accept, reason)
  DB->>DB: expire_booking_requests() first · lock request row
  DB->>DB: must be own request · status pending (expired → error)
  alt accept
    DB->>DB: event not cancelled · lock_artist_day + assert_artist_bookable (own unavailable mark allowed, clash refused)
    DB->>DB: status accepted · insert event_artists · event_artist_details times
  else decline
    DB->>DB: status declined · decline_reason
  end
  DB-->>AD: notify booking.accepted / booking.declined
  AD->>EP: Confirm
  EP->>DB: manage_artist_request(id, 'confirm')
  DB->>DB: status confirmed · copy call time, soundcheck, set times, fee into event_artist_details
  DB-->>AR: notify booking.confirmed → /artist/sessions/:id
  Note over DB: after the event's local date: manage_artist_request(id,'complete') → completed
```

## Booking request states

```mermaid
---
title: assignment_requests.status (assignment_status enum)
---
stateDiagram-v2
  [*] --> draft: create_artist_request(send=false)
  [*] --> pending: create_artist_request(send=true)
  draft --> pending: manage_artist_request send
  pending --> accepted: artist accepts
  pending --> declined: artist declines
  pending --> expired: expires_at passed (platform job / on respond)
  accepted --> confirmed: manage_artist_request confirm
  accepted --> completed: complete (after event date)
  confirmed --> completed: complete (after event date)
  draft --> cancelled: manage cancel
  pending --> cancelled: manage cancel / event cancelled
  accepted --> cancelled: manage cancel → removed from line-up
  confirmed --> cancelled: manage cancel → removed from line-up
  declined --> [*]
  expired --> [*]
  completed --> [*]
  cancelled --> [*]
```

## Race-condition protection

| Mechanism | Where | Protects against |
|---|---|---|
| `pg_advisory_xact_lock(hashtextextended('tangy.artist_day:'+artist+':'+date))` (`lock_artist_day`) | `assert_artist_bookable`, used by `save_event_lineup`, `update_event_artist`, `create_artist_request`, `respond_to_booking_request` | Two admins (or an admin and the artist) double-booking the same artist on the same day |
| `select … for update` on `events` | `save_event_lineup` | Concurrent line-up edits on one event |
| `for update` on the request row | `respond_to_booking_request`, `manage_artist_request` | Double answers |
| `assert_no_slot_overlap` | line-up / request | Overlapping sets inside one event |
| `guard_artist_availability` (0020) | `artist_availability` writes | Marking a day with a confirmed performance as unavailable |

## Legacy paths still in the code

- `create_assignment_request` / `respond_to_assignment_request` / `cancel_assignment_request` (0008) via `src/services/assignmentRequestService.js`: **LEGACY**. The service is not imported by any component. `respond_to_assignment_request` is still called *internally* by `respond_to_booking_request`.
- `create_booking_request` (0020) wrapper `adminApi.createBookingRequest`: **LEGACY / unused** by pages. `create_artist_request` (0033/0034) is the current path.
