# 18 — Messaging Architecture

**Status: IMPLEMENTED** (0008 base, 0018 partner threads, 0020 priority/meta, 0034 private artist threads and RLS tightening). Tests: `supabase/tests/messaging_security.test.sql`, `e2e/portals.mjs`, `e2e/platform.mjs`.

The repository states plainly: messaging is **not end-to-end encrypted**. Protection is HTTPS, authentication, authorization and RLS (0034 header; the artist messages page says so too).

## Data model

```mermaid
---
title: Messaging tables
---
erDiagram
  conversations ||--o{ conversation_participants : has
  conversations ||--o{ messages : contains
  conversations ||--o{ message_read_states : tracks
  conversations }o--o| events : related_session_id
  conversations }o--o| artists : related_artist_id
  conversations {
    uuid id
    text conversation_type "general | artist_support | sponsor_support | vendor_support | venue_support | artist_private"
    text category "support | assignment | general"
    conversation_status status "open | pending | resolved | closed"
    text priority "normal | high | urgent"
    uuid created_by
    uuid external_user_id
    uuid assigned_admin_id
  }
  conversation_participants {
    uuid conversation_id
    uuid user_id
    text role "owner | admin | member"
  }
  messages {
    uuid id
    uuid conversation_id
    uuid sender_id
    text content "1-4000 chars"
    text message_type
  }
  message_read_states {
    uuid conversation_id
    uuid user_id
  }
```

## Conversation types and who can read or write

| Type | Started by | Participants | Who else can read | Notes |
|---|---|---|---|---|
| `general` (category `support`) | Any signed-in user, via **Tangy Assistant → "Request an agent"** (`get_or_create_support_conversation`, 0008) | creator (+ assigned admin) | admin-level (`is_staff_or_admin()` = admin / super_admin) through RLS | Admin "Website support inbox" (`/admin-portal/ops/inbox`, `InboxSection`, `chatService`) |
| `artist_support`, `sponsor_support`, `vendor_support`, `venue_support` | Partner from their portal (`start_partner_conversation`, optionally tied to an event they are part of) or admin (`admin_start_partner_conversation`) | partner owner + admins who reply (auto-added as `admin` participant by `send_message`) | `messages.manage` holders | Admin Messages page (`MessagesPanel`, `admin_conversations`) |
| `artist_private` | **Super Admin only** (`start_private_artist_conversation`, 0034) | that Super Admin + the artist | **nobody else**: not other admins, staff or partners | Excluded from staff/admin read in every policy and function |
| category `assignment` | legacy 0008 assignment requests | — | — | **LEGACY** |

## RLS (final state, 0034)

| Table | Policy | Rule |
|---|---|---|
| conversations | participant or staff read | `is_participant(id) or (is_staff_or_admin() and conversation_type <> 'artist_private')` |
| conversations | creator or staff insert | creator may insert only `general` with no `external_user_id`; admins any non-private type |
| conversations | staff/admin update | admin-level, and for private threads only a participant |
| messages | participant or staff read | `is_participant(conversation_id) or (is_staff_or_admin() and not is_private_conversation(...))` |
| messages | participant or staff insert | `sender_id = auth.uid()` and same visibility rule |
| conversation_participants | — | populated only inside RPCs (0008 comment); `guard_conversation_admin_participant` (0035): only the team joins as `admin` |

## Partner ↔ team flow

```mermaid
---
title: Partner or artist ↔ team conversation
---
sequenceDiagram
  autonumber
  actor P as Partner / Artist
  participant PP as Portal MessagesPanel
  participant DB as Postgres
  participant RT as Supabase Realtime
  actor T as Team member (messages.manage)
  participant AM as /admin-portal/messages
  P->>PP: New message (optional event)
  PP->>DB: start_partner_conversation(event, subject, body)
  DB->>DB: partner_kind() must be artist / sponsor / vendor / venue · must be on the event
  DB->>DB: reuse open thread of the same type + event, or insert conversation + owner participant
  DB->>DB: insert message · on_message_created → notify messages.manage holders (message.new)
  DB-)RT: INSERT messages / conversations
  RT-)AM: inbox refresh (Realtime INSERT subscription)
  T->>AM: open thread → conversation_messages · mark_conversation_read
  T->>AM: reply
  AM->>DB: send_message(conversation, body)
  DB->>DB: can see thread? closed? · add team member as admin participant · status pending
  DB->>DB: on_message_created → notify partner (message.new, email body generic)
  DB-)RT: INSERT messages (filter conversation_id)
  RT-)PP: new message appears
  T->>AM: set_conversation_status / set_conversation_meta (priority, assign to me)
```

## Customer ↔ team (website support)

```mermaid
---
title: Tangy Assistant escalation → support conversation
---
flowchart TB
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef mock fill:#eeeeee,stroke:#888,color:#444,stroke-dasharray: 4 3
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  V["Visitor on /ai or launcher"]:::proc --> KB["aiSupportService knowledge-base answer<br/>messageService (browser-local transcript)"]:::mock
  KB --> ESC["'Request an agent' → AgentRequestForm<br/>sign-in required"]:::proc
  ESC --> SC["conversationService.get_or_create_support_conversation<br/>conversations (general / support) + participant"]:::db
  SC --> MSG["messages insert (RLS) · Realtime"]:::db
  MSG --> INB["Admin Website support inbox<br/>assign_conversation · reopen_conversation"]:::proc
```

## Private Super Admin ↔ artist

`start_private_artist_conversation(artist_user, subject, body)`:

- Super Admin only, and only for an artist with a portal account.
- Reuses the open private thread if there is one.
- Both participants are added. The thread is invisible to every other console user (RLS, `is_private_conversation`, `can_manage_conversation` excludes it).

The entry point is the admin `ArtistDetailPage`.

## Notifications and email

`on_message_created` (latest 0034) notifies the other participants, or `messages.manage` holders for partner and support threads, with `message.new`. Notification links go straight to the conversation. Email copies are throttled to one per thread per 15 minutes and never contain the message text.
