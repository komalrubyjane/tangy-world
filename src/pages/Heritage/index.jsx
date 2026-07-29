import { Link } from 'react-router-dom';
import { venuesDetailed } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

export const HeritagePage = () => {
  const { playSFX } = useAudio();

  return (
    <div className="w-full min-h-screen bg-[#4c1210] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        
        {/* HEADER */}
        <div className="border-b-4 border-[#d1a437] pb-4 text-left">
          <span className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em] uppercase">06 HERITAGE & VENUES // SANCTUARY MAP</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">HYDERABAD HERITAGE</h1>
          <p className="font-mono text-sm text-[#ecdcaf]/80">HISTORIC STEPWELLS, PALACES, & COURTYARDS REIMAGINED AS SONIC SANCTUARIES</p>
        </div>

        {/* VENUES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {venuesDetailed.map((venue) => (
            <div 
              key={venue.id}
              className="bg-[#191410] border-2 border-[#d1a437] p-5 shadow-[8px_8px_0px_#191410] flex flex-col justify-between text-left group"
            >
              <div className="flex flex-col gap-3">
                <div className="aspect-[16/9] overflow-hidden border border-[#d1a437]/20 relative">
                  <img src={venue.image} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-2 left-2 font-mono text-[8px] font-bold bg-[#191410]/90 text-[#d1a437] px-2 py-0.5 uppercase">
                    BUILT {venue.yearBuilt}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[9px] font-bold text-[#d1a437] uppercase">{venue.type}</span>
                  <h3 className="font-poster text-2xl text-[#ecdcaf] leading-tight my-1">{venue.name}</h3>
                  <p className="font-mono text-xs text-[#ecdcaf]/70">📍 {venue.location}</p>
                </div>

                <p className="font-sans text-xs text-[#ecdcaf]/80 leading-relaxed font-normal">{venue.history}</p>
              </div>

              <Link
                to={`/venues/${venue.id}`}
                onClick={() => playSFX('ticketClick')}
                className="w-full mt-6 py-2 bg-[#d1a437] text-[#191410] font-mono text-xs font-bold tracking-widest text-center uppercase hover:bg-[#ecdcaf] transition-all"
              >
                EXPLORE ARCHITECTURE →
              </Link>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
