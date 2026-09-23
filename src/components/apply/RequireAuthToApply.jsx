import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { EmailOtpAuth } from '../auth/EmailOtpAuth';

// Gates a role application form behind a real, authenticated Supabase
// session — "Do NOT allow anonymous applications." The RLS insert policies
// on collaborations/crew_applications require auth.uid() = user_id (see
// supabase/migrations/0015_application_lifecycle.sql), so an application
// submitted while logged out would fail server-side anyway; this gate makes
// that a clear, deliberate step in the UI instead of a confusing insert
// error. Authentication is real Supabase Auth email OTP (EmailOtpAuth) — no
// password, no custom OTP storage. UserAuthContext's own onAuthStateChange
// listener picks up the resulting session automatically, so this component
// just needs to stop rendering the gate once `isLoggedIn` flips true —
// which re-renders `children` (the real application form) in place.
export const RequireAuthToApply = ({ roleLabel, children }) => {
  const navigate = useNavigate();
  const { isLoggedIn, loading } = useUserAuth();

  if (loading) return null;
  if (isLoggedIn) return children;

  return (
    <div className="bg-black/10 border-2 border-current p-6 sm:p-8 flex flex-col gap-5">
      <div className="text-center">
        <h3 className="display text-2xl sm:text-3xl uppercase">VERIFY YOUR EMAIL TO APPLY</h3>
        <p className="font-mono text-xs opacity-80 mt-2 max-w-md mx-auto">
          Verify your email with a one-time code to submit your {roleLabel} application. This links the application to your
          account so you can track its status and we can email you the moment it's reviewed.
        </p>
      </div>

      <div className="max-w-sm mx-auto w-full">
        <EmailOtpAuth copy={{ emailIntro: `Enter your email — we'll send a one-time verification code to start your ${roleLabel} application.` }} />
      </div>

      <button type="button" onClick={() => navigate('/join')} className="text-center font-mono text-[10px] font-bold uppercase tracking-wider opacity-60 hover:opacity-100">
        ← CHANGE HOW YOU'RE JOINING
      </button>
    </div>
  );
};
