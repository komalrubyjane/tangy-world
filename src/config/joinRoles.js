// Single source of truth for "HOW ARE YOU JOINING TANGY?" — used by both the
// full /join page (JoinPage.jsx) and the quick-login modal (UserLoginModal.jsx)
// so the two entry points never drift out of sync or duplicate this data.
//
// Selecting a card is ONLY routing/onboarding intent — it never writes
// profiles.role. Guest/User is the only card that authenticates directly
// here; every other role hands off to its own existing login/application
// route, which is where a real account gets created and (for specialized
// roles) a real application gets submitted for admin review. See
// prevent_role_self_escalation in supabase/migrations/0003_role_security.sql
// for the backend guarantee this UI relies on.
//
// Deliberately absent: admin/staff/super_admin — never public-selectable
// (see 0003_role_security.sql + StaffAuthGate).
export const ROLE_CARDS = [
  { key: 'artist', icon: '🎸', label: 'Artist', tagline: 'I want to perform with Tangy.', kind: 'link', to: '/artist/login' },
  { key: 'sponsor', icon: '🤝', label: 'Sponsor', tagline: 'I want to sponsor or collaborate with Tangy.', kind: 'link', to: '/apply/sponsors' },
  { key: 'vendor', icon: '🛍️', label: 'Vendor', tagline: 'I want to participate as a vendor.', kind: 'link', to: '/apply/vendors' },
  { key: 'venue', icon: '🏛️', label: 'Venue / Host', tagline: 'I want to host Tangy experiences.', kind: 'link', to: '/apply/venue-host' },
  { key: 'crew', icon: '🎥', label: 'Crew', tagline: 'I want to work with the Tangy team.', kind: 'link', to: '/crew/apply' },
  { key: 'patron', icon: '🙋', label: 'Guest / User', tagline: 'I want to attend Tangy experiences.', kind: 'signup' },
];

// Secondary paths that already exist in the repo but aren't part of the
// six-role headline selector — kept reachable, just not given equal billing.
export const MORE_WAYS_TO_JOIN = [
  { key: 'volunteer', icon: '🙌', label: 'Volunteer', tagline: 'Contribute to Tangy community activities.', to: '/volunteer/apply' },
  { key: 'private', icon: '💌', label: 'Private Sessions', tagline: 'Create a private Tangy music experience.', to: '/private-sessions' },
  { key: 'collaborator', icon: '🧩', label: 'Collaborator', tagline: 'Work with Tangy on a collaboration.', to: '/collaborate' },
];
