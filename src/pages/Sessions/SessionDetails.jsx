import { useParams, Link } from 'react-router-dom';
import { events } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { PageTransition } from '../../components/ui/PageTransition';

export default function SessionDetailsPage({ onSelectBooking }) {
  const { slug } = useParams();
  const { playSFX } = useAudio();

  const evt = events.find((e) => e.slug === slug) || events[0];

  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#191410] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-8 text-left">
          
          {/* BREADCRUMB */}
          <div className="flex items-center gap-2 font-mono text-xs text-[#d1a437]">
            <Link to="/sessions" className="hover:underline">← ALL SESSIONS</Link>
            <span>/</span>
            <span className="uppercase text-[#ecdcaf]">{evt.title}</span>
          </div>

          {/* HERO POSTER BANNER */}
          <div className="relative w-full aspect-[21/9] overflow-hidden border-4 border-[#d1a437] shadow-2xl">
            <img src={evt.image} alt={evt.title} className="w-full h-full object-cover filter contrast-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#191410] via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div>
                <span className="font-mono text-xs font-bold text-[#c2272a] bg-[#ecdcaf] px-2 py-0.5 uppercase">{evt.city} · {evt.status}</span>
                <h1 className="font-poster text-3xl sm:text-5xl text-[#ecdcaf] uppercase mt-1">{evt.title}</h1>
              </div>
              <button
                onClick={() => { playSFX('ticketClick'); onSelectBooking && onSelectBooking(evt); }}
                className="px-6 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase border border-[#ecdcaf] shadow-md hover:bg-[#d1a437] hover:text-[#191410] transition-all"
              >
                BOOK TICKET ({evt.price})
              </button>
            </div>
          </div>

          {/* STORY & METADATA GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 flex flex-col gap-4">
              <h2 className="font-poster text-2xl text-[#d1a437]">THE SESSION STORY</h2>
              <p className="font-sans text-base text-[#ecdcaf]/90 leading-relaxed font-normal">
                {evt.story || evt.description}
              </p>

              {evt.setlist && (
                <div className="mt-4 p-4 bg-[#0d0a07] border border-[#ecdcaf]/20">
                  <h3 className="font-mono text-xs font-bold text-[#c2272a] uppercase mb-2">LIVE SETLIST & RUNNING ORDER</h3>
                  <ul className="flex flex-col gap-1 font-mono text-xs text-[#ecdcaf]/80">
                    {evt.setlist.map((item, idx) => (
                      <li key={idx} className="border-b border-[#ecdcaf]/10 pb-1">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 bg-[#0d0a07] p-5 border-2 border-[#d1a437]">
              <span className="font-mono text-xs font-bold text-[#d1a437] uppercase">SESSION DETAILS</span>
              <div className="font-mono text-xs border-b border-[#ecdcaf]/20 pb-2">
                <span className="opacity-60">DATE:</span> <span className="font-bold">{evt.date}</span>
              </div>
              <div className="font-mono text-xs border-b border-[#ecdcaf]/20 pb-2">
                <span className="opacity-60">TIME:</span> <span className="font-bold">{evt.time}</span>
              </div>
              <div className="font-mono text-xs border-b border-[#ecdcaf]/20 pb-2">
                <span className="opacity-60">VENUE:</span> <span className="font-bold">{evt.venue}</span>
              </div>
              <div className="font-mono text-xs border-b border-[#ecdcaf]/20 pb-2">
                <span className="opacity-60">ARTIST:</span> <span className="font-bold text-[#c2272a]">{evt.artist}</span>
              </div>
              <div className="font-mono text-xs border-b border-[#ecdcaf]/20 pb-2">
                <span className="opacity-60">CAPACITY:</span> <span className="font-bold">{evt.capacity} LISTNERS</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
