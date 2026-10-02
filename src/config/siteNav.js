// The public site's navigation — one source of truth for the Navbar (desktop
// dropdowns and the mobile index), each section's sub-navigation, breadcrumbs
// and the navigation E2E suite (e2e/navigation.mjs).
//
// Every item is a real route with its own page (no `#anchor` destinations).
// `match` lists extra path prefixes that belong to a section, so the parent
// stays highlighted on nested pages (e.g. /sessions/:slug, /blogs → Diary).
// `heading` is text the destination page's <h1> contains (used by the tests).
export const NAV_SECTIONS = [
  {
    title: 'About',
    path: '/about',
    match: ['/about'],
    items: [
      { label: 'Why Tangy', path: '/about/why-tangy', heading: 'WHY' },
      { label: 'Chronology', path: '/about/chronology', heading: 'CHRONOLOGY' },
      { label: 'Tangy Team', path: '/about/team', heading: 'TEAM' },
      { label: 'Full Story', path: '/about/full-story', heading: 'FULL STORY' },
    ],
  },
  {
    title: 'Sessions',
    path: '/sessions',
    match: ['/sessions'],
    items: [
      { label: 'Upcoming Sessions', path: '/sessions', heading: 'UPCOMING' },
      { label: 'Concert Culture', path: '/sessions/concert-culture', heading: 'CONCERT' },
      { label: 'Session Calendar', path: '/sessions/calendar', heading: 'CALENDAR' },
      { label: 'Join Waitlist', path: '/sessions/waitlist', heading: 'WAITLIST' },
      { label: 'Previous Sessions', path: '/sessions/archive', heading: 'PREVIOUS' },
    ],
  },
  {
    title: 'Archive',
    path: '/archive',
    // Gallery and Tangy TV keep their own URLs but belong to the archive.
    match: ['/archive', '/gallery', '/tv'],
    items: [
      { label: 'Previous Sessions', path: '/sessions/archive', heading: 'PREVIOUS' },
      { label: 'Programmes', path: '/archive/programmes', heading: 'PROGRAMMES' },
      { label: 'Gallery', path: '/gallery', heading: 'GALLERY' },
      { label: 'Tangy TV', path: '/tv', heading: 'TANGY TV' },
      { label: 'Museum Timeline', path: '/archive/museum-timeline', heading: 'TIMELINE' },
      { label: 'Past Memories', path: '/archive/past-memories', heading: 'MEMORIES' },
      { label: '35mm Contact Sheets', path: '/archive/contact-sheets', heading: 'CONTACT' },
    ],
  },
  {
    title: 'Artists',
    path: '/artist',
    match: ['/artist', '/artists'],
    items: [
      { label: 'Artists Directory', path: '/artist', heading: 'ARTIST' },
      { label: 'Apply as an Artist', path: '/artist/apply', heading: 'APPLY' },
      { label: 'Artist Login', path: '/artist/login', heading: 'STAGE' },
      // Signed-in area: signed-out visitors are sent to /artist/login.
      { label: 'Artist Portal', path: '/artist/dashboard', heading: 'ARTIST', protected: true },
    ],
  },
  {
    title: 'Crew',
    path: '/crew',
    match: ['/crew', '/volunteer'],
    items: [
      { label: 'Volunteer Opportunities', path: '/crew/volunteer', heading: 'VOLUNTEER' },
      { label: 'Production Team', path: '/crew/production', heading: 'AUDIO' },
      { label: 'Stage Operations', path: '/crew/stage-operations', heading: 'STAGE' },
      { label: 'Apply Now', path: '/crew/apply', heading: 'CREW' },
    ],
  },
  {
    title: 'Collaborate',
    path: '/collaborate',
    match: ['/collaborate', '/apply/vendors', '/apply/sponsors', '/apply/venue-host', '/apply/host'],
    items: [
      { label: 'Vendors', path: '/apply/vendors', heading: 'VENDOR' },
      { label: 'Sponsors', path: '/apply/sponsors', heading: 'SPONSOR' },
      { label: 'Venue / Host', path: '/apply/venue-host', heading: 'HOST' },
      { label: 'Explore Opportunities', path: '/collaborate/opportunities', heading: 'OPPORTUNITIES' },
    ],
  },
  {
    title: 'Private',
    path: '/private-sessions',
    match: ['/private-sessions', '/private/gatherings', '/private/corporate', '/private/weddings', '/private/heritage'],
    items: [
      { label: 'Private Gatherings', path: '/private/gatherings', heading: 'GATHERINGS' },
      { label: 'Corporate Events', path: '/private/corporate', heading: 'CORPORATE' },
      { label: 'Weddings', path: '/private/weddings', heading: 'WEDDINGS' },
      { label: 'Heritage Experiences', path: '/private/heritage', heading: 'HERITAGE' },
    ],
  },
  {
    title: 'Diary',
    path: '/diary',
    match: ['/diary', '/blogs'],
    items: [
      { label: 'Museum Journal', path: '/diary/journal', heading: 'JOURNAL' },
      { label: 'Recent Stories', path: '/diary/stories', heading: 'STORIES' },
    ],
  },
  {
    title: 'Contact',
    path: '/contact',
    match: ['/contact'],
    items: [
      { label: 'Location & Map', path: '/contact/location', heading: 'LOCATION' },
      { label: 'Email Dispatch', path: '/contact/email', heading: 'DISPATCH' },
      { label: 'Instagram', path: '/contact/instagram', heading: 'INSTAGRAM' },
    ],
  },
];

const under = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`);

// The section a URL belongs to (for the Navbar highlight and breadcrumbs).
export function sectionFor(pathname) {
  return NAV_SECTIONS.find((s) => s.match.some((p) => under(pathname, p))) || null;
}

// The dropdown item for exactly this URL, if any.
export function itemFor(pathname) {
  for (const s of NAV_SECTIONS) {
    const item = s.items.find((i) => i.path === pathname);
    if (item) return { section: s, item };
  }
  return null;
}
