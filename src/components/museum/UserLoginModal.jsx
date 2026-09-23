import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { useAudio } from '../../audio/AudioContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { ROLE_CARDS, MORE_WAYS_TO_JOIN } from '../../config/joinRoles';
import { EmailOtpAuth } from '../auth/EmailOtpAuth';
// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
import { DEMO_ADMIN_ENABLED } from '../../config/demoAdmin';

// The quick-login modal is the site's main "Login" entry point (opened from
// MuseumQuickDock's LOGIN button and BookingPage's "log in to book" prompts
// via openLoginModal()). It must show role selection FIRST — the Guest/User
// auth step below is only ever reached after picking Guest/User, exactly
// like the full /join page. Picking any other role closes this modal and
// navigates to that role's own existing login/application route
// (src/config/joinRoles.js) — never a second, duplicate auth flow, and never
// a write to profiles.role.
//
// Authentication itself is real Supabase Auth email OTP (EmailOtpAuth) —
// no password, no custom OTP storage/validation. signInWithOtp() both
// creates the account (if new) and sends the code; verifyOtp() confirms it
// and returns a real session. UserAuthContext's own onAuthStateChange
// listener picks that session up automatically, so onVerified here only
// needs to close the modal.
export const UserLoginModal = () => {
  const { isLoginModalOpen, closeLoginModal, isLoggedIn, user, logout } = useUserAuth();
  const { playSFX } = useAudio();
  const navigate = useNavigate();

  // DEMO-ONLY CODE — closes the real modal before navigating so it doesn't
  // stay mounted over the demo entry screen.
  const goToDemo = () => {
    closeLoginModal();
    navigate('/demo/patron');
  };
  const [step, setStep] = useState('role'); // 'role' | 'auth'
  const [stampsCount, setStampsCount] = useState(0);

  // Every fresh open starts at role selection — a visitor who closed the
  // modal mid auth shouldn't reopen straight back into that form.
  useEffect(() => {
    if (isLoginModalOpen && !isLoggedIn) {
      setStep('role');
    }
  }, [isLoginModalOpen, isLoggedIn]);

  useEffect(() => {
    if (!isLoginModalOpen || !isLoggedIn || !user || !isSupabaseConfigured) return;
    let cancelled = false;
    supabase
      .from('checkins')
      .select('id, bookings!inner(user_id)', { count: 'exact', head: true })
      .eq('bookings.user_id', user.id)
      .then(({ count }) => {
        if (!cancelled && typeof count === 'number') setStampsCount(count);
      });
    return () => { cancelled = true; };
  }, [isLoginModalOpen, isLoggedIn, user]);

  if (!isLoginModalOpen) return null;

  const selectRole = (card) => {
    playSFX('ticketClick');
    if (card.kind === 'signup') {
      setStep('auth');
      return;
    }
    closeLoginModal();
    navigate(card.to);
  };

  const handleLogout = () => {
    playSFX('ticketClick');
    logout();
    closeLoginModal();
  };

  const showRoleStep = !isLoggedIn && step === 'role';
  const showAuthStep = !isLoggedIn && step === 'auth';

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-[#11100C]/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full ${showRoleStep ? 'max-w-2xl' : 'max-w-md'} max-h-[90dvh] overflow-y-auto bg-[#EDE0C0] p-6 border-4 border-[#11100C] shadow-[16px_16px_0px_#11100C] text-[#11100C]`}
        style={{ backgroundImage: "url('/noise.png')", backgroundBlendMode: 'multiply', backgroundSize: '180px' }}
      >
        {/* Masking tape at top */}
        <div className="absolute -top-3 left-1/3 w-24 h-5 bg-[rgba(231,213,164,0.85)] rotate-[-2deg] border border-black/30 z-20 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-3 right-3 font-mono text-xs font-bold text-[#11100C] hover:text-[#C2272A] p-1"
        >
          ✕ CLOSE
        </button>

        {/* Header */}
        <div className="border-b-2 border-[#11100C] pb-3 mb-4 pr-16">
          <div className="font-mono text-[9px] font-bold text-[#B94717] tracking-[0.2em] uppercase mb-1">
            {showRoleStep ? '✦ TANGY MEMBERSHIP DESK' : '✦ TANGY PATRON PORTAL'}
          </div>
          <h2 className="display text-2xl sm:text-3xl font-bold leading-tight">
            {isLoggedIn ? 'PATRON PROFILE' : showRoleStep ? 'HOW ARE YOU JOINING TANGY?' : 'CREATE YOUR ACCOUNT'}
          </h2>
          <p className="font-serif italic text-xs text-[#2A1A0E] opacity-80 mt-1">
            {isLoggedIn
              ? 'Access your digital passport, concert stamps & member perks.'
              : showRoleStep
              ? 'Choose how you participate in the Tangy world.'
              : 'No password needed — verify with a one-time code sent to your email.'}
          </p>
        </div>

        {showRoleStep && (
          <div className="flex flex-col gap-5">
            <div role="group" aria-label="How are you joining Tangy?" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {ROLE_CARDS.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => selectRole(card)}
                  aria-label={`${card.label} — ${card.tagline}`}
                  className="text-left bg-[#F5E9C9] hover:bg-white border-2 border-[#11100C] p-3 shadow-[3px_3px_0px_#11100C] hover:-translate-y-0.5 focus-visible:-translate-y-0.5 transition-transform flex flex-col gap-1 outline-none focus-visible:ring-4 focus-visible:ring-[#B94717] focus-visible:ring-offset-2 focus-visible:ring-offset-[#EDE0C0]"
                >
                  <span className="text-xl" aria-hidden="true">{card.icon}</span>
                  <span className="font-condensed text-xs sm:text-sm font-bold uppercase leading-tight">{card.label}</span>
                  <span className="font-mono text-[9px] text-[#11100C]/70 leading-snug">{card.tagline}</span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-[#11100C]/20">
              <span className="block font-mono text-[8px] text-[#11100C]/50 uppercase tracking-[0.25em] mb-2">Other ways to join</span>
              <div role="group" aria-label="Other ways to join Tangy" className="flex flex-col gap-1.5">
                {MORE_WAYS_TO_JOIN.map((card) => (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => { playSFX('ticketClick'); closeLoginModal(); navigate(card.to); }}
                    aria-label={`${card.label} — ${card.tagline}`}
                    className="text-left flex items-center gap-2 font-mono text-[10px] text-[#11100C]/80 hover:text-[#B94717] p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[#B94717]"
                  >
                    <span aria-hidden="true">{card.icon}</span>
                    <span className="font-bold uppercase">{card.label}</span>
                    <span className="opacity-60">— {card.tagline}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="font-mono text-[9px] text-[#11100C]/50 leading-relaxed">
              Selecting a path doesn't grant that role — specialized paths go through a real application reviewed by the Tangy
              team.
            </p>
          </div>
        )}

        {isLoggedIn && user && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#E3D4AC] p-4 border-2 border-[#11100C] font-mono text-xs">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#11100C]/20">
                <span className="opacity-70">STATUS:</span>
                <span className="text-[#B94717] font-bold">ACTIVE MEMBER 🛂</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="opacity-70">NAME:</span>
                <span className="font-bold">{user.full_name || user.email}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="opacity-70">PASSPORT ID:</span>
                <span className="font-bold">{user.passport_id || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">STAMPS COLLECTED:</span>
                <span className="font-bold text-[#B94717]">{stampsCount} Sessions</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full font-mono text-xs font-bold uppercase tracking-widest bg-[#11100C] text-[#E7D5A4] hover:bg-[#C2272A] hover:text-white py-2.5 transition-colors shadow-[3px_3px_0px_#11100C]"
            >
              LOG OUT OF PASSPORT
            </button>
          </div>
        )}

        {showAuthStep && (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setStep('role')}
              className="self-start font-mono text-[10px] font-bold text-[#11100C]/60 hover:text-[#B94717] uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-[#B94717]"
            >
              ← CHANGE HOW YOU'RE JOINING
            </button>

            <EmailOtpAuth
              copy={{ emailIntro: "Enter your email — we'll send a one-time verification code to unlock your Digital Passport." }}
              onVerified={() => { playSFX('ticketClick'); closeLoginModal(); }}
            />

            <div className="font-mono text-[9px] opacity-70 bg-[#E3D4AC] p-2 border border-[#11100C]/30">
              ℹ️ Guest / User account — for attending Tangy experiences.
            </div>

            {/* DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note. */}
            {DEMO_ADMIN_ENABLED && (
              <button
                type="button"
                onClick={goToDemo}
                className="w-full text-left font-mono text-[9px] bg-transparent hover:bg-[#11100C]/5 p-2 border border-dashed border-[#11100C]/30 transition-colors"
              >
                <span className="font-bold uppercase tracking-wider text-[#11100C]/70">TEAM DEMO</span>
                <span className="text-[#11100C]/60"> — internal preview access, not a real account →</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
