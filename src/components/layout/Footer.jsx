import { ArchiveStamp } from '../ui/ArchiveStamp';

export const Footer = () => {
  return (
    <footer className="relative w-full bg-[#5A120D] text-[#E7D5A4] border-t-8 border-[#11100C] py-20 px-8 md:px-16 overflow-hidden">
      
      {/* NOISE & AGED RECORD SLEEVE TEXTURE */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-multiply pointer-events-none z-0" />

      {/* CROP MARKS & ARCHIVE CATALOG NO. */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#D19A24] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // CATALOG NO. 1974-END
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#E7D5A4]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        33⅓ RPM STEREO // RECORD ARCHIVE INDEX
      </div>

      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-10 relative z-10">
        
        {/* LEFT COLUMN: MUSEUM INDEX BRAND */}
        <div>
          <ArchiveStamp text="MUSEUM INDEX" rotation="-2deg" color="gold" className="mb-3" />
          <p className="font-mono text-[#D19A24] text-[10px] tracking-[0.3em] font-bold uppercase mb-2">HYDERABAD / INDIA // EST. 2016</p>
          <h2 className="display text-5xl md:text-7xl text-[#E7D5A4] ink-bleed">TANGY SESSIONS™</h2>
          <p className="font-mono text-xs text-[#E7D5A4]/70 mt-2 uppercase">PEOPLE • MUSIC • PLACES • STORIES</p>
        </div>

        {/* CENTER COLUMN: SPINNING VINYL ARTIFACT */}
        <div className="flex flex-col items-center gap-2 group cursor-pointer">
          <div className="w-20 h-20 md:w-24 md:h-24 relative animate-[spin_10s_linear_infinite]">
            <img src="/media/vinyl.png" alt="Vinyl Catalog" className="w-full h-full object-contain filter drop-shadow-xl" />
          </div>
          <span className="font-mono text-[8px] text-[#D19A24] font-bold tracking-widest uppercase">CATALOG NO. 1974-END ✦</span>
        </div>

        {/* RIGHT COLUMN: ARCHIVE BOOK INDEX LINKS */}
        <div className="flex flex-col md:flex-row gap-10 font-mono text-xs tracking-widest text-[#E7D5A4]">
          <div className="flex flex-col gap-2">
            <span className="text-[#D19A24] font-bold uppercase">ARCHIVE INDEX</span>
            <a href="#hero" className="hover:text-[#D19A24] transition-colors">01 COVER POSTER</a>
            <a href="#manifesto" className="hover:text-[#D19A24] transition-colors">02 MANIFESTO</a>
            <a href="#history" className="hover:text-[#D19A24] transition-colors">03 CHRONOLOGY</a>
            <a href="#sessions" className="hover:text-[#D19A24] transition-colors">04 SESSIONS</a>
            <a href="#founders" className="hover:text-[#D19A24] transition-colors">05 FOUNDERS</a>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[#D19A24] font-bold uppercase">CONTACT & CREDITS</span>
            <span>ARCHIVE 2016 — 2026</span>
            <span>HELLO@TANGYSESSIONS.COM</span>
            <span>HYDERABAD, TELANGANA</span>
          </div>
        </div>

      </div>

      <div className="max-w-[1200px] mx-auto mt-12 pt-6 border-t-2 border-[#E7D5A4]/20 flex flex-col md:flex-row justify-between font-mono text-[9px] text-[#E7D5A4]/70 relative z-10 uppercase">
        <span>© 2016–2026 TANGY SESSIONS. ALL RIGHTS RESERVED.</span>
        <span>AN INTERACTIVE PHYSICAL MUSIC ARCHIVE BOX</span>
      </div>

    </footer>
  );
};
