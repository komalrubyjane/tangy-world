# 30 — Data Flow Diagrams

Each diagram shows where a piece of data **originates**, where it is **stored** and where it **ends up**.

## 1. Authentication data

```mermaid
---
title: Authentication data
---
flowchart LR
  classDef src fill:#1f6f43,color:#fff
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef out fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  E(["Email typed by user"]):::src --> AU[("auth.users")]:::db
  AU -- "handle_new_user" --> PR[("profiles: role user · passport_id · email")]:::db
  AU -- "sync_profile_email (0035)" --> PR
  PR --> JWT["Session JWT in browser storage (supabase-js)"]:::out
  PR --> CTX["UserAuthContext user · role"]:::out
  PR --> PERM["my_permissions() via role_permissions"]:::out
  PR --> RLS["every RLS / RPC check"]:::out
```

## 2. Event data

```mermaid
---
title: Event data
---
flowchart LR
  classDef src fill:#1f6f43,color:#fff
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef out fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  A(["Admin EventForm / TicketTypesEditor / BookingFormEditor / Content → Sessions"]):::src --> EV[("events")]:::db
  A --> TT[("event_ticket_types")]:::db
  EV --> SIG[("event_availability_signal")]:::db
  EV & TT --> PUB["/sessions · /sessions/:slug · calendar · homepage"]:::out
  EV --> ARC["/sessions/archive · programmes"]:::out
  EV --> REM["event reminders · change notices → members"]:::out
  SIG -- Realtime --> PUB
```

## 3. Artist data

```mermaid
---
title: Artist data
---
flowchart LR
  classDef src fill:#1f6f43,color:#fff
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef out fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  AP(["Application answers"]):::src --> AR[("artists (pending → approved)")]:::db
  PF(["Artist profile edits"]):::src --> AR
  PF --> PP[("artist_private_profiles")]:::db
  AV(["Availability calendar"]):::src --> AA[("artist_availability")]:::db
  AR --> VIEW[("public_artists view")]:::db --> PUB["/artists · /artist directory · session line-ups"]:::out
  AR & AA --> DS["artist_day_status → admin pickers / calendars"]:::out
  PP --> TEAM["team only (entities.manage)"]:::out
```

## 4. Application data

```mermaid
---
title: Application data
---
flowchart TB
  classDef src fill:#1f6f43,color:#fff
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef out fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  F1(["/artist/apply"]):::src --> AA[("artist_applications.data")]:::db --> AR[("artists")]:::db
  F2(["/apply/vendors · sponsors · venue-host"]):::src --> CO[("collaborations")]:::db
  F3(["/crew/apply · /volunteer/apply"]):::src --> CR[("crew_applications")]:::db
  F4(["/private-sessions · /contact"]):::src --> EN[("private_enquiries · contact_enquiries")]:::db
  AA & CO & CR --> OV[("applications_overview view")]:::db --> ADM["Admin Applications"]:::out
  ADM --> REV[("application_reviews (internal notes)")]:::db
  ADM --> ROLE[("profiles.role + *_profiles")]:::db --> PORT["Portals"]:::out
  ADM --> AN[("application_notifications")]:::db --> EM["Approval email"]:::out
  EN --> OPS["Admin ops: enquiries / contact"]:::out
```

## 5. Booking data

```mermaid
---
title: Booking data
---
flowchart LR
  classDef src fill:#1f6f43,color:#fff
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef out fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  CF(["Checkout form: booker · attendees · answers"]):::src --> EF["razorpay-create-order"] --> BK[("bookings (pending)")]:::db
  BK --> ST["settle_payment → confirmed"]
  ST --> BK
  BK --> DASH["Customer /dashboard"]:::out
  BK --> ADM["Admin bookings · attendees CSV (attendee_tickets)"]:::out
  BK --> REP["Reports · revenue"]:::out
  BK --> AUD[("audit_logs")]:::db
```

## 6. Payment data

```mermaid
---
title: Payment data
---
flowchart TB
  classDef src fill:#1f6f43,color:#fff
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef ext fill:#efe0f5,stroke:#6b3d87,color:#222
  classDef out fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  Q(["booking_quote: price × qty + 18% tax"]):::src --> BK[("bookings.amount")]:::db
  BK --> RO["Razorpay order (paise)"]:::ext
  RO --> RP["Razorpay payment"]:::ext
  RP -- "checkout signature" --> VP["razorpay-verify-payment"]
  RP -- "webhook" --> WH["razorpay-webhook"] --> PWE[("payment_webhook_events")]:::db
  VP & WH --> BK2[("bookings: razorpay_payment_id · payment_status · signature_verified · refunded_amount")]:::db
  BK2 --> ADM["Admin Payments page"]:::out
  BK2 --> REP["report_revenue_by_month"]:::out
```

## 7. Ticket data

```mermaid
---
title: Ticket data
---
flowchart LR
  classDef src fill:#1f6f43,color:#fff
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef out fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  N(["attendee_names[] on booking"]):::src --> T[("tickets × qty · token")]:::db
  G(["bookings.group_token (DB default)"]):::src --> QR["QR TANGY:BOOKING:token<br/>browser + email"]:::out
  QR --> SC["/check-in scan"]
  SC --> CK[("checkins")]:::db
  T --> CK
  CK --> HIST["check-in history · stats · audit"]:::out
```

## 8. Waitlist data

```mermaid
---
title: Waitlist data
---
flowchart LR
  classDef src fill:#1f6f43,color:#fff
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef out fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  J(["join_waitlist(event, qty)"]):::src --> W[("waitlist: waiting · queue_no")]:::db
  REL(["seat released / capacity raised"]):::src --> OF["offer_waitlist_seats"] --> W2[("waitlist: offered · offer_expires_at")]:::db
  W2 --> HOLD["held seats counted in capacity everywhere"]:::out
  W2 --> CO["create_pending_booking → converted · booking_id"]:::out
  W2 --> EX["expire → expired → next party"]:::out
```

## 9. Notification data

```mermaid
---
title: Notification data
---
flowchart LR
  classDef src fill:#1f6f43,color:#fff
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef ext fill:#efe0f5,stroke:#6b3d87,color:#222
  classDef out fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  T(["triggers · RPCs · jobs"]):::src --> N["notify()"]
  P[("notification_preferences")]:::db --> N
  N --> NT[("notifications")]:::db -- Realtime --> BELL["bells / inboxes"]:::out
  N --> OB[("email_outbox")]:::db --> DR["send-notification-emails"] --> RS["Resend"]:::ext --> IN["inbox"]:::out
  OB --> LOG["Admin email delivery log"]:::out
```

## 10. Messaging data

```mermaid
---
title: Messaging data
---
flowchart LR
  classDef src fill:#1f6f43,color:#fff
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef out fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  U(["user / partner / team message text"]):::src --> RPC["send_message / start_* / chatService"] --> M[("messages")]:::db
  RPC --> C[("conversations · participants")]:::db
  M -- Realtime --> UI["thread views"]:::out
  M --> RS[("message_read_states")]:::db
  M -- "on_message_created" --> NT["notify message.new (no text in email)"]:::out
```

## 11. Content data

```mermaid
---
title: Content data
---
flowchart LR
  classDef src fill:#1f6f43,color:#fff
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef out fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  E(["Editors in Admin → Content"]):::src --> CT[("tv_videos · diary_posts · gallery_albums · gallery_photos · programmes · announcements")]:::db
  E --> FS[("content-media files")]:::db
  CT -- "published and published_at ≤ now" --> PUB["/tv · /diary · /gallery · archive · homepage · character pop-up"]:::out
  FS -- "signed URL if referenced by published content" --> PUB
```

## 12. Storage data

```mermaid
---
title: Storage data
---
flowchart LR
  classDef src fill:#1f6f43,color:#fff
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef out fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  AF(["Artist files"]):::src --> AM[("artist-media · artist-documents · artist-avatars")]:::db
  PF(["Partner files"]):::src --> ED[("event-documents/requirements · sponsor-assets")]:::db
  TF(["Team files"]):::src --> ED2[("event-documents/events · content-media")]:::db
  AM & ED & ED2 --> META[("artist_media · artist_documents · event_documents · sponsor_assets · CMS rows: storage_path")]:::db
  META --> SURL["signed URLs (10 min – 1 h) → reviewers, members, visitors"]:::out
  AM --> PUBAV["public avatar URLs"]:::out
```
