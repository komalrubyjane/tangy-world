/* global __TANGY_DEV_TOOLS__ */
// DEVELOPMENT-ONLY mock sign-in for the admin console.
//
// Enabled only when BOTH hold, and both are fixed at build time:
//   • import.meta.env.DEV      — false in every `vite build`
//   • __TANGY_DEV_TOOLS__      — defined by vite.config.js as true only for
//                                `vite` (serve); false for any build/preview
// In a production bundle this whole module is dead code and is dropped: the
// identities, the permission mirror and the switcher never ship. Nothing here
// touches the real auth flow — it only supplies an identity + role to the
// same permission system (rbac.js → AdminSession → nav/guards/pages).
import { useSyncExternalStore } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

// Callers inline `import.meta.env.DEV && __TANGY_DEV_TOOLS__` themselves (not
// this export) so the bundler folds it to `false` at each use site.
export const DEV_MOCK_ENABLED = import.meta.env.DEV && __TANGY_DEV_TOOLS__;

export const MOCK_IDENTITIES = {
  super_admin: { role: 'super_admin', full_name: 'Tangy Super Admin', email: 'superadmin@tangy.local', label: 'Super Admin' },
  admin: { role: 'admin', full_name: 'Tangy Admin', email: 'admin@tangy.local', label: 'Admin / Manager' },
  staff: { role: 'staff', full_name: 'Tangy Staff', email: 'staff@tangy.local', label: 'Staff' },
};

// External portals need a real (local) session — their data is RLS-scoped to
// the signed-in account — so they're only offered with a local Supabase stack.
export const PORTAL_IDENTITIES = {
  artist: { role: 'artist', full_name: 'Tangy Artist', email: 'artist@tangy.local', label: 'Artist', tagline: 'Performances, schedule, messages', path: '/artist/dashboard' },
  sponsor: { role: 'sponsor', full_name: 'Tangy Sponsor', email: 'sponsor@tangy.local', label: 'Sponsor', tagline: 'Sponsorship, deliverables, messages', path: '/sponsor/dashboard' },
  vendor: { role: 'vendor', full_name: 'Tangy Vendor', email: 'vendor@tangy.local', label: 'Vendor', tagline: 'Assigned events, instructions', path: '/vendor/dashboard' },
  venue: { role: 'venue', full_name: 'Tangy Venue Host', email: 'venue@tangy.local', label: 'Venue Host', tagline: 'Hosted events, setup, access', path: '/venue/dashboard' },
  volunteer: { role: 'volunteer', full_name: 'Tangy Volunteer', email: 'volunteer@tangy.local', label: 'Volunteer', tagline: 'Events, notices, check-in access', path: '/volunteer/dashboard' },
};

// Mirror of role_permissions (0017_admin_system.sql + 0018_operations_platform.sql).
// Used only when there is no real session (mock-only mode). With a local
// Supabase stack, permissions come from my_permissions() like production.
const STAFF = ['dashboard.view', 'events.view_assigned', 'attendees.view_assigned', 'checkin.perform', 'checkin.history', 'announcements.view', 'tasks.view_own'];
const ADMIN = [
  'dashboard.view', 'applications.view', 'applications.review', 'events.view_all', 'events.manage',
  'bookings.view_all', 'bookings.manage', 'payments.view', 'attendees.view_all', 'checkin.perform', 'checkin.history',
  'content.manage', 'announcements.view', 'team.manage', 'entities.manage', 'users.view', 'reports.view', 'operations.manage',
  'messages.manage', 'volunteers.manage', 'access.grant',
  'content.view', 'content.create', 'content.edit', 'content.publish', 'content.delete',
  'content.manage_tv', 'content.manage_diary', 'content.manage_media', 'content.manage_sessions',
];
export const MOCK_ROLE_PERMISSIONS = {
  staff: STAFF,
  admin: ADMIN,
  super_admin: [...new Set([...ADMIN, ...STAFF, 'users.manage', 'roles.manage', 'audit.view', 'settings.manage', 'ai.use'])],
};

export const mockUser = (role) => {
  const m = MOCK_IDENTITIES[role];
  return m && { id: `dev-mock-${role}`, email: m.email, full_name: m.full_name, role: m.role, is_active: true, devMock: true };
};

// ---- selected role (localStorage, dev only) ----
const KEY = 'tangy_dev_mock_role';
const listeners = new Set();
const read = () => {
  try { const r = localStorage.getItem(KEY); return MOCK_IDENTITIES[r] || PORTAL_IDENTITIES[r] ? r : null; } catch { return null; }
};
const write = (role) => {
  try { if (role) localStorage.setItem(KEY, role); else localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  listeners.forEach((l) => l());
};
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const useDevRoleImpl = () => useSyncExternalStore(subscribe, read, () => null);
export const useDevRole = DEV_MOCK_ENABLED ? useDevRoleImpl : () => null;

// Switches identity. Always drops any existing Supabase session first so a
// real account never lingers behind a mock one. Then asks the Vite dev
// server for a real session on a LOCAL Supabase stack (see vite.config.js);
// if that's unavailable the console runs in mock-only mode.
export async function switchDevRole(role) {
  if (!DEV_MOCK_ENABLED) return { mode: 'disabled' };
  if (isSupabaseConfigured) await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  // Role is recorded only after the session attempt, so the console never
  // briefly renders as a mock identity while a local session is on its way.
  const result = role ? await startLocalSession(role) : { mode: 'none' };
  write(role);
  return result;
}

async function startLocalSession(role) {
  if (!isSupabaseConfigured) return { mode: 'mock', reason: 'Supabase is not configured' };
  try {
    const res = await fetch('/__dev/mock-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.token_hash) return { mode: 'mock', reason: body.reason || `dev server said ${res.status}` };
    const { error } = await supabase.auth.verifyOtp({ token_hash: body.token_hash, type: 'magiclink' });
    if (error) return { mode: 'mock', reason: error.message };
    return { mode: 'local' };
  } catch (err) {
    return { mode: 'mock', reason: err.message };
  }
}

export const clearDevRole = () => { if (DEV_MOCK_ENABLED) write(null); };

// Which backend the dev build talks to (display + the local-session decision
// is re-checked by the dev server, which refuses anything but localhost).
export function devBackend() {
  try {
    const host = new URL(import.meta.env.VITE_SUPABASE_URL).hostname;
    return { host, local: ['127.0.0.1', 'localhost', '::1'].includes(host) };
  } catch {
    return { host: null, local: false };
  }
}

export const isDevIdentity = (user) => !!user && [...Object.values(MOCK_IDENTITIES), ...Object.values(PORTAL_IDENTITIES)].some((m) => m.email === user.email);
