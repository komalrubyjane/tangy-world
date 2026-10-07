# 21 — Database Architecture

Supabase Postgres, schema `public`, built by 36 ordered migrations (`supabase/migrations/0001`–`0036`). Extensions:

- `pgcrypto`: `gen_random_bytes`, `digest`
- `pg_cron`: when available
- Realtime publication `supabase_realtime`, containing `conversations`, `messages`, `notifications` and `event_availability_signal`

## Domain map

```mermaid
---
title: Database domains (61 tables, 3 views)
---
flowchart LR
  classDef d fill:#dce8f7,stroke:#2a5b9a,color:#122
  ID["AUTH / IDENTITY / ROLES<br/>auth.users · profiles · role_permissions<br/>· account_invitations<br/>vendor_ / sponsor_ / venue_ / crew_ /<br/>volunteer_profiles"]:::d
  EV["EVENTS<br/>events · venues · event_ticket_types ·<br/>event_availability_signal<br/>programmes · programme_events ·<br/>event_reminders_sent"]:::d
  AR["ARTISTS<br/>artists · artist_private_profiles ·<br/>artist_admin_notes · artist_availability<br/>artist_media · artist_documents ·<br/>event_artists · event_artist_details ·<br/>assignment_requests"]:::d
  AP["APPLICATIONS / ENQUIRIES<br/>artist_applications ·<br/>application_reviews ·<br/>application_notifications<br/>collaborations · crew_applications ·<br/>private_enquiries · contact_enquiries"]:::d
  BK["BOOKINGS / PAYMENTS / TICKETS<br/>bookings · tickets · checkins ·<br/>payment_webhook_events · waitlist ·<br/>partner_invoices"]:::d
  OP["OPERATIONS<br/>event_assignments · event_tasks ·<br/>event_requirements · event_documents<br/>sponsor_deliverables · sponsor_assets ·<br/>temporary_access · access_requests"]:::d
  MS["MESSAGING<br/>conversations ·<br/>conversation_participants · messages ·<br/>message_read_states"]:::d
  NT["NOTIFICATIONS / EMAIL<br/>notifications · notification_preferences<br/>· email_outbox"]:::d
  CT["CONTENT<br/>tv_videos · diary_posts · gallery_albums<br/>· gallery_photos · announcements"]:::d
  SY["SYSTEM / AUDIT<br/>audit_logs · system_settings ·<br/>platform_job_runs ·<br/>_security_0035_function_acl"]:::d
  VW["VIEWS<br/>public_artists · applications_overview ·<br/>attendee_tickets"]:::d
  ID --- AR & AP & BK & OP & MS & NT
  EV --- AR & BK & OP & CT
  AR --- AP
  BK --- NT
  OP --- NT
```

## Core relationships

### Identity, events and bookings

```mermaid
---
title: ER — identity, events, bookings, tickets, waitlist
---
erDiagram
  AUTH_USERS ||--|| PROFILES : "handle_new_user"
  PROFILES ||--o{ BOOKINGS : "user_id"
  EVENTS ||--o{ BOOKINGS : "event_id"
  EVENTS ||--o{ EVENT_TICKET_TYPES : "event_id"
  BOOKINGS ||--o{ TICKETS : "booking_id"
  EVENTS ||--o{ TICKETS : "event_id"
  TICKETS ||--o| CHECKINS : "ticket_id unique"
  BOOKINGS ||--o{ CHECKINS : "booking_id"
  EVENTS ||--o{ WAITLIST : "event_id"
  PROFILES ||--o{ WAITLIST : "user_id"
  WAITLIST |o--o| BOOKINGS : "booking_id / waitlist_entry_id"
  VENUES ||--o{ EVENTS : "venue_id"
  PROFILES ||--o{ EVENTS : "venue_partner_id"
  EVENTS ||--|| EVENT_AVAILABILITY_SIGNAL : "event_id"
  PROFILES {
    uuid id PK
    user_role role
    bool is_active
    text email
    text passport_id
  }
  EVENTS {
    uuid id PK
    text slug
    date event_date
    text status
    int capacity
    int price
    jsonb booking_questions
  }
  BOOKINGS {
    uuid id PK
    text registration_code
    booking_status status
    text payment_status
    int quantity
    int amount
    text razorpay_order_id
    text group_token
    text ticket_email_status
  }
  TICKETS {
    uuid id PK
    text ticket_number
    text token
    text status
    text attendee_name
  }
```

### Artists and line-ups

```mermaid
---
title: ER — artists and applications
---
erDiagram
  direction LR
  PROFILES ||--o| ARTISTS : "user_id"
  PROFILES ||--o| ARTIST_APPLICATIONS : "user_id unique"
  ARTIST_APPLICATIONS |o--o| ARTISTS : "artist_id"
  ARTIST_APPLICATIONS ||--o| APPLICATION_REVIEWS : "source_id"
  ARTISTS ||--o| ARTIST_PRIVATE_PROFILES : "artist_id"
  ARTISTS ||--o{ ARTIST_ADMIN_NOTES : "artist_id"
  ARTISTS ||--o{ ARTIST_AVAILABILITY : "artist_id + date"
  ARTISTS ||--o{ ARTIST_MEDIA : "artist_id"
  ARTISTS ||--o{ ARTIST_DOCUMENTS : "artist_id"
```

```mermaid
---
title: ER — line-ups and booking requests
---
erDiagram
  direction LR
  EVENTS ||--o{ EVENT_ARTISTS : "event_id"
  ARTISTS ||--o{ EVENT_ARTISTS : "artist_id"
  EVENT_ARTISTS ||--o| EVENT_ARTIST_DETAILS : "event_id + artist_id"
  EVENTS ||--o{ ASSIGNMENT_REQUESTS : "session_id"
  ARTISTS ||--o{ ASSIGNMENT_REQUESTS : "artist_id"
  ASSIGNMENT_REQUESTS }o--o| CONVERSATIONS : "conversation_id"
```

### Operations and partners

```mermaid
---
title: ER — event operations
---
erDiagram
  direction LR
  EVENTS ||--o{ EVENT_ASSIGNMENTS : "event_id"
  PROFILES ||--o{ EVENT_ASSIGNMENTS : "assignee_id"
  EVENT_ASSIGNMENTS ||--o{ EVENT_TASKS : "assignment_id"
  EVENTS ||--o{ EVENT_REQUIREMENTS : "event_id"
  PROFILES ||--o{ EVENT_REQUIREMENTS : "user_id"
  EVENTS ||--o{ EVENT_DOCUMENTS : "event_id"
  EVENTS ||--o{ TEMPORARY_ACCESS : "event_id"
  PROFILES ||--o{ TEMPORARY_ACCESS : "user_id"
  ACCESS_REQUESTS |o--o| TEMPORARY_ACCESS : "grant_id"
```

```mermaid
---
title: ER — partners and sponsors
---
erDiagram
  direction LR
  PROFILES ||--o| VENDOR_PROFILES : "id"
  PROFILES ||--o| SPONSOR_PROFILES : "id"
  PROFILES ||--o| VENUE_PROFILES : "id"
  PROFILES ||--o| CREW_PROFILES : "id"
  PROFILES ||--o| VOLUNTEER_PROFILES : "id"
  PROFILES ||--o{ VENUES : "partner_profile_id"
  SPONSOR_PROFILES ||--o{ SPONSOR_DELIVERABLES : "sponsor_profile_id"
  EVENTS ||--o{ SPONSOR_DELIVERABLES : "event_id"
  PROFILES ||--o{ SPONSOR_ASSETS : "sponsor_id"
  PROFILES ||--o{ PARTNER_INVOICES : "partner_id"
```

## Table catalogue (important tables)

| Table | Purpose | Who reads (RLS) | Who writes | Important triggers / functions |
|---|---|---|---|---|
| `profiles` | Account, role, active flag, passport | self; `is_admin()` | self (non-identity fields); RPCs | `handle_new_user`, `prevent_role_self_escalation`, `guard_profile_identity`, `sync_profile_email` |
| `role_permissions` | Role → permission matrix | console roles | migrations; `set_role_permission` (Super Admin) | `has_permission`, `my_permissions` |
| `events` | Sessions | public if status ≠ draft; assigned staff; event members; admin | admin (`is_admin()`), `update_session_content` | `events_audit`, `events_notify_change`, `events_notify_publish`, `events_prevent_delete_with_bookings`, `events_seed_ticket_type`, `events_capacity_to_waitlist`, `events_availability_signal`, `events_validate_timezone` |
| `event_ticket_types` | Per-event prices / capacities | public (active, non-draft event); events.manage | events.manage | `sync_event_from_price`, availability signal |
| `bookings` | Seat hold / purchase | self; bookings.view_all | **no client insert**; `create_pending_booking` (service role), admin RPCs, Edge Functions | `bookings_release_to_waitlist`, `bookings_flag_late_payment`, `bookings_system_audit`, `bookings_availability_signal`, `bookings_touch_payment` |
| `tickets` | One per attendee | self; bookings.view_all | `confirm_booking_and_issue_tickets` only | — |
| `checkins` | Attendance | self (own booking); bookings.view_all | `check_in_ticket` only | unique(ticket_id) |
| `waitlist` | Queue + offers | self (user_id / verified JWT email); bookings.view_all; admin | `join_waitlist`, `leave_waitlist`, offer functions | `waitlist_availability_signal` |
| `payment_webhook_events` | Razorpay event log | `is_admin()` | `razorpay-webhook` (service role) | unique `event_id` |
| `artists` | Artist profile / application record | public if approved (view `public_artists`); self; entities.manage / events.view_all | self (profile), `submit_artist_application`, approvals | `prevent_artist_status_self_escalation`, `artists_slug`, `artists_sync_application`, `artists_guard_duplicate` |
| `artist_applications` | 8-step application | self; applications.view | self while draft / needs_information; RPCs | `guard_artist_application` |
| `artist_availability` | Artist calendar | self; events.manage / entities.manage | self; `set_artist_availability` | `guard_artist_availability` |
| `assignment_requests` | Booking requests to artists | artist (non-draft); admin | RPCs | `assignment_requests_notify`, `guard_assignment_request_artist` |
| `event_artists` / `event_artist_details` | Line-up / set details | public line-up via views; members; team | `save_event_lineup`, `update_event_artist`, `respond_to_booking_request`, `manage_artist_request` | notify + audit triggers |
| `collaborations` / `crew_applications` | Partner / crew / volunteer applications | self; admin | self insert (signed in); approvals | duplicate and start guards, receipt and decision notifications, private-notes move |
| `event_assignments`, `event_tasks`, `event_requirements`, `event_documents` | Event operations | assignee / members / team | team; partners respond / submit | validation + notify + audit triggers |
| `temporary_access`, `access_requests` | Volunteer check-in grants | own; volunteers.manage | RPCs | `guard_temporary_access` |
| `notifications` | In-app inbox | own | `notify()` only | Realtime |
| `email_outbox` | Email queue | settings.manage | `notify()`, `enqueueTicketEmail` (service role) | `claim_email_batch`, `complete_email` |
| `conversations`, `messages`, … | Messaging | participants; admin-level except private | RPCs / RLS inserts | `on_message_created`, `guard_conversation_admin_participant` |
| content tables | CMS | public when published and due | content editors | `content_guard_publish`, audit triggers |
| `audit_logs` | Who did what | audit.view | `audit_write()`, `audit_row_change` triggers, system inserts | `audit_logs_append_only` (blocks update / delete) |
| `system_settings` | Runtime settings | console (exposed keys via `get_runtime_settings`) | `update_system_setting` (settings.manage) | audited |
| `platform_job_runs` | Scheduled job log | operations.manage | `run_platform_jobs` | advisory lock |

## Views

| View | Purpose |
|---|---|
| `public_artists` (0020) | Safe public subset of approved artists |
| `applications_overview` (0017/0033) | Union of artist / collaboration / crew applications for the admin list. Review notes come from `application_reviews` (null for applicants) |
| `attendee_tickets` (0016/0024) | Ticket + booking + event + check-in + payment status for attendee lists and CSV |

## Key settings (`system_settings`, seeded by migrations)

| Key | Default | Used by |
|---|---|---|
| `bookings.pending_timeout_minutes` | 30 | `expire_stale_bookings` |
| `bookings.tax_percent` | 18 | `booking_quote` |
| `waitlist.offer_hold_minutes` | 120 | `offer_waitlist_seats` |
| `waitlist.allocation` | strict_order | `offer_waitlist_seats` |
| `notifications.event_reminder_hours` | 24 | `send_event_reminders` |
| `notifications.send_approval_emails` | true | `ApplicationsPage` |
| `auth.admin_idle_timeout_minutes` | 60 | `AdminShell` |
| `checkin.allow_manual` | (true if unset) | `check_in_ticket` |
| `artists.availability_stale_days` | 30 | `send_availability_reminders` |
| `artists.request_default_days` | 7 (fallback) | `create_artist_request` |
