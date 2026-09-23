// DEMO-ONLY CODE — safe to delete entirely (this file + src/context/
// DemoAdminContext.jsx + src/pages/demoAdmin/*) once the real temporary
// team admin account (see supabase/README.md § "Temporary team demo admin")
// is provisioned, or before production, whichever comes first.
//
// A single explicit build-time flag gates the whole feature. It is NOT a
// credential — VITE_ variables are bundled into the browser and readable by
// anyone, so this can only ever be a feature toggle, never a secret. No
// password lives here or anywhere else in the frontend; Demo Admin mode has
// no password at all (see DemoAdminContext.jsx for why).
//
// Defaults OFF. A production build must never set this to 'true'.
export const DEMO_ADMIN_ENABLED = import.meta.env.VITE_DEMO_ADMIN_ENABLED === 'true';
