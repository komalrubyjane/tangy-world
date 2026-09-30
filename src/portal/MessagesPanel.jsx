import { useState, useEffect, useCallback, useRef } from 'react';
import { Icon, Button, Badge, Select, Input, Textarea, Field, SearchInput, Modal, EmptyState, ErrorState, Skeleton, cx, fmt } from '../admin/ui';
import { useDebounced } from '../admin/hooks';
import { list } from '../admin/api';
import { portalApi, subscribeInserts } from './portalApi';

// Controlled partner ↔ Tangy messaging. `mode="partner"`: the signed-in
// artist/sponsor/vendor/venue host sees only their own threads and can only
// write to Tangy. `mode="admin"`: the Tangy inbox (messages.manage). The
// database decides every read/write (0018); this is presentation only.
//
// Transport is HTTPS/TLS and content is stored behind row-level security.
// It is not end-to-end encrypted — Tangy admins read and reply to threads.

const TYPE_LABEL = { artist_support: 'Artist', sponsor_support: 'Sponsor', vendor_support: 'Vendor', venue_support: 'Venue host' };
const STATUS_LABEL = { open: 'Awaiting Tangy', pending: 'Awaiting partner', resolved: 'Resolved', closed: 'Closed' };
const STATUS_TONE = { open: 'warn', pending: 'info', resolved: 'good', closed: 'muted' };
const PRIORITY_LABEL = { normal: 'Normal', high: 'High', urgent: 'Urgent' };
// Quick views over the admin inbox; each maps onto admin_conversations filters.
const QUICK = [
  ['all', 'All', {}], ['artist_support', 'Artists', { type: 'artist_support' }], ['sponsor_support', 'Sponsors', { type: 'sponsor_support' }],
  ['vendor_support', 'Vendors', { type: 'vendor_support' }], ['venue_support', 'Venue hosts', { type: 'venue_support' }],
  ['unread', 'Unread', { unreadOnly: true }], ['open', 'Open', { status: 'active' }], ['closed', 'Closed', { status: 'closed' }],
  ['mine', 'Assigned to me', { assigned: 'me' }], ['unassigned', 'Unassigned', { assigned: 'none' }],
];

export const MessagesPanel = ({ mode = 'partner', selectedId, onSelect, events = [], eventFilter }) => {
  const admin = mode === 'admin';
  const [filters, setFilters] = useState({ quick: 'all', search: '' });
  const search = useDebounced(filters.search, 300);
  const [convs, setConvs] = useState(null);
  const [error, setError] = useState(null);
  const [composing, setComposing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const load = admin
      ? portalApi.adminConversations({ ...(QUICK.find((q) => q[0] === filters.quick)?.[2] || {}), search: search || null, eventId: eventFilter || null, limit: 50 })
      : portalApi.conversations();
    load.then((rows) => { if (!cancelled) { setConvs(rows); setError(null); } }, (err) => { if (!cancelled) setError(err); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, filters.quick, search, eventFilter, reloadKey]);

  // Keep the list fresh while the panel is open.
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') reload(); }, 20000);
    return () => clearInterval(t);
  }, [reload]);

  const selected = convs?.find((c) => c.id === selectedId) || null;
  const showThread = !!selectedId;

  return (
    <div className="bg-[#17130F] border border-[#C99A2E]/20 rounded-md overflow-hidden font-sans text-[#E7D5A4] grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[560px]" data-messages-panel>
      {/* Conversation list */}
      <aside className={cx('border-r border-[#C99A2E]/15 flex-col min-h-0', showThread ? 'hidden md:flex' : 'flex')} aria-label="Conversations">
        <div className="p-3 border-b border-[#C99A2E]/15 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#C99A2E]">{admin ? 'Partner inbox' : 'Messages with Tangy'}</span>
            <Button size="sm" variant="primary" icon="Plus" onClick={() => setComposing(true)}>{admin ? 'New' : 'New message'}</Button>
          </div>
          {admin && (
            <>
              <SearchInput value={filters.search} onChange={(v) => setFilters((f) => ({ ...f, search: v }))} placeholder="Search partner or subject…" />
              <div role="tablist" aria-label="Inbox views" className="flex flex-wrap gap-1">
                {QUICK.map(([k, label]) => (
                  <button key={k} role="tab" aria-selected={filters.quick === k} onClick={() => setFilters((f) => ({ ...f, quick: k }))}
                    className={cx('h-6 px-2 rounded-full border font-mono text-[10px] uppercase tracking-[0.06em]', filters.quick === k ? 'border-[#C99A2E] bg-[#C99A2E] text-[#11100C]' : 'border-[#E7D5A4]/20 text-[#ecdcaf]/70')}>
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {error ? <ErrorState error={error} onRetry={reload} />
            : convs === null ? <Skeleton rows={6} />
            : convs.length === 0 ? (
              <EmptyState icon="MessagesSquare" title="No messages yet"
                hint={admin ? 'Partner conversations appear here.' : 'Questions about an event, schedule or logistics? Message the Tangy team.'} />
            ) : (
              <ul>
                {convs.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => onSelect(c.id)} aria-current={c.id === selectedId}
                      className={cx('w-full text-left px-3.5 py-3 border-b border-[#E7D5A4]/[0.05] hover:bg-[#C99A2E]/[0.06] flex gap-2.5',
                        c.id === selectedId && 'bg-[#C99A2E]/[0.1]')}>
                      <span className={cx('mt-1.5 w-2 h-2 rounded-full shrink-0', c.unread > 0 ? 'bg-[#e4bd5c]' : 'bg-transparent')} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={cx('truncate text-[13.5px]', c.unread > 0 ? 'text-[#EFE2C0] font-medium' : 'text-[#E7D5A4]/85')}>
                            {admin ? (c.partner_name || c.partner_email) : (c.subject || 'Message to Tangy')}
                          </span>
                          <span className="font-mono text-[10px] text-[#E7D5A4]/40 shrink-0">{fmt.relative(c.last_message_at || c.created_at)}</span>
                        </span>
                        <span className="block font-mono text-[10.5px] text-[#C99A2E]/80 truncate mt-0.5">
                          {admin && `${TYPE_LABEL[c.conversation_type] || ''}${c.subject ? ` · ${c.subject}` : ''}`}
                          {!admin && (c.event_name || 'General')}
                          {admin && c.event_name && ` · ${c.event_name}`}
                        </span>
                        {admin && (c.priority !== 'normal' || c.assigned_admin_name) && (
                          <span className="flex items-center gap-1.5 mt-1">
                            {c.priority !== 'normal' && <Badge tone={c.priority === 'urgent' ? 'bad' : 'warn'}>{PRIORITY_LABEL[c.priority]}</Badge>}
                            {c.assigned_admin_name && <span className="font-mono text-[10px] text-[#E7D5A4]/45 truncate">→ {c.assigned_admin_name}</span>}
                          </span>
                        )}
                        <span className="flex items-center justify-between gap-2 mt-1">
                          <span className="truncate text-[12px] text-[#E7D5A4]/50">{c.last_message_preview}</span>
                          {c.unread > 0 && <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-[#B94717] text-white text-[10.5px] font-mono inline-flex items-center justify-center">{c.unread}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </aside>

      {/* Thread */}
      <section className={cx('flex-col min-h-0', showThread ? 'flex' : 'hidden md:flex')} aria-label="Conversation">
        {selectedId ? (
          <Thread key={selectedId} id={selectedId} conv={selected} admin={admin} onBack={() => onSelect(null)} onChanged={reload} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon="MessagesSquare" title="Select a conversation" hint={admin ? 'Replies go to the partner and are logged.' : 'Your messages go to the Tangy team.'} />
          </div>
        )}
      </section>

      {composing && (admin
        ? <AdminCompose onClose={() => setComposing(false)} onCreated={(id) => { setComposing(false); reload(); onSelect(id); }} />
        : <PartnerCompose events={events} onClose={() => setComposing(false)} onCreated={(id) => { setComposing(false); reload(); onSelect(id); }} />)}
    </div>
  );
};

const Thread = ({ id, conv, admin, onBack, onChanged }) => {
  const [msgs, setMsgs] = useState(null);
  const [error, setError] = useState(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const endRef = useRef(null);

  const refused = useRef(false);
  const load = useCallback(async () => {
    if (refused.current) return;
    try {
      const rows = await portalApi.messages(id);
      setMsgs(rows);
      setError(null);
      portalApi.markRead(id).catch(() => {});
    } catch (err) {
      // A thread this account may not open stays refused — stop polling it.
      if (/not found|permission/i.test(err.message)) refused.current = true;
      setError(err);
    }
  }, [id]);

  useEffect(() => {
    load();
    const unsubscribe = subscribeInserts(`messages:${id}`, 'messages', `conversation_id=eq.${id}`, () => load());
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 8000);
    return () => { unsubscribe(); clearInterval(t); };
  }, [id, load]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs?.length]);

  const send = async (e) => {
    e?.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError('');
    try {
      await portalApi.send(id, text);
      setBody('');
      await load();
      onChanged();
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const setStatus = async (status) => {
    try { await portalApi.setConversationStatus(id, status); onChanged(); } catch (err) { setSendError(err.message); }
  };
  const setMeta = async (meta) => {
    try { await portalApi.setConversationMeta(id, meta); onChanged(); } catch (err) { setSendError(err.message); }
  };

  const lastMine = msgs ? [...msgs].reverse().find((m) => m.is_mine) : null;
  const closed = conv?.status === 'closed';

  return (
    <>
      <header className="px-4 py-3 border-b border-[#C99A2E]/15 flex items-center gap-3">
        <button onClick={onBack} className="md:hidden h-9 w-9 -ml-2 inline-flex items-center justify-center rounded hover:bg-[#C99A2E]/10" aria-label="Back to conversations">
          <Icon name="ChevronLeft" size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] text-[#EFE2C0] truncate">
            {admin ? (conv?.partner_name || conv?.partner_email || 'Conversation') : (conv?.subject || 'Tangy team')}
          </div>
          <div className="font-mono text-[10.5px] text-[#E7D5A4]/50 truncate">
            {admin && conv && `${TYPE_LABEL[conv.conversation_type] || ''} · ${conv.partner_email || ''}`}
            {!admin && 'Tangy team'}
            {conv?.event_name && ` · ${conv.event_name}`}
          </div>
        </div>
        {conv?.status && !admin && <Badge tone={STATUS_TONE[conv.status]}>{STATUS_LABEL[conv.status]}</Badge>}
        {admin && conv && (
          <Select aria-label="Conversation status" value={conv.status} onChange={(e) => setStatus(e.target.value)} className="w-40! shrink-0 h-8 text-[12px]">
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        )}
      </header>
      {admin && conv && (
        <div className="px-4 py-2 border-b border-[#C99A2E]/10 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-[#E7D5A4]/55">
          <label className="flex items-center gap-1.5">Priority
            <Select aria-label="Conversation priority" value={conv.priority || 'normal'} onChange={(e) => setMeta({ priority: e.target.value })} className="w-28! h-7 text-[11.5px]">
              {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </label>
          <span className="flex items-center gap-1.5">
            {conv.assigned_admin_name ? `Assigned to ${conv.assigned_admin_name}` : 'Unassigned'}
            <Button size="sm" variant="ghost" icon="UserCheck" onClick={() => setMeta({ assignToMe: true })}>Assign to me</Button>
            {conv.assigned_admin_id && <Button size="sm" variant="ghost" onClick={() => setMeta({ assignToMe: false })}>Unassign</Button>}
          </span>
          <span>Partner last wrote {conv.last_partner_message_at ? fmt.relative(conv.last_partner_message_at) : '—'} · Tangy last replied {conv.last_tangy_reply_at ? fmt.relative(conv.last_tangy_reply_at) : '—'}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-[300px]" aria-live="polite">
        {error ? <ErrorState error={error} onRetry={load} />
          : msgs === null ? <Skeleton rows={4} />
          : msgs.length === 0 ? <EmptyState icon="MessagesSquare" title="No messages yet" />
          : msgs.map((m) => (
            <div key={m.id} className={cx('flex flex-col max-w-[85%] sm:max-w-[70%]', m.is_mine ? 'self-end items-end' : 'self-start items-start')}>
              {!m.is_mine && <span className="font-mono text-[10px] text-[#E7D5A4]/45 mb-1">{m.from_tangy ? `${m.sender_name} · Tangy` : m.sender_name}</span>}
              <div className={cx('px-3.5 py-2.5 rounded-lg text-[13.5px] leading-relaxed whitespace-pre-wrap break-words',
                m.is_mine ? 'bg-[#C99A2E] text-[#11100C] rounded-br-sm' : 'bg-[#221c15] text-[#EFE2C0] border border-[#C99A2E]/15 rounded-bl-sm')}>
                {m.content}
              </div>
              <span className="font-mono text-[10px] text-[#E7D5A4]/35 mt-1 flex items-center gap-1">
                {fmt.dateTime(m.created_at)}
                {m.id === lastMine?.id && (m.read_by_other
                  ? <><Icon name="CheckCheck" size={12} className="text-[#5fd3a0]" /> Read</>
                  : <><Icon name="Check" size={12} /> Sent</>)}
              </span>
            </div>
          ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="border-t border-[#C99A2E]/15 p-3 flex flex-col gap-2">
        {sendError && <div role="alert" className="text-[12.5px] text-[#ef6b5e]">{sendError}</div>}
        {closed && !admin ? (
          <p className="text-[12.5px] text-[#E7D5A4]/55 text-center py-2">This conversation is closed. Start a new message to reach Tangy.</p>
        ) : (
          <div className="flex items-end gap-2">
            <Textarea aria-label="Message" rows={2} value={body} maxLength={4000} placeholder="Type a message…"
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              className="flex-1 resize-none" />
            <Button type="submit" variant="primary" icon="Send" disabled={!body.trim() || sending} aria-label="Send message">{sending ? '…' : ''}</Button>
          </div>
        )}
      </form>
    </>
  );
};

const PartnerCompose = ({ events, onClose, onCreated }) => {
  const [f, setF] = useState({ subject: '', eventId: events.length === 1 ? events[0].event_id : '', body: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      onCreated(await portalApi.startConversation(f));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  const uniqueEvents = [...new Map(events.map((e) => [e.event_id, e])).values()];
  return (
    <Modal title="Message the Tangy team" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="Send" onClick={submit} disabled={busy || !f.body.trim()}>{busy ? 'Sending…' : 'Send'}</Button></>}>
      <Field label="About event">
        <Select value={f.eventId} onChange={(e) => setF({ ...f, eventId: e.target.value })}>
          <option value="">General (no specific event)</option>
          {uniqueEvents.map((e) => <option key={e.event_id} value={e.event_id}>{e.name} · {fmt.date(e.event_date)}</option>)}
        </Select>
      </Field>
      <Field label="Subject"><Input value={f.subject} maxLength={140} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="e.g. Soundcheck timing" /></Field>
      <Field label="Message *"><Textarea rows={5} maxLength={4000} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
      {error && <div role="alert" className="text-[12.5px] text-[#ef6b5e]">{error}</div>}
      <p className="text-[11.5px] text-[#E7D5A4]/45">Only you and the Tangy team can read this conversation. Please don’t share passwords or card details in messages.</p>
    </Modal>
  );
};

const PARTNER_ROLES = ['artist', 'sponsor', 'vendor', 'venue'];

const AdminCompose = ({ onClose, onCreated }) => {
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 250);
  const [people, setPeople] = useState([]);
  const [who, setWho] = useState(null);
  const [f, setF] = useState({ subject: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    list('profiles', {
      select: 'id, full_name, email, role',
      build: (qb) => {
        let x = qb.in('role', PARTNER_ROLES).eq('is_active', true).order('full_name');
        if (dq.trim()) x = x.or(`full_name.ilike.%${dq.trim().replace(/[%,()*]/g, '')}%,email.ilike.%${dq.trim().replace(/[%,()*]/g, '')}%`);
        return x;
      },
      to: 19,
    }).then((r) => { if (!cancelled) setPeople(r.rows); }, () => { if (!cancelled) setPeople([]); });
    return () => { cancelled = true; };
  }, [dq]);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      onCreated(await portalApi.adminStartConversation({ userId: who.id, ...f }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="New partner message" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="Send" onClick={submit} disabled={busy || !who || !f.body.trim()}>{busy ? 'Sending…' : 'Send'}</Button></>}>
      {who ? (
        <div className="flex items-center justify-between gap-2 bg-[#11100C] border border-[#C99A2E]/25 rounded px-3 py-2">
          <span className="text-[13px]">{who.full_name || who.email} <span className="text-[#E7D5A4]/45 font-mono text-[11px]">{who.role}</span></span>
          <Button size="sm" variant="ghost" onClick={() => setWho(null)}>Change</Button>
        </div>
      ) : (
        <Field label="To (artist, sponsor, vendor or venue host)">
          <SearchInput value={q} onChange={setQ} placeholder="Search by name or email…" />
          <ul className="mt-2 max-h-48 overflow-y-auto border border-[#C99A2E]/15 rounded divide-y divide-[#E7D5A4]/[0.05]">
            {people.length === 0 && <li className="px-3 py-3 text-[12px] text-[#E7D5A4]/45">No matching partners.</li>}
            {people.map((p) => (
              <li key={p.id}><button type="button" onClick={() => setWho(p)} className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#C99A2E]/[0.08]">
                {p.full_name || p.email} <span className="text-[#E7D5A4]/45 font-mono text-[11px]">{p.role} · {p.email}</span>
              </button></li>
            ))}
          </ul>
        </Field>
      )}
      <Field label="Subject"><Input value={f.subject} maxLength={140} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Field>
      <Field label="Message *"><Textarea rows={5} maxLength={4000} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
      {error && <div role="alert" className="text-[12.5px] text-[#ef6b5e]">{error}</div>}
      <p className="text-[11.5px] text-[#E7D5A4]/45">Volunteers and customers are reached through announcements, not private messages.</p>
    </Modal>
  );
};
