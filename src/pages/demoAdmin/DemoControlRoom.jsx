import { DemoAdminGate } from './DemoAdminGate';
import { DemoModeBanner } from './DemoModeBanner';
import { DemoControlRoomShell } from './DemoControlRoomShell';

// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
//
// Renders DemoControlRoomShell, NOT the real AdminDashboard (Phase 2's
// Control Room). Earlier this reused AdminDashboard directly — safe (RLS
// still blocks every read, since a demo session has no real Supabase auth
// token) but every section rendered empty, because there's no seed data in
// the real database yet. The user asked for demo data everywhere instead
// of empty states, so every section here is one of the fabricated
// Demo*Section components (DemoAdminSections.jsx) backed by demoAdminData.js
// — zero Supabase calls, entirely in-memory, clearly labeled "(DEMO)".
//
// "VIEW PORTALS" still points at /demo/* (a synthetic demo profile per
// role, no entity picker — see DemoRoleDashboard.jsx) instead of the real
// /admin/preview/* (StaffAuthGate-gated, unreachable from a demo session).
export const DemoControlRoom = () => (
  <DemoAdminGate>
    <DemoModeBanner />
    <DemoControlRoomShell />
  </DemoAdminGate>
);
