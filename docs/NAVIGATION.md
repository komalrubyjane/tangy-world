# Tangy World — navigation route audit

Every Navbar destination (desktop dropdowns and the mobile index) is a real
React Router route with its own page, title, description, breadcrumb and
section sub-navigation. The single source of truth is `src/config/siteNav.js`
(used by the Navbar, `SectionNav` / `PageCrumbs` and `e2e/navigation.mjs`).
No navigation link is an `#anchor`, and no page switches "sections" with local
state.

`e2e/navigation.mjs` proves, for every item below: open the parent, open the
dropdown, click the item, URL, page heading, parent highlighted, reload,
Back, Forward; the mobile index at 375 / 390 / 412 px; breadcrumbs; old URLs;
404s for unknown sub-pages; per-page titles.

## Route inventory

| Parent | Subsection | Old URL | Final URL | Independent page | Status |
| --- | --- | --- | --- | --- | --- |
| About | (section) | `/about` | `/about` | AboutPage | existing |
| About | Why Tangy | `/about#manifesto` | `/about/why-tangy` | WhyTangyPage | hash → page (page existed) |
| About | Chronology | `/about#history` | `/about/chronology` | ChronologyPage | hash → page (page existed) |
| About | Tangy Team | `/about/team` | `/about/team` | TeamPage | already a page |
| About | Full Story | `/about` | `/about/full-story` | FullStoryPage | repointed to its page (page existed) |
| Sessions | Upcoming Sessions | `/sessions#upcoming` | `/sessions` | SessionsPage (now the upcoming listing only) | hash → page; `/sessions/upcoming` redirects here |
| Sessions | Concert Culture | `/sessions#culture` | `/sessions/concert-culture` | ConcertCulturePage | hash → page; section removed from `/sessions` |
| Sessions | Session Calendar | `/sessions#calendar` | `/sessions/calendar` | SessionCalendarPage | hash → page; section removed from `/sessions` |
| Sessions | Join Waitlist | `/sessions#waitlist` | `/sessions/waitlist` | WaitlistPage | hash → page; section removed from `/sessions` |
| Archive | (section) | `/archive` | `/archive` | ArchivePage | existing |
| Sessions | Previous Sessions | — | `/sessions/archive` (+ `/sessions/archive/:slug`) | PreviousSessionsPage / PastSessionPage | **new**: the archive of past sessions; each has its own page |
| Archive | Previous Sessions | `/archive#session-archive` | `/sessions/archive` | PreviousSessionsPage | hash → page; `/archive/session-archive` redirects |
| Archive | Programmes | — | `/archive/programmes` (+ `/:slug`) | ProgrammesPage / ProgrammePage | **new** (migration 0031) |
| Archive | Gallery | — | `/gallery` (+ `/gallery/archive`, `/gallery/:album`) | GalleryPage / GalleryArchivePage | existing route reused; `/gallery/archive` **new** (filters) |
| Archive | Tangy TV | — | `/tv` (+ `/tv/:slug`) | TvPage | existing route reused |
| Archive | Museum Timeline | `/archive#museum-timeline` | `/archive/museum-timeline` | MuseumTimelinePage | hash → page |
| Archive | Past Memories | `/archive#past-memories` | `/archive/past-memories` | PastMemoriesPage | hash → page |
| Archive | 35mm Contact Sheets | `/archive#contact-sheets` | `/archive/contact-sheets` | ContactSheetsPage | hash → page |
| Artists | Artists Directory | `/artist` | `/artist` | ArtistsDirectoryPage (artist app) | already a page |
| Artists | Apply as an Artist | `/artist/register` | `/artist/apply` | ApplyPage (8-step application; signed-out visitors sign in on the page) | replaced; `/artist/register` redirects |
| Artists | Artist Login | `/artist/login` | `/artist/login` | LoginPage | already a page |
| Artists | Artist Portal | `/artist/dashboard` | `/artist/dashboard` | PortalDashboardPage in the dedicated portal shell (signed-out → `/artist/login`) | rebuilt — see `docs/ARTIST_PORTAL.md` |
| Crew | (section) | `/crew` | `/crew` | CrewPage | existing |
| Crew | Volunteer Opportunities | `/crew#volunteer` | `/crew/volunteer` | VolunteerOpportunitiesPage | hash → page |
| Crew | Production Team | `/crew#production` | `/crew/production` | ProductionTeamPage | hash → page |
| Crew | Stage Operations | `/crew#stage` | `/crew/stage-operations` | StageOperationsPage | hash → page |
| Crew | Apply Now | `/apply/crew` (rendered the whole Crew page) | `/crew/apply` | CrewApplyPage | repointed; `/apply/crew` redirects |
| Collaborate | (section) | `/collaborate` | `/collaborate` | CollaboratePage | existing |
| Collaborate | Vendors | `/apply/vendors` | `/apply/vendors` | VendorApplyPage | already a page |
| Collaborate | Sponsors | `/apply/sponsors` | `/apply/sponsors` | SponsorApplyPage | already a page |
| Collaborate | Venue / Host | `/apply/venue-host` | `/apply/venue-host` | VenueHostApplyPage | already a page |
| Collaborate | Explore Opportunities | `/collaborate` | `/collaborate/opportunities` | CollaborateOpportunitiesPage | repointed to its page (page existed) |
| Private | (section) | `/private-sessions` | `/private-sessions` | PrivateSessionsPage | existing; category cards now link to the pages |
| Private | Private Gatherings | `/private-sessions#gatherings` | `/private/gatherings` | PrivateOfferingPage | hash → page |
| Private | Corporate Events | `/private-sessions#corporate` | `/private/corporate` | PrivateOfferingPage | hash → page |
| Private | Weddings | `/private-sessions#weddings` | `/private/weddings` | PrivateOfferingPage | hash → page |
| Private | Heritage Experiences | `/private-sessions#heritage` | `/private/heritage` | PrivateOfferingPage | hash → page |
| Diary | (section) | `/blogs` | `/diary` | BlogsPage | `/diary` canonical; `/blogs` and `/blogs/:slug` redirect |
| Diary | Museum Journal | `/blogs#journal` | `/diary/journal` | MuseumJournalPage | hash → page |
| Diary | Recent Stories | `/blogs#stories` | `/diary/stories` | RecentStoriesPage | hash → page |
| Diary | ~~Behind the Scenes~~ | `/blogs#behind-the-scenes` | — | — | **removed from the menu**: it pointed at the general post list and `/diary/behind-the-scenes` only redirected to `/diary`; no such content exists. The old URL still redirects to `/diary`. |
| Diary | (posts) | `/blogs/:slug` | `/diary/:slug` | DiaryPostPage | already pages |
| Contact | (section) | `/contact` | `/contact` | ContactPage | existing |
| Contact | Location & Map | `/contact#location` | `/contact/location` | LocationPage | hash → page |
| Contact | Email Dispatch | `/contact#dispatch` | `/contact/email` | EmailDispatchPage | hash → page |
| Contact | Instagram | `instagram.com` (external, new tab) | `/contact/instagram` | InstagramPage | repointed to its page (it links out to Instagram) |

## New / changed routes

- **Routing pass:** no new pages were needed — every subsection page already existed; the Navbar pointed at `#anchors` instead.
- **Archive pass:** new `/sessions/archive`, `/sessions/archive/:slug`, `/archive/programmes`, `/archive/programmes/:slug`, `/gallery/archive`. Past sessions' booking URLs (`/sessions/:slug`) redirect to their archive page; upcoming ones the other way. No duplicate `/archive/sessions`, `/archive/gallery` or `/archive/tv` — the Archive menu and the `/archive` hub link to the real pages.
- **Redirects** (old links keep working): `/sessions/upcoming → /sessions`, `/blogs → /diary`, `/blogs/:slug → /diary/:slug`, `/apply/crew → /crew/apply`, `/volunteer → /crew/volunteer`, `/diary/behind-the-scenes → /diary` (existing).
- **Removed catch-alls** `/about/*` and `/archive/*`: they rendered the overview page for any URL (e.g. `/about/founders` showed About). Unknown sub-pages now show the 404 page.
- **Removed duplicate page files**: `UpcomingSessionsPage` (copy of the `/sessions` grid) and the four Private category pages (one config-driven `PrivateOfferingPage`).

## Shared components (no duplicated business logic)

| Component | Replaces |
| --- | --- |
| `config/siteNav.js` | the Navbar's inline menu + every page's hand-written jump-link row |
| `components/layout/SectionNav.jsx` (`SectionNav`, `PageCrumbs`) | `#anchor` jump rows on About / Sessions / Archive / Crew / Private, "← BACK" links, sibling-link rows |
| `components/sessions/UpcomingSessionsGrid.jsx` | the grid copied in SessionsPage and UpcomingSessionsPage (now with an error state) |
| `components/sessions/ConcertCultureRules.jsx` | the rules copied in SessionsPage and ConcertCulturePage |
| `components/private/PrivateEnquiryForm.jsx` + `config/privateOfferings.js` | five copies of the private-enquiry submission |
| `components/contact/ContactEnquiryForm.jsx` | two copies of the contact submission |
| `components/crew/CrewApplicationForm.jsx` | two diverging crew-application copies (the `/crew/apply` copy faked success when the backend was offline) |

## Intentionally still same-page

- **Homepage chapters** (Hero, Manifesto, Archive, Diary, Upcoming Events, Newsletter, Closing) and the chapter rail — visual sections of one page, not Navbar destinations.
- **In-page filters**: Sessions venue filter, Archive category filter, Diary tag filter — they filter one listing; they are not destinations.
- **Old section ids** (`#history`, `#production`, `#location`, …) remain on the overview pages so existing bookmarks still scroll; nothing links to them any more.
- **Portal / dashboard tabs** already use real routes (`/…/dashboard/:tab`).
- **Artist app pages** (`/artist…`) keep their own artist navbar (separate sub-app); the site Navbar's Artists menu links into it.
