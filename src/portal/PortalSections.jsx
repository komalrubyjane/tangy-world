import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Icon, Button, Badge, Panel, Textarea, EmptyState, ErrorState, Skeleton, Drawer, KeyValue, cx, fmt } from '../admin/ui';
import { localISODate } from '../admin/rbac';
import { portalApi, friendlyError } from './portalApi';

// Building blocks for the partner and volunteer portals. Every section loads
// only the caller's own data through RLS / SECURITY DEFINER RPCs (0018), and
// each has loading, empty and error states — nothing is filled with sample data.

const KIND_LABEL = { artist: 'Performing artist', sponsor: 'Sponsor', vendor: 'Vendor', venue: 'Venue host', volunteer: 'Volunteer', crew: 'Crew', staff: 'Staff' };
const FEE_LABEL = { pending: 'Fee pending', invoiced: 'Invoiced', paid: 'Paid' };

// ?tab= in the URL so notification deep links open the right section.
export function usePortalTab(defaultTab, tabIds) {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab = tabIds.includes(requested) ? requested : defaultTab;
  const setTab = useCallback((next) => {
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set('tab', next);
      if (next !== 'messages') n.delete('c');
      return n;
    }, { replace: true });
  }, [setParams]);
  const conversationId = params.get('c');
  const setConversationId = useCallback((id) => {
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (id) n.set('c', id); else n.delete('c');
      return n;
    }, { replace: true });
  }, [setParams]);
  return { tab, setTab, conversationId, setConversationId };
}

export function usePortalEvents(enabled = true) {
  const [state, setState] = useState({ events: null, error: null });
  const [includePast, setIncludePast] = useState(false);
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (!enabled) { setState({ events: [], error: null }); return undefined; }
    let cancelled = false;
    portalApi.myEvents(includePast).then(
      (events) => { if (!cancelled) setState({ events, error: null }); },
      (error) => { if (!cancelled) setState({ events: null, error }); });
    return () => { cancelled = true; };
  }, [enabled, includePast, key]);
  return { ...state, loading: state.events === null && !state.error, includePast, setIncludePast, reload: () => setKey((k) => k + 1) };
}

const timeRange = (a, b) => (a ? `${fmt.time(a)}${b ? ` – ${fmt.time(b)}` : ''}` : null);
const eventWhen = (e) => [fmt.date(e.event_date), [e.event_time, e.end_time].filter(Boolean).join(' – ')].filter(Boolean).join(' · ');
const mapsUrl = (e) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([e.venue_name, e.venue_address, e.venue_city].filter(Boolean).join(', '))}`;

// ---------------------------------------------------------------------------
// Greeting + next event
// ---------------------------------------------------------------------------

export const Greeting = ({ name, subtitle }) => {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return (
    <div>
      <h2 className="font-condensed text-[28px] sm:text-[32px] uppercase tracking-tight text-[#EFE2C0] m-0 leading-none">{part}{name ? `, ${name.split(' ')[0]}` : ''}</h2>
      {subtitle && <p className="text-[13.5px] text-[#E7D5A4]/60 mt-2 font-sans">{subtitle}</p>}
    </div>
  );
};

export const NextEventCard = ({ events, loading, error, onRetry, onOpen, emptyTitle = 'No upcoming events', emptyHint }) => {
  const today = localISODate();
  const next = (events || []).find((e) => e.event_date >= today && e.event_status !== 'cancelled');
  if (loading) return <Panel><Skeleton rows={3} /></Panel>;
  if (error) return <Panel><ErrorState error={error} onRetry={onRetry} /></Panel>;
  if (!next) return <Panel><EmptyState icon="CalendarDays" title={emptyTitle} hint={emptyHint} /></Panel>;
  const artist = next.member_kind === 'artist';
  const rows = [
    artist && next.starts_at && ['Performance', timeRange(next.starts_at, next.ends_at)],
    next.call_time && ['Call time', fmt.time(next.call_time)],
    artist && next.soundcheck_at && ['Soundcheck', fmt.time(next.soundcheck_at)],
    !artist && next.starts_at && ['Your window', timeRange(next.starts_at, next.ends_at)],
  ].filter(Boolean);
  return (
    <section aria-label="Next event" className="bg-[#17130F] border border-[#C99A2E]/35 rounded-md overflow-hidden font-sans grid grid-cols-1 sm:grid-cols-[1fr_auto]">
      <div className="p-5">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#C99A2E]">{artist ? 'Next performance' : 'Next event'}</div>
        <h3 className="font-condensed text-[26px] uppercase tracking-tight text-[#EFE2C0] mt-1.5 mb-0 leading-none">{next.name}</h3>
        <p className="text-[13.5px] text-[#E7D5A4]/70 mt-2">{eventWhen(next)}</p>
        <p className="text-[13.5px] text-[#E7D5A4]/70 flex items-center gap-1.5 mt-1"><Icon name="MapPin" size={14} className="text-[#C99A2E]" />{next.venue_name || 'Venue to be confirmed'}</p>
        {rows.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {rows.map(([k, v]) => (
              <div key={k} className="bg-[#11100C] border border-[#C99A2E]/20 rounded px-3 py-2">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#E7D5A4]/50">{k}</dt>
                <dd className="font-condensed text-[18px] text-[#EFE2C0] m-0 mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" icon="Eye" onClick={() => onOpen(next)}>View event</Button>
          {next.open_requirements > 0 && <Badge tone="warn">{next.open_requirements} item{next.open_requirements === 1 ? '' : 's'} needed from you</Badge>}
        </div>
      </div>
      {next.image_url && <img src={next.image_url} alt="" className="hidden sm:block w-56 h-full object-cover opacity-80" />}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Events list + detail drawer
// ---------------------------------------------------------------------------

export const EventsPanel = ({ events, loading, error, onRetry, includePast, setIncludePast, onOpen, emptyHint }) => {
  const today = localISODate();
  const upcoming = (events || []).filter((e) => e.event_date >= today);
  const past = (events || []).filter((e) => e.event_date < today);
  const Card = ({ e }) => (
    <li>
      <button onClick={() => onOpen(e)} className="w-full text-left bg-[#17130F] border border-[#C99A2E]/20 hover:border-[#C99A2E]/60 rounded-md p-4 flex gap-4 items-start transition-colors">
        <div className="shrink-0 w-14 text-center bg-[#11100C] border border-[#C99A2E]/25 rounded py-1.5">
          <div className="font-mono text-[10px] uppercase text-[#C99A2E]">{new Date(`${e.event_date}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' })}</div>
          <div className="font-condensed text-[22px] leading-none text-[#EFE2C0]">{e.event_date.slice(8, 10)}</div>
        </div>
        <div className="min-w-0 flex-1 font-sans">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[15px] text-[#EFE2C0]">{e.name}</span>
            <span className="flex gap-1.5 shrink-0">
              {e.event_status === 'cancelled' && <Badge status="cancelled" />}
              {e.assignment_status && e.assignment_status !== 'confirmed' && <Badge status={e.assignment_status} />}
            </span>
          </div>
          <div className="text-[12.5px] text-[#E7D5A4]/60 mt-0.5">{KIND_LABEL[e.member_kind]}{e.responsibility && e.responsibility !== KIND_LABEL[e.member_kind] ? ` · ${e.responsibility}` : ''}</div>
          <div className="text-[12.5px] text-[#E7D5A4]/50 mt-0.5">{[e.event_time, e.venue_name].filter(Boolean).join(' · ') || 'Details to be confirmed'}</div>
          {e.open_requirements > 0 && <div className="mt-2"><Badge tone="warn">{e.open_requirements} needed from you</Badge></div>}
        </div>
      </button>
    </li>
  );
  return (
    <Panel title="My events" actions={<label className="flex items-center gap-2 text-[12px] text-[#E7D5A4]/60 font-sans"><input type="checkbox" className="accent-[#C99A2E]" checked={includePast} onChange={(e) => setIncludePast(e.target.checked)} />Show past</label>}>
      {loading ? <Skeleton rows={4} /> : error ? <ErrorState error={error} onRetry={onRetry} /> : (events || []).length === 0 ? (
        <EmptyState icon="CalendarDays" title="No assigned events" hint={emptyHint || 'When Tangy adds you to an event, it appears here.'} />
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <h4 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#E7D5A4]/50 mb-2">Upcoming</h4>
            {upcoming.length ? <ul className="flex flex-col gap-2">{upcoming.map((e) => <Card key={`${e.event_id}-${e.member_kind}`} e={e} />)}</ul>
              : <p className="text-[13px] text-[#E7D5A4]/45 font-sans">No upcoming events.</p>}
          </div>
          {includePast && (
            <div>
              <h4 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#E7D5A4]/50 mb-2">Past</h4>
              {past.length ? <ul className="flex flex-col gap-2 opacity-80">{past.map((e) => <Card key={`${e.event_id}-${e.member_kind}`} e={e} />)}</ul>
                : <p className="text-[13px] text-[#E7D5A4]/45 font-sans">No past events.</p>}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
};

export const EventDrawer = ({ event: e, onClose, onChanged, readOnly }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!e) return null;
  const artist = e.member_kind === 'artist';
  const respond = async (status) => {
    setBusy(true);
    setError('');
    const { error: err } = await supabase.from('event_assignments').update({ status }).eq('id', e.assignment_id);
    setBusy(false);
    if (err) { setError(friendlyError(err).message); return; }
    onChanged?.();
    onClose();
  };
  const items = [
    ['Date', eventWhen(e)],
    ['Your role', [KIND_LABEL[e.member_kind], e.responsibility !== KIND_LABEL[e.member_kind] && e.responsibility].filter(Boolean).join(' · ')],
    artist && e.starts_at && ['Performance', timeRange(e.starts_at, e.ends_at)],
    e.call_time && ['Call time', fmt.dateTime(e.call_time)],
    artist && e.soundcheck_at && ['Soundcheck', fmt.dateTime(e.soundcheck_at)],
    !artist && e.starts_at && ['Your window', `${fmt.dateTime(e.starts_at)}${e.ends_at ? ` – ${fmt.time(e.ends_at)}` : ''}`],
    e.fee_status && e.fee_status !== 'not_applicable' && ['Fee', `${e.fee_amount != null ? fmt.money(e.fee_amount) + ' · ' : ''}${FEE_LABEL[e.fee_status]}`],
    ['Tangy contact', e.tangy_contact || 'Tangy team'],
  ].filter(Boolean);
  return (
    <Drawer title={e.name} subtitle={e.event_status === 'cancelled' ? 'This event has been cancelled' : KIND_LABEL[e.member_kind]} onClose={onClose}
      footer={e.assignment_id && e.assignment_status === 'assigned' && !readOnly && (
        <>
          <Button variant="danger" onClick={() => respond('declined')} disabled={busy}>Decline</Button>
          <Button variant="success" onClick={() => respond('confirmed')} disabled={busy}>Confirm</Button>
        </>
      )}>
      <KeyValue items={items} />
      <Panel title="Venue">
        <div className="font-sans text-[13.5px] text-[#E7D5A4]/80">
          <div className="text-[#EFE2C0]">{e.venue_name || 'To be confirmed'}</div>
          {(e.venue_address || e.venue_city) && <div className="text-[#E7D5A4]/60 mt-0.5">{[e.venue_address, e.venue_city].filter(Boolean).join(', ')}</div>}
          {e.venue_name && <a href={mapsUrl(e)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[#e4bd5c] underline underline-offset-2">Open in Maps <Icon name="ArrowUpRight" size={13} /></a>}
        </div>
      </Panel>
      {e.instructions && <Panel title={artist ? 'Performance notes' : 'Operational instructions'}><p className="font-sans text-[13.5px] text-[#E7D5A4]/80 whitespace-pre-line">{e.instructions}</p></Panel>}
      {artist && e.hospitality && <Panel title="Hospitality"><p className="font-sans text-[13.5px] text-[#E7D5A4]/80 whitespace-pre-line">{e.hospitality}</p></Panel>}
      {artist && e.travel && <Panel title="Travel & logistics"><p className="font-sans text-[13.5px] text-[#E7D5A4]/80 whitespace-pre-line">{e.travel}</p></Panel>}
      {e.description && <Panel title="About the event"><p className="font-sans text-[13.5px] text-[#E7D5A4]/70 whitespace-pre-line">{e.description}</p></Panel>}
      {error && <div role="alert" className="text-[12.5px] text-[#ef6b5e] font-sans">{error}</div>}
    </Drawer>
  );
};

export const ScheduleTimeline = ({ events, loading, error, onRetry, onOpen }) => {
  const today = localISODate();
  const upcoming = (events || []).filter((e) => e.event_date >= today && e.event_status !== 'cancelled');
  return (
    <Panel title="Your schedule">
      {loading ? <Skeleton rows={3} /> : error ? <ErrorState error={error} onRetry={onRetry} /> : upcoming.length === 0 ? (
        <EmptyState icon="CalendarClock" title="Nothing scheduled" hint="Confirmed times appear here as Tangy sets them." />
      ) : (
        <ol className="relative border-l border-[#C99A2E]/30 ml-2 flex flex-col gap-5 font-sans">
          {upcoming.map((e) => {
            const slots = [
              e.call_time && ['Call time', e.call_time],
              e.soundcheck_at && ['Soundcheck', e.soundcheck_at],
              e.starts_at && [e.member_kind === 'artist' ? 'Performance' : 'Start', e.starts_at],
              e.ends_at && ['Finish', e.ends_at],
            ].filter(Boolean).sort((a, b) => new Date(a[1]) - new Date(b[1]));
            return (
              <li key={`${e.event_id}-${e.member_kind}`} className="pl-5 relative">
                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#C99A2E]" />
                <button onClick={() => onOpen(e)} className="text-left">
                  <div className="text-[15px] text-[#EFE2C0] hover:underline">{e.name}</div>
                  <div className="text-[12.5px] text-[#E7D5A4]/55">{eventWhen(e)} · {e.venue_name || 'Venue TBC'}</div>
                </button>
                {slots.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {slots.map(([k, t]) => <li key={k} className="font-mono text-[11px] bg-[#11100C] border border-[#C99A2E]/20 rounded px-2 py-1"><span className="text-[#E7D5A4]/50">{k}</span> <span className="text-[#EFE2C0]">{fmt.time(t)}</span></li>)}
                  </ul>
                ) : <p className="text-[12px] text-[#E7D5A4]/40 mt-1">Times not set yet.</p>}
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// Requirements
// ---------------------------------------------------------------------------

export const RequirementsPanel = ({ onChanged }) => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [key, setKey] = useState(0);
  useEffect(() => {
    let c = false;
    portalApi.requirements().then((r) => { if (!c) { setRows(r); setError(null); } }, (e) => { if (!c) setError(e); });
    return () => { c = true; };
  }, [key]);
  const reload = () => { setKey((k) => k + 1); onChanged?.(); };
  const open = (rows || []).filter((r) => ['requested', 'changes_requested'].includes(r.status));
  const done = (rows || []).filter((r) => !['requested', 'changes_requested'].includes(r.status));
  return (
    <Panel title="What Tangy needs from you" subtitle={rows ? `${open.length} open` : undefined}>
      {error ? <ErrorState error={error} onRetry={reload} /> : rows === null ? <Skeleton rows={3} /> : rows.length === 0 ? (
        <EmptyState icon="ClipboardList" title="Nothing needed right now" hint="When Tangy needs information from you, it shows up here." />
      ) : (
        <ul className="flex flex-col gap-3 font-sans">
          {open.map((r) => <RequirementItem key={r.id} r={r} onDone={reload} />)}
          {done.map((r) => <RequirementItem key={r.id} r={r} onDone={reload} />)}
        </ul>
      )}
    </Panel>
  );
};

const REQ_LABEL = { requested: 'Needed', changes_requested: 'Changes requested', submitted: 'Submitted', accepted: 'Accepted' };
const REQ_TONE = { requested: 'warn', changes_requested: 'bad', submitted: 'info', accepted: 'good' };

const RequirementItem = ({ r, onDone }) => {
  const editable = ['requested', 'changes_requested'].includes(r.status);
  const [text, setText] = useState(r.response || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try { await portalApi.submitRequirement(r.id, text); onDone(); } catch (err) { setError(err.message); setBusy(false); }
  };
  return (
    <li className="bg-[#11100C] border border-[#C99A2E]/20 rounded-md p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[14.5px] text-[#EFE2C0]">{r.title}</div>
          <div className="text-[12px] text-[#E7D5A4]/50">{r.events?.name}{r.due_at ? ` · due ${fmt.dateTime(r.due_at)}` : ''}</div>
        </div>
        <Badge tone={REQ_TONE[r.status]}>{REQ_LABEL[r.status]}</Badge>
      </div>
      {r.details && <p className="text-[13px] text-[#E7D5A4]/70 mt-2 whitespace-pre-line">{r.details}</p>}
      {r.review_note && <p className="text-[12.5px] mt-2 text-[#f5b544]">Tangy: {r.review_note}</p>}
      {editable ? (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
          <Textarea aria-label={`Response to ${r.title}`} rows={3} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your response or a link to the file…" />
          {error && <div role="alert" className="text-[12.5px] text-[#ef6b5e]">{error}</div>}
          <div><Button type="submit" variant="primary" icon="Send" disabled={busy || !text.trim()}>{busy ? 'Sending…' : 'Submit'}</Button></div>
        </form>
      ) : r.response && (
        <p className="text-[12.5px] text-[#E7D5A4]/60 mt-2 border-l-2 border-[#C99A2E]/30 pl-3 whitespace-pre-line">{r.response}</p>
      )}
    </li>
  );
};

// ---------------------------------------------------------------------------
// Documents / announcements / notifications
// ---------------------------------------------------------------------------

const useLoad = (fn) => {
  const [state, setState] = useState({ data: null, error: null });
  const [key, setKey] = useState(0);
  useEffect(() => {
    let c = false;
    fn().then((data) => { if (!c) setState({ data, error: null }); }, (error) => { if (!c) setState({ data: null, error }); });
    return () => { c = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { ...state, reload: () => setKey((k) => k + 1) };
};

export const DocumentsPanel = () => {
  const { data, error, reload } = useLoad(portalApi.documents);
  return (
    <Panel title="Documents" subtitle="Shared with you by the Tangy team">
      {error ? <ErrorState error={error} onRetry={reload} /> : data === null ? <Skeleton rows={3} /> : data.length === 0 ? (
        <EmptyState icon="FileText" title="No documents yet" hint="Stage plots, passes and briefs shared with you appear here." />
      ) : (
        <ul className="divide-y divide-[#E7D5A4]/[0.06] font-sans">
          {data.map((d) => (
            <li key={d.id} className="py-3 flex items-center gap-3">
              <Icon name="FileText" size={18} className="text-[#C99A2E] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] text-[#EFE2C0] truncate">{d.title}</div>
                <div className="text-[12px] text-[#E7D5A4]/50">{d.events?.name} · {fmt.date(d.created_at)}</div>
              </div>
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12.5px] text-[#e4bd5c] underline underline-offset-2">Open <Icon name="ArrowUpRight" size={13} /></a>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

export const AnnouncementsPanel = ({ limit = 20, compact = false }) => {
  const { data, error, reload } = useLoad(() => portalApi.announcements(limit));
  const body = error ? <ErrorState error={error} onRetry={reload} /> : data === null ? <Skeleton rows={3} /> : data.length === 0 ? (
    <EmptyState icon="Megaphone" title="No announcements" hint="Event updates from Tangy appear here." />
  ) : (
    <ul className="flex flex-col gap-3 font-sans">
      {data.map((a) => (
        <li key={a.id} className={cx('border-l-2 pl-3', a.priority === 'high' ? 'border-[#ef6b5e]' : 'border-[#C99A2E]/50')}>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#EFE2C0]">{a.title}</span>
            {a.priority === 'high' && <Badge tone="bad">Important</Badge>}
          </div>
          {a.body && <p className={cx('text-[13px] text-[#E7D5A4]/70 mt-1 whitespace-pre-line', compact && 'line-clamp-2')}>{a.body}</p>}
          <div className="font-mono text-[10.5px] text-[#E7D5A4]/40 mt-1">{a.event_name || 'All'} · {fmt.relative(a.publish_at)}</div>
        </li>
      ))}
    </ul>
  );
  return <Panel title="Announcements">{body}</Panel>;
};

export const NotificationsPanel = () => {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [more, setMore] = useState(true);
  const load = useCallback(async (before = null) => {
    try {
      const rows = await portalApi.notifications({ limit: 20, before, unreadOnly });
      setItems((prev) => (before ? [...(prev || []), ...rows] : rows));
      setMore(rows.length === 20);
      setError(null);
    } catch (err) { setError(err); }
  }, [unreadOnly]);
  useEffect(() => { setItems(null); load(); }, [load]);
  const markAll = async () => { await portalApi.markNotificationsRead(null); load(); };
  return (
    <Panel title="Notifications" actions={
      <div className="flex items-center gap-3 font-sans">
        <label className="flex items-center gap-2 text-[12px] text-[#E7D5A4]/60"><input type="checkbox" className="accent-[#C99A2E]" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />Unread only</label>
        <Button size="sm" variant="ghost" icon="CheckCheck" onClick={markAll}>Mark all read</Button>
      </div>}>
      {error ? <ErrorState error={error} onRetry={() => load()} /> : items === null ? <Skeleton rows={4} /> : items.length === 0 ? (
        <EmptyState icon="Bell" title="No notifications" />
      ) : (
        <>
          <ul className="divide-y divide-[#E7D5A4]/[0.06] font-sans">
            {items.map((n) => (
              <li key={n.id} className="py-3 flex gap-3">
                <span className={cx('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', n.read_at ? 'bg-transparent' : 'bg-[#e4bd5c]')} />
                <div className="min-w-0 flex-1">
                  {n.link ? <Link to={n.link} className="text-[14px] text-[#EFE2C0] hover:underline" onClick={() => { if (!n.read_at) portalApi.markNotificationsRead([n.id]).catch(() => {}); }}>{n.title}</Link>
                    : <span className="text-[14px] text-[#EFE2C0]">{n.title}</span>}
                  {n.body && <p className="text-[12.5px] text-[#E7D5A4]/60 mt-0.5">{n.body}</p>}
                  <span className="font-mono text-[10.5px] text-[#E7D5A4]/40">{fmt.dateTime(n.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
          {more && <div className="pt-3"><Button size="sm" onClick={() => load(items[items.length - 1]?.created_at)}>Load more</Button></div>}
        </>
      )}
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// Volunteer — temporary check-in access
// ---------------------------------------------------------------------------

export const CheckInAccessPanel = ({ events }) => {
  const { data, error, reload } = useLoad(portalApi.myCheckinAccess);
  const [requesting, setRequesting] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [reqError, setReqError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  const grants = (data || []).filter((r) => r.grant_id);
  // "Active" is re-derived from the clock so the card flips to EXPIRED on time;
  // the server independently refuses check-in after expiry.
  const active = grants.filter((g) => g.state === 'active' && new Date(g.expires_at).getTime() > now);
  const recent = grants.filter((g) => !active.includes(g)).slice(0, 5);
  const pending = (data || []).filter((r) => r.request_status === 'pending');
  const today = localISODate();
  const requestable = useMemo(() => (events || []).filter((e) => e.member_kind === 'volunteer' && e.event_date >= localISODate(new Date(Date.now() - 86400000))
    && !active.some((a) => a.event_id === e.event_id) && !pending.some((p) => p.event_id === e.event_id)), [events, active, pending]);

  const submit = async () => {
    setBusy(true);
    setReqError('');
    try { await portalApi.requestCheckinAccess(requesting.event_id, msg); setRequesting(null); setMsg(''); reload(); }
    catch (err) { setReqError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      <Panel title="Check-in access">
        {error ? <ErrorState error={error} onRetry={reload} /> : data === null ? <Skeleton rows={2} /> : (
          <div className="flex flex-col gap-3">
            {active.length === 0 && (
              <div className="rounded-md border border-[#E7D5A4]/15 bg-[#11100C] p-4" data-access-state={grants[0] ? grants[0].state : 'none'}>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#E7D5A4]/50">Status</div>
                <div className="font-condensed text-[24px] uppercase text-[#E7D5A4]/80 mt-0.5">{grants[0] ? (grants[0].state === 'revoked' ? 'Ended' : 'Expired') : 'No active check-in access'}</div>
                <p className="text-[13px] text-[#E7D5A4]/55 mt-1">{grants[0] ? 'Contact the event admin if you need access.' : 'The event team grants check-in access for a set time when you are needed at the gate.'}</p>
              </div>
            )}
            {active.map((g) => (
              <div key={g.grant_id} className="rounded-md border-2 border-[#2fb877] bg-[#123d2a] p-4" data-access-state="active">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#b9f5d6]/80">{g.event_name}</div>
                <div className="font-condensed text-[28px] uppercase text-[#b9f5d6] mt-0.5 leading-none">Active</div>
                <p className="text-[13.5px] text-[#b9f5d6]/85 mt-1.5">Expires {fmt.time(g.expires_at)}{g.event_date !== today ? ` · ${fmt.date(g.event_date)}` : ''}</p>
                <Button variant="success" size="lg" icon="ScanLine" to={`/check-in?event=${g.event_id}`} className="mt-3">Open check-in</Button>
              </div>
            ))}
            {pending.map((p) => (
              <div key={p.request_id} className="rounded-md border border-[#d4911c]/40 bg-[#d4911c]/10 p-3 text-[13px] text-[#ffe0a3]">
                Request sent for <b>{p.event_name}</b> · {fmt.relative(p.request_created_at)} — waiting for the event team.
              </div>
            ))}
            {requestable.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {requestable.map((e) => <Button key={e.event_id} size="sm" icon="KeyRound" onClick={() => setRequesting(e)}>Request access · {e.name}</Button>)}
              </div>
            )}
          </div>
        )}
      </Panel>
      {recent.length > 0 && (
        <Panel title="Recent access">
          <ul className="divide-y divide-[#E7D5A4]/[0.06]">
            {recent.map((g) => (
              <li key={g.grant_id} className="py-2.5 flex items-center justify-between gap-2 text-[13px]">
                <span>{g.event_name}<span className="text-[#E7D5A4]/45"> · {fmt.dateTime(g.granted_at)} – {fmt.time(g.expires_at)}</span></span>
                <Badge status={g.state === 'revoked' ? 'cancelled' : 'expired'}>{g.state === 'revoked' ? 'Ended' : 'Expired'}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {requesting && (
        <div className="fixed inset-0 z-[450] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="Request check-in access">
          <div className="absolute inset-0 bg-black/70" onClick={() => setRequesting(null)} />
          <div className="relative w-full sm:max-w-md bg-[#15110D] border border-[#C99A2E]/35 rounded-t-lg sm:rounded-md p-5 flex flex-col gap-3">
            <h2 className="font-condensed text-base uppercase tracking-wide text-[#EFE2C0] m-0">Request check-in access</h2>
            <p className="text-[13px] text-[#E7D5A4]/65">{requesting.name} · {fmt.date(requesting.event_date)}</p>
            <Textarea aria-label="Message to the event team" rows={3} maxLength={500} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Optional note for the event team" />
            {reqError && <div role="alert" className="text-[12.5px] text-[#ef6b5e]">{reqError}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRequesting(null)}>Cancel</Button>
              <Button variant="primary" onClick={submit} disabled={busy}>{busy ? 'Sending…' : 'Send request'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PortalStat = ({ label, value, onClick, tone }) => (
  <button onClick={onClick} className="text-left bg-[#17130F] border border-[#C99A2E]/20 hover:border-[#C99A2E]/60 rounded-md p-3.5 font-sans transition-colors">
    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#E7D5A4]/55">{label}</div>
    <div className={cx('mt-1.5 font-condensed text-[26px] leading-none tabular-nums', tone === 'warn' ? 'text-[#f5b544]' : 'text-[#EFE2C0]')}>{value ?? '—'}</div>
  </button>
);
