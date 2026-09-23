import { Link } from 'react-router-dom';

// "VIEW PORTALS" — lets an admin/super_admin inspect any real portal
// experience without impersonating another auth.uid() or changing
// profiles.role. Patron/Crew/Volunteer/Vendor/Sponsor/Venue/Artist route to
// an entity selector first (there's no single "the vendor portal" — each
// account is its own record); Private Sessions has no per-account portal of
// its own, so it opens the existing Enquiries tab instead of a duplicate
// screen (see onNavigate below).
const PORTALS = [
  { role: 'patron', icon: '🎟', label: 'Patron' },
  { role: 'artist', icon: '🎸', label: 'Artist' },
  { role: 'crew', icon: '🎬', label: 'Crew' },
  { role: 'volunteer', icon: '🙋', label: 'Volunteer' },
  { role: 'vendor', icon: '🛍', label: 'Vendor' },
  { role: 'sponsor', icon: '🤝', label: 'Sponsor' },
  { role: 'venue', icon: '🏛', label: 'Venue' },
];

// `basePath` lets the demo-admin build (src/pages/demoAdmin/DemoControlRoom.jsx)
// reuse this exact component pointed at /demo-admin/preview/* instead of the
// real /admin/preview/* — same UI, different (demo-gated) destination.
export const PortalsSection = ({ onNavigate, basePath = '/admin/preview' }) => (
  <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
    <h3 className="text-lg font-bold text-[#C99A2E] mb-1 border-b border-[#C99A2E]/30 pb-2">VIEW PORTALS</h3>
    <p className="text-[10px] text-[#E7D5A4]/50 uppercase font-bold mt-3 mb-4">
      Inspect any real portal as it appears to that account — read-only, using your own admin session.
    </p>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {PORTALS.map((p) => (
        <Link
          key={p.role}
          to={`${basePath}/${p.role}`}
          className="flex flex-col items-center gap-2 bg-[#11100C] border border-[#C99A2E]/30 hover:border-[#C99A2E] hover:bg-[#C99A2E]/5 px-4 py-6 text-center transition-colors"
        >
          <span className="text-2xl">{p.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">{p.label}</span>
        </Link>
      ))}

      <button
        onClick={() => onNavigate?.('private')}
        className="flex flex-col items-center gap-2 bg-[#11100C] border border-[#C99A2E]/30 hover:border-[#C99A2E] hover:bg-[#C99A2E]/5 px-4 py-6 text-center transition-colors"
      >
        <span className="text-2xl">✦</span>
        <span className="text-[10px] font-bold uppercase tracking-wider">Private Sessions</span>
      </button>
    </div>

    <p className="text-[9px] text-[#E7D5A4]/40 mt-5 leading-relaxed">
      Every preview is read-only. Sending messages, saving profile edits, and responding to assignments are disabled while
      inspecting another account — your own admin identity (and role) never changes.
    </p>
  </div>
);
