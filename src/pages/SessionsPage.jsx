import { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useEvents } from '../hooks/useEvents';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../audio/AudioContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { isMockAuth } from '../config/auth';
import { waitlistService } from '../services/waitlistService';

const VENUE_FILTERS = ['ALL', 'STEPWELL', 'BARADARI', 'COURTYARD'];

export const SessionsPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const { events, loading: eventsLoading } = useEvents();
  const [filter, setFilter] = useState('ALL');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistEventId, setWaitlistEventId] = useState('');
  const [waitlistError, setWaitlistError] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

  const upcomingEvents = events.filter((e) => e.dbStatus !== 'past');

  useEffect(() => {
    if (!waitlistEventId && upcomingEvents.length > 0) {
      setWaitlistEventId(upcomingEvents[0].id);
    }
  }, [upcomingEvents, waitlistEventId]);

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setWaitlistError('');
    if (!waitlistName || !waitlistEmail) return;
    if (!/^\S+@\S+\.\S+$/.test(waitlistEmail)) {
      setWaitlistError('Please enter a valid email address.');
      return;
    }
    if (waitlistPhone && !/^[\d\s+()-]{7,15}$/.test(waitlistPhone)) {
      setWaitlistError('Please enter a valid phone number, or leave it blank.');
      return;
    }
    playSFX('ticketClick');

    if (isMockAuth) {
      if (waitlistEventId) {
        waitlistService.join({ eventId: waitlistEventId, name: waitlistName, email: waitlistEmail, phone: waitlistPhone || null });
      }
      setWaitlistSubmitted(true);
      return;
    }

    if (!isSupabaseConfigured || !waitlistEventId) {
      setWaitlistSubmitted(true);
      return;
    }

    setWaitlistSubmitting(true);
    const { error } = await supabase.from('waitlist').insert({
      event_id: waitlistEventId,
      name: waitlistName,
      email: waitlistEmail,
      phone: waitlistPhone || null,
    });
    setWaitlistSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        setWaitlistError("You're already on the waitlist for this session.");
      } else {
        setWaitlistError('Something went wrong — please try again.');
      }
      return;
    }
    setWaitlistSubmitted(true);
  };

  const filteredEvents = upcomingEvents.filter(evt => {
    if (filter === 'ALL') return true;
    return evt.venue?.toUpperCase().includes(filter);
  });

  const STATUS_STYLES = {
    'SOLD OUT': { bg: '#5A120D', text: '#E7D5A4' },
    'AVAILABLE': { bg: '#2D5A1B', text: '#E7D5A4' },
    'ALMOST GONE': { bg: '#B94717', text: '#E7D5A4' },
    'UPCOMING': { bg: '#11100C', text: '#C99A2E' }
  };

  return (
    <div className="min-h-screen bg-[#B94717] text-[#E7D5A4] font-mono selection:bg-[#11100C] selection:text-[#E7D5A4] overflow-x-hidden">
      <Navbar />

      {/* PAGE HERO */}
      <section className="relative pt-28 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#11100C]">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-multiply pointer-events-none" />

        {/* Giant faded year watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.08]">
          <span className="font-display text-[22vw] leading-none text-[#11100C] font-bold">2026</span>
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
                className="px-3 py-1.5 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-[#11100C] bg-[#E7D5A4] text-[#11100C] hover:bg-[#11100C] hover:text-[#E7D5A4] transition-colors"
              >
                {link.label} ↓
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 1. UPCOMING SESSIONS GRID */}
      <section id="upcoming" className="pt-10 pb-16">
        <div className="bg-[#11100C] border-b-2 border-[#B94717] py-3 px-4 sm:px-6 mb-8">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center font-mono text-xs font-bold text-[#11100C] bg-[#E7D5A4] border-2 border-dashed border-[#11100C]">
            LOADING SESSIONS...
          </div>
        )}

        {!eventsLoading && filteredEvents.length === 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center font-mono text-xs font-bold text-[#11100C] bg-[#E7D5A4] border-2 border-dashed border-[#11100C]">
            NO SESSIONS MATCH THIS FILTER YET — CHECK BACK SOON.
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
          {!eventsLoading && filteredEvents.map((evt, idx) => {
            const statusStyle = STATUS_STYLES[evt.status] || STATUS_STYLES['AVAILABLE'];
            const isSoldOut = evt.status === 'SOLD OUT';

            return (
              <div
                key={evt.id}
                className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] shadow-[6px_6px_0px_#11100C] sm:shadow-[12px_12px_0px_#11100C] flex flex-col justify-between overflow-hidden group hover:-translate-y-1 transition-transform duration-200"
              >
                <div className="relative w-full aspect-[4/3] bg-black border-b-4 border-[#11100C] overflow-hidden">
                  <img
                    src={evt.image}
                    alt={evt.title}
                    className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700"
                  />
                  <div
                    className="absolute top-2 right-2 font-mono text-[9px] px-2 py-1 font-bold uppercase"
                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                  >
                    {evt.status}
                  </div>
                  <div className="absolute bottom-2 left-2 bg-[#11100C]/80 text-[#E7D5A4] font-mono text-[8px] px-2 py-0.5 font-bold">
                    TICKET #TK-1974-00{idx + 1}
                  </div>
                </div>

                <div className="p-4 sm:p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-center font-mono text-[9px] sm:text-[10px] font-bold text-[#B94717] border-b-2 border-[#11100C] pb-2 mb-3 uppercase">
                    <span>{evt.date}</span>
                    <span>{evt.time}</span>
                  </div>

                  <h3 className="display text-2xl sm:text-3xl text-[#11100C] leading-tight mb-1">{evt.title}</h3>
                  <p className="font-mono text-[10px] sm:text-xs text-[#5A120D] font-bold uppercase mb-1">{evt.artist}</p>
                  <p className="font-mono text-[10px] sm:text-xs font-bold text-[#B94717] mb-2">{evt.venue} · {evt.city}</p>
                  <p className="font-mono text-[10px] sm:text-xs text-[#11100C]/75 leading-relaxed mb-4 flex-1">
                    {evt.description}
                  </p>

                  <div className="flex justify-between items-center mb-3 font-mono text-[9px] uppercase text-[#11100C]/60">
                    <span>{evt.tags?.slice(0, 2).join(' · ')}</span>
                    <span className="font-bold text-[#B94717]">{evt.price}</span>
                  </div>

                  <button
                    onClick={() => { playSFX('ticketClick'); !isSoldOut && navigate(`/book/${evt.slug || evt.id}`); }}
                    disabled={isSoldOut}
                    className={`w-full py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 transition-colors ${
                      isSoldOut
                        ? 'bg-[#5A120D] text-[#E7D5A4]/60 border-[#5A120D] cursor-not-allowed'
                        : 'bg-[#11100C] text-[#E7D5A4] border-[#11100C] hover:bg-[#B94717] hover:border-[#B94717]'
                    }`}
                  >
                    {isSoldOut ? 'SOLD OUT ✗' : 'BOOK TICKETS →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. CONCERT CULTURE SECTION */}
      <section id="culture" className="py-16 bg-[#11100C] text-[#E7D5A4] border-t-8 border-[#11100C] px-4 sm:px-6">
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
              <div key={i} className="bg-[#1C0E08] border-2 border-[#C99A2E]/40 p-6">
                <span className="font-mono text-xs font-bold text-[#C99A2E] block mb-2">RULE #0{i+1}</span>
                <h3 className="display text-2xl text-[#E7D5A4] mb-2">{c.title}</h3>
                <p className="font-mono text-xs text-[#E7D5A4]/75 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SESSION CALENDAR SECTION */}
      <section id="calendar" className="py-16 bg-[#E7D5A4] text-[#11100C] border-t-8 border-[#11100C] px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <span className="font-mono text-xs text-[#B94717] tracking-[0.35em] uppercase font-bold block mb-2 text-center">
            2026 SEASON SCHEDULE
          </span>
          <h2 className="display text-4xl sm:text-6xl text-[#11100C] text-center mb-8">SESSION CALENDAR</h2>

          <div className="bg-[#F5E9C9] border-4 border-[#11100C] p-4 sm:p-8 shadow-[10px_10px_0px_#11100C]">
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
                      onClick={() => { playSFX('ticketClick'); navigate(`/book/${evt.slug || evt.id}`); }}
                      className="text-left bg-[#E7D5A4] border-2 border-[#11100C] p-4 hover:-translate-y-0.5 transition-transform"
                    >
                      <span className="font-mono text-[9px] font-bold text-[#B94717] block mb-1 uppercase">{evt.date}</span>
                      <h4 className="display text-xl text-[#11100C] mb-1">{evt.title}</h4>
                      <p className="font-mono text-[10px] text-[#11100C]/70 mb-2">{evt.venue}</p>
                      <span className="inline-block bg-[#11100C] text-[#E7D5A4] font-mono text-[8px] font-bold px-2 py-0.5">
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
      <section id="waitlist" className="py-16 bg-[#11100C] text-[#E7D5A4] border-t-8 border-[#B94717] px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-[#E7D5A4] text-[#11100C] p-6 sm:p-10 border-4 border-[#11100C] shadow-[12px_12px_0px_#B94717]">
          <div className="text-center mb-6">
            <span className="font-mono text-[10px] text-[#B94717] tracking-[0.3em] uppercase font-bold block mb-2">
              PRIORITY TICKET RESERVATIONS
            </span>
            <h2 className="display text-3xl sm:text-5xl text-[#11100C]">JOIN THE WAITLIST</h2>
            <p className="font-mono text-xs text-[#11100C]/70 mt-2">
              Get notified 48 hours before official public tickets launch for sold-out sessions.
            </p>
          </div>

          {waitlistSubmitted ? (
            <div className="text-center py-8 border-2 border-[#11100C] bg-[#F5E9C9]">
              <h3 className="display text-3xl text-[#11100C] mb-2">YOU ARE ON THE WAITLIST!</h3>
              <p className="font-mono text-xs text-[#11100C]/70 uppercase">We'll email you the moment tickets open.</p>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-[#11100C]/40 font-mono text-xs text-[#11100C]/60">
              NO UPCOMING SESSIONS TO WAITLIST FOR RIGHT NOW — CHECK BACK SOON.
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-4 font-mono text-xs">
              <input
                required
                type="text"
                placeholder="YOUR FULL NAME *"
                value={waitlistName}
                onChange={(e) => setWaitlistName(e.target.value)}
                className="p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none"
              />
              <input
                required
                type="email"
                placeholder="YOUR EMAIL ADDRESS *"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                className="p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none"
              />
              <input
                type="tel"
                placeholder="PHONE NUMBER (OPTIONAL)"
                value={waitlistPhone}
                onChange={(e) => setWaitlistPhone(e.target.value)}
                className="p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none"
              />
              <select
                value={waitlistEventId}
                onChange={(e) => setWaitlistEventId(e.target.value)}
                className="p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none"
              >
                {upcomingEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>{evt.title} — {evt.date}</option>
                ))}
              </select>

              {waitlistError && (
                <div className="p-3 bg-[#B94717] text-[#E7D5A4] font-bold border border-[#11100C]">
                  ✕ {waitlistError}
                </div>
              )}

              <button
                type="submit"
                disabled={waitlistSubmitting}
                className="py-3 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] border-2 border-[#11100C] font-bold uppercase tracking-widest transition-colors shadow-[4px_4px_0px_#11100C] disabled:opacity-50"
              >
                {waitlistSubmitting ? 'JOINING...' : 'JOIN SESSION WAITLIST →'}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};
