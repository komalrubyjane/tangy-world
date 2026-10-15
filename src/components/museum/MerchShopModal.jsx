import { useEffect } from 'react';
import { merchandiseStore } from '../../data/mockData';

// Merch previews only: there is no shop backend, so nothing is purchasable.
// The sheet sits above the fixed site header and is capped to the viewport;
// only the product grid scrolls, so the title and Close stay on screen.
export const MerchShopModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center p-2 sm:p-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]" data-lenis-prevent>
      {/* Fade Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* VINTAGE GENERAL STORE / MERCH MODAL */}
      <div role="dialog" aria-modal="true" aria-labelledby="kirana-title" className="relative w-full max-w-4xl max-h-full bg-[#191410] text-[#ecdcaf] border-2 border-[#d1a437] p-4 sm:p-6 shadow-[4px_4px_0px_#4c1210] flex flex-col gap-3 sm:gap-5 z-10 overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center gap-3 border-b-2 border-[#d1a437]/40 pb-3 shrink-0">
          <div className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 id="kirana-title" className="m-0 font-mono text-[11px] sm:text-xs font-bold text-[#d1a437] tracking-[0.2em] sm:tracking-[0.3em]"><span aria-hidden="true">🛒 </span>VINTAGE TANGY KIRANA <span className="hidden sm:inline">// MERCHANDISE</span></h2>
            <span className="font-mono text-[10px] text-[#ecdcaf]/70">LIMITED PRESSINGS</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="shrink-0 min-h-[44px] font-mono text-xs font-bold border border-[#ecdcaf] px-3 text-[#ecdcaf] hover:bg-[#c2272a] transition-all"
          >
            ✕ CLOSE
          </button>
        </div>

        <p className="shrink-0 p-2 sm:p-3 bg-[#191410] text-[#ecdcaf]/80 font-mono text-[10.5px] sm:text-[11px] text-center border border-[#ecdcaf]/20 m-0">
          The Tangy shop isn’t open yet — these are previews, not items for sale.
        </p>

        {/* PRODUCTS CATALOG GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1">
          {merchandiseStore.map((item) => (
            <div 
              key={item.id}
              className="bg-[#0d0a07] border-2 border-[#ecdcaf]/20 p-3 shadow-md flex flex-col justify-between text-left group hover:border-[#d1a437] transition-all"
            >
              <div className="flex flex-col gap-2">
                <div className="relative overflow-hidden aspect-[16/10] sm:aspect-[4/3] border border-[#ecdcaf]/10">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <span className="absolute top-2 left-2 font-mono text-[10px] font-bold bg-[#191410]/90 text-[#d1a437] px-2 py-0.5 border border-[#d1a437]/30">
                    {item.category}
                  </span>
                </div>

                <h4 className="font-poster text-base text-[#ecdcaf] leading-tight mt-1">{item.name}</h4>
                <p className="font-mono text-[10px] text-[#ecdcaf]/70 leading-relaxed">{item.description}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-3 sm:mt-4 pt-2 border-t border-[#ecdcaf]/10">
                <span className="font-poster text-lg text-[#d1a437]">{item.price}</span>
                {/* There is no shop backend yet — nothing can be bought here. */}
                <span className="px-3 py-1.5 border border-[#ecdcaf]/30 text-[#ecdcaf]/70 font-mono text-[10px] font-bold tracking-widest uppercase">
                  COMING SOON
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 font-mono text-[10px] text-[#ecdcaf]/60 text-center pt-2 border-t border-[#ecdcaf]/20">
          ✦ WORLDWIDE SHIPPING FROM HYDERABAD · INCLUDES RECYCLED POSTER TUBE & STICKERS
        </div>

      </div>
    </div>
  );
};
