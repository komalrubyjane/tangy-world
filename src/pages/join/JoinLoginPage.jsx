import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useUserAuth } from '../../context/UserAuthContext';
import { EmailOtpAuth } from '../../components/auth/EmailOtpAuth';
// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
import { DEMO_ADMIN_ENABLED } from '../../config/demoAdmin';

// Universal sign-in for every role (not just Guest/User) — a pending or
// approved sponsor/vendor/venue/crew/volunteer account returning later
// lands here too (ProtectedRoute redirects any logged-out visit to a
// protected route here). DashboardRedirect reads the authoritative role
// once signed in — this page never asks them to pick a role again.
export const JoinLoginPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useUserAuth();

  useEffect(() => {
    if (isLoggedIn) navigate('/dashboard');
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono overflow-x-hidden">
      <Navbar />
      <section className="pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
        <div className="bg-[#EFE2C0] paperTexture text-[#11100C] border-4 border-[#11100C] p-6 sm:p-10 shadow-[10px_10px_0px_#11100C]">
          <span className="font-mono text-[9px] font-bold text-[#B94717] uppercase tracking-widest">TANGY PROFILE // SIGN IN</span>
          <h1 className="font-condensed text-2xl font-bold uppercase mb-6 mt-1">WELCOME BACK</h1>

          <EmailOtpAuth onVerified={() => navigate('/dashboard')} />
        </div>

        <div className="bg-[#181614] border-2 border-[#C99A2E] p-5 sm:p-6 shadow-[8px_8px_0px_#11100C]">
          <span className="font-mono text-[9px] font-bold text-[#B94717] uppercase tracking-widest block">OTHER TANGY LOGINS</span>
          <h2 className="font-condensed text-lg font-bold uppercase mt-1 mb-1">NOT A PATRON ACCOUNT?</h2>
          <p className="font-mono text-[10px] text-[#E7D5A4]/60 mb-4 leading-relaxed">
            Artists and Tangy staff sign in through their own dedicated portals.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate('/artist/login')}
              className="text-left border border-[#C99A2E]/50 hover:border-[#C99A2E] bg-[#11100C] hover:bg-[#C99A2E]/10 p-3 flex items-center justify-between gap-3 transition-colors"
            >
              <div>
                <div className="font-mono text-[10px] font-bold uppercase text-[#C99A2E]">Artist Portal</div>
                <div className="font-mono text-[10px] text-[#E7D5A4]/70">Approved artists sign in here.</div>
              </div>
              <span className="shrink-0 px-2 py-1 border border-[#C99A2E]/60 text-[9px] font-bold uppercase tracking-wider text-[#E7D5A4]">→</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="text-left border border-[#C99A2E]/50 hover:border-[#C99A2E] bg-[#11100C] hover:bg-[#C99A2E]/10 p-3 flex items-center justify-between gap-3 transition-colors"
            >
              <div>
                <div className="font-mono text-[10px] font-bold uppercase text-[#C99A2E]">Staff / Admin</div>
                <div className="font-mono text-[10px] text-[#E7D5A4]/70">Tangy team console.</div>
              </div>
              <span className="shrink-0 px-2 py-1 border border-[#C99A2E]/60 text-[9px] font-bold uppercase tracking-wider text-[#E7D5A4]">→</span>
            </button>

            {/* DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note. */}
            {DEMO_ADMIN_ENABLED && (
              <button
                type="button"
                onClick={() => navigate('/demo/patron')}
                className="text-left border border-dashed border-[#E7D5A4]/40 hover:border-[#E7D5A4] bg-[#11100C] hover:bg-[#E7D5A4]/5 p-3 flex items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase text-[#E7D5A4]/70">Team Demo</div>
                  <div className="font-mono text-[10px] text-[#E7D5A4]/50">Internal preview — not a real account.</div>
                </div>
                <span className="shrink-0 px-2 py-1 border border-[#E7D5A4]/40 text-[9px] font-bold uppercase tracking-wider text-[#E7D5A4]/70">→</span>
              </button>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};
