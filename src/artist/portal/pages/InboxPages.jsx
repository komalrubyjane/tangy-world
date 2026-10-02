import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePageMeta } from '../../../hooks/usePageMeta';
import { portalApi } from '../../../portal/portalApi';
import { MessagesPanel } from '../../../portal/MessagesPanel';
import { NotificationPreferences, PREF_KEYS_BY_ROLE } from '../../../portal/NotificationPreferences';
import { DocumentsPanel, AnnouncementsPanel } from '../../../portal/PortalSections';
import { InvoicesPanel } from '../../../portal/PartnerExtras';
import { uploadWithProgress, openPrivateFile, removeFile, safeFileName, formatBytes } from '../../../lib/storage';
import { artistApi } from '../api';
import { PageHeader, Card, Btn, Loading, ErrorNote, Empty, Field, Input, Select, PIcon } from '../kit';
import { fmtDate, cx } from '../util';

// /artist/notifications — everything the team and the platform told you.
export const NotificationsPage = () => {
  usePageMeta({ title: 'Notifications', noindex: true });
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const navigate = useNavigate();
  const load = async () => {
    try { setRows(await portalApi.notifications({ limit: 100, unreadOnly })); setError(null); } catch (err) { setError(err); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [unreadOnly]);
  const open = async (n) => {
    if (!n.read_at) await portalApi.markNotificationsRead([n.id]);
    if (n.link) navigate(n.link); else load();
  };
  const markAll = async () => { await portalApi.markNotificationsRead(null); load(); };
  return (
    <div>
      <PageHeader title="Notifications" description="Requests, schedule changes, messages and application updates."
        actions={<>
          <Btn size="sm" variant="ghost" aria-pressed={unreadOnly} onClick={() => setUnreadOnly(!unreadOnly)}>{unreadOnly ? 'Show all' : 'Unread only'}</Btn>
          <Btn size="sm" onClick={markAll}>Mark all read</Btn>
        </>} />
      {error && <ErrorNote error={error} onRetry={load} />}
      {!rows ? <Loading /> : rows.length === 0 ? <Empty title={unreadOnly ? 'All caught up' : 'No notifications yet'} /> : (
        <ul className="list-none m-0 p-0 flex flex-col gap-2" data-notifications>
          {rows.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => open(n)} data-notification={n.type}
                className={cx('w-full text-left flex gap-3 p-4 rounded-lg border focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]',
                  n.read_at ? 'bg-[#1C1814] border-[#E7D5A4]/10' : 'bg-[#2A231A] border-[#C99A2E]/40')}>
                <span className={cx('mt-1.5 w-2 h-2 rounded-full shrink-0', n.read_at ? 'bg-transparent' : 'bg-[#C99A2E]')} aria-hidden="true" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-[#F3E7C9] font-medium">{n.title}{!n.read_at && <span className="sr-only"> (unread)</span>}</span>
                  {n.body && <span className="block text-sm text-[#E7D5A4]/75 mt-0.5">{n.body}</span>}
                  <span className="block text-xs text-[#E7D5A4]/55 mt-1">{fmtDate(n.created_at)}{n.link ? ' · Open →' : ''}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <section aria-labelledby="ann-h" className="mt-10">
        <h2 id="ann-h" className="font-condensed text-2xl uppercase text-[#F3E7C9] m-0 mb-3">Announcements</h2>
        <AnnouncementsPanel />
      </section>
    </div>
  );
};

// /artist/messages and /artist/messages/:conversationId — you and the Tangy
// team only (the messaging rules in the database decide who can talk to whom).
export const MessagesPage = () => {
  usePageMeta({ title: 'Messages', noindex: true });
  const { conversationId } = useParams();
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Messages" description="Conversations with the Tangy team. Messages are private to you and the team; they are not end-to-end encrypted." />
      <div data-artist-messages>
        <MessagesPanel mode="partner" selectedId={conversationId || null} onSelect={(id) => navigate(id ? `/artist/messages/${id}` : '/artist/messages')} />
      </div>
    </div>
  );
};

const DOC_KINDS = [['rider', 'Technical rider'], ['epk', 'EPK / press kit'], ['tax', 'Tax document'], ['payment', 'Payment details'], ['identity', 'ID / business document'], ['other', 'Other']];
const MAX_DOC = 25 * 1024 * 1024;

// /artist/documents — private files for the team (never public).
export const DocumentsPage = () => {
  usePageMeta({ title: 'Documents', noindex: true });
  const { user } = useAuth();
  const input = useRef(null);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);
  const [progress, setProgress] = useState(null);
  const [msg, setMsg] = useState('');
  const load = async () => { try { setRows(await artistApi.documents(user.id)); setError(null); } catch (err) { setError(err); } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (user?.id) load(); }, [user?.id]);
  const choose = (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    if (file.size > MAX_DOC) { setMsg(`That file is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_DOC)}.`); return; }
    setMsg(''); setPending({ file, title: file.name.replace(/\.[^.]+$/, ''), kind: 'rider' });
  };
  const upload = async () => {
    const path = `${user.id}/${Date.now()}-${safeFileName(pending.file.name)}`;
    setProgress(0);
    try {
      await uploadWithProgress('artist-documents', path, pending.file, { onProgress: setProgress, maxBytes: MAX_DOC });
      try {
        await artistApi.addDocument({ artist_id: user.id, kind: pending.kind, title: pending.title.trim() || pending.file.name, storage_path: path, file_name: pending.file.name, file_size_bytes: pending.file.size });
      } catch (err) { await removeFile('artist-documents', path); throw err; }
      setPending(null); setMsg('Uploaded — only you and the Tangy team can open it.'); load();
    } catch (err) { setMsg(err.message); }
    setProgress(null);
  };
  const remove = async (d) => {
    try { await artistApi.deleteDocument(d.id); await removeFile('artist-documents', d.storage_path); load(); } catch (err) { setMsg(err.message); }
  };
  return (
    <div>
      <PageHeader title="Documents" description="Your rider, press kit and the paperwork the team needs. Private to you and the Tangy team."
        actions={<><input ref={input} type="file" className="sr-only" accept=".pdf,.docx,image/*" onChange={choose} aria-label="Choose a document" /><Btn variant="primary" icon="Upload" onClick={() => input.current?.click()}>Upload document</Btn></>} />
      {pending && (
        <Card title="New document" className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title" id="doc-title"><Input id="doc-title" value={pending.title} onChange={(e) => setPending({ ...pending, title: e.target.value })} /></Field>
            <Field label="Type" id="doc-kind"><Select id="doc-kind" value={pending.kind} onChange={(e) => setPending({ ...pending, kind: e.target.value })}>{DOC_KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
          </div>
          <div className="flex gap-2 mt-3">
            <Btn variant="primary" onClick={upload} disabled={progress != null}>{progress != null ? `Uploading ${progress}%` : 'Upload'}</Btn>
            <Btn variant="ghost" onClick={() => setPending(null)}>Cancel</Btn>
          </div>
        </Card>
      )}
      {msg && <p role="status" className="text-sm text-[#E7D5A4] mb-3">{msg}</p>}
      {error && <ErrorNote error={error} onRetry={load} />}
      {!rows ? <Loading /> : rows.length === 0 ? <Empty title="No documents yet">Upload your technical rider first — it helps the team plan your set.</Empty> : (
        <ul className="list-none m-0 p-0 flex flex-col gap-2" data-artist-documents>
          {rows.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 bg-[#1C1814] border border-[#E7D5A4]/12 rounded-lg p-4">
              <PIcon name="FileText" />
              <span className="flex-1 min-w-[180px]"><span className="block text-sm text-[#F3E7C9]">{d.title}</span>
                <span className="text-xs text-[#E7D5A4]/65">{DOC_KINDS.find(([k]) => k === d.kind)?.[1]} · {formatBytes(d.file_size_bytes || 0)} · {fmtDate(d.created_at)}</span></span>
              <Btn size="sm" onClick={() => openPrivateFile('artist-documents', d.storage_path)}>Open</Btn>
              <Btn size="sm" variant="ghost" icon="Trash2" aria-label={`Delete ${d.title}`} onClick={() => remove(d)} />
            </li>
          ))}
        </ul>
      )}
      <section aria-labelledby="team-docs" className="mt-10">
        <h2 id="team-docs" className="font-condensed text-2xl uppercase text-[#F3E7C9] m-0 mb-3">Shared by the Tangy team</h2>
        <DocumentsPanel />
      </section>
      <section aria-labelledby="payments-h" className="mt-10" id="payments">
        <h2 id="payments-h" className="font-condensed text-2xl uppercase text-[#F3E7C9] m-0 mb-3">Payments & invoices</h2>
        <InvoicesPanel />
      </section>
    </div>
  );
};

// /artist/settings — account, notifications, privacy. The role is not editable here.
export const SettingsPage = () => {
  usePageMeta({ title: 'Settings', noindex: true });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Settings" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Account">
          <dl className="m-0 text-sm grid grid-cols-[110px_1fr] gap-y-2">
            <dt className="text-[#E7D5A4]/65">Email</dt><dd className="m-0 text-[#F3E7C9] break-all">{user.email}</dd>
            <dt className="text-[#E7D5A4]/65">Account</dt><dd className="m-0 text-[#F3E7C9]">Artist</dd>
            <dt className="text-[#E7D5A4]/65">Sign-in</dt><dd className="m-0 text-[#F3E7C9]">One-time email code — no password to manage.</dd>
          </dl>
          <p className="text-xs text-[#E7D5A4]/60 mt-3 mb-0">Your account type is set by the Tangy team. To change your email, message the team.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Btn to="/artist/profile">Edit profile & phone</Btn>
            <Btn variant="ghost" onClick={async () => { await logout(); navigate('/artist/login'); }} icon="LogOut">Sign out</Btn>
          </div>
        </Card>
        <Card title="Privacy">
          <ul className="text-sm text-[#E7D5A4]/80 m-0 pl-4 flex flex-col gap-1.5">
            <li>Your public page shows your stage name, bio, genre, city, photos and links only.</li>
            <li>Availability, documents, phone, fees and travel details are visible only to you and the Tangy team.</li>
            <li>Media appears publicly only after the team approves it.</li>
          </ul>
          <Link to="/privacy" className="text-sm underline mt-3 inline-block">Privacy notice</Link>
        </Card>
        <Card title="Notifications" className="lg:col-span-2"><NotificationPreferences keys={PREF_KEYS_BY_ROLE.artist} /></Card>
      </div>
    </div>
  );
};
