// Single global switch for which backend the app's data surfaces use.
// The mock account system (MockAuthContext/mockAuthService) has been
// removed — UserAuthContext and artist AuthContext are Supabase-Auth-only
// now. `isMockAuth` is kept only because many admin sections and public
// application forms still branch on it to choose between a real Supabase
// query and their still-mock local data (src/data/mock/*, src/services/*
// mock services) — that migration is tracked separately (admin control
// room rebuild). Once every one of those call sites is real, delete this
// flag entirely along with AUTH_MODE.
export const AUTH_MODE = 'real';

export const isMockAuth = false;
