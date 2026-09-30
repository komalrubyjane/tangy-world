import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useEvents } from '../hooks/useEvents';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../audio/AudioContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { WaitlistDirectory } from '../components/booking/WaitlistDirectory';
import { PosterEventCard } from '../components/ui/PosterEventCard';

const VENUE_FILTERS = ['ALL', 'STEPWELL', 'BARADARI', 'COURTYARD'];

export const SessionsPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const { events, loading: eventsLoading } = useEvents();
  const [filter, setFilter] = useState('ALL');
  const upcomingEvents = events.filter((e) => e.dbStatus !== 'past');
  usePageMeta({ title: 'Sessions', description: 'Upcoming Tangy sessions — live music in Hyderabad’s heritage spaces. Book tickets or join the waitlist.' });

  const filteredEvents = upcomingEvents.filter(evt => {
    if (filter === 'ALL') return true;
    return evt.venue?.toUpperCase().includes(filter);
  });

  return (
    <div className="min-h-screen bg-[#211915] text-[#E7D5A4] font-mono selection:bg-[#181614] selection:text-[#E7D5A4] overflow-x-hidden printNoise">
      <Navbar />

      {/* PAGE HERO */}
      <section className="relative pt-28 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#11100C]">

        {/* Giant faded year watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.08]">
          <span className="font-condensed text-[22vw] leading-none text-[#11100C] font-bold">2026</span>
        </div>

        <div className="relative z-10">
          <span className="font-mono text-xs text-[#E7D5A4]/80 tracking-[0.35em] uppercase font-bold mb-3 block">
            TANGY SESSIONS PROGRAMMING // 2026 CALENDAR
          </span>
          <h1 className="display text-5xl sm:text-8xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-4">
            ALL<br/>SESSIONS
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#11100C] py-3 sm:py-4 uppercase">
            EXPLORE CURRENT SESSIONS, FUTURE PROGRAMMING, CONCERT CULTURE AND WAITLIST RESERVATIONS IN HYDERABAD.
          </p>

          {/* Quick jump anchor links */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              { label: 'UPCOMING SESSIONS', hash: '#upcoming' },
              { label: 'CONCERT CULTURE', hash: '#culture' },
              { label: 'SESSION CALENDAR', hash: '#calendar' },
              { label: 'JOIN WAITLIST', hash: '#waitlist' }
            ].map((link) => (
              <a
                key={link.hash}
                href={link.hash}
                className="px-3 py-1.5 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-[#11100C] bg-[#EFE2C0] text-[#11100C] hover:bg-[#181614] hover:text-[#E7D5A4] transition-colors"
              >
                {link.label} ↓
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 1. UPCOMING SESSIONS GRID */}
      <section id="upcoming" className="pt-10 pb-16">
        <div className="bg-[#181614] border-b-2 border-[#B94717] py-3 px-4 sm:px-6 mb-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center font-mono text-[10px] text-[#E7D5A4]/60 uppercase tracking-widest">
            <span>{filteredEvents.length} SESSION{filteredEvents.length !== 1 ? 'S' : ''} AVAILABLE</span>
            <span>HYDERABAD // HERITAGE CONCERT SERIES</span>
          </div>
        </div>

        {/* VENUE FILTERS */}
        <div className="flex gap-2 justify-center mb-8 overflow-x-auto px-4 pb-1 scrollbar-none">
          {VENUE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-3 sm:px-4 py-2 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest border-2 border-[#11100C] flex-shrink-0 transition-colors ${
                filter === f
                  ? 'bg-[#11100C] text-[#E7D5A4]'
                  : 'bg-[#E7D5A4] text-[#11100C] hover:bg-[#11100C] hover:text-[#E7D5A4]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {eventsLoading && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center font-mono text-xs font-bold text-[#11100C] bg-[#EFE2C0] paperTexture border-2 border-dashed border-[#11100C]">
            LOADING SESSIONS...
          </div>
        )}

        {!eventsLoading && filteredEvents.length === 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center font-mono text-xs font-bold text-[#11100C] bg-[#EFE2C0] paperTexture border-2 border-dashed border-[#11100C]">
            NO SESSIONS MATCH THIS FILTER YET — CHECK BACK SOON.
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
          {!eventsLoading && filteredEvents.map((evt, idx) => (
            <PosterEventCard
              key={evt.id}
              event={evt}
              idx={idx}
              onBook={() => { playSFX('ticketClick'); navigate(`/sessions/${evt.slug || evt.id}`); }}
            />
          ))}
        </div>
      </section>

      {/* 2. CONCERT CULTURE SECTION */}
      <section id="culture" className="py-16 bg-[#181614] printNoise text-[#E7D5A4] border-t-8 border-[#11100C] px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <span className="font-mono text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mb-3 text-center">
            THE TANGY PHILOSOPHY
          </span>
          <h2 className="display text-4xl sm:text-6xl text-[#E7D5A4] text-center mb-8">CONCERT CULTURE</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'UNAMPLIFIED ACOUSTICS', desc: 'No loud artificial speakers. We collaborate with ancient limestone walls that naturally carry the sound for seconds.' },
              { title: 'NO PHONES IN THE AIR', desc: 'We ask all attendees to put away screens during performances. Be completely present in the physical room.' },
              { title: 'COLLECTIBLE TICKETS', desc: 'Every ticket is a physical hand-screenprinted artefact on 300gsm cotton paper for your archive.' }
            ].map((c, i) => (
              <div key={i} className="bg-[#211915] border-2 border-[#C99A2E]/40 p-6">
                <span className="font-mono text-xs font-bold text-[#C99A2E] block mb-2">RULE #0{i+1}</span>
                <h3 className="display text-2xl text-[#E7D5A4] mb-2">{c.title}</h3>
                <p className="font-mono text-xs text-[#E7D5A4]/75 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SESSION CALENDAR SECTION */}
      <section id="calendar" className="py-16 bg-[#EFE2C0] paperTexture text-[#11100C] border-t-8 border-[#11100C] px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <span className="font-mono text-xs text-[#B94717] tracking-[0.35em] uppercase font-bold block mb-2 text-center">
            2026 SEASON SCHEDULE
          </span>
          <h2 className="display text-4xl sm:text-6xl text-[#11100C] text-center mb-8">SESSION CALENDAR</h2>

          <div className="bg-[#EFE2C0] paperTexture border-4 border-[#11100C] p-4 sm:p-8 shadow-[10px_10px_0px_#11100C]">
            {events.length === 0 ? (
              <div className="text-center py-10 font-mono text-xs font-bold text-[#11100C]/60">
                NO SESSIONS ON THE CALENDAR YET — CHECK BACK SOON.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[...events]
                  .sort((a, b) => (a.rawDate || '').localeCompare(b.rawDate || ''))
                  .map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => { playSFX('ticketClick'); navigate(`/sessions/${evt.slug || evt.id}`); }}
                      className="text-left bg-[#E7D5A4] border-2 border-[#11100C] p-4 hover:-translate-y-0.5 transition-transform"
                    >
                      <span className="font-mono text-[9px] font-bold text-[#B94717] block mb-1 uppercase">{evt.date}</span>
                      <h4 className="display text-xl text-[#11100C] mb-1">{evt.title}</h4>
                      <p className="font-mono text-[10px] text-[#11100C]/70 mb-2">{evt.venue}</p>
                      <span className="inline-block bg-[#181614] text-[#E7D5A4] font-mono text-[8px] font-bold px-2 py-0.5">
                        {evt.status}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. JOIN WAITLIST SECTION */}
      <section id="waitlist" className="py-16 bg-[#181614] printNoise text-[#E7D5A4] border-t-8 border-[#B94717] px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-[#EFE2C0] paperTexture text-[#11100C] p-6 sm:p-10 border-4 border-[#11100C] shadow-[12px_12px_0px_#B94717]">
          <div className="text-center mb-6">
            <span className="font-mono text-[10px] text-[#B94717] tracking-[0.3em] uppercase font-bold block mb-2">
              PRIORITY TICKET RESERVATIONS
            </span>
            <h2 className="display text-3xl sm:text-5xl text-[#11100C]">JOIN THE WAITLIST</h2>
            <p className="font-mono text-xs text-[#11100C]/70 mt-2">
              Sold out? Join a session's waitlist — released seats are offered in order and held for you.
            </p>
          </div>

          {eventsLoading ? <p className="m-0 text-center font-mono text-xs">Loading sessions…</p> : <WaitlistDirectory events={events} />}
        </div>
      </section>

      <Footer />
    </div>
  );
};
