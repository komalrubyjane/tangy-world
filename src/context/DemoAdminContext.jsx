import { createContext, useContext, useState } from 'react';
import { DEMO_ADMIN_ENABLED } from '../config/demoAdmin';

// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
//
// Completely isolated from Supabase Auth: no supabase.auth.* call anywhere
// in this file, no auth.uid(), no profiles.role, no session token. State is
// a single in-memory boolean (deliberately NOT persisted to localStorage or
// sessionStorage — a page refresh exits demo mode by design, so there is
// never a client-side-persisted "I am an admin" artifact sitting around).
//
// There is no password check here. A VITE_ build flag can only ever be a
// public feature toggle (it's compiled into the JS bundle for anyone to
// read), so gating "enter demo mode" behind a client-checked password would
// be theater, not security — the real security boundary is that demo mode
// grants NOTHING beyond what RLS already lets an anonymous/no-session
// caller see, which is nothing privileged. See DemoAdminGate.jsx.
const DemoAdminContext = createContext(null);

export const DemoAdminProvider = ({ children }) => {
  const [isDemoAdmin, setIsDemoAdmin] = useState(false);

  const enterDemo = () => {
    if (!DEMO_ADMIN_ENABLED) return false; // defense in depth — never activates if the flag is off
    setIsDemoAdmin(true);
    return true;
  };

  // Clears ONLY the demo flag. Must never touch supabase.auth — a real
  // signed-in user browsing alongside/after a demo session must be
  // completely unaffected.
  const exitDemo = () => setIsDemoAdmin(false);

  return (
    <DemoAdminContext.Provider value={{ isDemoAdmin: DEMO_ADMIN_ENABLED && isDemoAdmin, enterDemo, exitDemo, demoAdminEnabled: DEMO_ADMIN_ENABLED }}>
      {children}
    </DemoAdminContext.Provider>
  );
};

export const useDemoAdmin = () => {
  const ctx = useContext(DemoAdminContext);
  if (!ctx) throw new Error('useDemoAdmin must be used within DemoAdminProvider');
  return ctx;
};
