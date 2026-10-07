# 08 — Artist Application Workflow (`/artist/apply`)

**Status: IMPLEMENTED** (migrations 0032/0033; `src/artist/portal/pages/ApplyPage.jsx`, `ApplicationStatusPage.jsx`; admin `src/admin/pages/ArtistApplicationsPage.jsx`).

- One row per account in `artist_applications` (`user_id` is unique).
- Answers live in `data jsonb` (< 200 KB), grouped by section: `about`, `artistry`, `experience`, `online`, `media`, `technical`, `availability`.
- The video, the consents and the review state are separate columns.

## Step-by-step

| # | Step (`STEPS`) | Main fields | Browser validation (`validate(step)`) | Server validation on submit |
|---|---|---|---|---|
| 1 | About you | full name\*, stage name\*, email (prefilled), phone, WhatsApp, city\*, country, website | name, stage name, city required; phone pattern | full name, stage name, city |
| 2 | Your artistry | artist type\*, primary genre\*, other genres, sub-genres, instruments, languages, sound/style, short bio\*, long bio, years active, experience level | type, genre, short bio ≥ 40 chars | artist type, primary genre, short bio |
| 3 | Experience | years performing, number of shows, venues, festivals, cultural events, collaborations, performed with Tangy before (+ which event) | — | — |
| 4 | Online presence | Instagram, Spotify, YouTube, SoundCloud, website, other + self-reported audience numbers | https:// links (or @handle for Instagram) | — |
| 5 | Performance media | how the video is shared; primary video\* (upload up to 50 MB or YouTube/Vimeo URL); title, place, date, type, description; optional 2nd video link; media consent\* | video present; only YouTube/Vimeo links; consent | `video_url` or `video_storage_path`; `media_consent`; DB check constraint on `video_url` pattern |
| 6 | Technical & hospitality | format, set duration, technical requirements, own backline, rider notes, travelling from, members, accommodation, travel assistance, food, other | — | — |
| 7 | Availability | typical availability, preferred days, blocked dates, notice period, last-minute, travel radius, cities | — | — |
| 8 | Review | read-only summary with "edit" links; accuracy confirmation\* | accuracy confirmed | `accuracy_confirmed` |

## Draft, autosave and submit flow

```mermaid
---
title: /artist/apply — draft, autosave, upload, submit
---
flowchart TD
  classDef start fill:#1f6f43,color:#fff
  classDef proc fill:#f4ead2,stroke:#7a5c2e,color:#222
  classDef dec fill:#fff3c4,stroke:#b38600,color:#222
  classDef db fill:#dce8f7,stroke:#2a5b9a,color:#122
  classDef err fill:#fbdada,stroke:#b42318,color:#5a0d0d
  classDef res fill:#d9f2e3,stroke:#1f7a4a,color:#0f3d24
  S(["Open /artist/apply"]):::start --> AU{"Signed in?"}:::dec
  AU -- no --> OTP["EmailOtpAuth inline"]:::proc --> AU
  AU -- yes --> LD["Load own artist_applications<br/>row"]:::db
  LD --> EX{"Row exists?"}:::dec
  EX -- no --> NEW["insert {} · status draft<br/>(guard_artist_application<br/>forces draft)"]:::db
  EX -- yes --> ST{"status"}:::dec
  ST -- "submitted / under_review / approved / rejected / withdrawn" --> STAT["/artist/application status<br/>page"]:::res
  ST -- "draft / needs_information" --> STEP
  NEW --> STEP["Step N from ?step= or<br/>current_step"]:::proc
  STEP --> ED["Edit fields"]:::proc
  ED --> T["1.5 s debounce →<br/>saveApplication()<br/>update data, current_step,<br/>video, consents"]:::db
  T --> RLS{"RLS: own row and status draft<br/>or needs_information"}:::dec
  RLS -- no --> NS["'Not saved: …'"]:::err
  RLS -- yes --> ED
  ED --> UP{"Step 5 upload?"}:::dec
  UP -- yes --> STO["uploadWithProgress →<br/>artist-media/applications/uid/…<br/>bucket: 50 MB,<br/>audio/video/images/pdf"]:::db
  STO --> ED
  ED --> NX["Continue → validate(step)"]:::dec
  NX -- errors --> ED
  NX -- ok --> STEP
  STEP -- "step 8" --> SB["Submit: validate all steps ·<br/>accuracy confirmed"]:::dec
  SB -- missing --> ED
  SB -- ok --> RPC["save() then<br/>submit_artist_application()"]:::db
  RPC --> CHK{"server: required fields,<br/>video, consents"}:::dec
  CHK -- missing --> ERR["'Please complete: …'"]:::err
  CHK -- ok --> ART["insert artists (status<br/>pending) or update pending row<br/>application status submitted ·<br/>artist_id · submitted_at"]:::db
  ART --> N1["notify self<br/>application.submitted<br/>resubmission → notify<br/>reviewers<br/>application.resubmitted<br/>audit application.submitted /<br/>resubmitted"]:::db
  N1 --> GO["navigate /artist/application"]:::res
```

## Application state machine

```mermaid
---
title: artist_applications.status
---
stateDiagram-v2
  [*] --> draft: insert (applicant)
  draft --> submitted: submit_artist_application
  submitted --> under_review: review start_review
  submitted --> needs_information: review request_info
  under_review --> needs_information: review request_info
  needs_information --> submitted: applicant edits and resubmits
  submitted --> approved: review approve
  under_review --> approved: review approve
  submitted --> rejected: review reject (internal reason required)
  under_review --> rejected: review reject
  draft --> withdrawn: withdraw_artist_application
  submitted --> withdrawn
  under_review --> withdrawn
  needs_information --> withdrawn
  approved --> [*]
  rejected --> [*]
  withdrawn --> [*]
```

`sync_artist_application_status` keeps the application in step when a decision is made on the `artists` row from the generic Applications screen.

## Admin review flow

```mermaid
---
title: Admin review — request info, resubmit, decide, provision
---
sequenceDiagram
  autonumber
  actor AR as Artist applicant
  participant AP as ApplyPage / ApplicationStatusPage
  participant DB as Postgres
  actor RV as Reviewer (applications.review)
  participant AA as ArtistApplicationsPage
  AR->>AP: Submit
  AP->>DB: submit_artist_application()
  DB-->>RV: (list shows "New")
  RV->>AA: Open application · preview video (YouTube/Vimeo embed or signed URL)
  AA->>DB: review_artist_application(id, 'start_review')
  DB-->>AR: notify application.under_review (in-app)
  RV->>AA: Request information (items + message)
  AA->>DB: review_artist_application(id, 'request_info', items, message)
  DB->>DB: status needs_information · info_request jsonb
  DB-->>AR: notify application.info_requested (in-app + email queue)
  AR->>AP: Update answers · resubmit
  AP->>DB: submit_artist_application()  (update pending artists row)
  DB-->>RV: notify application.resubmitted
  alt approve
    RV->>AA: Approve (public message, internal note)
    AA->>DB: review_artist_application(id, 'approve', …)
    DB->>DB: approve_artist_application(artist_id)<br/>artists approved · profiles.role user → artist<br/>application_notifications(approval) · notify application.approved · audit
    DB-->>AR: in-app notification · next visit to /artist/dashboard opens the portal
  else reject
    RV->>AA: Reject (internal reason required, optional public message)
    AA->>DB: review_artist_application(id, 'reject', …)
    DB->>DB: reject_artist_application · status rejected · decided_at · audit
    DB-->>AR: notify application.rejected (in-app)
  end
  Note over DB: internal notes → application_reviews (reviewers only)<br/>public_message → shown to the applicant
```

## Security boundaries

- **RLS:**
  - The applicant reads their own row, and edits it only while it is `draft` or `needs_information`.
  - Reviewers read with `applications.view`.
- **Trigger `guard_artist_application`:** for API callers it forces `status = draft` on insert and blocks every status and review field. Only the RPCs (which set `tangy.application_rpc = on`) can change them.
- **Uploads:** application uploads go to `artist-media/applications/<uid>/`. Only the applicant and `applications.view` holders can read them (0033 storage policies).
- **Approval email:** see the gap noted in [07](07-artist-architecture.md#artist-approval-email-a-gap). `application.info_requested` **is** emailed (catalogue `email = true`), while `approved` / `rejected` are in-app only on this path.
