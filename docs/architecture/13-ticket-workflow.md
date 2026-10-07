# 13 — Ticket Architecture

**Status: IMPLEMENTED** (0016 tickets, 0017 fixes, 0023 named attendees + group QR).

## Model

- A **booking** holds the buyer, the quantity and the named attendees (`attendee_names[]`, collected *before* payment). It also holds an opaque `group_token`: 20 random bytes, hex, default value set in 0023.
- **Tickets** exist only after settlement: one `tickets` row per attendee. Each has a `ticket_number` (`<registration_code>-01`, `-02`…), its own random 20-byte hex `token`, a tier, an `attendee_name` and `status` `valid` / `checked_in` / `cancelled`.
- **Attendance** is one `checkins` row per ticket (`unique(ticket_id)`). It records who checked the ticket in, when, how (`qr`/`manual`), notes, and a `batch_id` for group check-ins.

## Ticket pipeline

```mermaid
---
title: Booking → settlement → tickets → QR → email → check-in
---
flowchart TD
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef ext fill:#efe0f5,stroke:#6b3d87,color:#222
  classDef res fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  B["bookings row (pending)<br/>attendee_names[] · group_token (DB default)"]:::db
  B --> S["settle_payment → status confirmed"]:::db
  S --> G["confirm_booking_and_issue_tickets(booking)<br/>lock booking · only if no tickets yet"]:::db
  G --> T["tickets × quantity<br/>ticket_number REG-01… · token gen_random_bytes(20) · attendee_name[i] · status valid"]:::db
  T --> Q1["Browser QR (client-side, qrcode lib)<br/>TANGY:BOOKING:group_token<br/>BookingPage · PatronDashboard · admin Bookings"]:::res
  T --> Q2["Email QR (server-side, Deno qrcode via esm.sh)<br/>same payload → booking-pass.png attachment"]:::proc
  Q2 --> E["email_outbox → send-notification-emails → Resend"]:::ext
  Q1 & E --> CU["Customer shows ONE QR for the whole party"]:::res
  CU --> CK["/check-in scan → check_in_ticket(token, event, attendee ids)"]:::db
  CK --> AT["checkins rows (one per admitted attendee) · tickets.status checked_in · audit checkin.scan / checkin.manual"]:::db
```

## Where QR codes are generated, and what is inside

| Payload | Generated where | Contains | Used for |
|---|---|---|---|
| `TANGY:BOOKING:<group_token>` | **Client-side** with `src/lib/qr.js` (`qrcode.toDataURL`) in `BookingPage` (after confirmation), `PatronDashboard`, admin `Bookings.jsx`; **server-side** in `_shared/ticketEmail.ts` (email attachment) | Only the opaque booking token: no ids, names or contact details | Group check-in: staff see the attendee list and tick who is present |
| `TANGY:TICKET:<token>` | Still accepted by `check_in_ticket` (issued per ticket since 0016) | Opaque ticket token | Single-attendee check-in (legacy-compatible) |
| Bare token typed by hand | — | Either token | Server resolves which kind it is |

No QR exists before payment is confirmed. `finalizeConfirmedBooking` only renders it from a server-confirmed booking.

## Where ticket data comes from

| Consumer | Source |
|---|---|
| Customer dashboard | `bookings` + embedded `tickets(*)` + `events(…)` (RLS: own rows) via `bookingService.getMyBookings` |
| Confirmation screen | `razorpay-verify-payment` response (`booking`, `tickets`) |
| Ticket email | `buildTicketEmail` reads `tickets`, `events`, `profiles.email` with the service role; the recipient is the **account email**, never the typed attendee email |
| Admin attendees list / CSV | view `attendee_tickets` (ticket + booking + event + check-in + payment status) |
| Scanner | `check_in_ticket` / `booking_attendees_state` responses |

## Ticket states

```mermaid
---
title: tickets.status
---
stateDiagram-v2
  [*] --> valid: issued at settlement / comp booking
  valid --> checked_in: check_in_ticket
  valid --> cancelled: admin_cancel_ticket / admin_cancel_booking / admin_record_refund
  checked_in --> [*]
  cancelled --> [*]
```

`admin_cancel_booking` refuses when any ticket on the booking is already `checked_in`.
