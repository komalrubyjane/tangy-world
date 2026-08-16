import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useAudio } from '../audio/AudioContext';
import { eventService } from '../services/eventService';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];
const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// Builds a Mon-Sun grid of Date objects (or null for padding) covering the given month.
function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // JS getDay(): 0=Sun..6=Sat. Convert to Mon-first index: 0=Mon..6=Sun.
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const SessionCalendarPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const today = useMemo(() => new Date(), []);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(null);

  const monthEvents = useMemo(
    () => eventService.getByMonth(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const eventsByDay = useMemo(() => {
    const map = {};
    monthEvents.forEach((evt) => {
      const d = new Date(`${evt.date}T00:00:00`);
      const dayNum = d.getDate();
      if (!map[dayNum]) map[dayNum] = [];
      map[dayNum].push(evt);
    });
    return map;
  }, [monthEvents]);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const isToday = (day) =>
    day != null &&
    viewYear === today.getFullYear() &&
    viewMonth === today.getMonth() &&
    day === today.getDate();

  const goPrevMonth = () => {
    playSFX('ticketClick');
    setSelectedDay(null);
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const goNextMonth = () => {
    playSFX('ticketClick');
    setSelectedDay(null);
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const goToday = () => {
    playSFX('ticketClick');
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  const handleDayClick = (day) => {
    if (day == null || !eventsByDay[day]) return;
    playSFX('ticketClick');
    setSelectedDay(day === selectedDay ? null : day);
  };

  const selectedEvents = selectedDay != null ? (eventsByDay[selectedDay] || []) : [];

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/sessions" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO SESSIONS</a>
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            2026 SEASON SCHEDULE
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-8xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            SESSION<br/>CALENDAR
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            BROWSE THE FULL SEASON MONTH BY MONTH. TAP A MARKED DAY TO SEE EVENT DETAILS AND BOOK.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-16 max-w-5xl mx-auto px-3 sm:px-6">
        {/* MONTH NAV BAR */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={goPrevMonth}
            className="px-3 sm:px-4 py-2 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest border-2 border-[#C99A2E] text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors shrink-0"
            aria-label="Previous month"
          >
            ← PREV
          </button>

          <div className="text-center flex-1 min-w-0">
            <h2 className="display text-xl sm:text-4xl text-[#E7D5A4] leading-none truncate">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={goToday}
              className="px-3 sm:px-4 py-2 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest border-2 border-[#B94717] bg-[#B94717] text-[#E7D5A4] hover:bg-[#11100C] hover:border-[#11100C] transition-colors"
            >
              TODAY
            </button>
            <button
              onClick={goNextMonth}
              className="px-3 sm:px-4 py-2 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest border-2 border-[#C99A2E] text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors"
              aria-label="Next month"
            >
              NEXT →
            </button>
          </div>
        </div>

        {/* DESKTOP / TABLET GRID (sm and up) */}
        <div className="hidden sm:block bg-[#F5E9C9] border-4 border-[#11100C] shadow-[10px_10px_0px_#11100C] p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAY_LABELS.map((wd) => (
              <div key={wd} className="text-center font-mono text-[10px] font-bold text-[#B94717] uppercase tracking-wider py-1">
                {wd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((day, idx) => {
              const hasEvents = day != null && eventsByDay[day];
              const selected = day != null && day === selectedDay;
              return (
                <button
                  key={idx}
                  disabled={day == null}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square flex flex-col items-center justify-center relative border font-mono text-xs transition-colors ${
                    day == null
                      ? 'border-transparent cursor-default'
                      : isToday(day)
                      ? 'border-2 border-[#B94717] text-[#11100C] font-bold'
                      : 'border-[#11100C]/15 text-[#11100C]'
                  } ${hasEvents ? 'bg-[#E7D5A4] hover:bg-[#C99A2E] cursor-pointer font-bold' : day != null ? 'bg-transparent' : ''} ${
                    selected ? 'ring-2 ring-[#11100C] bg-[#C99A2E]' : ''
                  }`}
                >
                  {day}
                  {hasEvents && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#B94717]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* MOBILE COMPACT LIST-PER-WEEK VIEW (< sm) */}
        <div className="sm:hidden bg-[#F5E9C9] border-4 border-[#11100C] shadow-[6px_6px_0px_#11100C] p-3">
          {Array.from({ length: grid.length / 7 }).map((_, weekIdx) => {
            const week = grid.slice(weekIdx * 7, weekIdx * 7 + 7);
            if (week.every((d) => d == null)) return null;
            return (
              <div key={weekIdx} className="flex gap-1.5 overflow-x-auto pb-2 mb-2 last:mb-0 scrollbar-none">
                {week.map((day, dIdx) => {
                  const hasEvents = day != null && eventsByDay[day];
                  const selected = day != null && day === selectedDay;
                  return (
                    <button
                      key={dIdx}
                      disabled={day == null}
                      onClick={() => handleDayClick(day)}
                      className={`shrink-0 w-12 h-14 flex flex-col items-center justify-center border font-mono text-[10px] relative ${
                        day == null
                          ? 'border-transparent'
                          : isToday(day)
                          ? 'border-2 border-[#B94717] text-[#11100C] font-bold'
                          : 'border-[#11100C]/15 text-[#11100C]'
                      } ${hasEvents ? 'bg-[#E7D5A4] font-bold' : ''} ${selected ? 'ring-2 ring-[#11100C] bg-[#C99A2E]' : ''}`}
                    >
                      <span className="text-[8px] opacity-60">{WEEKDAY_LABELS[dIdx]}</span>
                      <span>{day}</span>
                      {hasEvents && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#B94717]" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* EVENT LEGEND */}
        <div className="flex items-center gap-4 mt-4 font-mono text-[9px] sm:text-[10px] text-[#E7D5A4]/60 uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#B94717] inline-block" /> HAS SESSION</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 border-2 border-[#B94717] inline-block" /> TODAY</span>
        </div>

        {/* SELECTED DAY EVENT DETAILS */}
        <div className="mt-8 sm:mt-10">
          {selectedDay == null ? (
            <div className="text-center py-10 sm:py-12 border-2 border-dashed border-[#C99A2E]/30 font-mono text-xs text-[#E7D5A4]/50 uppercase tracking-widest">
              TAP A MARKED DAY ON THE CALENDAR TO SEE SESSION DETAILS.
            </div>
          ) : selectedEvents.length === 0 ? (
            <div className="text-center py-10 sm:py-12 border-2 border-dashed border-[#C99A2E]/30 font-mono text-xs text-[#E7D5A4]/50 uppercase tracking-widest">
              NO SESSIONS SCHEDULED ON {MONTH_NAMES[viewMonth]} {selectedDay}, {viewYear}.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold">
                SESSIONS ON {MONTH_NAMES[viewMonth]} {selectedDay}, {viewYear}
              </span>
              {selectedEvents.map((evt) => {
                const spotsLeft = evt.capacity - evt.sold;
                const isSoldOut = evt.status === 'sold-out' || spotsLeft <= 0;
                return (
                  <div key={evt.id} className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] shadow-[6px_6px_0px_#11100C] p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="sm:w-40 shrink-0 aspect-[4/3] sm:aspect-square overflow-hidden border-2 border-[#11100C]">
                      <img src={evt.image} alt={evt.name} className="w-full h-full object-cover filter grayscale contrast-125" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center font-mono text-[9px] sm:text-[10px] font-bold text-[#B94717] uppercase mb-2 flex-wrap gap-1">
                        <span>{evt.time}</span>
                        <span className={isSoldOut ? 'text-[#5A120D]' : 'text-[#2D5A1B]'}>
                          {isSoldOut ? 'SOLD OUT' : `${spotsLeft} SPOTS LEFT`}
                        </span>
                      </div>
                      <h3 className="display text-2xl sm:text-3xl text-[#11100C] leading-tight mb-2">{evt.name}</h3>
                      <p className="font-mono text-[10px] sm:text-xs text-[#B94717] font-bold uppercase mb-2">{evt.venue} · {evt.city}</p>
                      <p className="font-mono text-[10px] sm:text-xs text-[#11100C]/75 leading-relaxed mb-3">{evt.description}</p>
                      <p className="font-mono text-[9px] text-[#11100C]/60 uppercase mb-4">
                        ARTISTS: {evt.artists?.length ? evt.artists.join(', ') : 'TO BE ANNOUNCED'} · ₹{evt.price}
                      </p>
                      <button
                        onClick={() => { playSFX('ticketClick'); !isSoldOut && navigate(`/book/${evt.slug || evt.id}`); }}
                        disabled={isSoldOut}
                        className={`w-full sm:w-auto px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest border-2 transition-colors ${
                          isSoldOut
                            ? 'bg-[#5A120D] text-[#E7D5A4]/60 border-[#5A120D] cursor-not-allowed'
                            : 'bg-[#11100C] text-[#E7D5A4] border-[#11100C] hover:bg-[#B94717] hover:border-[#B94717]'
                        }`}
                      >
                        {isSoldOut ? 'SOLD OUT ✗' : 'BOOK →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};
