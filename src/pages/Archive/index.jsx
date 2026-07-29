import { Link } from 'react-router-dom';
import { archiveItems } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

export const ArchivePage = ({ onOpenArchiveSpread }) => {
  const { playSFX } = useAudio();

  return (
    <div className="w-full min-h-screen bg-[#191410] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        
        {/* HEADER */}
        <div className="border-b-4 border-[#315D73] pb-4 text-left">
          <span className="font-mono text-xs font-bold text-[#315D73] tracking-[0.3em] uppercase">04 ARCHIVE MUSEUM // LIBRARY COLLECTIONS</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">PRINTED ARCHIVE</h1>
          <p className="font-mono text-sm text-[#ecdcaf]/80">POSTERS, TICKET STUBS, VINYL COVERS, PRESS MENTIONS & HANDWRITTEN FIELD NOTES</p>
        </div>

        {/* ARCHIVE ITEMS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {archiveItems.map((item) => {
            const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <div 
                key={item.id}
                className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-5 shadow-[8px_8px_0px_#315D73] flex flex-col justify-between text-left group"
              >
                <div className="flex flex-col gap-3">
                  <div className="aspect-[4/3] overflow-hidden border-2 border-[#191410] relative bg-[#191410]">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <span className="absolute top-2 left-2 font-mono text-[9px] font-bold bg-[#c2272a] text-[#ecdcaf] px-2 py-0.5 uppercase">
                      {item.category} ({item.year})
                    </span>
                  </div>

                  <h3 className="font-poster text-2xl text-[#191410]">{item.title}</h3>
                  <p className="font-mono text-xs text-[#c2272a] font-semibold">{item.headline}</p>
                  <p className="font-sans text-xs text-[#241a12]/90 leading-relaxed">{item.details}</p>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-[#191410]/20">
                  <Link
                    to={`/archive/${slug}`}
                    onClick={() => playSFX('ticketClick')}
                    className="flex-1 py-2 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest text-center uppercase hover:bg-[#c2272a] transition-all"
                  >
                    FULLSCREEN READ →
                  </Link>

                  <button
                    onClick={() => { playSFX('ticketClick'); onOpenArchiveSpread && onOpenArchiveSpread(); }}
                    className="px-4 py-2 border-2 border-[#191410] font-mono text-xs font-bold hover:bg-[#191410] hover:text-[#ecdcaf] transition-all"
                  >
                    MAGAZINE SPREAD 📖
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
