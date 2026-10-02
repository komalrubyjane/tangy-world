# Tangy World — Artist Portal and artist applications

Migrations `0032_booking_request_states.sql` and `0033_artist_portal.sql`
(local only — not applied to production). Demo data:
`supabase/demo/demo_seed_artist_portal.sql`.

## The portal

One dedicated shell (`src/artist/portal/ArtistPortalShell.jsx`): a sidebar on
desktop, a drawer on mobile (focus trap, Escape, focus restore). No site
Navbar, no admin navigation, no secondary tab bar, no public-site overlays.
Only approved artists get in; anyone else with an application is sent to its
status page.

| Route | Page |
| --- | --- |
| `/artist/dashboard` | Next session (call / soundcheck / stage times), upcoming, request counts, availability conflicts, unread notifications & messages, profile completion, media status — every card links to its page |
| `/artist/sessions` (`?show=pending\|past\|cancelled`) | Booked sessions + requests awaiting an answer |
| `/artist/sessions/:sessionId` | Event, performance, team, requirements & hospitality, fee; update availability / message coordinator |
| `/artist/calendar` (`?view=week\|agenda&date=`) | Month / week / agenda; confirmed, request, tentative and unavailable entries are distinct (colour + label); entries open their session or request; export upcoming performances as `.ics` |
| `/artist/requests`, `/artist/requests/:requestId` | Grouped requests; opening marks it viewed; accept, or decline with a reason |
| `/artist/availability` | Tap a day or a range → available / tentative / unavailable, note, optional time window. Private to the artist and the team. Days with a confirmed performance keep their booking (a range skips them and the page says how many) |
| `/artist/media`, `/artist/media/:mediaId` | Upload with title, kind, description, tags, date, related session, performance type; review states; private preview links |
| `/artist/messages`, `/artist/messages/:conversationId` | Artist ↔ Tangy team only (existing messaging rules). Not end-to-end encrypted, and the page says so |
| `/artist/notifications` | Unread / read, mark one or all read, every item opens its page |
| `/artist/profile` | Identity, artistry, experience, self-reported audience numbers ("artist provided"), private contact, technical, hospitality & travel, payment status — one page, no tab row |
| `/artist/documents` | Rider, EPK, tax / payment, ID — private bucket `artist-documents` |
| `/artist/settings` | Account (role not editable), privacy, notification preferences, sign out |
| `/artist/apply` | The 8-step application (below) |
| `/artist/application` | Application status, what the team asked for, decision message, withdraw |

Old links: `/artist/dashboard/<tab>` → the section's page; `/artist/register`
and `/artists/apply` → `/artist/apply`.

## The application (`/artist/apply?step=1…8`)

About you · Your artistry · Experience · Online presence · Performance media ·
Technical & hospitality · Availability · Review. One step at a time, progress
bar, Back / Continue with validation, **autosave** (and Save draft) to
`artist_applications.data`; refresh or Back keeps the step (it is in the URL).
Account details are prefilled. Chips for types, genres, instruments,
languages; repeatable highlight cards (venue / event / year / type).
Performance video: upload (private `artist-media/applications/<user id>/`) or a
YouTube / Vimeo link (validated in the browser and by a database check).
Media consent ("subject to final legal review") and an accuracy confirmation
are required. The server validates and creates the artist record on submit.

States: draft → submitted → under_review → needs_information → submitted … →
approved | rejected (| withdrawn). Only `review_artist_application()` changes
them; a trigger blocks applicants from setting status or review fields.

## Admin

* `/admin-portal/artists/applications` — All / New / Under review / Needs
  information / Approved / Rejected / Withdrawn (the filter is in the URL);
  search by name, city or genre; artist, genre, city, experience,
  Instagram, Spotify, date, status.
* `/admin-portal/artists/applications/:id` — every section, the video preview
  in place (privacy-enhanced YouTube / Vimeo embed or a signed link to the
  upload), tags, structured assessment (experience, media quality,
  completeness, technical readiness, availability — no automatic score),
  private notes; Start review / Request information (checklist + message +
  internal note) / Approve (provisions the role server-side, notifies) /
  Reject (internal reason required; optional artist-facing message).
* Event → Artists: request with performance type, set length, call and
  soundcheck times, fee, technical and hospitality notes; save as draft or
  send; a conflict check shows the artist's availability and other sessions
  that day (warns, never blocks); requests can be sent, confirmed (copies the
  logistics to the artist's session), cancelled (the artist is notified and the
  session leaves their calendar) or marked completed — from the session's own
  date in the event's timezone (`events.timezone`), not the database's UTC date.
* Request states: draft (team only) → pending ("sent", "viewed" once opened)
  → accepted → confirmed → completed; declined / expired / cancelled.

## Security

* Internal review notes for every application kind now live in
  `application_reviews` (reviewers only); they used to sit on rows the
  applicant could read.
* Availability is readable only by the artist and the team (it was public).
* Applications: applicant + reviewers only. Documents and application uploads:
  private buckets, owner + team only. Media is public only after approval.
* Artists cannot approve their own application or media, change their role,
  change request statuses directly, read other artists' data or open admin
  routes — `supabase/tests/artist_portal.test.sql` and `e2e/artist-portal.mjs`.

## Demo data

12 applications (2 approved, 1 draft, 2 needs information, 1 rejected,
3 submitted, 2 under review, 1 withdrawn) with a generated demo performance
video (a title card — `public/media/demo/demo-performance.mp4`); 16 booking
requests for the four demo artists (4 pending, 5 accepted incl. 2 confirmed,
2 declined, 4 completed, 1 draft); 6 media items; availability incl. a
conflict (Kabir Sethi). Sign in as `ananya.rao@demo.tangy.local` or
`kabir.sethi@demo.tangy.local` at `/artist/login`; reviewers as
`ops@demo.tangy.local`.
