import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';

export const PrivateSessions = ({ onRequestPrivate }) => {
  const { playSFX } = useAudio();

  const handleRequestClick = () => {
    playSFX('ticketClick');
    if (typeof onRequestPrivate === 'function') {
      onRequestPrivate();
    }
  };

  return (
    <section 
      id="private-sessions" 
      className="relative w-full py-28 md:py-36 bg-[#3A241A] text-[#D9C6A0] overflow-hidden border-t-8 border-[#4B2D22]"
    >
      {/* NOISE & AGED PAPER FIBER OVERLAY */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-overlay pointer-events-none z-10" />

      {/* CROP MARKS & METADATA */}
      <div className="absolute top-6 left-6 font-mono text-[9px] text-[#9E6D35] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // PRIVATE ARCHIVE DOSSIER
      </div>
      <div className="absolute top-6 right-6 font-mono text-[9px] text-[#D9C6A0]/50 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        CURATED HERITAGE EXPERIENCES
      </div>

      <div className="max-w-[1000px] mx-auto px-6 relative z-20">
        
        {/* MAIN PRIVATE SESSIONS DOSSIER CARD */}
        <div className="bg-[#D9C6A0] text-[#35251A] p-8 md:p-14 border-4 border-[#35251A] shadow-archival relative rotate-[-0.5deg]">
          
          {/* CONFIDENTIAL WAX SEAL ACCENT GRAPHIC */}
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-[#7A2B24] border-4 border-[#35251A] text-[#D9C6A0] font-mono text-[9px] font-bold flex items-center justify-center text-center rotate-12 shadow-lg z-30 pointer-events-none">
            PRIVATE<br/>SEAL ✦
          </div>

          {/* MASKING TAPE AT TOP CENTER */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-[rgba(203,179,140,0.85)] rotate-[1deg] border border-[#35251A]/30 z-30 pointer-events-none" />

          {/* Header Metadata */}
          <div className="flex justify-between items-center border-b-2 border-[#35251A]/30 pb-4 mb-8 font-mono text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-[#35251A]">
            <span>FILE NO. 09-P // CURATED SHOWS</span>
            <span>HYDERABAD · ON REQUEST</span>
          </div>

          {/* Title & Editorial Intro */}
          <div className="text-center mb-10">
            <span className="font-mono text-xs font-bold text-[#7A2B24] tracking-[0.3em] uppercase block mb-2">
              EXCLUSIVE PERFORMANCE ARCHIVE
            </span>
            <h2 className="font-poster text-5xl md:text-8xl text-[#35251A] leading-none mb-4 uppercase">
              PRIVATE SESSIONS
            </h2>
            <p className="font-handwritten text-xl text-[#35251A]/90 leading-relaxed italic max-w-xl mx-auto mb-8 border-y-2 border-[#35251A]/20 py-4">
              "Some performances aren't announced. They're created exclusively for those who ask."
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-10 font-mono text-[9px] font-bold text-[#35251A] uppercase">
              <span className="bg-[#CBB38C] border border-[#35251A] px-2.5 py-1">PRIVATE GATHERINGS</span>
              <span className="bg-[#CBB38C] border border-[#35251A] px-2.5 py-1">HOUSE SESSIONS</span>
              <span className="bg-[#CBB38C] border border-[#35251A] px-2.5 py-1">BRAND EXPERIENCES</span>
              <span className="bg-[#CBB38C] border border-[#35251A] px-2.5 py-1">SPECIAL VENUES</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="w-full">
            <a 
              href="/private-sessions" 
              className="btn-ticket w-full text-center block !bg-[#7A2B24] !text-[#D9C6A0] hover:!bg-[#35251A] font-mono text-xs font-bold uppercase tracking-widest py-3.5 border-2 border-[#35251A]"
            >
              PRIVATE SESSIONS → VIEW MORE
            </a>
          </div>

        </div>

      </div>
    </section>
  );
};
