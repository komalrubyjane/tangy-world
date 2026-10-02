import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useUserAuth } from '../../../context/UserAuthContext';
import { usePageMeta } from '../../../hooks/usePageMeta';
import { artistApi } from '../api';
import { Card, Btn, StatusPill, Loading, ErrorNote } from '../kit';
import { fmtDate, cx } from '../util';

const TIMELINE = ['draft', 'submitted', 'under_review', 'approved'];
const COPY = {
  draft: ['Not submitted yet', 'Your answers are saved as a draft. Finish and submit when you are ready.'],
  submitted: ['Application submitted', 'Thank you — the Tangy team will start reviewing it soon.'],
  under_review: ['Under review', 'Your application is currently being reviewed by the Tangy team.'],
  needs_information: ['More information requested', 'The team needs a little more before deciding. Update your application and resubmit.'],
  approved: ['Approved', 'Welcome to Tangy. Your artist portal is ready.'],
  rejected: ['Not selected this time', 'Thank you for applying. We are not able to take this application forward right now.'],
  withdrawn: ['Withdrawn', 'You withdrew this application.'],
};

// /artist/application — where an application stands, and what (if anything) is needed.
export const ApplicationStatusPage = () => {
  usePageMeta({ title: 'Your artist application', noindex: true });
  const { isLoggedIn, loading } = useUserAuth();
  const [app, setApp] = useState(undefined);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = async () => { try { setApp(await artistApi.myApplication()); setError(null); } catch (err) { setError(err); } };
  useEffect(() => { if (isLoggedIn) load(); }, [isLoggedIn]);
  if (loading) return <Shell><Loading /></Shell>;
  if (!isLoggedIn) return <Navigate to={`/join/login?next=${encodeURIComponent('/artist/application')}`} replace />;
  if (error) return <Shell><ErrorNote error={error} onRetry={load} /></Shell>;
  if (app === undefined) return <Shell><Loading /></Shell>;
  if (app === null) return <Navigate to="/artist/apply" replace />;
  const [title, text] = COPY[app.status];
  const reached = TIMELINE.indexOf(app.status === 'needs_information' ? 'under_review' : app.status);
  const withdraw = async () => { setBusy(true); try { await artistApi.withdrawApplication(); await load(); } catch (err) { setError(err); } setBusy(false); };

  return (
    <Shell>
      <div className="flex flex-wrap items-center gap-3 mb-2"><h1 className="font-condensed text-3xl sm:text-4xl uppercase text-[#F3E7C9] m-0" data-application-status={app.status}>{title}</h1><StatusPill status={app.status} /></div>
      <p className="text-sm text-[#E7D5A4]/80 mb-6">{text}</p>

      {!['rejected', 'withdrawn'].includes(app.status) && (
        <ol className="grid grid-cols-4 gap-2 list-none p-0 mb-6" aria-label="Application progress">
          {TIMELINE.map((s, i) => (
            <li key={s} aria-current={i === reached ? 'step' : undefined}>
              <span className={cx('block h-1.5 rounded-full mb-2', i <= reached ? 'bg-[#C99A2E]' : 'bg-[#E7D5A4]/15')} />
              <span className={cx('text-xs', i <= reached ? 'text-[#F3E7C9]' : 'text-[#E7D5A4]/50')}>{COPY[s][0]}</span>
            </li>
          ))}
        </ol>
      )}

      {app.status === 'needs_information' && app.info_request && (
        <Card title="What the team needs" className="mb-4">
          {(app.info_request.items || []).length > 0 && <ul className="mt-0 mb-2 pl-5 text-sm">{app.info_request.items.map((i) => <li key={i}>{i}</li>)}</ul>}
          {app.info_request.message && <p className="text-sm m-0">“{app.info_request.message}”</p>}
          <p className="text-xs text-[#E7D5A4]/60 mt-2 mb-3">Requested {fmtDate(app.info_request.requested_at)}</p>
          <Btn variant="primary" to="/artist/apply?step=1">Update application</Btn>
        </Card>
      )}
      {app.public_message && <Card title="Message from Tangy" className="mb-4"><p className="text-sm m-0">{app.public_message}</p></Card>}

      <Card>
        <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm m-0">
          <dt className="text-[#E7D5A4]/65">Stage name</dt><dd className="m-0 text-[#F3E7C9]">{app.data?.about?.stage_name || '—'}</dd>
          <dt className="text-[#E7D5A4]/65">Submitted</dt><dd className="m-0 text-[#F3E7C9]">{app.submitted_at ? fmtDate(app.submitted_at) : 'Not yet'}</dd>
          {app.decided_at && <><dt className="text-[#E7D5A4]/65">Decided</dt><dd className="m-0 text-[#F3E7C9]">{fmtDate(app.decided_at)}</dd></>}
        </dl>
        <div className="flex flex-wrap gap-2 mt-4">
          {app.status === 'draft' && <Btn variant="primary" to="/artist/apply">Continue application</Btn>}
          {app.status === 'approved' && <Btn variant="primary" href="/artist/dashboard">Open your artist portal</Btn>}
          {['draft', 'submitted', 'under_review', 'needs_information'].includes(app.status) && <Btn variant="ghost" disabled={busy} onClick={withdraw}>Withdraw application</Btn>}
        </div>
      </Card>
    </Shell>
  );
};

const Shell = ({ children }) => (
  <div className="min-h-[100dvh] ui-texture text-[#E7D5A4] font-body">
    <header className="border-b border-[#E7D5A4]/10 px-4 h-14 flex items-center max-w-3xl mx-auto"><Link to="/" className="font-display text-lg uppercase text-[#F3E7C9]">Tangy</Link></header>
    <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
  </div>
);
