import { useParams, Link } from 'react-router-dom';
import { venuesDetailed } from '../../data/mockData';

export const VenueDetailsPage = () => {
  const { slug } = useParams();

  const venue = venuesDetailed.find((v) => v.id === slug) || venuesDetailed[0];

  return (
    <div className="w-full min-h-screen bg-[#191410] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 text-left">
        
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#d1a437]">
          <Link to="/heritage" className="hover:underline">← ALL HERITAGE VENUES</Link>
          <span>/</span>
          <span className="uppercase text-[#ecdcaf]">{venue.name}</span>
        </div>

        {/* HERO BANNER */}
        <div className="relative w-full aspect-[21/9] overflow-hidden border-4 border-[#d1a437] shadow-2xl">
          <img src={venue.image} alt={venue.name} className="w-full h-full object-cover filter contrast-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#191410] via-transparent to-transparent opacity-90" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="font-mono text-xs font-bold text-[#191410] bg-[#d1a437] px-2 py-0.5 uppercase">{venue.type} · BUILT {venue.yearBuilt}</span>
            <h1 className="font-poster text-3xl sm:text-5xl text-[#ecdcaf] uppercase mt-1">{venue.name}</h1>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0d0a07] p-5 border-2 border-[#d1a437] flex flex-col gap-3">
            <h3 className="font-poster text-xl text-[#d1a437] uppercase">HISTORICAL CONTEXT</h3>
            <p className="font-sans text-sm text-[#ecdcaf]/90 leading-relaxed font-normal">{venue.history}</p>
          </div>

          <div className="bg-[#0d0a07] p-5 border-2 border-[#c2272a] flex flex-col gap-3">
            <h3 className="font-poster text-xl text-[#c2272a] uppercase">ACOUSTICS & ARCHITECTURE</h3>
            <p className="font-mono text-xs text-[#ecdcaf]/80">🏛️ {venue.architecture}</p>
            <p className="font-mono text-xs text-[#d1a437]">🔊 ACOUSTIC SIGNATURE: {venue.soundscape}</p>
            <p className="font-mono text-xs text-[#ecdcaf]/60">✦ SESSIONS HELD: {venue.sessionsHeld} LIVE NIGHTS</p>
          </div>
        </div>

      </div>
    </div>
  );
};
