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
  CONTENT: 'content.manage',
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
      { to: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', requires: P.DASHBOARD, end: true },
      { to: '/admin/applications', label: 'Applications', icon: 'Inbox', requires: P.APPLICATIONS_VIEW, badge: 'applications' },
      { to: '/admin/events', label: 'Events', icon: 'CalendarDays', requires: P.EVENTS_ALL },
      { to: '/admin/my-events', label: 'My Events', icon: 'CalendarDays', requires: P.EVENTS_ASSIGNED, hideIf: P.EVENTS_ALL },
      { to: '/admin/bookings', label: 'Bookings & Payments', icon: 'Ticket', requires: P.BOOKINGS_ALL },
      { to: '/admin/attendees', label: 'Attendees', icon: 'Users', anyOf: [P.ATTENDEES_ALL, P.ATTENDEES_ASSIGNED] },
      { to: '/check-in', label: 'QR Check-in', icon: 'ScanLine', requires: P.CHECKIN, external: true },
      { to: '/admin/check-ins', label: 'Check-in History', icon: 'History', requires: P.CHECKIN_HISTORY },
      { to: '/admin/tasks', label: 'Event Tasks', icon: 'ListChecks', anyOf: [P.TASKS_OWN, P.TEAM] },
    ],
  },
  {
    group: 'People',
    items: [
      { to: '/admin/people/artists', label: 'Artists', icon: 'Mic', requires: P.ENTITIES },
      { to: '/admin/people/sponsors', label: 'Sponsors', icon: 'Handshake', requires: P.ENTITIES },
      { to: '/admin/people/vendors', label: 'Vendors', icon: 'Store', requires: P.ENTITIES },
      { to: '/admin/people/venue-hosts', label: 'Venue Hosts', icon: 'Building2', requires: P.ENTITIES },
      { to: '/admin/people/venues', label: 'Venues', icon: 'MapPin', requires: P.ENTITIES },
      { to: '/admin/people/crew', label: 'Crew', icon: 'Contact', requires: P.ENTITIES },
      { to: '/admin/volunteers', label: 'Volunteers', icon: 'HeartHandshake', requires: P.VOLUNTEERS },
      { to: '/admin/team', label: 'Team', icon: 'UsersRound', requires: P.TEAM },
      { to: '/admin/users', label: 'Users & Roles', icon: 'ShieldCheck', requires: P.USERS_MANAGE },
      { to: '/admin/roles', label: 'Roles & Permissions', icon: 'KeyRound', requires: P.ROLES },
    ],
  },
  {
    group: 'Communicate',
    items: [
      { to: '/admin/messages', label: 'Messages', icon: 'MessagesSquare', requires: P.MESSAGES, badge: 'messages' },
      { to: '/admin/content', label: 'Announcements', icon: 'Megaphone', requires: P.CONTENT },
      { to: '/admin/announcements', label: 'Announcements', icon: 'Megaphone', requires: P.ANNOUNCEMENTS_VIEW, hideIf: P.CONTENT },
      { to: '/admin/event-info', label: 'Event Info', icon: 'Info', requires: P.EVENTS_ASSIGNED, hideIf: P.EVENTS_ALL },
    ],
  },
  {
    group: 'Insight',
    items: [
      { to: '/admin/reports', label: 'Reports', icon: 'BarChart3', requires: P.REPORTS },
      { to: '/admin/audit', label: 'Audit Logs', icon: 'ScrollText', requires: P.AUDIT },
    ],
  },
  {
    group: 'System',
    items: [
      { to: '/admin/settings', label: 'System Settings', icon: 'Settings', requires: P.SETTINGS },
      { to: '/admin/ai', label: 'Tangy AI', icon: 'Sparkles', requires: P.AI },
    ],
  },
  {
    group: 'More operations',
    collapsible: true,
    items: [
      { to: '/admin/ops/inbox', label: 'Website support inbox', icon: 'Inbox', requires: P.OPERATIONS },
      { to: '/admin/ops/enquiries', label: 'Private enquiries', icon: 'Mail', requires: P.OPERATIONS },
      { to: '/admin/ops/contact', label: 'Contact messages', icon: 'Mail', requires: P.OPERATIONS },
      { to: '/admin/ops/waitlist', label: 'Waitlist', icon: 'Hourglass', requires: P.OPERATIONS },
      { to: '/admin/ops/notifications', label: 'Email notifications', icon: 'BellRing', requires: P.OPERATIONS },
      { to: '/admin/ops/portals', label: 'View portals', icon: 'DoorOpen', requires: P.OPERATIONS },
      { to: '/admin/ops/tv', label: 'Tangy TV', icon: 'Tv', requires: P.OPERATIONS },
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
  overview: '/admin',
  events: '/admin/events',
  bookings: '/admin/bookings',
  attendees: '/admin/attendees',
  artists: '/admin/people/artists',
  messages: '/admin/messages',
  volunteers: '/admin/volunteers',
  users: '/admin/users',
  crew: '/admin/applications?type=crew',
  collab: '/admin/applications',
  private: '/admin/ops/enquiries',
  contact: '/admin/ops/contact',
  waitlist: '/admin/ops/waitlist',
  inbox: '/admin/ops/inbox',
  notifications: '/admin/ops/notifications',
  payments: '/admin/bookings?tab=payments',
  announcements: '/admin/content',
  tv: '/admin/ops/tv',
  settings: '/admin/settings',
  portals: '/admin/ops/portals',
};

// Ticket tiers are defined (and priced) server-side in
// supabase/functions/razorpay-create-order — mirrored here for display only.
export const TICKET_TIERS = [
  { id: 'gen', name: 'General Admission', markup: 0 },
  { id: 'vip', name: 'VIP Heritage Pass', markup: 500 },
  { id: 'premium', name: 'Backstage Collective Pass', markup: 1200 },
];
export const TAX_RATE = 0.18;

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
