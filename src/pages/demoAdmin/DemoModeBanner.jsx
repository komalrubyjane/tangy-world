import { useNavigate } from 'react-router-dom';
import { useDemoAdmin } from '../../context/DemoAdminContext';

// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
//
// Persistent on every /demo-admin/* screen. "EXIT DEMO" clears ONLY the
// demo flag (useDemoAdmin().exitDemo()) — it never calls
// supabase.auth.signOut(), so a real Supabase session (if any exists in the
// same browser) is completely unaffected either way.
export const DemoModeBanner = () => {
  const { exitDemo } = useDemoAdmin();
  const navigate = useNavigate();

  const handleExit = () => {
    exitDemo();
    navigate('/');
  };

  return (
    <div className="sticky top-0 z-[500] bg-[#8B2E00] text-[#E7D5A4] border-b-2 border-[#11100C]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E7D5A4] animate-pulse shrink-0" />
          <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
            DEMO ADMIN MODE · TEAM PREVIEW — no real account, no database changes
          </span>
        </div>
        <button
          onClick={handleExit}
          className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-[#E7D5A4]/60 px-2.5 py-1 hover:bg-[#E7D5A4] hover:text-[#8B2E00] transition-colors"
        >
          EXIT DEMO
        </button>
      </div>
    </div>
  );
};
