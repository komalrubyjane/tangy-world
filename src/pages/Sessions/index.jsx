import { Link } from 'react-router-dom';
import { events } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

export const SessionsPage = ({ onSelectBooking }) => {
  const { playSFX } = useAudio();

  return (
    <div className="w-full min-h-screen bg-[#3c0f0e] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        
        {/* PAGE HEADER */}
        <div className="border-b-4 border-[#d1a437] pb-4 text-left">
          <span className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em] uppercase">02 SESSIONS ARCHIVE // TICKETS & CATALOG</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">CONCERT SESSIONS</h1>
          <p className="font-mono text-sm text-[#ecdcaf]/80">LIVE ARCHIVE OF MUSIC RITUALS IN HISTORIC SANCTUARIES</p>
        </div>

        {/* SESSIONS CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <div 
              key={evt.id} 
              className="bg-[#191410] border-2 border-[#d1a437] p-5 shadow-[8px_8px_0px_#4c1210] flex flex-col justify-between text-left group hover:border-[#ecdcaf] transition-all"
            >
              <div className="flex flex-col gap-3">
                <div className="relative aspect-[4/3] overflow-hidden border border-[#ecdcaf]/20">
                  <img 
                    src={evt.image} 
                    alt={evt.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <span className="absolute top-2 left-2 font-mono text-[9px] font-bold bg-[#c2272a] text-[#ecdcaf] px-2.5 py-0.5 uppercase shadow">
                    {evt.city} · {evt.status}
                  </span>
                </div>

                <span className="font-mono text-[10px] font-bold text-[#d1a437] uppercase">{evt.venue} · {evt.date}</span>
                <h3 className="font-poster text-2xl text-[#ecdcaf] leading-tight">{evt.title}</h3>
                <p className="font-mono text-xs text-[#c2272a] font-bold">{evt.artist}</p>
                <p className="font-sans text-xs text-[#ecdcaf]/80 leading-relaxed">{evt.description}</p>
              </div>

              <div className="flex flex-col gap-2 mt-6 pt-3 border-t border-[#ecdcaf]/10">
                <Link
                  to={`/sessions/${evt.slug}`}
                  onClick={() => playSFX('ticketClick')}
                  className="w-full py-2 bg-[#d1a437] text-[#191410] font-mono text-xs font-bold tracking-widest text-center uppercase hover:bg-[#ecdcaf] transition-all"
                >
                  EXPLORE SESSION STORY →
                </Link>

                <button
                  onClick={() => { playSFX('ticketClick'); onSelectBooking && onSelectBooking(evt); }}
                  className="w-full py-2 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#191410] border border-[#c2272a] transition-all"
                >
                  ADMIT ONE TICKET ({evt.price})
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
