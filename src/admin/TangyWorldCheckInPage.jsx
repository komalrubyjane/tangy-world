import { useState, useEffect, useRef, useCallback } from 'react';
import { StaffAuthGate } from './StaffAuthGate';
import { useUserAuth } from '../context/UserAuthContext';
import { useEvents } from '../hooks/useEvents';
import { checkinService } from '../lib/checkinService';
import { useAudio } from '../audio/AudioContext';

// Every `result` value here is exactly what check_in_ticket() (0016_payments_tickets_checkin.sql)
// returns — this page only renders it, it never decides validity itself.
const RESULT_STYLES = {
  valid: { bg: '#10b981', label: '✓ VALID TICKET — CHECKED IN' },
  already_checked_in: { bg: '#f59e0b', label: '⚠ ALREADY CHECKED IN' },
  wrong_event: { bg: '#ef4444', label: '✕ TICKET IS FOR A DIFFERENT SESSION' },
  cancelled: { bg: '#ef4444', label: '✕ TICKET CANCELLED' },
  payment_not_confirmed: { bg: '#ef4444', label: '✕ PAYMENT NOT CONFIRMED' },
  not_found: { bg: '#ef4444', label: '✕ INVALID TICKET' },
  error: { bg: '#ef4444', label: '✕ UNABLE TO VERIFY TICKET' },
};

function QrScanner({ onDecoded, active }) {
  const containerId = 'tangy-qr-reader';
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (cancelled) return;
      const scanner = new Html5QrcodeScanner(containerId, { fps: 10, qrbox: 240 }, false);
      scanner.render(
        (decodedText) => onDecoded(decodedText),
        () => {} // ignore per-frame decode misses
      );
      scannerRef.current = scanner;
    });

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return <div id={containerId} className="w-full max-w-sm mx-auto" />;
}

function CheckInWorkspace() {
  const { user } = useUserAuth();
  const { playSFX } = useAudio();
  const realEvents = useEvents();
  const [eventId, setEventId] = useState('');
  const [mode, setMode] = useState('scan'); // 'scan' | 'manual'
  const [result, setResult] = useState(null); // the RPC's own result object
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [checkingInId, setCheckingInId] = useState(null);
  const [stats, setStats] = useState({ totalAttendees: 0, checkedIn: 0 });
  const [recent, setRecent] = useState([]);
  const [scanError, setScanError] = useState('');
  const lastScanRef = useRef({ code: '', at: 0 });

  const svc = checkinService;
  const eventsLoading = realEvents.loading;
  const liveEvents = realEvents.events.filter((e) => e.dbStatus && e.dbStatus !== 'draft');

  useEffect(() => {
    if (!eventId && liveEvents.length > 0) setEventId(liveEvents[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveEvents]);

  const refreshStats = useCallback(() => {
    if (!eventId) return;
    svc.getStats(eventId).then(setStats);
    svc.getRecentCheckins(eventId).then(setRecent);
  }, [eventId, svc]);

  useEffect(() => { refreshStats(); }, [refreshStats]);

  const runCheckIn = async (tokenOrScan) => {
    setScanError('');
    playSFX('ticketClick');
    // navigator.onLine is a hint, not proof — the RPC call itself is what
    // actually determines success; this just gives a faster, clearer
    // message for the common "phone lost signal" case rather than a raw
    // network error bubbling up.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setScanError('Unable to verify ticket. Please reconnect and try again.');
      return;
    }
    const res = await svc.checkInByToken(tokenOrScan, eventId);
    if (res.result === 'error') {
      setScanError(res.error || 'Unable to verify ticket. Please reconnect and try again.');
      return;
    }
    setResult(res);
    refreshStats();
  };

  const handleDecoded = (text) => {
    const now = Date.now();
    if (text === lastScanRef.current.code && now - lastScanRef.current.at < 3000) return; // debounce repeat frames
    lastScanRef.current = { code: text, at: now };
    runCheckIn(text);
  };

  useEffect(() => {
    if (mode !== 'manual' || !searchQuery) { setSearchResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      svc.searchBookings(searchQuery, eventId).then((rows) => {
        if (!cancelled) { setSearchResults(rows); setSearching(false); }
      });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [searchQuery, eventId, mode, svc]);

  const handleManualCheckIn = async (ticket) => {
    setCheckingInId(ticket.id);
    await runCheckIn(ticket.token);
    setCheckingInId(null);
    // Re-run the current search so this ticket's row reflects its new status.
    if (searchQuery) svc.searchBookings(searchQuery, eventId).then(setSearchResults);
  };

  const selectedEvent = liveEvents.find((e) => e.id === eventId);
  const style = result ? RESULT_STYLES[result.result] : null;

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono p-3 sm:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#191410] border-2 border-[#C99A2E] p-4 mb-6 rounded-sm">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[#E7D5A4]">TANGY WORLD // CHECK-IN</h1>
          <p className="font-serif italic text-xs text-[#E7D5A4]/70">Staff: {user.email}</p>
        </div>
        <select
          value={eventId}
          onChange={(e) => { setEventId(e.target.value); setResult(null); }}
          className="w-full sm:w-auto bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs text-[#E7D5A4]"
        >
          {eventsLoading && <option>Loading events...</option>}
          {liveEvents.map((e) => (
            <option key={e.id} value={e.id}>{e.title} — {e.date}</option>
          ))}
        </select>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#191410] border border-[#C99A2E]/60 p-3 text-center">
          <div className="text-[9px] text-[#C99A2E] uppercase">Attendees</div>
          <div className="text-2xl font-bold">{stats.totalAttendees}</div>
        </div>
        <div className="bg-[#191410] border border-[#C99A2E]/60 p-3 text-center">
          <div className="text-[9px] text-[#C99A2E] uppercase">Checked In</div>
          <div className="text-2xl font-bold text-[#10b981]">{stats.checkedIn}</div>
        </div>
        <div className="bg-[#191410] border border-[#C99A2E]/60 p-3 text-center">
          <div className="text-[9px] text-[#C99A2E] uppercase">Remaining</div>
          <div className="text-2xl font-bold text-[#f59e0b]">{Math.max(0, stats.totalAttendees - stats.checkedIn)}</div>
        </div>
      </div>

      {/* MODE TABS */}
      <div className="flex gap-2 mb-4">
        {[{ id: 'scan', label: '📷 QR SCAN' }, { id: 'manual', label: '🔍 MANUAL CHECK-IN' }].map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setResult(null); setScanError(''); }}
            className={`flex-1 py-3 text-xs font-bold uppercase border-2 ${mode === m.id ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]' : 'bg-[#191410] text-[#E7D5A4]/70 border-[#C99A2E]/30'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* NETWORK / RPC ERROR BANNER */}
      {scanError && (
        <div className="p-4 mb-4 border-2 border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444] font-bold text-center text-sm">
          {scanError}
          <button onClick={() => setScanError('')} className="block mx-auto mt-2 text-xs underline">DISMISS</button>
        </div>
      )}

      {/* RESULT BANNER */}
      {result && (
        <div className="p-4 mb-4 border-2 border-[#11100C] text-[#11100C] font-bold text-center" style={{ backgroundColor: style?.bg }}>
          <div className="text-lg">{style?.label}</div>
          {result.attendee_name && <div className="text-sm mt-1">{result.attendee_name}</div>}
          <div className="text-xs mt-1 font-mono">
            {[result.ticket_number, result.tier].filter(Boolean).join(' · ')}
          </div>
          {result.result === 'already_checked_in' && result.checked_in_at && (
            <div className="text-xs mt-1 font-mono">Checked in at: {new Date(result.checked_in_at).toLocaleTimeString()}</div>
          )}
          <button onClick={() => setResult(null)} className="mt-2 text-xs underline">DISMISS</button>
        </div>
      )}

      {!eventId ? (
        <div className="p-8 text-center text-xs text-[#E7D5A4]/60 border-2 border-dashed border-[#C99A2E]/30">
          No sessions available to check in against yet.
        </div>
      ) : mode === 'scan' ? (
        <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-4">
          <QrScanner active={mode === 'scan'} onDecoded={handleDecoded} />
          <p className="text-center text-[10px] text-[#E7D5A4]/50 mt-3">Point the camera at the attendee's ticket QR code.</p>
        </div>
      ) : (
        <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by registration code, name, email, or phone..."
            className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-3 text-sm text-[#E7D5A4] mb-3"
          />
          {searching && <div className="text-xs text-[#E7D5A4]/50">Searching...</div>}
          <div className="flex flex-col gap-3">
            {searchResults.map((b) => (
              <div key={b.id} className="bg-[#11100C] border border-[#C99A2E]/30 p-3">
                <div className="text-sm font-bold">{b.attendee_name}</div>
                <div className="text-[10px] text-[#E7D5A4]/60 mb-2">{b.registration_code} · {b.attendee_email} · {b.events?.name} · {b.status}</div>
                {(b.tickets || []).length === 0 ? (
                  <div className="text-[10px] text-[#E7D5A4]/40 uppercase">No tickets issued (payment not confirmed).</div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {b.tickets.map((t) => (
                      <div key={t.id} className="flex justify-between items-center bg-[#191410] border border-[#C99A2E]/20 px-2.5 py-1.5">
                        <span className="text-[10px] font-mono">{t.ticket_number}</span>
                        {t.status === 'checked_in' ? (
                          <span className="text-[10px] font-bold text-[#f59e0b]">✓ CHECKED IN</span>
                        ) : (
                          <button
                            onClick={() => handleManualCheckIn(t)}
                            disabled={checkingInId === t.id}
                            className="px-3 py-1.5 bg-[#10b981] text-[#11100C] text-[10px] font-bold uppercase disabled:opacity-50"
                          >
                            {checkingInId === t.id ? 'CHECKING...' : 'CHECK IN'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT CHECK-INS */}
      {recent.length > 0 && (
        <div className="mt-6 bg-[#191410] border border-[#C99A2E]/30 p-4">
          <div className="text-[10px] text-[#C99A2E] uppercase font-bold mb-2">Recent Check-ins</div>
          <div className="flex flex-col gap-1 text-xs">
            {recent.map((r) => (
              <div key={r.id} className="flex justify-between border-b border-[#E7D5A4]/10 py-1">
                <span>{r.bookings?.attendee_name} ({r.tickets?.ticket_number})</span>
                <span className="text-[#E7D5A4]/50">{new Date(r.checked_in_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedEvent && (
        <p className="mt-4 text-center text-[9px] text-[#E7D5A4]/40">Checking in for: {selectedEvent.title}</p>
      )}
    </div>
  );
}

export const TangyWorldCheckInPage = () => (
  <StaffAuthGate title="TANGY WORLD ACCESS" subtitle="Event Check-in Terminal — Staff Only">
    <CheckInWorkspace />
  </StaffAuthGate>
);
