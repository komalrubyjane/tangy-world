import { useState, useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useEvents } from '../../hooks/useEvents';
import { useAudio } from '../../audio/AudioContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export const WaitlistPage = () => {
  const { playSFX } = useAudio();
  const { events } = useEvents();
  const upcomingEvents = events.filter((e) => e.dbStatus !== 'past');

  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistEventId, setWaitlistEventId] = useState('');
  const [waitlistError, setWaitlistError] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#B94717] selection:text-[#E7D5A4] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/sessions" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO SESSIONS</a>
          <span className="font-mono text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            PRIORITY TICKET RESERVATIONS
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-8xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            JOIN THE<br/>WAITLIST
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            GET NOTIFIED 48 HOURS BEFORE OFFICIAL PUBLIC TICKETS LAUNCH FOR SOLD-OUT SESSIONS.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-[#E7D5A4] text-[#11100C] p-6 sm:p-10 border-4 border-[#11100C] shadow-[12px_12px_0px_#B94717]">
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
              <input required type="text" placeholder="YOUR FULL NAME *" value={waitlistName} onChange={(e) => setWaitlistName(e.target.value)} className="p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none" />
              <input required type="email" placeholder="YOUR EMAIL ADDRESS *" value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} className="p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none" />
              <input type="tel" placeholder="PHONE NUMBER (OPTIONAL)" value={waitlistPhone} onChange={(e) => setWaitlistPhone(e.target.value)} className="p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none" />
              <select value={waitlistEventId} onChange={(e) => setWaitlistEventId(e.target.value)} className="p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none">
                {upcomingEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>{evt.title} — {evt.date}</option>
                ))}
              </select>

              {waitlistError && (
                <div className="p-3 bg-[#B94717] text-[#E7D5A4] font-bold border border-[#11100C]">
                  ✕ {waitlistError}
                </div>
              )}

              <button type="submit" disabled={waitlistSubmitting} className="py-3 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] border-2 border-[#11100C] font-bold uppercase tracking-widest transition-colors shadow-[4px_4px_0px_#11100C] disabled:opacity-50">
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
