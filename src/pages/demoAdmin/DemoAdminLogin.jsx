import { useNavigate } from 'react-router-dom';
import { useDemoAdmin } from '../../context/DemoAdminContext';

// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
//
// Deliberately has NO password field. A VITE_ build flag is a public
// toggle, not a secret (see DemoAdminContext.jsx) — a client-checked
// password here would only be able to compare against a value that's
// sitting in the bundle for anyone to read, which is not real
// authentication, just the appearance of it. The actual security property
// is: demo mode never reaches real data (RLS grants a caller with no
// Supabase session nothing), so there is nothing here worth "protecting"
// with a fake password check.
export const DemoAdminLogin = () => {
  const navigate = useNavigate();
  const { enterDemo, demoAdminEnabled } = useDemoAdmin();

  const handleEnter = () => {
    if (enterDemo()) navigate('/demo-admin/control-room');
  };

  return (
    <div className="min-h-screen bg-[#11100C] flex items-center justify-center p-4 text-[#E7D5A4] font-mono">
      <div
        className="w-full max-w-md bg-[#191410] border-2 border-[#C99A2E] p-8 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative"
        style={{ backgroundImage: "url('/noise.png')", backgroundBlendMode: 'multiply', backgroundSize: '180px' }}
      >
        <div className="absolute -top-3 left-1/3 w-24 h-5 bg-[rgba(201,154,46,0.4)] rotate-[-2deg] border border-[#C99A2E]/50 pointer-events-none" />

        <div className="text-center border-b border-[#C99A2E]/30 pb-4 mb-6">
          <div className="text-[9px] font-bold tracking-[0.3em] text-[#C99A2E] uppercase mb-1">[ ✦ ] TEAM DEMO</div>
          <h1 className="font-condensed text-3xl font-bold text-[#E7D5A4] tracking-tight">DEMO ADMIN</h1>
          <p className="font-serif italic text-xs text-[#E7D5A4]/70 mt-1">Internal team preview access — not a real account</p>
        </div>

        {!demoAdminEnabled ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-xs text-[#E7D5A4]/80">Demo mode is not enabled in this build.</p>
            <button onClick={() => navigate('/admin')} className="w-full bg-[#C99A2E] text-[#11100C] hover:bg-[#E7D5A4] font-bold uppercase tracking-widest py-3 border border-[#11100C]">
              GO TO REAL SIGN IN →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-[10px] text-[#E7D5A4]/70 bg-[#11100C] border border-[#C99A2E]/30 p-3 leading-relaxed">
              This is a <span className="text-[#C99A2E] font-bold">development-only</span> preview session. It does not create a
              Supabase user, does not change any real account's role, and cannot read or write real production data — every
              action you take here is either read-only or a no-op against the real database.
            </div>

            <button
              onClick={handleEnter}
              className="w-full bg-[#C99A2E] text-[#11100C] hover:bg-[#E7D5A4] font-mono text-xs font-bold uppercase tracking-widest py-3 border border-[#11100C] transition-colors shadow-[4px_4px_0px_#11100C] active:scale-95"
            >
              ENTER DEMO ADMIN →
            </button>

            <button type="button" onClick={() => navigate('/')} className="text-center text-[10px] text-[#E7D5A4]/50 underline">
              ← Back to site
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-[9px] text-[#E7D5A4]/40 border-t border-[#C99A2E]/20 pt-4">
          PROPERTY OF TANGY SESSIONS · HYDERABAD · TEMPORARY DEMO BUILD
        </div>
      </div>
    </div>
  );
};
