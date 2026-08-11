import { useState } from 'react';
import { merchandiseStore } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

export const MerchShopModal = ({ isOpen, onClose }) => {
  const { playSFX } = useAudio();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addedItem, setAddedItem] = useState(null);

  const handleBuy = (item) => {
    playSFX('ticketClick');
    setAddedItem(item);
    setTimeout(() => {
      setAddedItem(null);
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Fade Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* VINTAGE GENERAL STORE / MERCH MODAL */}
      <div className="relative w-full max-w-4xl bg-[#191410] text-[#ecdcaf] border-4 border-[#d1a437] p-6 shadow-[14px_14px_0px_#4c1210] flex flex-col gap-5 z-10 overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b-2 border-[#d1a437]/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em]">🛒 VINTAGE TANGY KIRANA // MERCHANDISE</span>
            <span className="font-mono text-[9px] text-[#ecdcaf]/70">LIMITED PRESSINGS</span>
          </div>
          <button 
            onClick={onClose}
            className="font-mono text-xs font-bold border border-[#ecdcaf] px-3 py-1 text-[#ecdcaf] hover:bg-[#c2272a] transition-all"
          >
            ✕ CLOSE
          </button>
        </div>

        {addedItem && (
          <div className="p-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold text-center border border-[#ecdcaf] animate-bounce">
            ✓ ADDED "{addedItem.name}" TO YOUR BAG!
          </div>
        )}

        {/* PRODUCTS CATALOG GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[62vh] overflow-y-auto pr-1">
          {merchandiseStore.map((item) => (
            <div 
              key={item.id}
              className="bg-[#0d0a07] border-2 border-[#ecdcaf]/20 p-3 shadow-md flex flex-col justify-between text-left group hover:border-[#d1a437] transition-all"
            >
              <div className="flex flex-col gap-2">
                <div className="relative overflow-hidden aspect-[4/3] border border-[#ecdcaf]/10">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <span className="absolute top-2 left-2 font-mono text-[8px] font-bold bg-[#191410]/90 text-[#d1a437] px-2 py-0.5 border border-[#d1a437]/30">
                    {item.category}
                  </span>
                </div>

                <h4 className="font-poster text-base text-[#ecdcaf] leading-tight mt-1">{item.name}</h4>
                <p className="font-mono text-[10px] text-[#ecdcaf]/70 leading-relaxed">{item.description}</p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-2 border-t border-[#ecdcaf]/10">
                <span className="font-poster text-lg text-[#d1a437]">{item.price}</span>
                <button
                  onClick={() => handleBuy(item)}
                  className="px-3 py-1.5 bg-[#d1a437] text-[#191410] font-mono text-[10px] font-bold tracking-widest uppercase hover:bg-[#ecdcaf] active:scale-95 transition-all"
                >
                  ADD TO BAG →
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="font-mono text-[9.5px] text-[#ecdcaf]/60 text-center pt-2 border-t border-[#ecdcaf]/20">
          ✦ WORLDWIDE SHIPPING FROM HYDERABAD · INCLUDES RECYCLED POSTER TUBE & STICKERS
        </div>

      </div>
    </div>
  );
};
