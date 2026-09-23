import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useUserAuth } from '../../context/UserAuthContext';
import { ROLE_CARDS, MORE_WAYS_TO_JOIN } from '../../config/joinRoles';
import { EmailOtpAuth } from '../../components/auth/EmailOtpAuth';

// Real account-type selection — "HOW ARE YOU JOINING TANGY?" Only Guest/User
// creates a Supabase Auth account directly from here; every specialized role
// routes to its existing real application form (already wired to
// collaborations/crew_applications/private_enquiries), because selecting a
// role here is NEVER permission escalation — profiles.role stays 'user'
// until an admin reviews and approves the application (see
// prevent_role_self_escalation in 0003_role_security.sql). Artist has its
// own dedicated portal/signup already, so it links out to that instead.
// Super Admin/Staff/Admin are deliberately absent — those are never
// selectable here; that access is provisioned internally (StaffAuthGate).
// ROLE_CARDS/MORE_WAYS_TO_JOIN live in src/config/joinRoles.js — this same
// data also drives the quick-login modal (UserLoginModal.jsx), so both
// entry points into the Tangy world show identical role-selection copy.

export const JoinPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useUserAuth();
  const [selectedRole, setSelectedRole] = useState(null);

  const selectRole = (card) => {
    if (card.kind === 'link') {
      navigate(card.to);
      return;
    }
    if (isLoggedIn) {
      navigate('/dashboard');
      return;
    }
    setSelectedRole(card.key);
  };

  const selected = ROLE_CARDS.find((c) => c.key === selectedRole);

  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono selection:bg-[#C89D35] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-14 sm:pb-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="relative z-10">
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 block">
            TANGY SESSIONS // MEMBERSHIP DESK
          </span>
          <h1 className="display text-4xl sm:text-7xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4">
            HOW ARE YOU<br />JOINING TANGY?
          </h1>
          {!selectedRole && (
            <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
              CHOOSE HOW YOU'RE PARTICIPATING IN TANGY — WE'LL TAKE YOU DOWN THE RIGHT PATH FROM HERE.
            </p>
          )}
        </div>
      </section>

      {!selectedRole ? (
        <section className="pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div role="group" aria-label="How are you joining Tangy?" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {ROLE_CARDS.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() => selectRole(card)}
                aria-label={`${card.label} — ${card.tagline}`}
                className="text-left bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C] hover:-translate-y-1 focus-visible:-translate-y-1 transition-transform flex flex-col gap-2 outline-none focus-visible:ring-4 focus-visible:ring-[#C99A2E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11100C]"
              >
                <span className="text-3xl" aria-hidden="true">{card.icon}</span>
                <h3 className="font-condensed text-xl font-bold uppercase leading-tight">{card.label}</h3>
                <p className="font-mono text-[11px] text-[#11100C]/70 leading-relaxed">{card.tagline}</p>
                <span className="mt-2 font-mono text-[10px] font-bold text-[#B94717] uppercase">
                  {card.kind === 'signup' ? 'CREATE ACCOUNT →' : 'APPLY →'}
                </span>
              </button>
            ))}
          </div>
          <p className="text-center mt-8 font-mono text-[10px] text-[#E7D5A4]/50 max-w-2xl mx-auto uppercase tracking-wider">
            Selecting a path here does not grant that role. Specialized paths go through a real application, reviewed by the
            Tangy team — your account stays a guest account until it's approved.
          </p>

          <div className="mt-14 pt-8 border-t border-[#C99A2E]/20">
            <span className="block text-center font-mono text-[9px] sm:text-[10px] text-[#E7D5A4]/40 uppercase tracking-[0.3em] mb-4">
              Other ways to join
            </span>
            <div role="group" aria-label="Other ways to join Tangy" className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
              {MORE_WAYS_TO_JOIN.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => navigate(card.to)}
                  aria-label={`${card.label} — ${card.tagline}`}
                  className="text-left bg-[#191410] border border-[#C99A2E]/40 hover:border-[#C99A2E] p-4 transition-colors flex items-start gap-3 outline-none focus-visible:ring-2 focus-visible:ring-[#C99A2E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11100C]"
                >
                  <span className="text-xl shrink-0" aria-hidden="true">{card.icon}</span>
                  <span>
                    <span className="block font-condensed text-sm font-bold uppercase">{card.label}</span>
                    <span className="block font-mono text-[10px] text-[#E7D5A4]/60 mt-0.5 leading-snug">{card.tagline}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center mt-10 font-mono text-xs text-[#E7D5A4]/60">
            Already have a Tangy profile? <button type="button" onClick={() => navigate('/join/login')} className="text-[#C99A2E] underline font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#C99A2E]">SIGN IN →</button>
          </div>
        </section>
      ) : (
        <section className="pb-20 px-4 sm:px-6 max-w-lg mx-auto">
          <div className="bg-[#EFE2C0] paperTexture text-[#11100C] border-4 border-[#11100C] p-6 sm:p-10 shadow-[10px_10px_0px_#11100C]">
            <div className="flex justify-between items-center border-b-2 border-[#11100C] pb-3 mb-6">
              <div>
                <span className="font-mono text-[9px] font-bold text-[#B94717] uppercase tracking-widest">{selected.icon} {selected.label}</span>
                <h2 className="font-condensed text-2xl font-bold uppercase">CREATE YOUR ACCOUNT</h2>
              </div>
              <button onClick={() => setSelectedRole(null)} className="font-mono text-[10px] font-bold underline">CHANGE</button>
            </div>

            <EmailOtpAuth onVerified={() => navigate('/dashboard')} />
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};
