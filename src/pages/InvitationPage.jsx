import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { EmailOtpAuth } from '../components/auth/EmailOtpAuth';
import { useUserAuth } from '../context/UserAuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { usePageMeta } from '../hooks/usePageMeta';

// /invitation#token=… — the link from an account invitation (0030). The
// invitation decides the role; this page only lets the owner of the invited
// email address accept it. accept_account_invitation() re-checks everything
// server-side (token hash, expiry, single use, revocation, email match).
// The token lives in the URL fragment, so it is never sent to a server.
const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin / Manager', staff: 'Staff' };
const STATE_COPY = {
  accepted: 'This invitation has already been used.',
  revoked: 'This invitation was withdrawn. Ask the person who invited you for a new one.',
  expired: 'This invitation has expired. Ask the person who invited you for a new one.',
  invalid: 'This invitation link is not valid. Check that you opened the whole link from the email.',
};

const readToken = () => new URLSearchParams(window.location.hash.slice(1)).get('token') || '';

export const InvitationPage = () => {
  usePageMeta({ title: 'Your invitation', noindex: true });
  const { user, isLoggedIn, loading, logout } = useUserAuth();
  const [token, setToken] = useState(readToken);
  // Pasting a new link into a tab already on /invitation only changes the hash.
  useEffect(() => {
    const onHash = () => { setToken(readToken()); setPreview(null); setError(''); setAcceptedRole(null); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [acceptedRole, setAcceptedRole] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { setPreview({ state: 'invalid' }); return; }
    supabase.rpc('invitation_preview', { p_token: token }).then(({ data, error: err }) => {
      setPreview(err ? { state: 'invalid' } : data);
    });
  }, [token]);

  const accept = async () => {
    setBusy(true);
    setError('');
    const { data, error: err } = await supabase.rpc('accept_account_invitation', { p_token: token });
    setBusy(false);
    if (err) { setError(err.message || 'Could not accept the invitation.'); return; }
    setAcceptedRole(data);
  };

  const wrongAccount = isLoggedIn && preview?.email && user?.email?.toLowerCase() !== preview.email;

  let content;
  if (!preview || loading) {
    content = <p className="t-body m-0" role="status">Checking your invitation…</p>;
  } else if (acceptedRole) {
    content = (
      <div className="flex flex-col gap-4" role="status">
        <p className="t-body m-0">You now have <strong>{ROLE_LABEL[acceptedRole]}</strong> access to the Tangy console.</p>
        {/* Full page load so the console reads the new permissions. */}
        <a href="/admin-portal" className="t-btn self-start">Open the console</a>
      </div>
    );
  } else if (preview.state !== 'pending') {
    content = (
      <div className="flex flex-col gap-4">
        <p className="t-body m-0" role="alert">{STATE_COPY[preview.state] || STATE_COPY.invalid}</p>
        <Link to="/" className="t-btn t-btn-ghost self-start">Go to the home page</Link>
      </div>
    );
  } else {
    content = (
      <div className="flex flex-col gap-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 t-body m-0">
          <dt className="t-meta">Role</dt><dd className="m-0 font-semibold" data-invite-role>{ROLE_LABEL[preview.role]}</dd>
          <dt className="t-meta">For</dt><dd className="m-0 break-all">{preview.email}</dd>
          <dt className="t-meta">From</dt><dd className="m-0">{preview.invited_by}</dd>
          <dt className="t-meta">Expires</dt><dd className="m-0">{new Date(preview.expires_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</dd>
        </dl>
        <hr className="archivalRule m-0" />
        {!isLoggedIn ? (
          <div className="flex flex-col gap-3">
            <p className="t-small m-0">Sign in with <strong>{preview.email}</strong> to accept. We'll email you a one-time code; a new account is created if you don't have one yet.</p>
            <EmailOtpAuth initialEmail={preview.email} copy={{ emailIntro: `Enter ${preview.email} — we'll send a one-time code.` }} />
          </div>
        ) : wrongAccount ? (
          <div className="flex flex-col gap-3">
            <p className="t-body m-0" role="alert">You're signed in as {user.email}, but this invitation is for {preview.email}.</p>
            <button type="button" onClick={logout} className="t-btn t-btn-ghost self-start">Sign out and switch account</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="t-small m-0">Signed in as {user.email}. Accepting gives this account {ROLE_LABEL[preview.role]} access.</p>
            <button type="button" onClick={accept} disabled={busy} className="t-btn self-start disabled:opacity-60">
              {busy ? 'Accepting…' : 'Accept invitation'}
            </button>
          </div>
        )}
        {error && <p className="t-small m-0 text-[#a64a2b]" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-body flex flex-col t-quiet">
      <Navbar />
      <main className="flex-1 flex items-start justify-center px-4 pt-28 pb-16" data-invitation-page>
        <section className="surface-modal w-full max-w-lg p-5 sm:p-8" aria-labelledby="invitation-title">
          <p className="t-label text-[#a64a2b] m-0">Tangy team invitation</p>
          <h1 id="invitation-title" className="display text-[2rem] sm:text-[2.6rem] leading-[0.95] mt-2 mb-4">Join the Tangy team</h1>
          {content}
        </section>
      </main>
      <Footer />
    </div>
  );
};
