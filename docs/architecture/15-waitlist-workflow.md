# 15 — Waitlist Workflow

**Status: IMPLEMENTED** (0027 server-authoritative waitlist, 0029 allocation policy). Frontend: `src/components/booking/WaitlistPanel.jsx` (session page), `WaitlistDirectory.jsx` (`/sessions/waitlist`), Patron dashboard waitlist tab, admin `WaitlistSection`. Tests: `supabase/tests/waitlist.test.sql`, `e2e/waitlist.mjs`, `scripts/test-concurrency.sh` (offer race).

## Rules (from the 0027 header)

- Join only when signed in, and only when the session is sold out. If seats are actually free, `join_waitlist` refuses with `SEATS_AVAILABLE` and tells the person to book directly.
- Order is by `queue_no`. Allocation setting `waitlist.allocation`:
  - `strict_order` (default): never skip the head of the queue
  - `first_fit`: offer to the earliest party that fits
- Seats held by live offers count against capacity **everywhere**: `create_pending_booking`, `event_availability`, `settle_payment`. A released seat can only be claimed by the person it was offered to.
- Every offer decision runs under the **event row lock**, the same lock checkout takes, so two people can never be offered the same seat.
- Legacy anonymous rows (no account) are listed for the team but never auto-offered.

## Workflow

```mermaid
---
title: Waitlist — join, offer, convert, expire
---
flowchart TD
  classDef start fill:#1f6f43,color:#fff
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef dec fill:#fff3c4,stroke:#b38600,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef res fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  S(["Session sold out<br/>event_availability: sold_out"]):::start --> J["WaitlistPanel → join_waitlist(event, qty)"]:::proc
  J --> JV{"signed in · session open · qty in range ·<br/>not already waiting · truly full?"}:::dec
  JV -- no --> JE["WAITLIST_CLOSED / INVALID_QUANTITY / ALREADY_WAITLISTED / SEATS_AVAILABLE"]:::err
  JV -- yes --> W["waitlist row status waiting · queue_no<br/>notify waitlist.joined (position) — receipt to self"]:::db
  W --> R{"Seats released?"}:::dec
  R -- "booking cancelled / expired / failed / refunded<br/>(waitlist_on_booking_release)" --> O
  R -- "capacity raised (waitlist_on_capacity_change)" --> O
  R -- "offer expired / declined" --> O
  R -- "admin_offer_waitlist (manual)" --> O
  O["offer_waitlist_seats(event)<br/>lock event · expire lapsed offers · free = capacity − pending − confirmed − held"]:::db
  O --> F{"head of queue fits?"}:::dec
  F -- "no, strict_order" --> STOP["stop · seats stay bookable by anyone"]:::proc
  F -- "no, first_fit" --> NEXT["try next party"]:::proc --> F
  F -- yes --> OF["status offered · offer_expires_at = now + waitlist.offer_hold_minutes (120)<br/>notify waitlist.offer (urgent, emailed) · audit waitlist.offered"]:::db
  OF --> B{"Holder books before expiry?"}:::dec
  B -- yes --> CK["razorpay-create-order accepts a sold-out event for an offer holder<br/>create_pending_booking uses the held seats"]:::proc
  CK --> CV["waitlist converted · booking_id · audit waitlist.converted<br/>→ normal payment flow (12)"]:::res
  B -- no --> EX["expire_waitlist_offers (platform job, every 5 min)<br/>status expired · notify waitlist.offer_expired · offer onwards"]:::err
  EX --> O
  W --> LV["leave_waitlist → cancelled"]:::proc
```

## States

```mermaid
---
title: waitlist.status
---
stateDiagram-v2
  [*] --> waiting: join_waitlist
  waiting --> offered: offer_waitlist_seats
  offered --> converted: holder starts checkout (create_pending_booking)
  offered --> expired: hold lapsed
  waiting --> cancelled: leave_waitlist / admin_remove_waitlist_entry
  offered --> cancelled: leave / admin remove
  converted --> [*]
  expired --> [*]
  cancelled --> [*]
```

## Scheduler behaviour

`run_platform_jobs()` (pg_cron, every 5 minutes) calls `expire_waitlist_offers()`. It expires lapsed offers (`for update skip locked`), notifies the holders, then calls `offer_waitlist_seats()` for every event that still has waiting parties. `offer_waitlist_seats()` also expires lapsed offers for its own event at the start of each pass, so seats flow on even between scheduler runs whenever a booking changes.

## Who sees what

| | Customer | Admin |
|---|---|---|
| Position | `my_waitlist()` (position, offer expiry) on the session page and dashboard | `/admin-portal/waitlist`: queue per event, offer / remove (audited) |
| Notifications | `waitlist.joined`, `waitlist.offer`, `waitlist.offer_expired` (critical in-app + emailed). Conversion is recorded as audit `waitlist.converted` only (no notification is sent for it) | — |
| RLS | `waitlist: self read own` (user_id) and `self read own by verified email` (JWT email, 0035) | `bookings.view_all` / `is_admin()` read |
