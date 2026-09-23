import { useEvents } from '../../hooks/useEvents';
import { useAudio } from '../../audio/AudioContext';
import { useReveal } from '../../hooks/useReveal';
import { PosterEventCard } from '../ui/PosterEventCard';

// Posters lie on the archive table at slightly different angles — the same
// three values every render, not random.
const TABLE_ANGLES = ['-0.9deg', '0.6deg', '-0.4deg'];

// 03 — SESSIONS. A quiet dark field so the poster-tickets are the only loud
// objects: large editorial heading, three posters on the grid, one link out.
export const UpcomingEvents = ({ onSelectBooking }) => {
  const { playSFX } = useAudio();
  const { events: allEvents } = useEvents();
  const events = allEvents.filter((e) => e.dbStatus !== 'past').slice(0, 3);
  const sectionRef = useReveal();

  const handleBookClick = (event) => {
    playSFX('ticketClick');
    if (onSelectBooking) onSelectBooking(event);
  };

  return (
    <section ref={sectionRef} id="sessions" className="t-section theme-sessions overflow-hidden">
      <div className="t-container">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 md:pb-12 border-b-[3px] border-double border-[#EFE2C0]/25">
          <div>
            <p className="reveal t-label sec-accent m-0">03 — Collectible concert tickets // 1974 series</p>
            <h2 className="reveal-type t-h1 registrationOffset text-[#EFE2C0] mt-4 mb-0"><span className="rt">Sessions</span></h2>
          </div>
          <a href="/sessions" className="reveal d2 t-btn t-btn-light self-start md:self-auto">Sessions → View more</a>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-8 lg:gap-10 mt-12 md:mt-16 max-w-[420px] sm:max-w-none mx-auto">
          {events.map((event, idx) => (
            <div
              key={event.id}
              className="reveal-paper h-full"
              style={{ transitionDelay: `${330 + idx * 110}ms`, '--rest-rot': TABLE_ANGLES[idx % TABLE_ANGLES.length] }}
            >
              <PosterEventCard event={event} idx={idx} onBook={() => handleBookClick(event)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
