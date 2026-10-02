import { useState, useEffect, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
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
  const { isLoginModalOpen, closeLoginModal, isLoggedIn, user, logout, loginReason } = useUserAuth();
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
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, isLoginModalOpen);
  useEffect(() => {
    if (!isLoginModalOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeLoginModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLoginModalOpen, closeLoginModal]);

  // Every fresh open starts at role selection — a visitor who closed the
  // modal mid auth shouldn't reopen straight back into that form.
  useEffect(() => {
    if (isLoginModalOpen && !isLoggedIn) {
      setStep(loginReason ? 'auth' : 'role');
    }
  }, [isLoginModalOpen, isLoggedIn, loginReason]);

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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        tabIndex={-1}
        className={`surface-modal outline-none relative w-full ${showRoleStep ? 'max-w-2xl' : 'max-w-md'} max-h-[90dvh] overflow-y-auto p-5 sm:p-8`}
        data-membership-desk
      >
        {/* One strip of tape — the only print detail on this sheet. */}
        <span className="t-tape -top-2 left-1/3 rotate-[-2deg]" aria-hidden="true" />

        <button
          type="button"
          onClick={closeLoginModal}
          aria-label="Close"
          className="absolute top-2 right-2 sm:top-3 sm:right-3 t-label inline-flex items-center gap-1.5 min-h-[44px] px-3 text-[#181614] hover:text-[#a64a2b] outline-none focus-visible:outline-2 focus-visible:outline-[#a64a2b]"
        >
          <span aria-hidden="true">✕</span> Close
        </button>

        {/* Header */}
        <header className="pr-20 mb-5">
          <p className="t-label text-[#a64a2b] m-0">
            {showRoleStep ? 'Tangy membership desk' : 'Tangy patron portal'}
          </p>
          <h2 id="login-modal-title" className="display text-[2rem] sm:text-[2.6rem] leading-[0.95] mt-2 mb-0">
            {isLoggedIn ? 'PATRON PROFILE' : showRoleStep ? 'HOW ARE YOU JOINING TANGY?' : loginReason ? `SIGN IN ${loginReason}` : 'CREATE YOUR ACCOUNT'}
          </h2>
          <p className="t-quote text-[1.05rem] sm:text-[1.15rem] text-[#181614]/80 mt-2 mb-0">
            {isLoggedIn
              ? 'Access your digital passport, concert stamps & member perks.'
              : showRoleStep
              ? 'Choose how you participate in the Tangy world.'
              : 'No password needed — verify with a one-time code sent to your email.'}
          </p>
        </header>
        <hr className="archivalRule mb-5" />

        {showRoleStep && (
          <div className="flex flex-col gap-5">
            <div role="group" aria-label="How are you joining Tangy?" className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ROLE_CARDS.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => selectRole(card)}
                  aria-label={`${card.label} — ${card.tagline}`}
                  className="t-choice"
                >
                  <span className="text-2xl leading-none" aria-hidden="true">{card.icon}</span>
                  <span className="font-condensed text-base sm:text-lg font-semibold uppercase leading-tight tracking-wide mt-1">{card.label}</span>
                  <span className="t-small text-[13px] text-[#181614]/75 leading-snug">{card.tagline}</span>
                </button>
              ))}
            </div>

            <div>
              <p className="t-meta text-[#181614]/75 m-0 mb-1">Other ways to join</p>
              <div role="group" aria-label="Other ways to join Tangy" className="flex flex-col divide-y divide-[#181614]/15 border-y border-[#181614]/15">
                {MORE_WAYS_TO_JOIN.map((card) => (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => { playSFX('ticketClick'); closeLoginModal(); navigate(card.to); }}
                    aria-label={`${card.label} — ${card.tagline}`}
                    className="group text-left flex items-center gap-3 min-h-[44px] py-2 px-1 t-small text-[#181614] hover:text-[#a64a2b] outline-none focus-visible:outline-2 focus-visible:outline-[#a64a2b]"
                  >
                    <span aria-hidden="true" className="text-base">{card.icon}</span>
                    <span className="flex-1 min-w-0">
                      <span className="font-condensed font-semibold uppercase tracking-wide">{card.label}</span>
                      <span className="text-[#181614]/75 group-hover:text-inherit"> — {card.tagline}</span>
                    </span>
                    <span aria-hidden="true" className="t-label">→</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="t-small text-[12.5px] text-[#181614]/75 leading-relaxed m-0">
              Selecting a path doesn't grant that role — specialized paths go through a real application reviewed by the Tangy
              team.
            </p>
          </div>
        )}

        {isLoggedIn && user && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#f8f0db] p-4 border border-[#181614]/35 rounded-[2px] font-mono text-xs">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#11100C]/20">
                <span className="opacity-70">STATUS:</span>
                <span className="text-[#a64a2b] font-bold">ACTIVE MEMBER 🛂</span>
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
                <span className="font-bold text-[#a64a2b]">{stampsCount} Sessions</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              type="button"
              className="t-btn w-full"
            >
              LOG OUT OF PASSPORT
            </button>
          </div>
        )}

        {showAuthStep && (
          <div className="flex flex-col gap-4">
            {!loginReason && <button
              type="button"
              onClick={() => setStep('role')}
              className="self-start t-label min-h-[44px] text-[#181614]/75 hover:text-[#a64a2b] outline-none focus-visible:outline-2 focus-visible:outline-[#a64a2b]"
            >
              ← CHANGE HOW YOU'RE JOINING
            </button>}

            <EmailOtpAuth
              copy={{ emailIntro: "Enter your email — we'll send a one-time verification code to unlock your Digital Passport." }}
              onVerified={() => { playSFX('ticketClick'); closeLoginModal(); }}
            />

            <div className="t-small text-[12.5px] text-[#181614]/80 bg-[#f8f0db] p-3 border border-[#181614]/25 rounded-[2px]">
              ℹ️ {loginReason ? 'New here? The same code creates your free Tangy account.' : 'Guest / User account — for attending Tangy experiences.'}
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
