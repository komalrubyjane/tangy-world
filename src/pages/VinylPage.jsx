import { vinylCatalog } from '../data/mockData';
import { useAudio } from '../audio/AudioContext';

export const VinylPage = ({ onOpenVinylPlayer }) => {
  const { playSFX } = useAudio();

  return (
    <div className="w-full min-h-screen bg-[#191410] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        
        {/* HEADER */}
        <div className="border-b-4 border-[#c2272a] pb-4 text-left">
          <span className="font-mono text-xs font-bold text-[#c2272a] tracking-[0.3em] uppercase">05 VINYL SHELF // 33⅓ RPM TURNTABLE</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">INTERACTIVE RECORD SHELF</h1>
          <p className="font-mono text-sm text-[#ecdcaf]/80">HEAVYWEIGHT 180G AUDIOPHILE PRESSINGS RECORDED LIVE ON TAPE</p>
        </div>

        {/* VINYL CATALOG GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {vinylCatalog.map((vinyl) => (
            <div 
              key={vinyl.id}
              className="bg-[#0d0a07] border-2 border-[#d1a437] p-6 shadow-[10px_10px_0px_#4c1210] flex flex-col justify-between text-left group"
            >
              <div className="flex flex-col gap-4">
                {/* VINYL SLEEVE & DISK OVERLAP */}
                <div className="relative aspect-square overflow-hidden border border-[#ecdcaf]/20 bg-[#191410] flex items-center justify-center">
                  <img src={vinyl.cover} alt={vinyl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute w-44 h-44 rounded-full bg-[#0d0a07] border-4 border-[#191410] flex items-center justify-center shadow-2xl group-hover:rotate-45 transition-transform duration-700">
                    <div className="w-16 h-16 rounded-full bg-[#c2272a] text-[#ecdcaf] flex items-center justify-center font-poster text-[8px] text-center p-1">
                      33⅓ RPM
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[9px] font-bold text-[#d1a437] uppercase">{vinyl.catalogNo} · {vinyl.speed}</span>
                  <h3 className="font-poster text-2xl text-[#ecdcaf] leading-tight my-1">{vinyl.title}</h3>
                  <p className="font-mono text-xs text-[#c2272a] font-bold">{vinyl.artist} ({vinyl.year})</p>
                </div>

                <p className="font-sans text-xs text-[#ecdcaf]/80 leading-relaxed font-normal">{vinyl.story}</p>
              </div>

              <button
                onClick={() => { playSFX('ticketClick'); onOpenVinylPlayer && onOpenVinylPlayer(vinyl); }}
                className="w-full mt-6 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#d1a437] hover:text-[#191410] transition-all border border-[#ecdcaf]"
              >
                DROP NEEDLE & PLAY VINYL 💿 →
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
