// Single global switch for which backend the app's authentication surfaces
// use. Every real-auth context (UserAuthContext, artist AuthContext,
// StaffAuthGate) branches on this constant to decide between the mock
// service (src/services/mockAuthService.js) and their existing Supabase
// logic. Change ONLY this value to flip the whole app between modes —
// never hardcode a mode check anywhere else.
//
//   'mock' -> MockAuthService -> localStorage      -> role dashboard
//   'real' -> Supabase Auth   -> database          -> role dashboard
export const AUTH_MODE = 'mock';

export const isMockAuth = AUTH_MODE === 'mock';
