import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { isMockAuth } from '../config/auth';
import { DEV_ACCOUNT_LIST } from '../services/mockAuthService';

// Shared gate for /admin and /check-in — both are staff-only surfaces backed
// by the same Supabase Auth identity as patron accounts, distinguished only by
// profiles.role (enforced by RLS on the backend, not just this frontend check).
// allowedRoles must match what the backend RLS policies actually grant for the
// wrapped page: /admin's management sections use is_admin() (admin/super_admin
// only), while /check-in's check-in tables use is_staff_or_admin().
export const StaffAuthGate = ({ title, subtitle, allowedRoles = ['staff', 'admin', 'super_admin'], children }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn, loading, signIn, logout, authError } = useUserAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#11100C] flex items-center justify-center text-[#E7D5A4] font-mono text-xs">
        AUTHENTICATING...
      </div>
    );
  }

  const isAuthorized = isLoggedIn && user && allowedRoles.includes(user.role);

  if (isAuthorized) {
    return children;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);
    const ok = await signIn(email, password);
    setIsSubmitting(false);
    if (!ok) return;
    // signIn resolves before the profile role has necessarily loaded on this
    // render; the outer isAuthorized check re-evaluates once context updates.
  };

  return (
    <div className="min-h-screen bg-[#11100C] flex items-center justify-center p-4 text-[#E7D5A4] font-mono">
      <div
        className="w-full max-w-md bg-[#191410] border-2 border-[#C99A2E] p-8 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative"
        style={{ backgroundImage: "url('/noise.png')", backgroundBlendMode: 'multiply', backgroundSize: '180px' }}
      >
        <div className="absolute -top-3 left-1/3 w-24 h-5 bg-[rgba(201,154,46,0.4)] rotate-[-2deg] border border-[#C99A2E]/50 pointer-events-none" />

        <div className="text-center border-b border-[#C99A2E]/30 pb-4 mb-6">
          <div className="text-[9px] font-bold tracking-[0.3em] text-[#C99A2E] uppercase mb-1">
            [ ✦ ] RESTRICTED ACCESS
          </div>
          <h1 className="font-display text-3xl font-bold text-[#E7D5A4] tracking-tight">{title}</h1>
          {subtitle && <p className="font-serif italic text-xs text-[#E7D5A4]/70 mt-1">{subtitle}</p>}
        </div>

        {isLoggedIn && user && !isAuthorized ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-xs text-[#E7D5A4]/80">
              Signed in as <span className="font-bold">{user.email}</span>, but this account doesn't have staff access.
            </p>
            <button
              onClick={logout}
              className="w-full bg-[#C2272A] text-white hover:bg-[#11100C] font-mono text-xs font-bold uppercase tracking-widest py-3 border border-[#C2272A]"
            >
              SIGN OUT
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#C99A2E] uppercase mb-1">Staff Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs text-[#E7D5A4] focus:outline-none focus:border-[#C99A2E]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#C99A2E] uppercase mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs text-[#E7D5A4] focus:outline-none focus:border-[#C99A2E]"
              />
            </div>

            {(authError || localError) && (
              <div className="text-[10px] text-[#C2272A] bg-[#C2272A]/10 border border-[#C2272A]/40 p-2 text-center">
                {localError || authError}
              </div>
            )}

            {isMockAuth ? (
              <button
                type="button"
                onClick={() => {
                  const acc = DEV_ACCOUNT_LIST.find((a) => a.role === 'admin');
                  setEmail(acc.email);
                  setPassword(acc.password);
                }}
                className="w-full text-left text-[10px] text-[#C99A2E] bg-[#C99A2E]/10 hover:bg-[#C99A2E]/20 border border-[#C99A2E]/40 p-2 transition-colors"
              >
                <span className="font-bold uppercase tracking-wider">DEVELOPMENT ACCESS · MOCK AUTHENTICATION</span>
                <br />Tap to fill admin@tangysessions.test — then Authenticate.
              </button>
            ) : !isSupabaseConfigured && (
              <div className="text-[10px] text-[#C99A2E] bg-[#C99A2E]/10 border border-[#C99A2E]/40 p-2 text-center">
                Backend not connected yet — staff sign-in is unavailable until Supabase is configured.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#C99A2E] text-[#11100C] hover:bg-[#E7D5A4] font-mono text-xs font-bold uppercase tracking-widest py-3 border border-[#11100C] transition-colors shadow-[4px_4px_0px_#11100C] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'AUTHENTICATING...' : 'AUTHENTICATE →'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-center text-[10px] text-[#E7D5A4]/50 underline"
            >
              ← Back to site
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-[9px] text-[#E7D5A4]/40 border-t border-[#C99A2E]/20 pt-4">
          PROPERTY OF TANGY SESSIONS · HYDERABAD
        </div>
      </div>
    </div>
  );
};
