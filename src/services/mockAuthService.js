// Centralized MOCK authentication service — the ONLY place mock auth logic
// lives. Consumed both by the standalone mock account system (MockAuthContext,
// JoinPage, JoinLoginPage, the 9 role dashboards) AND — when AUTH_MODE ===
// 'mock' (see src/config/auth.js) — by the EXISTING real-auth surfaces
// (UserAuthContext/UserLoginModal, artist AuthContext/LoginPage,
// StaffAuthGate) so there is exactly one mock implementation, never three.
//
// Architecture guarantee: this file NEVER imports supabaseClient and NEVER
// calls any supabase.auth.* method. It works fully offline, with zero
// network requests, regardless of whether Supabase is configured, reachable,
// or has any tables at all. Verified by code (no supabase import exists
// below) and confirmed live via network inspection during testing.
//
// The real Supabase-backed contexts (UserAuthContext.jsx, artist
// AuthContext.jsx, StaffAuthGate.jsx) branch on AUTH_MODE to call either
// this file or their own Supabase logic — never both, never mixed.

const SESSION_KEY = 'tangy_mock_session';
const ROLE_STORE_KEY = 'tangy_mock_v2_role_accounts';
const DEV_PASSWORD = 'TangyMock@2026';

// Fired on every session write/clear so the several React contexts that each
// independently read this same localStorage key (UserAuthContext, artist
// AuthContext, MockAuthContext) can react immediately without a page reload
// — e.g. logging in via the /join dev-account panel and client-navigating
// straight to a StaffAuthGate-protected route.
export const MOCK_SESSION_EVENT = 'tangy-mock-session-changed';
function notifySessionChanged() {
  window.dispatchEvent(new Event(MOCK_SESSION_EVENT));
}

export const ROLE_META = {
  patron: { label: 'Attend Sessions', tagline: 'Book tickets, collect stamps, and follow the sessions you love.', dashboard: '/dashboard' },
  artist: { label: 'Artist', tagline: 'Perform, connect, and become part of the Tangy Sessions archive.', dashboard: '/artist-mock/portal' },
  vendor: { label: 'Vendor', tagline: 'Explore opportunities to collaborate with Tangy.', dashboard: '/vendor/dashboard' },
  crew: { label: 'Crew', tagline: 'Join the people behind the sessions.', dashboard: '/crew-mock/dashboard' },
  volunteer: { label: 'Volunteer', tagline: 'Help make every session run — front of house to soundcheck.', dashboard: '/volunteer/dashboard' },
  sponsor: { label: 'Sponsor', tagline: 'Power heritage preservation and artist grants.', dashboard: '/sponsor/dashboard' },
  venue: { label: 'Venue / Host', tagline: 'Open your heritage space to live unamplified music.', dashboard: '/venue/dashboard' },
  private: { label: 'Private / Corporate', tagline: 'Curated Tangy experiences for weddings, offsites, and rituals.', dashboard: '/private/dashboard' },
};

// Deterministic development/demo accounts — always available, regardless of
// localStorage state (even a fresh incognito browser), so documented test
// credentials never fail with "account not found". These sit ONLY in the
// mock system's own role store, entirely separate from ROLE_META (which
// intentionally has no 'admin' entry — the signup role-picker never offers
// it). In mock mode the admin dev account lands on the REAL /admin route
// (StaffAuthGate, made AUTH_MODE-aware) so it exercises the existing admin
// UI, not a separate mock-only console.
const DEV_ACCOUNT_ROLES = { ...ROLE_META, admin: { label: 'Admin (dev only)', tagline: 'Mock development access to the existing admin console — not real production security.', dashboard: '/admin' } };

function buildDevAccounts() {
  const accounts = {};
  for (const role of Object.keys(DEV_ACCOUNT_ROLES)) {
    const email = `${role}@tangysessions.test`;
    accounts[email] = {
      id: `mock-${role}-dev`,
      fullName: `${DEV_ACCOUNT_ROLES[role].label} (Dev)`,
      email,
      password: DEV_PASSWORD,
      role,
      createdAt: '2026-01-01T00:00:00.000Z',
      applicationStatus: role === 'patron' ? null : 'approved',
      isDevAccount: true,
    };
  }
  return accounts;
}

export const DEV_ACCOUNTS = buildDevAccounts();

// Role -> dashboard path, including 'admin' (mock-only; ROLE_META
// intentionally excludes it so the signup role-picker UI never offers it).
export const DASHBOARD_BY_ROLE = Object.fromEntries(
  Object.entries(DEV_ACCOUNT_ROLES).map(([role, meta]) => [role, meta.dashboard])
);

// Handy for the "Development Accounts" preset panel — the real password is
// still DEV_PASSWORD for all of them, this is just for rendering the list.
export const DEV_ACCOUNT_LIST = Object.values(DEV_ACCOUNTS).map((a) => ({
  role: a.role,
  label: DEV_ACCOUNT_ROLES[a.role].label,
  email: a.email,
  password: DEV_PASSWORD,
  dashboard: DEV_ACCOUNT_ROLES[a.role].dashboard,
}));

function loadRoleAccounts() {
  try {
    const raw = localStorage.getItem(ROLE_STORE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    // Dev accounts always win over anything stored under the same email —
    // guarantees the documented credentials never drift or get shadowed.
    return { ...stored, ...DEV_ACCOUNTS };
  } catch {
    return { ...DEV_ACCOUNTS };
  }
}

function saveRoleAccounts(accounts) {
  // Never persist the deterministic dev accounts into localStorage — they're
  // regenerated from code every load, so there's nothing to save for them.
  const toStore = { ...accounts };
  for (const email of Object.keys(DEV_ACCOUNTS)) delete toStore[email];
  localStorage.setItem(ROLE_STORE_KEY, JSON.stringify(toStore));
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const mockAuthService = {
  // ---- Primary API (requested names) ----

  getMockSession() {
    return readSession();
  },

  getCurrentMockUser() {
    return readSession();
  },

  isMockAuthenticated() {
    return !!readSession();
  },

  hasMockRole(role) {
    const session = readSession();
    return !!session && session.role === role;
  },

  mockSignup({ fullName, email, password, role }) {
    if (!DEV_ACCOUNT_ROLES[role]) return { success: false, error: 'Choose a valid account type.' };
    if (!fullName || !email || !password) return { success: false, error: 'All fields are required.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

    const accounts = loadRoleAccounts();
    const key = email.toLowerCase();
    if (accounts[key] && !accounts[key].isDevAccount) {
      return { success: false, error: 'A development account already exists for this email.' };
    }
    const account = {
      id: `mock-${role}-${Date.now()}`,
      fullName,
      email,
      role,
      createdAt: new Date().toISOString(),
      applicationStatus: role === 'patron' ? null : 'pending',
    };
    accounts[key] = { ...account, password };
    saveRoleAccounts(accounts);

    const session = { ...account, isMock: true, authenticated: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    notifySessionChanged();
    return { success: true, user: session };
  },

  mockLogin(email, password) {
    const accounts = loadRoleAccounts();
    const record = accounts[(email || '').toLowerCase()];
    if (!record || record.password !== password) {
      return { success: false, error: 'Invalid development account.' };
    }
    const { password: _pw, ...rest } = record;
    const session = { ...rest, isMock: true, authenticated: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    notifySessionChanged();
    return { success: true, user: session };
  },

  mockLogout() {
    localStorage.removeItem(SESSION_KEY);
    notifySessionChanged();
  },

  seedDemoUser(role) {
    // convenience for previewing dashboards without a full signup
    const demo = { id: `demo-${role}`, fullName: `Demo ${DEV_ACCOUNT_ROLES[role]?.label || role}`, email: `demo-${role}@tangy.demo`, role, createdAt: new Date().toISOString(), applicationStatus: role === 'patron' ? null : 'approved', isMock: true, authenticated: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(demo));
    notifySessionChanged();
    return demo;
  },

  // ---- Back-compat aliases (existing call sites, e.g. MockAuthContext) ----
  getSession() { return this.getMockSession(); },
  signUp(data) { return this.mockSignup(data); },
  signIn({ email, password }) { return this.mockLogin(email, password); },
  signOut() { return this.mockLogout(); },
};
