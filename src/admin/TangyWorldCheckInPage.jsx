import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StaffAuthGate } from './StaffAuthGate';
import { useAdminSession, useSetting } from './AdminSession';
import { checkinService } from '../lib/checkinService';
import { useAudio } from '../audio/AudioContext';
import { useDebounced } from './hooks';
import { TICKET_TIERS } from './rbac';
import { Icon, Button, Badge, cx, fmt } from './ui';

const TIER_NAME = Object.fromEntries(TICKET_TIERS.map((t) => [t.id, t.name]));

// Every `result` is exactly what check_in_ticket() returns — this page only
// renders it; it never decides validity itself.
const RESULTS = {
  valid: { tone: 'good', icon: 'CircleCheck', title: 'Checked in', sound: 'ticketClick' },
  already_checked_in: { tone: 'warn', icon: 'TriangleAlert', title: 'Already checked in' },
  wrong_event: { tone: 'bad', icon: 'CircleX', title: 'Wrong event' },
  cancelled: { tone: 'bad', icon: 'CircleX', title: 'Ticket cancelled' },
  payment_not_confirmed: { tone: 'bad', icon: 'CircleX', title: 'Payment not confirmed' },
  not_found: { tone: 'bad', icon: 'CircleX', title: 'Invalid ticket' },
  not_assigned: { tone: 'bad', icon: 'Lock', title: 'Not your event' },
  access_expired: { tone: 'bad', icon: 'Lock', title: 'Access expired' },
  manual_disabled: { tone: 'bad', icon: 'Lock', title: 'Manual check-in disabled' },
  error: { tone: 'bad', icon: 'TriangleAlert', title: 'Unable to verify' },
};
const TONE = {
  good: 'bg-[#123d2a] border-[#2fb877] text-[#b9f5d6]',
  warn: 'bg-[#3d2c0e] border-[#f5b544] text-[#ffe0a3]',
  bad: 'bg-[#40150f] border-[#ef6b5e] text-[#ffc4bd]',
};

function detailLine(r) {
  switch (r.result) {
    case 'wrong_event': return `This ticket is for ${r.ticket_event_name || 'another event'}.`;
    case 'already_checked_in': return `First checked in at ${fmt.time(r.checked_in_at)}${r.checked_in_by_name ? ` by ${r.checked_in_by_name}` : ''}${r.method === 'manual' ? ' (manual)' : ''}.`;
    case 'not_found': return 'This code is not a Tangy ticket.';
    case 'cancelled': return 'This ticket was cancelled or refunded.';
    case 'payment_not_confirmed': return 'The booking has no confirmed payment. Send the guest to the help desk.';
    case 'not_assigned': return 'You are not assigned to this event.';
    case 'access_expired': return 'Your check-in access for this event has ended. Contact the event admin if you still need it.';
    case 'manual_disabled': return 'Only QR scans are accepted right now.';
    case 'error': return r.error || 'Check the connection and try again.';
    default: return null;
  }
}

function QrScanner({ onDecoded, active }) {
  const containerId = 'tangy-qr-reader';
  const scannerRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  // The camera starts once; route each decode to the latest handler so it
  // always uses the currently selected event.
  const onDecodedRef = useRef(onDecoded);
  onDecodedRef.current = onDecoded;

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      scanner
        .start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, (text) => onDecodedRef.current(text), () => {})
        .catch(() => { if (!cancelled) setCameraError('Camera unavailable. Allow camera access, or use manual check-in.'); });
    });
    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (!s) return;
      const clear = () => { try { s.clear(); } catch { /* already cleared */ } };
      // stop() throws synchronously when the camera never started (e.g.
      // permission denied), which would crash the switch to manual mode.
      let stopped;
      try { stopped = s.stop(); } catch { stopped = null; }
      if (stopped) stopped.catch(() => {}).finally(clear);
      else clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div>
      <div id={containerId} className="w-full max-w-sm mx-auto rounded overflow-hidden bg-black aspect-square" />
      {cameraError && <p className="mt-3 text-center text-[13px] text-[#f5b544]">{cameraError}</p>}
    </div>
  );
}

function CheckInWorkspace() {
  const { user } = useAdminSession();
  const { playSFX } = useAudio();
  const allowManual = useSetting('checkin.allow_manual', true);
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = useState(null);
  const eventId = params.get('event') || '';
  const [mode, setMode] = useState('scan');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const q = useDebounced(search, 300);
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const lastScan = useRef({ code: '', at: 0 });
  const inFlight = useRef(false);

  useEffect(() => { checkinService.getEvents().then(setEvents); }, []);
  // Default to today's / the nearest event (RPC orders by distance from today).
  useEffect(() => {
    if (!events || events.length === 0) return;
    if (!eventId || !events.some((e) => e.id === eventId)) setParams({ event: events[0].id }, { replace: true });
  }, [events, eventId, setParams]);

  const refresh = useCallback(() => {
    if (!eventId) return;
    checkinService.getStats(eventId).then(setStats);
    checkinService.getRecentCheckins(eventId, 8).then(setRecent);
  }, [eventId]);
  useEffect(() => { refresh(); }, [refresh]);

  const run = async (token, method = 'qr', attendeeHint = null) => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setResult({ result: 'error', error: 'You are offline. Reconnect and scan again.' });
      return;
    }
    inFlight.current = true;
    setBusy(true);
    const res = await checkinService.checkInByToken(token, eventId, { method });
    inFlight.current = false;
    setBusy(false);
    setResult({ ...res, attendee_name: res.attendee_name || attendeeHint });
    if (res.result === 'valid') playSFX('ticketClick');
    if (navigator.vibrate) navigator.vibrate(res.result === 'valid' ? 60 : [80, 60, 80]);
    refresh();
  };

  const onDecoded = (text) => {
    const now = Date.now();
    // The camera decodes ~10×/s. While the same ticket stays in frame, keep
    // sliding the window so its result isn't replaced by "Already checked in"
    // (by this very scan); it re-triggers only after 10s out of view.
    if (text === lastScan.current.code && now - lastScan.current.at < 10000) {
      lastScan.current.at = now;
      return;
    }
    if (inFlight.current) return;
    lastScan.current = { code: text, at: now };
    run(text, 'qr');
  };

  useEffect(() => {
    if (mode !== 'manual' || !q.trim() || !eventId) { setMatches([]); return; }
    let cancelled = false;
    setSearching(true);
    checkinService.searchTickets(q, eventId).then((rows) => { if (!cancelled) { setMatches(rows); setSearching(false); } });
    return () => { cancelled = true; };
  }, [q, eventId, mode, result]);

  const selected = (events || []).find((e) => e.id === eventId);
  // Volunteers: show their window and flip to "expired" on time. The server
  // refuses scans after expiry regardless of what this clock says.
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setClock(Date.now()), 15000); return () => clearInterval(t); }, []);
  const accessEnds = selected?.access_expires_at ? new Date(selected.access_expires_at).getTime() : null;
  const accessOver = accessEnds != null && clock >= accessEnds;
  const homePath = user?.role === 'volunteer' ? '/volunteer/dashboard' : '/admin';
  const r = result && (RESULTS[result.result] || RESULTS.error);
  const pct = stats?.tickets_issued ? Math.round((100 * stats.checked_in) / stats.tickets_issued) : 0;

  return (
    <div data-lenis-prevent className="min-h-[100dvh] bg-[#11100C] text-[#E7D5A4] font-sans">
      <header className="sticky top-0 z-50 bg-[#141009] border-b border-[#C99A2E]/20 px-3 sm:px-5 py-2.5 flex items-center gap-2">
        <Link to={homePath} className="h-10 w-10 inline-flex items-center justify-center rounded text-[#E7D5A4]/70 hover:bg-[#C99A2E]/10" aria-label={user?.role === 'volunteer' ? 'Back to volunteer portal' : 'Back to console'}><Icon name="ChevronLeft" size={20} /></Link>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#C99A2E]">Check-in · {user?.full_name || user?.email}</div>
          <select
            aria-label="Event"
            value={eventId}
            onChange={(e) => { setParams({ event: e.target.value }, { replace: true }); setResult(null); }}
            className="w-full bg-transparent text-[15px] text-[#EFE2C0] font-condensed uppercase tracking-wide focus:outline-none truncate"
          >
            {events === null && <option>Loading events…</option>}
            {(events || []).map((e) => <option key={e.id} value={e.id} className="bg-[#11100C]">{e.name} — {fmt.date(e.event_date)}</option>)}
          </select>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-3 sm:px-5 py-4 flex flex-col gap-4 pb-16">
        {events && events.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Icon name="CalendarDays" size={28} className="mx-auto text-[#C99A2E]/60" />
            <div className="font-condensed text-lg uppercase mt-3">No events to check in</div>
            <p className="text-[13px] text-[#E7D5A4]/55 mt-1">You're not assigned to any published event. Ask an admin to add you to the event team.</p>
          </div>
        ) : (
          <>
            {accessEnds != null && (
              <div role="status" data-access-window className={cx('rounded-md border px-3 py-2 text-[13px] flex items-center gap-2', accessOver ? 'border-[#ef6b5e] bg-[#40150f] text-[#ffc4bd]' : 'border-[#2fb877]/60 bg-[#123d2a] text-[#b9f5d6]')}>
                <Icon name="Timer" size={16} />
                {accessOver ? 'Your check-in access has expired. Contact the event admin if you still need it.' : `Check-in access until ${fmt.time(selected.access_expires_at)}`}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2" aria-live="polite">
              {[['Checked in', stats?.checked_in, 'text-[#5fd3a0]'], ['To arrive', stats?.remaining, 'text-[#f5b544]'], ['Tickets', stats?.tickets_issued, 'text-[#EFE2C0]']].map(([label, n, cls]) => (
                <div key={label} className="bg-[#17130F] border border-[#C99A2E]/20 rounded-md py-2.5 text-center">
                  <div className={cx('font-condensed text-2xl tabular-nums leading-none', cls)}>{n ?? '—'}</div>
                  <div className="font-mono text-[9.5px] uppercase tracking-[0.15em] text-[#E7D5A4]/45 mt-1">{label}</div>
                </div>
              ))}
            </div>
            <div className="h-1.5 rounded-full bg-[#E7D5A4]/10 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Check-in progress">
              <div className="h-full bg-[#2fb877] transition-all" style={{ width: `${pct}%` }} />
            </div>

            {r && (
              <div role="status" className={cx('rounded-md border-2 p-4 flex gap-3 items-start', TONE[r.tone])}>
                <Icon name={r.icon} size={30} className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-condensed text-2xl uppercase leading-tight">{r.title}</div>
                  {result.attendee_name && <div className="text-[17px] mt-1 font-medium">{result.attendee_name}</div>}
                  <div className="font-mono text-[12px] opacity-80 mt-1">{[result.ticket_number, TIER_NAME[result.tier] || result.tier, result.registration_code].filter(Boolean).join(' · ')}</div>
                  {result.result === 'valid' && <div className="text-[12.5px] opacity-80 mt-1">{fmt.time(result.checked_in_at)}{result.checked_in_by_name ? ` · by ${result.checked_in_by_name}` : ''}{result.method === 'manual' ? ' · manual' : ''}</div>}
                  {detailLine(result) && <div className="text-[13px] mt-1.5">{detailLine(result)}</div>}
                </div>
                <button onClick={() => setResult(null)} className="h-9 w-9 inline-flex items-center justify-center rounded hover:bg-black/20" aria-label="Dismiss"><Icon name="X" size={18} /></button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {[{ id: 'scan', label: 'Scan QR', icon: 'ScanLine' }, ...(allowManual ? [{ id: 'manual', label: 'Manual', icon: 'Search' }] : [])].map((m) => (
                <button key={m.id} onClick={() => { setMode(m.id); setResult(null); }}
                  className={cx('h-12 rounded-md border inline-flex items-center justify-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em]', mode === m.id ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]' : 'border-[#C99A2E]/30 text-[#E7D5A4]/70')}>
                  <Icon name={m.icon} size={17} /> {m.label}
                </button>
              ))}
            </div>

            {mode === 'scan' && eventId ? (
              <div className="bg-[#17130F] border border-[#C99A2E]/20 rounded-md p-3">
                <QrScanner active onDecoded={onDecoded} />
                <p className="text-center text-[12px] text-[#E7D5A4]/45 mt-3">{busy ? 'Verifying…' : 'Point the camera at the ticket QR code.'}</p>
              </div>
            ) : mode === 'manual' && (
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Icon name="Search" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E7D5A4]/40" />
                  <input type="search" autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, booking code or ticket number"
                    className="w-full h-12 pl-10 pr-3 bg-[#17130F] border border-[#C99A2E]/30 rounded-md text-[15px] text-[#EFE2C0] placeholder:text-[#E7D5A4]/30 focus:outline-none focus:border-[#C99A2E]" />
                </div>
                {searching && <div className="text-[12px] text-[#E7D5A4]/45 px-1">Searching…</div>}
                {!searching && q && matches.length === 0 && <div className="text-[13px] text-[#E7D5A4]/50 px-1 py-3">No attendees found for "{q}".</div>}
                <ul className="flex flex-col gap-2">
                  {matches.map((t) => (
                    <li key={t.ticket_id} className="bg-[#17130F] border border-[#C99A2E]/20 rounded-md p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] text-[#EFE2C0] truncate">{t.attendee_name}</div>
                        <div className="font-mono text-[11.5px] text-[#E7D5A4]/50">{t.ticket_number} · {TIER_NAME[t.tier] || 'General'}</div>
                      </div>
                      {t.ticket_status === 'checked_in' ? <Badge status="checked_in">In {fmt.time(t.checked_in_at)}</Badge>
                        : t.ticket_status === 'cancelled' ? <Badge status="cancelled" />
                        : t.booking_status !== 'confirmed' ? <Badge status={t.booking_status} />
                        : <Button variant="success" size="lg" disabled={busy} onClick={() => run(t.token, 'manual', t.attendee_name)}>Check in</Button>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recent.length > 0 && (
              <section className="bg-[#17130F] border border-[#C99A2E]/20 rounded-md">
                <h2 className="px-4 py-2.5 border-b border-[#C99A2E]/15 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#C99A2E] m-0">Recent check-ins</h2>
                <ul className="divide-y divide-[#E7D5A4]/[0.06]">
                  {recent.map((c) => (
                    <li key={c.id} className="px-4 py-2 flex items-center gap-2 text-[13px]">
                      <span className="flex-1 min-w-0 truncate">{c.attendee_name} <span className="text-[#E7D5A4]/40 font-mono text-[11px]">{c.ticket_number}</span></span>
                      {c.method === 'manual' && <Badge status="manual" />}
                      <span className="font-mono text-[11px] text-[#E7D5A4]/45">{fmt.time(c.checked_in_at)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {selected && <p className="text-center font-mono text-[10.5px] text-[#E7D5A4]/35">{selected.name} · {selected.venue || 'Venue TBC'}</p>}
          </>
        )}
      </main>
    </div>
  );
}

export const TangyWorldCheckInPage = () => (
  <StaffAuthGate title="Check-in" subtitle="Event-day QR check-in for Tangy staff.">
    <CheckInWorkspace />
  </StaffAuthGate>
);
