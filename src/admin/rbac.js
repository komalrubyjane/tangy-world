// Single source of truth for the admin console's role model on the client.
//
// The DATABASE is the authority: permissions come from role_permissions via
// my_permissions() (0017_admin_system.sql), and every RPC/RLS policy
// re-checks them server-side. Nothing here grants access — it only decides
// what to render, so a tampered client just sees buttons that fail.

export const CONSOLE_ROLES = ['super_admin', 'admin', 'staff'];

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin / Manager',
  staff: 'Staff',
  user: 'Patron',
  artist: 'Artist',
  vendor: 'Vendor',
  sponsor: 'Sponsor',
  volunteer: 'Volunteer',
  crew: 'Crew',
  venue: 'Venue Partner',
};

export const P = {
  DASHBOARD: 'dashboard.view',
  APPLICATIONS_VIEW: 'applications.view',
  APPLICATIONS_REVIEW: 'applications.review',
  EVENTS_ALL: 'events.view_all',
  EVENTS_MANAGE: 'events.manage',
  EVENTS_ASSIGNED: 'events.view_assigned',
  BOOKINGS_ALL: 'bookings.view_all',
  BOOKINGS_MANAGE: 'bookings.manage',
  PAYMENTS: 'payments.view',
  ATTENDEES_ALL: 'attendees.view_all',
  ATTENDEES_ASSIGNED: 'attendees.view_assigned',
  CHECKIN: 'checkin.perform',
  CHECKIN_HISTORY: 'checkin.history',
  CONTENT: 'content.manage',              // announcements
  CONTENT_VIEW: 'content.view',
  CONTENT_CREATE: 'content.create',
  CONTENT_EDIT: 'content.edit',
  CONTENT_PUBLISH: 'content.publish',
  CONTENT_DELETE: 'content.delete',
  CONTENT_TV: 'content.manage_tv',
  CONTENT_DIARY: 'content.manage_diary',
  CONTENT_MEDIA: 'content.manage_media',
  CONTENT_SESSIONS: 'content.manage_sessions',
  ANNOUNCEMENTS_VIEW: 'announcements.view',
  TEAM: 'team.manage',
  TASKS_OWN: 'tasks.view_own',
  ENTITIES: 'entities.manage',
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  ROLES: 'roles.manage',
  REPORTS: 'reports.view',
  AUDIT: 'audit.view',
  SETTINGS: 'settings.manage',
  AI: 'ai.use',
  OPERATIONS: 'operations.manage',
  MESSAGES: 'messages.manage',
  VOLUNTEERS: 'volunteers.manage',
  ACCESS_GRANT: 'access.grant',
};

// `requires` may be a string (one permission) or an array (ALL required).
// `anyOf` means at least one of the listed permissions.
export function allowed(perms, { requires, anyOf } = {}) {
  const set = perms instanceof Set ? perms : new Set(perms || []);
  if (requires) {
    const list = Array.isArray(requires) ? requires : [requires];
    if (!list.every((p) => set.has(p))) return false;
  }
  if (anyOf && !anyOf.some((p) => set.has(p))) return false;
  return true;
}

// Navigation is generated from permissions — no component decides visibility
// on its own. Order and grouping follow the Tangy admin blueprint.
export const NAV = [
  {
    group: 'Operate',
    items: [
      { to: '/admin-portal', label: 'Dashboard', icon: 'LayoutDashboard', requires: P.DASHBOARD, end: true },
      { to: '/admin-portal/applications', label: 'Applications', icon: 'Inbox', requires: P.APPLICATIONS_VIEW, badge: 'applications' },
      { to: '/admin-portal/events', label: 'Events', icon: 'CalendarDays', requires: P.EVENTS_ALL },
      { to: '/admin-portal/my-events', label: 'My Events', icon: 'CalendarDays', requires: P.EVENTS_ASSIGNED, hideIf: P.EVENTS_ALL },
      { to: '/admin-portal/bookings', label: 'Bookings & Payments', icon: 'Ticket', requires: P.BOOKINGS_ALL },
      { to: '/admin-portal/invoices', label: 'Partner Invoices', icon: 'Receipt', requires: [P.PAYMENTS, P.BOOKINGS_MANAGE] },
      { to: '/admin-portal/attendees', label: 'Attendees', icon: 'Users', anyOf: [P.ATTENDEES_ALL, P.ATTENDEES_ASSIGNED] },
      { to: '/check-in', label: 'QR Check-in', icon: 'ScanLine', requires: P.CHECKIN, external: true },
      { to: '/admin-portal/check-ins', label: 'Check-in History', icon: 'History', requires: P.CHECKIN_HISTORY },
      { to: '/admin-portal/tasks', label: 'Event Tasks', icon: 'ListChecks', anyOf: [P.TASKS_OWN, P.TEAM] },
    ],
  },
  {
    group: 'People',
    items: [
      { to: '/admin-portal/people/artists', label: 'Artists', icon: 'Mic', requires: P.ENTITIES },
      { to: '/admin-portal/people/sponsors', label: 'Sponsors', icon: 'Handshake', requires: P.ENTITIES },
      { to: '/admin-portal/people/vendors', label: 'Vendors', icon: 'Store', requires: P.ENTITIES },
      { to: '/admin-portal/people/venue-hosts', label: 'Venue Hosts', icon: 'Building2', requires: P.ENTITIES },
      { to: '/admin-portal/people/venues', label: 'Venues', icon: 'MapPin', requires: P.ENTITIES },
      { to: '/admin-portal/people/crew', label: 'Crew', icon: 'Contact', requires: P.ENTITIES },
      { to: '/admin-portal/reviews', label: 'Media & Asset Reviews', icon: 'Image', requires: P.ENTITIES },
      { to: '/admin-portal/volunteers', label: 'Volunteers', icon: 'HeartHandshake', requires: P.VOLUNTEERS },
      { to: '/admin-portal/team', label: 'Team', icon: 'UsersRound', requires: P.TEAM },
      { to: '/admin-portal/users', label: 'Users & Roles', icon: 'ShieldCheck', requires: P.USERS_MANAGE },
      { to: '/admin-portal/roles', label: 'Roles & Permissions', icon: 'KeyRound', requires: P.ROLES },
    ],
  },
  {
    group: 'Communicate',
    items: [
      { to: '/admin-portal/messages', label: 'Messages', icon: 'MessagesSquare', requires: P.MESSAGES, badge: 'messages' },
      { to: '/admin-portal/content', label: 'Content', icon: 'Megaphone', anyOf: [P.CONTENT, P.CONTENT_VIEW] },
      { to: '/admin-portal/announcements', label: 'Announcements', icon: 'Megaphone', requires: P.ANNOUNCEMENTS_VIEW, hideIf: P.CONTENT },
      { to: '/admin-portal/event-info', label: 'Event Info', icon: 'Info', requires: P.EVENTS_ASSIGNED, hideIf: P.EVENTS_ALL },
    ],
  },
  {
    group: 'Insight',
    items: [
      { to: '/admin-portal/reports', label: 'Reports', icon: 'BarChart3', requires: P.REPORTS },
      { to: '/admin-portal/audit', label: 'Audit Logs', icon: 'ScrollText', requires: P.AUDIT },
    ],
  },
  {
    group: 'System',
    items: [
      { to: '/admin-portal/settings', label: 'System Settings', icon: 'Settings', requires: P.SETTINGS },
      { to: '/admin-portal/ai', label: 'Tangy AI', icon: 'Sparkles', requires: P.AI },
    ],
  },
  {
    group: 'More operations',
    collapsible: true,
    items: [
      { to: '/admin-portal/ops/inbox', label: 'Website support inbox', icon: 'Inbox', requires: P.OPERATIONS },
      { to: '/admin-portal/ops/enquiries', label: 'Private enquiries', icon: 'Mail', requires: P.OPERATIONS },
      { to: '/admin-portal/ops/contact', label: 'Contact messages', icon: 'Mail', requires: P.OPERATIONS },
      { to: '/admin-portal/ops/waitlist', label: 'Waitlist', icon: 'Hourglass', requires: P.OPERATIONS },
      { to: '/admin-portal/ops/notifications', label: 'Email delivery', icon: 'BellRing', requires: P.OPERATIONS },
      { to: '/admin-portal/ops/portals', label: 'View portals', icon: 'DoorOpen', requires: P.OPERATIONS },
    ],
  },
];

export function buildNav(perms) {
  const set = new Set(perms || []);
  return NAV.map((g) => ({
    ...g,
    items: g.items.filter((item) => allowed(set, item) && !(item.hideIf && set.has(item.hideIf))),
  })).filter((g) => g.items.length > 0);
}

// Which dashboard a console user lands on. Derived from permissions (not the
// raw role string) so the matrix in the DB stays authoritative.
export function dashboardKind(perms) {
  const set = new Set(perms || []);
  if (set.has(P.AUDIT) && set.has(P.SETTINGS)) return 'super_admin';
  if (set.has(P.EVENTS_ALL)) return 'admin';
  if (set.has(P.DASHBOARD)) return 'staff';
  return null;
}

// Legacy /admin?tab=<id> links (from the previous single-page control room).
export const LEGACY_TAB_ROUTES = {
  overview: '/admin-portal',
  events: '/admin-portal/events',
  bookings: '/admin-portal/bookings',
  attendees: '/admin-portal/attendees',
  artists: '/admin-portal/people/artists',
  messages: '/admin-portal/messages',
  volunteers: '/admin-portal/volunteers',
  users: '/admin-portal/users',
  crew: '/admin-portal/applications?type=crew',
  collab: '/admin-portal/applications',
  private: '/admin-portal/ops/enquiries',
  contact: '/admin-portal/ops/contact',
  waitlist: '/admin-portal/ops/waitlist',
  inbox: '/admin-portal/ops/inbox',
  notifications: '/admin-portal/ops/notifications',
  payments: '/admin-portal/bookings?tab=payments',
  announcements: '/admin-portal/content',
  tv: '/admin-portal/content?tab=tv',
  settings: '/admin-portal/settings',
  portals: '/admin-portal/ops/portals',
};

// Ticket types and prices are per event in event_ticket_types (0026) and are
// priced by booking_quote() on the server. These are only display-name
// fallbacks for the codes older bookings/tickets carry.
export const TICKET_TIERS = [
  { id: 'gen', name: 'General Admission' },
  { id: 'vip', name: 'VIP Heritage Pass' },
  { id: 'premium', name: 'Backstage Collective Pass' },
];

export const EVENT_STATUSES = ['draft', 'on-sale', 'sold-out', 'past', 'cancelled'];
export const EVENT_STATUS_LABELS = {
  draft: 'Draft',
  'on-sale': 'Published · On sale',
  'sold-out': 'Published · Sold out',
  past: 'Completed',
  cancelled: 'Cancelled',
};

// Lifecycle phase is derived from the date — never stored — so it can't drift.
export function localISODate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function eventPhase(evt, today = new Date()) {
  if (!evt) return null;
  if (evt.status === 'cancelled') return 'cancelled';
  if (evt.status === 'draft') return 'draft';
  const iso = localISODate(today);
  if (evt.event_date > iso) return 'upcoming';
  if (evt.event_date === iso) return 'live';
  return 'completed';
}
