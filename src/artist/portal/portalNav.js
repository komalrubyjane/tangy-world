// The Artist Portal's one navigation (sidebar on desktop, drawer on mobile).
// Every entry is a real route; there is no secondary tab bar.
export const ARTIST_NAV = [
  { to: '/artist/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/artist/sessions', label: 'Sessions', icon: 'Music' },
  { to: '/artist/calendar', label: 'Calendar', icon: 'CalendarDays' },
  { to: '/artist/requests', label: 'Requests', icon: 'Inbox', badge: 'requests' },
  { to: '/artist/availability', label: 'Availability', icon: 'CalendarCheck' },
  { to: '/artist/media', label: 'Media', icon: 'Image' },
  { to: '/artist/messages', label: 'Messages', icon: 'MessagesSquare', badge: 'messages' },
  { to: '/artist/notifications', label: 'Notifications', icon: 'Bell', badge: 'notifications' },
  { to: '/artist/profile', label: 'Profile', icon: 'UserRound' },
  { to: '/artist/documents', label: 'Documents', icon: 'FileText' },
  { to: '/artist/settings', label: 'Settings', icon: 'Settings' },
];

// Old /artist/dashboard/<tab> links (the previous tabbed portal) → their page.
export const LEGACY_TAB = {
  overview: '/artist/dashboard', events: '/artist/sessions', schedule: '/artist/calendar', requirements: '/artist/sessions',
  messages: '/artist/messages', documents: '/artist/documents', payments: '/artist/documents',
  announcements: '/artist/notifications', notifications: '/artist/notifications',
};

// The artist workspace (portal + application): no public-site overlays (the
// museum dock, the assistant, announcement pop-ups) over a working screen.
// /artist/profile/:id is the public artist page and keeps them.
const WORKSPACE = ['/artist/apply', '/artist/application', ...ARTIST_NAV.map((i) => i.to).filter((p) => p !== '/artist/profile')];
export const isArtistWorkspace = (pathname) => pathname === '/artist/profile'
  || WORKSPACE.some((p) => pathname === p || pathname.startsWith(`${p}/`));
