import { Link } from 'react-router-dom';
import { artists } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

export const ArtistsPage = () => {
  const { playSFX } = useAudio();

  return (
    <div className="w-full min-h-screen bg-[#191410] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        
        {/* HEADER */}
        <div className="border-b-4 border-[#c2272a] pb-4 text-left">
          <span className="font-mono text-xs font-bold text-[#c2272a] tracking-[0.3em] uppercase">03 ARTISTS LINEAGE // SONIC ARCHIVE</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">PERFORMING ARTISTS</h1>
          <p className="font-mono text-sm text-[#ecdcaf]/80">COMPOSERS, VOCALISTS, & INSTRUMENTALISTS IN THE TANGY LINEAGE</p>
        </div>

        {/* ARTISTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {artists.map((artist) => {
            const slug = artist.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <div 
                key={artist.id}
                className="bg-[#ecdcaf] text-[#191410] border-2 border-[#191410] p-4 shadow-[6px_6px_0px_#c2272a] flex flex-col justify-between text-left group hover:scale-[1.02] transition-transform"
              >
                <div className="flex flex-col gap-2">
                  <div className="aspect-square overflow-hidden border border-[#191410] relative">
                    <img 
                      src={artist.image} 
                      alt={artist.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <span className="absolute bottom-2 left-2 font-mono text-[8px] font-bold bg-[#c2272a] text-[#ecdcaf] px-2 py-0.5 uppercase">
                      {artist.genre}
                    </span>
                  </div>

                  <h3 className="font-poster text-2xl text-[#191410] my-1">{artist.name}</h3>
                  <p className="font-mono text-xs text-[#c2272a] font-bold">{artist.role}</p>
                  <p className="font-mono text-[10px] text-[#191410]/80 leading-relaxed truncate">{artist.bio}</p>
                </div>

                <Link
                  to={`/artists/${slug}`}
                  onClick={() => playSFX('ticketClick')}
                  className="w-full mt-4 py-2 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest text-center uppercase hover:bg-[#c2272a] transition-all"
                >
                  VIEW PROFILE →
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
