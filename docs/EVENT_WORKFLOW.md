# Event ↔ artist workflow

How events, artist calendars, line-ups, notifications, private messages and
roles fit together (migration `0034_event_artist_workflow.sql`). The database is
the authority for every rule below; the screens only present it.

## One source for availability

Artists keep their own calendar at `/artist/availability`: Available,
Tentative or Unavailable for a day, a range of days, or a time window on a day,
with a note. Nothing else stores availability — the team never types it in.

`artist_day_status(artist, date, start?, end?)` turns that calendar plus the
artist's bookings into one answer:

| Answer | Meaning |
| --- | --- |
| Unavailable | The artist marked the day (or an overlapping window) unavailable |
| Busy | Already on another, not-cancelled line-up at an overlapping time (unknown times count as overlapping) |
| Tentative | Marked tentative · a **pending** request that day (never treated as a booking) · booked that day at a different time · available for only part of the window |
| Available | Marked available |
| Not set | Nothing recorded, nothing booked |

Everything that shows availability reads this one function:
`find_available_artists()` (event editor, the event's Artists tab, the artist
directory's "Find available artists", the admin calendar's day view),
`artist_calendar()` (the artist portal calendar, the admin artist page, the
calendar drawer in the event editor — all the same `ArtistCalendar`
component), `artist_availability_summary()` (artist dashboard, admin
availability tab) and `artist_day_summary()` (admin dashboard).

## Building a line-up

`/admin-portal/events/new` (and an event's **Details** tab) is one sectioned
page: Event basics · Date & time · Venue · Artists · Capacity & tickets ·
Content · Publishing · Notifications. Once the date is set, **Add artist**
opens the selector — every approved artist grouped by the answer above,
available first, searchable by name, genre, instrument or city, filterable by
state, with each artist's full calendar one click away. Chosen artists become
cards with running order, performance type, set length, start / end (in the
event's time zone), notes and fee, and either **Add to line-up** or **Send
session request**. Overlapping sets are caught in the form and again on the
server.

The line-up is `event_artists` (event ↔ artist, many-to-many) with one
`event_artist_details` row per pair for the performance details. Requests are
`assignment_requests` (draft → pending → accepted → confirmed → completed;
declined / expired / cancelled).

Every write re-checks on the server under a per-artist-per-day advisory lock
(`assert_artist_bookable`), so two admins can't double-book an artist:

* `save_event_lineup()` — busy artists are refused; unavailable ones only with
  an explicit override, which is written to the audit log. A request may go to
  an unavailable or tentative artist (they decide), never to a busy one.
* `update_event_artist()` / `remove_event_artist()` — the event's Artists tab.
* `create_artist_request()` and `respond_to_booking_request()` (accepting) take
  the same lock and re-check, so a clash booked meanwhile is refused.

## Who is told what

| When | Who | Notification (links to) |
| --- | --- | --- |
| Request sent | The artist | New session request (`/artist/requests/:id`) |
| Accepted / declined | The admin who sent it | Accepted / declined (`/admin-portal/events/:id/artists`) |
| Event **published** with a line-up, or an artist added to a published event | Each artist on it | "You're on the lineup" — date, venue, performance time, "Do your best." (`/artist/sessions/:id`) — never for a draft |
| Date / time / venue changed | Line-up artists (once published) and anyone holding a request | Event updated — "New date: …" (`/artist/sessions/:id`) |
| Performance times changed | That artist | Performance details changed (`/artist/sessions/:id`) |
| Removed from a published line-up | That artist | Line-up change (`/artist/messages`) |
| Event cancelled | Line-up artists and request holders | Event cancelled — open requests are closed, the line-up rows stay as history and the artist's calendar shows the session as Cancelled |
| New message | The other participants | New message (`/artist/messages/:id` or `/admin-portal/messages/:id`) |
| Application decisions | The applicant | (0033) |
| Calendar not updated for `artists.availability_stale_days` (default 30) | The artist, once per period | Availability reminder (`/artist/availability`); the portal shows the same reminder |
| Role changed | The person | "Your Tangy role has been updated" — previous and new role, link to their dashboard |
| Custom (Super Admin) | One chosen person | Their title and message |

Older notifications that still carry `/artist/dashboard?tab=…` links are
redirected to the matching page by the artist dashboard.

## Custom notifications

A Super Admin can send one person a notification from their user page
(`/admin-portal/users/:id`) or an artist's **Notifications** tab:
`send_custom_notification()` refuses anyone else (Admin, Staff, artists …),
keeps links inside Tangy and is audited. It always lands in-app; an email is
queued only if the recipient's settings allow it, and the screen says which —
it never claims an email was sent.

## Private Super Admin ↔ artist messages

From an artist's **Messages** tab a Super Admin starts (or continues) a
private conversation (`start_private_artist_conversation()`,
`conversation_type = 'artist_private'`). It uses the existing messaging
tables, read receipts and notifications. Only its two participants can read or
write it: row-level security on conversations, participants and messages, and
every conversation function (`conversation_messages`, `send_message`, the
admin inbox, status / assignment / reopen) exclude private threads for
everyone else — other admins and Super Admins, staff, other artists,
sponsors, vendors, venue hosts and customers.

It is **not end-to-end encrypted**: protection is HTTPS, authentication,
authorization and database row-level security.

## Roles

`profiles.role` is the only role. Every protected request resolves it on the
server (`current_role_name()`, `has_permission()`), so a change applies to the
very next request — nothing in local storage, the URL or a client-side role
picker is trusted. `admin_set_user_role()` is the only way to change it:
`roles.manage` holders only, never one's own role, Super Admin granted or
removed only by a Super Admin, never the last Super Admin; each change is
audited (who, whom, old, new, reason) and the person is notified. An open
session re-reads its role when the tab regains focus and every minute, so
menus, guards and the dashboard follow without signing out.

## Public site

The homepage's diary section is the Tangy field journal (the 3D book); the same journal also has its own page, `/diary/journal`, and `/diary` is the full archive. The **Tangy
Calendar** section lists the next dates from the same `events` rows as
`/sessions` and `/sessions/calendar` (drafts and cancelled sessions never
appear), so a newly published session shows up on the next visit.

The admin **Calendar** (`/admin-portal/calendar`) shows every event with its
line-up and request states, filterable by artist, venue and status, and for a
chosen day who is available.

## Review data

`scripts/demo-data.sh seed` loads `supabase/demo/demo_seed_workflow.sql`: an
eight-week calendar for every approved demo artist (with some deliberately
stale), instruments for searching, and seven scenarios — Ragas at Dusk (two
artists, both available), Folk & Fusion Night (three, one tentative),
Monsoon Listening Room (draft; Kabir Sethi unavailable that day), Courtyard
Sessions: New Voices (pending request), Stepwell Strings (accepted request),
Old City Qawwali Night (cancelled, line-up kept) and Winter Baithak
(completed) — plus a private director ↔ Ananya Rao conversation.

## Session pages

Each session's page (`/sessions/:slug`, which is also its checkout) is printed
in the site's own materials — the ticket-poster card, ink and paper panels —
over the session's own backdrop: by default its cover photo, blurred and
darkened; or a dark colour / image chosen under **Page background** in the
event editor (`events.page_background`, which accepts only `cover`, a
`#RRGGBB` colour or an image link). The archive page of a past session uses
the same backdrop. No marketing pop-up covers the booking form.

## Demo accounts

`scripts/demo-data.sh seed` creates the demo accounts (sign in with the
email; the code arrives in Mailpit, http://127.0.0.1:54324). On a local dev
server with the role selector (`/admin-portal` while signed out, dev builds
only), **Artist** signs in as the demo artist Ananya Rao — sessions, requests,
calendar, availability, a private conversation and notifications to explore.
`npm run dev` reads `.env.development.local` (git-ignored, local only), which
points it at the local stack.
