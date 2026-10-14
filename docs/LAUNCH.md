# Temporary public launch

A controlled launch on Vercel with the custom domain: the site's story, archive,
gallery, Tangy TV, artists and team stay public; sessions, accounts and anything
unfinished are held back behind a consistent "Coming soon".

Everything is driven by one switch, `src/config/launch.js` (`LAUNCH_MODE`). It is
**on unless** the build sets `VITE_TEMPORARY_LAUNCH=false`. No database data is
changed, and nothing in the event, booking or payment architecture is removed.

## What launch mode changes

| Area | During the launch |
|---|---|
| `/sessions` (Book Now) | Shows the one `TEMPORARY_SESSION` instead of the live listing. Its **Book now** opens the Google Form in a new tab. |
| Session listings | `useEvents` makes no query, so the home Sessions section, Tangy Calendar, `/sessions/calendar`, the programme board and the waitlist all show their empty state ("New sessions coming soon"). Artist pages list no upcoming sessions. |
| `/sessions/:id`, `/book/:id` | "Booking opens soon" page. No event lookup, no checkout, no Razorpay. |
| `/join`, `/join/login`, `/profile`, `/dashboard*`, partner dashboards, `/private/dashboard` | "Accounts coming soon". |
| `/artist/login`, `/artist/apply`, `/artist/application`, the artist portal (`/artist/dashboard`, `/artist/sessions`, …) | "Artist portal coming soon". The artists directory and public profiles stay. |
| Dock LOGIN / PASSPORT and every "sign in to …" prompt | The login modal says accounts are coming soon (no sign-up form). |
| Forms that need sign-in (contact, private sessions, crew, volunteer, vendor, sponsor, venue) | The page stays up; the form becomes a "Coming soon" panel with hello@tangysessions.com. |
| Placeholder forms that saved nothing (home Inner Circle, `/inner-circle`, dock Postcard) | Replaced by a "Coming soon" note. |
| Navigation | Join Waitlist, Apply as an Artist, Artist Login and Artist Portal are hidden (`launchHidden` in `src/config/siteNav.js`). |
| Tangy AI | Answers about ticketing, Passport, waitlist, the next session, and artist and crew applications describe the launch state (`LAUNCH_ANSWERS` in `src/data/mock/aiKnowledge.js`). |

Not affected: `/admin-portal` with its own sign-in and all event management,
`/check-in`, `/invitation` (staff and partner invites sent by an admin), the
archive of previous sessions, and every database record.

## Configure before going live

### 1. The Google Form (required for Book now)

Set the variable in Vercel (Project → Settings → Environment Variables,
Production and Preview), then redeploy, because Vite bakes it in at build time:

```
VITE_TEMP_SESSION_FORM_URL=https://docs.google.com/forms/d/e/<form id>/viewform
```

Only `https://docs.google.com/forms/…` and `https://forms.gle/<id>` links are
accepted. If the variable is missing or holds anything else, the card shows
"Registration opens soon" and no button. Visitors are never sent to an
unvalidated URL or into checkout.

### 2. The session details

Edit `TEMPORARY_SESSION` in `src/config/launch.js`. Fill in only what the team
has confirmed. A field left `null` isn't shown, and the card never guesses a
date, venue or price. Until a title is set, the card reads "Our next session".
For an image, put the file under `public/` and use its path.

### 3. Vercel and the custom domain

- Add the domain in Vercel → Domains and set the DNS records Vercel shows. If both
  apex and `www` are used, have one redirect to the other.
- Vercel needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or
  `VITE_SUPABASE_ANON_KEY`). `vite build` fails without them.
- `vercel.json` already rewrites every path to `index.html`, so direct links
  like `/sessions` or `/about/team` load.
- Supabase → Authentication → URL Configuration: set **Site URL** to the custom
  domain and add it to **Redirect URLs**. Admin sign-in emails use it.
- Edge Function secrets: set `SITE_URL` to the custom domain's origin. If both
  apex and `www` serve the site, also set `ALLOWED_ORIGINS` (see
  `docs/OPERATIONS.md`, "CORS"). Without this, the admin console's
  function calls fail with CORS errors on the new domain.

## Ending the launch

1. Set `VITE_TEMPORARY_LAUNCH=false` in Vercel and redeploy. Live sessions,
   booking, accounts and the artist portal come back unchanged.
2. Later, delete `src/config/launch.js`, `src/components/launch/`, and the
   `LAUNCH_MODE` branches (`grep -rn LAUNCH_MODE src`).
