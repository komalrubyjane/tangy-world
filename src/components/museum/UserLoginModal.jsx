import { useState, useEffect } from 'react';
import { useUserAuth } from '../../context/UserAuthContext';
import { useAudio } from '../../audio/AudioContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { isMockAuth } from '../../config/auth';
import { DEV_ACCOUNT_LIST } from '../../services/mockAuthService';

export const UserLoginModal = () => {
  const { isLoginModalOpen, closeLoginModal, signIn, signUp, isLoggedIn, user, logout, authError } = useUserAuth();
  const { playSFX } = useAudio();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [stampsCount, setStampsCount] = useState(0);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    playSFX('ticketClick');
    setIsSubmitting(true);
    if (mode === 'signup') {
      const ok = await signUp(email, password, name);
      if (ok) setSignupDone(true);
    } else {
      await signIn(email, password);
    }
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    playSFX('ticketClick');
    logout();
    closeLoginModal();
  };

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-[#11100C]/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto bg-[#EDE0C0] p-6 border-4 border-[#11100C] shadow-[16px_16px_0px_#11100C] text-[#11100C]"
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
        <div className="border-b-2 border-[#11100C] pb-3 mb-4">
          <div className="font-mono text-[9px] font-bold text-[#B94717] tracking-[0.2em] uppercase mb-1">
            ✦ TANGY PATRON PORTAL
          </div>
          <h2 className="display text-3xl font-bold leading-tight">
            {isLoggedIn ? 'PATRON PROFILE' : signupDone ? 'CHECK YOUR EMAIL' : mode === 'signup' ? 'CREATE ACCOUNT' : 'USER LOGIN'}
          </h2>
          <p className="font-serif italic text-xs text-[#2A1A0E] opacity-80 mt-1">
            {isLoggedIn
              ? 'Access your digital passport, concert stamps & member perks.'
              : signupDone
              ? 'We sent a confirmation link — verify your email, then sign in below.'
              : 'Sign in as a Tangy Listener to unlock your Digital Passport & Stamps.'}
          </p>
        </div>

        {isLoggedIn && user ? (
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
        ) : signupDone ? (
          <button
            onClick={() => { setSignupDone(false); setMode('signin'); }}
            className="w-full font-mono text-xs font-bold uppercase tracking-widest bg-[#11100C] text-[#E7D5A4] hover:bg-[#C2272A] py-2.5 transition-colors shadow-[3px_3px_0px_#11100C]"
          >
            BACK TO SIGN IN →
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <div>
                <label className="block font-mono text-[10px] font-bold tracking-wider text-[#11100C] uppercase mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arjuna Rao"
                  className="w-full bg-[#F5E9C9] border-2 border-[#11100C] px-3 py-2 font-serif text-sm text-[#11100C] focus:outline-none focus:border-[#B94717]"
                />
              </div>
            )}

            <div>
              <label className="block font-mono text-[10px] font-bold tracking-wider text-[#11100C] uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="listener@tangysessions.com"
                className="w-full bg-[#F5E9C9] border-2 border-[#11100C] px-3 py-2 font-mono text-xs text-[#11100C] focus:outline-none focus:border-[#B94717]"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold tracking-wider text-[#11100C] uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F5E9C9] border-2 border-[#11100C] px-3 py-2 font-mono text-xs text-[#11100C] focus:outline-none focus:border-[#B94717]"
              />
            </div>

            {authError && (
              <div className="font-mono text-[10px] text-white bg-[#C2272A] p-2 border border-[#11100C]">
                ✕ {authError}
              </div>
            )}

            {isMockAuth ? (
              <button
                type="button"
                onClick={() => {
                  const acc = DEV_ACCOUNT_LIST.find((a) => a.role === 'patron');
                  setEmail(acc.email);
                  setPassword(acc.password);
                }}
                className="text-left font-mono text-[9px] bg-[#E3D4AC] hover:bg-[#d8c495] p-2 border border-[#11100C]/30 transition-colors"
              >
                <span className="font-bold uppercase tracking-wider text-[#B94717]">DEVELOPMENT ACCESS · MOCK AUTHENTICATION</span>
                <br />Tap to fill patron@tangysessions.test — then press Enter &amp; Unlock Passport.
              </button>
            ) : (
              <div className="font-mono text-[9px] opacity-70 bg-[#E3D4AC] p-2 border border-[#11100C]/30">
                ℹ️ Customer/Listener Login. (Artists please use the Artist Portal from the main menu).
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-mono text-xs font-bold uppercase tracking-widest bg-[#c2272a] text-[#ecdcaf] hover:bg-[#11100C] border-2 border-[#11100C] py-3 transition-colors shadow-[3px_3px_0px_#11100C] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting
                ? mode === 'signup' ? 'CREATING ACCOUNT...' : 'UNLOCKING PASSPORT...'
                : mode === 'signup' ? 'CREATE ACCOUNT →' : 'ENTER & UNLOCK PASSPORT →'}
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
              className="text-center font-mono text-[10px] font-bold text-[#B94717] underline uppercase"
            >
              {mode === 'signup' ? 'Already have an account? Sign in' : "New here? Create an account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
