import { useState, useEffect, useRef, useCallback } from 'react';
import { StaffAuthGate } from './StaffAuthGate';
import { useUserAuth } from '../context/UserAuthContext';
import { useEvents } from '../hooks/useEvents';
import { checkinService } from '../lib/checkinService';
import { mockCheckinAdapter } from '../services/mockCheckinAdapter';
import { eventService } from '../services/eventService';
import { isMockAuth } from '../config/auth';
import { useAudio } from '../audio/AudioContext';

const RESULT_STYLES = {
  success: { bg: '#10b981', label: '✓ CHECK-IN SUCCESSFUL' },
  duplicate: { bg: '#f59e0b', label: '⚠ ALREADY CHECKED IN' },
  invalid: { bg: '#ef4444', label: '✕ INVALID REGISTRATION' },
  wrongEvent: { bg: '#ef4444', label: '✕ TICKET IS FOR A DIFFERENT SESSION' },
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
  const [result, setResult] = useState(null); // { type, booking }
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState({ totalAttendees: 0, checkedIn: 0 });
  const [recent, setRecent] = useState([]);
  const lastScanRef = useRef({ code: '', at: 0 });

  // Mock mode: source events from the mock account system's own event list
  // (src/data/mock/events.js via eventService) — the same dataset mock
  // bookings/Profile/Admin all key off — and swap in the localStorage-backed
  // check-in adapter instead of the real Supabase-backed checkinService.
  const svc = isMockAuth ? mockCheckinAdapter : checkinService;
  const eventsLoading = isMockAuth ? false : realEvents.loading;
  const liveEvents = isMockAuth
    ? eventService.getAll().map((e) => ({ id: e.id, title: e.name, date: e.date, dbStatus: e.status }))
    : realEvents.events.filter((e) => e.dbStatus && e.dbStatus !== 'draft');

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

  const handleCheckIn = async (booking) => {
    const res = await svc.checkIn(booking.id, eventId, user.id);
    playSFX('ticketClick');
    if (res.success) {
      setResult({ type: 'success', booking });
      refreshStats();
    } else if (res.alreadyCheckedIn) {
      setResult({ type: 'duplicate', booking });
    } else {
      setResult({ type: 'invalid', booking, error: res.error });
    }
  };

  const handleDecoded = async (text) => {
    const now = Date.now();
    if (text === lastScanRef.current.code && now - lastScanRef.current.at < 3000) return; // debounce repeat frames
    lastScanRef.current = { code: text, at: now };

    const lookup = await svc.lookupByCode(text, eventId);
    if (!lookup.found) {
      playSFX('ticketClick');
      setResult({ type: 'invalid', code: text });
      return;
    }
    if (lookup.wrongEvent) {
      playSFX('ticketClick');
      setResult({ type: 'wrongEvent', booking: lookup.booking });
      return;
    }
    if (lookup.alreadyCheckedIn) {
      playSFX('ticketClick');
      setResult({ type: 'duplicate', booking: lookup.booking });
      return;
    }
    handleCheckIn(lookup.booking);
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

  const selectedEvent = liveEvents.find((e) => e.id === eventId);

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
            onClick={() => { setMode(m.id); setResult(null); }}
            className={`flex-1 py-3 text-xs font-bold uppercase border-2 ${mode === m.id ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]' : 'bg-[#191410] text-[#E7D5A4]/70 border-[#C99A2E]/30'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* RESULT BANNER */}
      {result && (
        <div
          className="p-4 mb-4 border-2 border-[#11100C] text-[#11100C] font-bold text-center"
          style={{ backgroundColor: RESULT_STYLES[result.type]?.bg }}
        >
          <div className="text-lg">{RESULT_STYLES[result.type]?.label}</div>
          {result.booking && (
            <div className="text-xs mt-1 font-mono">
              {result.booking.attendee_name} · {result.booking.registration_code} · {result.booking.quantity} ticket(s)
            </div>
          )}
          {!result.booking && result.code && (
            <div className="text-xs mt-1 font-mono">Code: {result.code}</div>
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
          <div className="flex flex-col gap-2">
            {searchResults.map((b) => {
              const checkedIn = b.checkins && b.checkins.length > 0;
              return (
                <div key={b.id} className="flex justify-between items-center bg-[#11100C] border border-[#C99A2E]/30 p-3">
                  <div>
                    <div className="text-sm font-bold">{b.attendee_name}</div>
                    <div className="text-[10px] text-[#E7D5A4]/60">{b.registration_code} · {b.attendee_email} · {b.events?.name}</div>
                  </div>
                  {checkedIn ? (
                    <span className="text-[10px] font-bold text-[#f59e0b]">✓ CHECKED IN</span>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(b)}
                      className="px-3 py-2 bg-[#10b981] text-[#11100C] text-[10px] font-bold uppercase"
                    >
                      CHECK IN
                    </button>
                  )}
                </div>
              );
            })}
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
                <span>{r.bookings?.attendee_name} ({r.bookings?.registration_code})</span>
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
