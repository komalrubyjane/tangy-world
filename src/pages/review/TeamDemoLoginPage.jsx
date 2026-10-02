import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { REVIEW_ACCOUNTS, TEAM_REVIEW_PASSWORD } from '../../config/teamReview';
import { usePageMeta } from '../../hooks/usePageMeta';

// /team-demo — TEAM REVIEW MODE only (the route exists only in review builds).
// One click signs in to that role's demo account (a real session on the
// disposable review project) and opens its own dashboard.
export const TeamDemoLoginPage = () => {
  usePageMeta({ title: 'Team demo login', noindex: true });
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const enter = async (acc) => {
    setBusy(acc.role); setError('');
    try {
      if (!isSupabaseConfigured || !TEAM_REVIEW_PASSWORD) throw new Error('The review backend is not configured.');
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      const { error: e } = await supabase.auth.signInWithPassword({ email: acc.email, password: TEAM_REVIEW_PASSWORD });
      if (e) throw e;
      // A full load, so every context (console, portals, artist workspace) starts from the new session.
      window.location.assign(acc.path);
    } catch (err) {
      setError(`${acc.label}: ${err.message}`);
      setBusy(null);
    }
  };
  return (
    <div className="theme-sessions min-h-screen text-[#EFE2C0] font-mono px-4 sm:px-6 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto">
        <p className="t-label sec-accent m-0 text-center">Team review // demo accounts only</p>
        <h1 className="display uppercase text-5xl sm:text-7xl text-center leading-none mt-4 mb-4 ink-bleed">Team demo login</h1>
        <p className="text-center text-xs sm:text-sm text-[#EFE2C0]/75 max-w-2xl mx-auto mb-10 leading-relaxed">
          Pick a role to see Tangy as that person. Each card signs in to a disposable demo account on the review
          project — real dashboards, real permissions, demo data. No email code needed.
        </p>
        {error && <p role="alert" className="max-w-2xl mx-auto mb-6 p-3 border-2 border-[#B5532A] bg-[#B5532A]/20 text-sm text-center">{error}</p>}
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none m-0 p-0" data-team-demo>
          {REVIEW_ACCOUNTS.map((acc) => (
            <li key={acc.role}>
              <button type="button" onClick={() => enter(acc)} disabled={!!busy} data-review-role={acc.role}
                className="w-full h-full text-left bg-[#EFE2C0] paperTexture text-[#181614] border-2 border-[#11100C] shadow-[4px_4px_0px_#0b0907] p-5 flex flex-col gap-2 hover:-translate-y-0.5 transition-transform disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C89D35]">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#B5532A]">{acc.label}</span>
                <span className="font-condensed uppercase text-2xl leading-tight">{acc.name}</span>
                <span className="font-body text-[13px] text-[#181614]/75 flex-1">{acc.tagline}</span>
                <span className="mt-2 inline-flex items-center justify-center min-h-[44px] bg-[#181614] text-[#EFE2C0] font-mono text-xs font-bold uppercase tracking-widest">
                  {busy === acc.role ? 'Signing in…' : `Enter as ${acc.label} →`}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-center text-[11px] text-[#EFE2C0]/55 mt-10">Temporary team-review build. Not the production sign-in.</p>
      </div>
    </div>
  );
};

// A slim strip on every page of a review build: which demo account is signed in, and a way to switch.
export const TeamReviewStrip = ({ email }) => {
  const acc = REVIEW_ACCOUNTS.find((a) => a.email === email);
  const navigate = useNavigate();
  return (
    <div className="fixed top-[68px] left-2 z-[10050] flex items-center gap-2 px-3 h-8 rounded-full border-2 border-[#11100C] bg-[#B5532A] text-[#EFE2C0] font-mono text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0_#11100C]" data-team-review-strip>
      <span>Team review{acc ? ` · ${acc.label}: ${acc.name}` : ''}</span>
      <button type="button" onClick={() => navigate('/team-demo')} className="underline underline-offset-2 min-h-[32px]">Switch role</button>
    </div>
  );
};
