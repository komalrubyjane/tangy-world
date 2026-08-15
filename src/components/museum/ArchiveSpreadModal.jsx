import { useState } from 'react';
import { archiveItems } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

export const ArchiveSpreadModal = ({ isOpen, onClose }) => {
  const { playSFX } = useAudio();
  const [selectedItem, setSelectedItem] = useState(archiveItems[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Fade Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* MAGAZINE DOUBLE-PAGE SPREAD READER */}
      <div className="relative w-full max-w-4xl max-h-[90dvh] bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[16px_16px_0px_#4c1210] flex flex-col gap-6 z-10 overflow-y-auto overflow-x-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b-2 border-[#191410] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#c2272a] tracking-[0.3em]">📚 TANGY ARCHIVE // MAGAZINE SPREAD</span>
            <span className="font-mono text-[9px] text-[#241a12]/70">LIBRARY FILE NO. {selectedItem.year}</span>
          </div>
          <button 
            onClick={onClose}
            className="font-mono text-xs font-bold border border-[#191410] px-3 py-1 text-[#191410] hover:bg-[#c2272a] hover:text-[#ecdcaf] transition-all"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* MAGAZINE SPREAD READER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* LEFT PAGE: HIGH RES IMAGE / ARTIFACT */}
          <div className="bg-[#191410] p-3 border-2 border-[#191410] shadow-md rotate-[-1deg] relative">
            <img 
              src={selectedItem.image} 
              alt={selectedItem.title} 
              className="w-full aspect-[4/3] object-cover filter contrast-110" 
            />
            <div className="mt-2 font-mono text-[9px] text-[#ecdcaf] flex justify-between uppercase">
              <span>{selectedItem.category}</span>
              <span>YEAR {selectedItem.year}</span>
            </div>
          </div>

          {/* RIGHT PAGE: EDITORIAL STORY & SPECS */}
          <div className="flex flex-col gap-4 text-left">
            <div>
              <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase tracking-widest">{selectedItem.category} ARCHIVE</span>
              <h3 className="font-poster text-2xl text-[#191410] leading-tight my-1">{selectedItem.title}</h3>
              <p className="font-mono text-xs text-[#241a12]/80 font-semibold border-b border-[#191410]/20 pb-2">{selectedItem.headline}</p>
            </div>

            <p className="font-sans text-sm text-[#241a12]/90 leading-relaxed font-normal">
              {selectedItem.details}
            </p>

            <blockquote className="p-3 bg-[#ecdcaf] border-l-4 border-[#c2272a] font-serif italic text-xs text-[#191410]">
              "Preserving the tangible soul of music culture before it dissolves into digital noise."
            </blockquote>

            {/* SPREAD NAVIGATOR SELECTOR */}
            <div className="flex gap-2 mt-2 pt-3 border-t border-[#191410]/20 overflow-x-auto">
              {archiveItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { playSFX('ticketClick'); setSelectedItem(item); }}
                  className={`px-2.5 py-1.5 font-mono text-[9px] font-bold tracking-wider uppercase border text-nowrap transition-all ${selectedItem.id === item.id ? 'bg-[#191410] text-[#ecdcaf] border-[#191410]' : 'bg-[#e9decb] text-[#191410] border-[#191410]/30 hover:border-[#191410]'}`}
                >
                  {item.category} ({item.year})
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
