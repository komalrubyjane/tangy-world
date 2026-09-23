import { useState, useEffect, useCallback } from 'react';
import { useAudio } from '../../audio/AudioContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SETTABLE = [
  { key: 'available', label: 'AVAILABLE FOR BOOKINGS', color: '#2e6834', text: '#ecdcaf' },
  { key: 'tentative', label: 'TENTATIVE / PENDING', color: '#d1a437', text: '#191410' },
  { key: 'unavailable', label: 'UNAVAILABLE / BLOCKED', color: '#191410', text: '#ecdcaf' },
  { key: 'clear', label: 'CLEAR SELECTION', color: '#e9decb', text: '#191410' },
];

const pad = (n) => String(n).padStart(2, '0');
const toISODate = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

// Real availability (artist_availability, self-settable) overlaid with real
// confirmed performances (event_artists — 'booked', never self-settable: an
// artist can't misrepresent their own booking status). See
// 0012_artist_availability.sql — this used to be pure local React state
// with a SAVE button that persisted nothing.
export const CalendarPage = () => {
  const { playSFX } = useAudio();
  const { user } = useAuth();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selected, setSelected] = useState(null);
  const [availability, setAvailability] = useState({}); // date -> status
  const [bookedDates, setBookedDates] = useState(new Set());
  const [mode, setMode] = useState('available');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const monthStart = toISODate(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthEnd = toISODate(year, month, daysInMonth);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [{ data: avail }, { data: performances }] = await Promise.all([
      supabase.from('artist_availability').select('date, status').eq('artist_id', user.id).gte('date', monthStart).lte('date', monthEnd),
      supabase.from('event_artists').select('events(event_date)').eq('artist_id', user.id),
    ]);
    setAvailability(Object.fromEntries((avail || []).map((a) => [a.date, a.status])));
    setBookedDates(new Set((performances || []).map((p) => p.events?.event_date).filter(Boolean)));
    setLoading(false);
  }, [user?.id, monthStart, monthEnd]);

  useEffect(() => { load(); }, [load]);

  const handleSetDay = async (day) => {
    const iso = toISODate(year, month, day);
    if (bookedDates.has(iso)) return; // booked days aren't self-editable
    playSFX('ticketClick');
    setSelected(day);
    setError('');
    if (mode === 'clear') {
      await supabase.from('artist_availability').delete().eq('artist_id', user.id).eq('date', iso);
    } else {
      const { error: err } = await supabase.from('artist_availability').upsert({ artist_id: user.id, date: iso, status: mode }, { onConflict: 'artist_id,date' });
      if (err) { setError(err.message); return; }
    }
    load();
  };

  const goPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else { setMonth((m) => m - 1); }
  };
  const goNextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else { setMonth((m) => m + 1); }
  };

  const firstDay = new Date(year, month, 1).getDay();

  const statusFor = (day) => {
    const iso = toISODate(year, month, day);
    if (bookedDates.has(iso)) return 'booked';
    return availability[iso];
  };

  const getDayBg = (status) => {
    if (status === 'available') return 'bg-[#2e6834] text-[#ecdcaf] font-bold';
    if (status === 'booked') return 'bg-[#c2272a] text-[#ecdcaf] font-bold';
    if (status === 'tentative') return 'bg-[#d1a437] text-[#191410] font-bold';
    if (status === 'unavailable') return 'bg-[#191410] text-[#ecdcaf]/50';
    return 'bg-[#ecdcaf] text-[#191410] hover:bg-[#c2272a] hover:text-[#ecdcaf]';
  };

  const legendItems = [
    { key: 'available', label: 'AVAILABLE FOR BOOKINGS', color: '#2e6834' },
    { key: 'booked', label: 'BOOKED / CONFIRMED', color: '#c2272a' },
    { key: 'tentative', label: 'TENTATIVE / PENDING', color: '#d1a437' },
    { key: 'unavailable', label: 'UNAVAILABLE / BLOCKED', color: '#191410' },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-6xl mx-auto flex flex-col gap-6 text-left">

      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[10px_10px_0px_#4c1210] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">ARTIST WORKSPACE // SCHEDULING</span>
          <h1 className="font-poster text-4xl sm:text-5xl text-[#191410] leading-none mt-1">AVAILABILITY CALENDAR</h1>
          <p className="font-mono text-xs text-[#241a12]/80 mt-1 uppercase">
            Pick a status on the right, then click a date — saved instantly. Booked dates come from confirmed performances and can't be edited here.
          </p>
        </div>
      </div>

      {error && <div className="p-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold border-2 border-[#191410]">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410] flex flex-col gap-4">
          <div className="flex justify-between items-center border-b-2 border-[#191410] pb-4">
            <button onClick={goPrevMonth} className="px-3 py-1 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold border border-[#191410]">← PREV</button>
            <h2 className="font-poster text-3xl text-[#191410]">{monthNames[month].toUpperCase()} {year}</h2>
            <button onClick={goNextMonth} className="px-3 py-1 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold border border-[#191410]">NEXT →</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-bold text-[#c2272a] uppercase border-b border-[#191410]/20 pb-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => <div key={d}>{d}</div>)}
          </div>

          {loading ? (
            <div className="text-center font-mono text-xs opacity-50 py-10">LOADING...</div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="aspect-square opacity-0" />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const status = statusFor(day);
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSetDay(day)}
                    disabled={status === 'booked'}
                    className={`aspect-square border-2 border-[#191410] font-mono text-xs font-bold flex flex-col items-center justify-center relative transition-all active:scale-95 disabled:cursor-not-allowed ${getDayBg(status)} ${selected === day ? 'ring-2 ring-[#c2272a]' : ''}`}
                  >
                    <span>{day}</span>
                    {isToday && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#c2272a]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410]">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase block border-b-2 border-[#191410] pb-3 mb-4">SET DATE STATUS</span>
            <div className="flex flex-col gap-2">
              {SETTABLE.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { playSFX('ticketClick'); setMode(item.key); }}
                  className={`w-full p-3 font-mono text-[10px] font-bold text-left uppercase border-2 border-[#191410] flex items-center justify-between transition-all ${mode === item.key ? 'shadow-[4px_4px_0px_#191410] scale-[1.02]' : 'opacity-80'}`}
                  style={{ backgroundColor: item.color, color: item.text }}
                >
                  <span>{item.label}</span>
                  {mode === item.key && <span>● ACTIVE</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410]">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase block border-b-2 border-[#191410] pb-3 mb-4">MONTH SUMMARY ({monthNames[month].toUpperCase()})</span>
            <div className="flex flex-col gap-2 font-mono text-xs font-bold">
              {legendItems.map((item) => {
                const count = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter((d) => statusFor(d) === item.key).length;
                return (
                  <div key={item.key} className="flex justify-between items-center p-2 bg-[#ecdcaf] border border-[#191410]">
                    <span className="text-[10px]">{item.label}</span>
                    <span className="text-[#c2272a]">{count} DAYS</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
