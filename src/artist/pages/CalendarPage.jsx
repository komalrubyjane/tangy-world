import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';

export const CalendarPage = () => {
  const { playSFX } = useAudio();
  const [month, setMonth] = useState(5); // June (0-indexed)
  const [year] = useState(2025);
  const [selected, setSelected] = useState(null);

  const [availability, setAvailability] = useState({
    14: 'booked', 20: 'available', 21: 'available', 22: 'available',
    5: 'unavailable', 6: 'unavailable', 7: 'unavailable',
    10: 'tentative', 11: 'tentative',
  });

  const [mode, setMode] = useState('available');
  const [savedMsg, setSavedMsg] = useState('');

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();

  const handleSetDay = (day) => {
    playSFX('ticketClick');
    setAvailability(prev => ({ ...prev, [day]: mode }));
    setSelected(day);
  };

  const handleSave = () => {
    playSFX('ticketClick');
    setSavedMsg('AVAILABILITY PREFERENCES SAVED!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const legendItems = [
    { key: 'available', label: 'AVAILABLE FOR BOOKINGS', color: '#2e6834', text: '#ecdcaf' },
    { key: 'booked', label: 'BOOKED / CONFIRMED', color: '#c2272a', text: '#ecdcaf' },
    { key: 'tentative', label: 'TENTATIVE / PENDING', color: '#d1a437', text: '#191410' },
    { key: 'unavailable', label: 'UNAVAILABLE / BLOCKED', color: '#191410', text: '#ecdcaf' },
  ];

  const getDayBg = (day, status) => {
    if (selected === day) {
      if (mode === 'available') return 'bg-[#2e6834] text-[#ecdcaf] font-bold border-[#191410]';
      if (mode === 'booked') return 'bg-[#c2272a] text-[#ecdcaf] font-bold border-[#191410]';
      if (mode === 'tentative') return 'bg-[#d1a437] text-[#191410] font-bold border-[#191410]';
      if (mode === 'unavailable') return 'bg-[#191410] text-[#ecdcaf] font-bold border-[#191410]';
    }
    if (status === 'available') return 'bg-[#2e6834] text-[#ecdcaf] font-bold';
    if (status === 'booked') return 'bg-[#c2272a] text-[#ecdcaf] font-bold';
    if (status === 'tentative') return 'bg-[#d1a437] text-[#191410] font-bold';
    if (status === 'unavailable') return 'bg-[#191410] text-[#ecdcaf]/50';
    return 'bg-[#ecdcaf] text-[#191410] hover:bg-[#c2272a] hover:text-[#ecdcaf]';
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-6xl mx-auto flex flex-col gap-6 text-left">
      
      {/* HEADER BANNER */}
      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[10px_10px_0px_#4c1210] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
            ARTIST WORKSPACE // SCHEDULING
          </span>
          <h1 className="font-poster text-4xl sm:text-5xl text-[#191410] leading-none mt-1">
            AVAILABILITY CALENDAR
          </h1>
          <p className="font-mono text-xs text-[#241a12]/80 mt-1 uppercase">
            Click any date cell and choose a status from the right panel to update your schedule.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#c2272a] hover:bg-[#c2272a] transition-all"
        >
          SAVE AVAILABILITY →
        </button>
      </div>

      {savedMsg && (
        <div className="p-3 bg-[#2e6834] text-[#ecdcaf] font-mono text-xs font-bold border-2 border-[#191410] shadow-[4px_4px_0px_#191410]">
          ✓ {savedMsg}
        </div>
      )}

      {/* CALENDAR & CONTROL SIDEBAR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CALENDAR GRID (2 COLS) */}
        <div className="lg:col-span-2 bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410] flex flex-col gap-4">
          
          {/* MONTH NAV */}
          <div className="flex justify-between items-center border-b-2 border-[#191410] pb-4">
            <button 
              onClick={() => setMonth(m => Math.max(0, m - 1))} 
              className="px-3 py-1 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold border border-[#191410]"
            >
              ← PREV
            </button>
            <h2 className="font-poster text-3xl text-[#191410]">
              {monthNames[month].toUpperCase()} {year}
            </h2>
            <button 
              onClick={() => setMonth(m => Math.min(11, m + 1))} 
              className="px-3 py-1 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold border border-[#191410]"
            >
              NEXT →
            </button>
          </div>

          {/* DAY HEADERS */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-bold text-[#c2272a] uppercase border-b border-[#191410]/20 pb-2">
            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* DAYS GRID */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-0" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const status = availability[day];
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSetDay(day)}
                  className={`aspect-square border-2 border-[#191410] font-mono text-xs font-bold flex flex-col items-center justify-center relative transition-all active:scale-95 ${getDayBg(day, status)}`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#c2272a]" />
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* STATUS MODE SELECTOR & SUMMARY (1 COL) */}
        <div className="flex flex-col gap-6">
          
          {/* MODE PAINTER SELECTOR */}
          <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410]">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase block border-b-2 border-[#191410] pb-3 mb-4">
              SET DATE STATUS
            </span>

            <div className="flex flex-col gap-2">
              {legendItems.map((item) => (
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

          {/* MONTHLY SUMMARY COUNTERS */}
          <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410]">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase block border-b-2 border-[#191410] pb-3 mb-4">
              MONTH SUMMARY ({monthNames[month].toUpperCase()})
            </span>

            <div className="flex flex-col gap-2 font-mono text-xs font-bold">
              {legendItems.map((item) => {
                const count = Object.values(availability).filter(v => v === item.key).length;
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
