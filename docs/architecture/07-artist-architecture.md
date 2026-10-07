# 07 — Artist Architecture and Lifecycle

Artist features come from migrations `0012` (availability), `0013` (media), `0014` (Spotify), `0020` (private profiles, profile completion, request details), `0022` (storage fixes), `0032`–`0034` (applications, portal, event workflow) and `0036` (documents bucket fix). The repository's own guide is `docs/ARTIST_PORTAL.md`.

## Complete artist lifecycle (as implemented)

```mermaid
---
title: Artist lifecycle — discovery to future events
---
flowchart TD
  classDef start fill:#1f6f43,color:#fff
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef dec fill:#fff3c4,stroke:#b38600,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef res fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  D(["Discovers Tangy<br/>homepage Volunteer section → /artist · /artist/apply"]):::start
  D --> SI["Sign in · email OTP"]:::proc
  SI --> AP["/artist/apply · 8 steps<br/>artist_applications draft, autosave"]:::proc
  AP --> SUB["submit_artist_application()"]:::db
  SUB --> REC["artists row created status pending<br/>application submitted"]:::db
  REC --> RV{"Team review<br/>review_artist_application"}:::dec
  RV -- request_info --> NI["needs_information<br/>notify + email"]:::proc --> AP
  RV -- reject --> RJ["rejected · decision message"]:::err
  RV -- approve --> OK["approve_artist_application<br/>artists.status approved · profiles.role artist<br/>notify application.approved (in-app)"]:::res
  OK --> PORT["/artist/dashboard · ArtistPortalShell"]:::proc
  PORT --> PRO["Profile · avatar (public bucket) · private profile"]:::proc
  PORT --> AV["Availability calendar<br/>set_artist_availability"]:::proc
  PORT --> MED["Media library → curator review"]:::proc
  PORT --> DOC["Documents: rider, EPK, tax, ID"]:::proc
  AV --> REQ["Team sends booking request<br/>create_artist_request"]:::db
  REQ --> RESP{"Artist responds<br/>respond_to_booking_request"}:::dec
  RESP -- decline --> DEC["declined (+ reason)"]:::err
  RESP -- accept --> ACC["accepted → event_artists line-up<br/>event_artist_details times"]:::db
  ACC --> CONF["Team confirms<br/>manage_artist_request confirm"]:::db
  CONF --> SES["/artist/sessions/:id<br/>call time · soundcheck · set · fee · requirements"]:::proc
  SES --> PERF["Event day · performance"]:::proc
  PERF --> COMP["Team marks completed<br/>manage_artist_request complete (after event date)"]:::db
  COMP --> HIST["Past sessions + archive pages<br/>partner_invoices (payment status)"]:::res
  HIST --> FUT["Future requests · availability reminders every N days"]:::proc
```

## What each stage touches

| Stage | Frontend | RPC / table | Storage | Notifications / email | Admin involvement | Security boundary |
|---|---|---|---|---|---|---|
| Apply (draft) | `artist/portal/pages/ApplyPage.jsx` | insert/update `artist_applications` (`artistApi.startApplication/saveApplication`) | `artist-media/applications/<uid>/…` | — | — | RLS: applicant edits own row only in `draft`/`needs_information`; `guard_artist_application` blocks status/review fields |
| Submit | same | `submit_artist_application()` | — | `application.submitted` to self (in-app); on resubmit `application.resubmitted` to reviewers | — | Server validates required fields, video, consents |
| Review | `admin/pages/ArtistApplicationsPage.jsx` | `review_artist_application(start_review / request_info / approve / reject)`, `application_reviews` (internal notes) | signed URL for video | `application.under_review` (in-app), `application.info_requested` (in-app + email), `application.approved` / `rejected` (in-app, critical) | applications.review | Internal notes separated from applicant-readable rows (0033) |
| Portal access | `ArtistPortalShell` | `artists` (own) | — | — | — | Approved `artists` row required |
| Profile | `artist/pages/ProfilePage.jsx`, `workspaceApi` | `artists`, `artist_private_profiles`, `artist_profile_completion()` | `artist-avatars/<artist id>/…` (public) | — | team can view | self update own row; status changes blocked by `prevent_artist_status_self_escalation` |
| Availability | `artist/portal/pages/AvailabilityPage.jsx` | `set_artist_availability()`, `artist_availability`, `artist_availability_summary()` | — | platform job `send_availability_reminders` (stale after `artists.availability_stale_days`, default 30) | team reads (`events.manage`/`entities.manage`) | Only approved artist; days with a confirmed performance keep their booking (`guard_artist_availability`) |
| Requests | `artist/portal/pages/RequestsPage.jsx` | `my_booking_requests()`, `mark_artist_request_viewed()`, `respond_to_booking_request()` | — | to the artist: `booking.requested`, `booking.confirmed`, `booking.cancelled`; to the requesting admin: `booking.accepted` / `declined` / `expired` | team creates/confirms | Drafts invisible to the artist; per-artist-per-day advisory lock |
| Sessions | `artist/portal/pages/SessionsPage.jsx` | `event_artists`, `events`, `event_artist_details`, `event_requirements` | `event-documents` (audience-scoped) | `schedule.changed`, `event.*_changed`, `event.cancelled`, `event.reminder` | team edits line-up | `event_member_kind()` |
| Media | `artist/pages/MediaPage.jsx` | `artist_media` (status uploaded → under_review → approved/rejected, archived) | `artist-media/<artist id>/…` (private) | `media.submitted`, `media.reviewed` | Reviews page (entities.manage) | `guard_artist_media`: only curators approve/reject |
| Documents | `artist/portal/pages/InboxPages.jsx` (DocumentsPage) | `artist_documents` | `artist-documents/<artist id>/…` (private, 25 MB, pdf/images/docx) | — | team reads | own folder only (0036) |
| Messages | `InboxPages.jsx` (MessagesPage) | `my_conversations`, `conversation_messages`, `send_message`, `start_partner_conversation` | — | `message.new` (email: generic text only) | Messages page; private Super Admin thread | RLS on participants |
| Payment / history | `ArtistEventDrawer` | `partner_invoices` (read) | — | `invoice.issued` / `invoice.paid` | Invoices page | own invoices |

## Portal shell

```mermaid
---
title: Artist portal — shell and pages
---
flowchart TB
  classDef gate fill:#fff3c4,stroke:#b38600,color:#222
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  R["/artist/* portal routes"] --> SH["ArtistPortalShell<br/>artist AuthProvider → PortalFrame"]:::gate
  SH --> Q1{"session?"}:::gate
  Q1 -- no --> L["/artist/login?next="]:::proc
  Q1 -- yes --> Q2{"artists.status<br/>approved?"}:::gate
  Q2 -- no --> S["/artist/application"]:::proc
  Q2 -- yes --> NAV["Sidebar portalNav.js<br/>+ pending-request badge"]:::proc
  NAV --> PAGES["Dashboard · Sessions · Calendar (.ics)<br/>Requests · Availability · Media<br/>Messages · Notifications · Profile<br/>Documents · Settings"]:::proc
  PAGES --> API["artist/portal/api.js · workspaceApi.js<br/>portalApi.js · storage.js"]:::db
```

## Artist approval email: a gap

When an artist is approved from the **Artist Applications** page (`review_artist_application` → `approve_artist_application`), the artist receives an **in-app** notification `application.approved`. Its catalogue entry has `email = false`, and that page does **not** invoke `send-approval-email`. The branded approval email is sent only when an application is approved from the generic **Applications** drawer (`ApplicationsPage`), which calls `send-approval-email` when `notifications.send_approval_emails` is on.

Status: **PARTIALLY IMPLEMENTED** for the artist-specific path. The artist is told in-app and by the dashboard redirect. An `application_notifications` row is created, so a "resend" from the Applications screen can still send it.
