import { Link } from 'react-router-dom';
import { useDemoAdmin } from '../../context/DemoAdminContext';

// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
//
// The demo-mode equivalent of StaffAuthGate.jsx — but checks
// DemoAdminContext, never Supabase. If the build flag is off OR the visitor
// hasn't explicitly entered demo mode, this renders a message and a way
// back to REAL authentication — it never silently grants access, and it
// never redirects into a real, privileged surface on its own.
export const DemoAdminGate = ({ children }) => {
  const { isDemoAdmin, demoAdminEnabled } = useDemoAdmin();

  if (isDemoAdmin) return children;

  return (
    <div className="min-h-screen bg-[#11100C] flex items-center justify-center p-4 text-[#E7D5A4] font-mono">
      <div className="w-full max-w-md bg-[#191410] border-2 border-[#C99A2E] p-8 rounded-sm text-center flex flex-col gap-4">
        <div className="text-[9px] font-bold tracking-[0.3em] text-[#C99A2E] uppercase">[ ✦ ] TEAM DEMO</div>
        <h1 className="font-condensed text-2xl font-bold">
          {demoAdminEnabled ? 'DEMO MODE NOT ACTIVE' : 'DEMO MODE IS DISABLED'}
        </h1>
        <p className="text-xs text-[#E7D5A4]/70">
          {demoAdminEnabled
            ? "You haven't entered Demo Admin mode yet."
            : 'This build does not have team demo access enabled.'}
        </p>
        {demoAdminEnabled ? (
          <Link to="/demo-admin" className="bg-[#C99A2E] text-[#11100C] hover:bg-[#E7D5A4] font-bold uppercase tracking-widest py-3 border border-[#11100C]">
            GO TO DEMO ENTRY →
          </Link>
        ) : (
          <Link to="/admin" className="bg-[#C99A2E] text-[#11100C] hover:bg-[#E7D5A4] font-bold uppercase tracking-widest py-3 border border-[#11100C]">
            SIGN IN AS ADMIN →
          </Link>
        )}
      </div>
    </div>
  );
};
