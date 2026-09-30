import { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAdminSession } from '../AdminSession';
import { P } from '../rbac';
import { SearchBar, LoadMoreButton, EmptyState, NotConfiguredState, DataTable, StatusBadge, ActionButton } from '../AdminUI';

const ACTIVE = ['waiting', 'offered'];
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');

// Server-authoritative waitlist (0027): order, offers and holds are decided by
// the database. This view shows the queue per session and lets bookings
// managers run the offer engine now or remove an entry.
export const WaitlistSection = () => {
  const { can } = useAdminSession();
  const canManage = can(P.BOOKINGS_MANAGE);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(isSupabaseConfigured ? '' : 'not-configured');
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const reload = () => setReloadKey((k) => k + 1);

  // The whole list is loaded (positions need every entry of a session).
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let cancelled = false;
    setLoading(true);
    supabase.from('waitlist').select('*, events(name, slug, event_date)').order('queue_no', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        setError(err ? err.message : '');
        setRows(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [reloadKey]);
  const [eventFilter, setEventFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState({ kind: '', text: '' });

  // Queue position among live, account-linked entries of the same session.
  const positions = useMemo(() => {
    const map = {};
    const counters = {};
    rows.filter((r) => r.status === 'waiting' && r.user_id).forEach((r) => {
      counters[r.event_id] = (counters[r.event_id] || 0) + 1;
      map[r.id] = counters[r.event_id];
    });
    return map;
  }, [rows]);

  const events = useMemo(() => {
    const seen = new Map();
    rows.forEach((r) => { if (r.events && !seen.has(r.event_id)) seen.set(r.event_id, r.events.name); });
    return [...seen.entries()];
  }, [rows]);

  if (error === 'not-configured') return <NotConfiguredState />;

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) => (!eventFilter || r.event_id === eventFilter)
    && (statusFilter === 'all' || (statusFilter === 'active' ? ACTIVE.includes(r.status) : r.status === statusFilter))
    && (!q || `${r.name} ${r.email}`.toLowerCase().includes(q)));
  const shown = filtered.slice(0, visibleCount);

  const run = async (key, fn, ok) => {
    setBusy(key);
    setNotice({ kind: '', text: '' });
    const { data, error: err } = await fn();
    setBusy('');
    if (err) { setNotice({ kind: 'error', text: err.message }); return; }
    setNotice({ kind: 'ok', text: ok(data) });
    reload();
  };

  const offerNow = (eventId) => run(`offer-${eventId}`, () => supabase.rpc('admin_offer_waitlist', { p_event_id: eventId }),
    (n) => (n ? `${n} ${n === 1 ? 'offer' : 'offers'} sent.` : 'No seats are free to offer right now.'));
  const remove = (row) => {
    const reason = window.prompt(`Remove ${row.name} from the waitlist for ${row.events?.name}? Optional reason:`, '');
    if (reason === null) return;
    run(`rm-${row.id}`, () => supabase.rpc('admin_remove_waitlist_entry', { p_entry_id: row.id, p_reason: reason }), () => 'Entry removed.');
  };

  const statusCell = (w) => (
    <div className="flex flex-col gap-1">
      <StatusBadge status={w.status} />
      {w.status === 'waiting' && (w.user_id ? <span className="text-[10px] opacity-70">#{positions[w.id]} in line</span> : <span className="text-[10px] opacity-60">No account — not auto-offered</span>)}
      {w.status === 'offered' && <span className="text-[10px] opacity-70">held until {fmt(w.offer_expires_at)}</span>}
    </div>
  );
  const actions = (w) => canManage && ACTIVE.includes(w.status) && (
    <ActionButton tone="danger" disabled={!!busy} onClick={(e) => { e?.stopPropagation?.(); remove(w); }}>Remove</ActionButton>
  );

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-4 sm:p-6 rounded-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-[#C99A2E]/30 pb-2">
        <h3 className="text-lg font-bold text-[#C99A2E]">SESSION WAITLIST</h3>
        <span className="text-[10px] opacity-70">Offers are held for the time set in Settings → waitlist.offer_hold_minutes.</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        <label className="flex items-center gap-2">
          <span className="sr-only">Session</span>
          <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="p-2 bg-[#11100C] border border-[#C99A2E]/40 min-h-[36px]">
            <option value="">All sessions</option>
            {events.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="sr-only">Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 bg-[#11100C] border border-[#C99A2E]/40 min-h-[36px]">
            <option value="active">Active (waiting + offered)</option>
            <option value="all">All</option>
            {['waiting', 'offered', 'converted', 'expired', 'cancelled', 'skipped'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        {canManage && eventFilter && (
          <ActionButton tone="success" disabled={!!busy} onClick={() => offerNow(eventFilter)}>
            {busy === `offer-${eventFilter}` ? 'Offering…' : 'Offer free seats now'}
          </ActionButton>
        )}
      </div>
      {notice.text && <p role={notice.kind === 'error' ? 'alert' : 'status'} className={`text-xs mb-3 ${notice.kind === 'error' ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>{notice.text}</p>}
      {error && <p role="alert" className="text-xs mb-3 text-[#ef4444]">Could not load the waitlist: {error}</p>}
      <SearchBar value={search} onChange={(v) => { setSearch(v); setVisibleCount(50); }} placeholder="Search name or email..." count={filtered.length} />
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/60">LOADING...</div> : shown.length === 0 ? (
        <EmptyState>NOBODY ON THE WAITLIST{statusFilter === 'active' ? ' RIGHT NOW' : ''}.</EmptyState>
      ) : (
        <DataTable
          rows={shown}
          columns={[
            { key: 'name', header: 'NAME', render: (w) => <><div className="font-bold">{w.name}</div><div className="opacity-70">{w.email}</div></> },
            { key: 'event', header: 'SESSION', render: (w) => w.events?.name || '—' },
            { key: 'qty', header: 'PEOPLE', render: (w) => w.quantity },
            { key: 'status', header: 'STATUS', render: statusCell },
            { key: 'joined', header: 'JOINED', render: (w) => <span className="opacity-60">{fmt(w.created_at)}</span> },
            { key: 'actions', header: '', render: actions },
          ]}
          renderCard={(w) => (
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between gap-2"><span className="font-bold">{w.name}</span>{statusCell(w)}</div>
              <div className="opacity-70 break-all">{w.email}</div>
              <div>{w.events?.name} · {w.quantity} {w.quantity === 1 ? 'person' : 'people'} · joined {fmt(w.created_at)}</div>
              {actions(w)}
            </div>
          )}
        />
      )}
      <LoadMoreButton hasMore={filtered.length > visibleCount} onClick={() => setVisibleCount((c) => c + 50)} />
    </div>
  );
};
