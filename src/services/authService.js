// MOCK service — part of the new mock account/dashboard/AI system.
// Not connected to Supabase. Swap the internals for real calls later
// without changing any component that imports this file.
const SESSION_KEY = 'tangy_mock_v2_session';
const ROLE_STORE_KEY = 'tangy_mock_v2_role_accounts';

function loadRoleAccounts() {
  try {
    const raw = localStorage.getItem(ROLE_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRoleAccounts(accounts) {
  localStorage.setItem(ROLE_STORE_KEY, JSON.stringify(accounts));
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

export const authService = {
  getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  signUp({ fullName, email, password, role }) {
    if (!ROLE_META[role]) return { success: false, error: 'Choose a valid account type.' };
    if (!fullName || !email || !password) return { success: false, error: 'All fields are required.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

    const accounts = loadRoleAccounts();
    if (accounts[email.toLowerCase()]) {
      return { success: false, error: 'An account already exists for this email.' };
    }
    const account = {
      id: `mock-${role}-${Date.now()}`,
      fullName,
      email,
      role,
      createdAt: new Date().toISOString(),
      applicationStatus: role === 'patron' ? null : 'pending',
    };
    accounts[email.toLowerCase()] = { ...account, password }; // mock-only, never do this with real passwords
    saveRoleAccounts(accounts);

    const session = { ...account };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, user: session };
  },

  signIn({ email, password }) {
    const accounts = loadRoleAccounts();
    const record = accounts[email.toLowerCase()];
    if (!record || record.password !== password) {
      return { success: false, error: 'Invalid email or password.' };
    }
    const { password: _pw, ...session } = record;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, user: session };
  },

  signOut() {
    localStorage.removeItem(SESSION_KEY);
  },

  seedDemoUser(role) {
    // convenience for previewing dashboards without a full signup
    const demo = { id: `demo-${role}`, fullName: `Demo ${ROLE_META[role]?.label || role}`, email: `demo-${role}@tangy.demo`, role, createdAt: new Date().toISOString(), applicationStatus: role === 'patron' ? null : 'approved' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(demo));
    return demo;
  },
};
