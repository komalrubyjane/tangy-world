import { ArchiveStamp } from '../ui/ArchiveStamp';
import { TextileBorderStrip, LotusMotif, RangoliMedallion, BandhaniDotField, HandDrawnUnderline, RetroPosterFrame } from '../ui/CulturalMotifs';
import { TapeStrip, PushPin } from '../ui/BackgroundDecorations';

export const Footer = () => {
  return (
    <footer className="relative w-full bg-[#5A120D] text-[#E7D5A4] pt-16 pb-14 px-6 md:px-16 overflow-hidden isolate">

      {/* WOVEN TEXTILE BORDER — the "back cover" seam between page content and footer */}
      <TextileBorderStrip className="absolute top-0 left-0 right-0 z-20" height={14} colorA="#D19A24" colorB="#11100C" />

      {/* NOISE & AGED RECORD SLEEVE TEXTURE */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-multiply pointer-events-none z-0" />
      <BandhaniDotField color="#D19A24" opacity={0.09} size={38} className="z-0" />
      <RetroPosterFrame color="#D19A24" inset={16} className="hidden md:block z-20" />

      {/* GIANT RANGOLI — a real graphic illustration bleeding off the right edge, the */}
      {/* footer's back-cover centerpiece rather than a background hint. */}
      <RangoliMedallion
        color="#D19A24"
        className="hidden md:block absolute -right-[10%] top-1/2 -translate-y-1/2 w-[46%] max-w-[520px] opacity-[0.16] pointer-events-none animate-[spin_160s_linear_infinite] z-0"
      />

      {/* CROP MARKS & ARCHIVE CATALOG NO. */}
      <div className="absolute top-6 left-4 font-mono text-[9px] text-[#D19A24] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // CATALOG NO. 1974-END
      </div>
      <div className="absolute top-6 right-4 font-mono text-[9px] text-[#E7D5A4]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        33⅓ RPM STEREO // RECORD ARCHIVE INDEX
      </div>

      <div className="max-w-[1300px] mx-auto relative z-10 mt-8">

        {/* MASTHEAD ROW — an oversized rotated wordmark with a riso ghost duplicate, */}
        {/* the dominant graphic element of the whole footer (magazine back-cover masthead). */}
        <div className="relative inline-flex items-center gap-2 mb-2">
          <TapeStrip className="absolute -top-3 -left-4 w-16 h-4 -rotate-6" />
          <ArchiveStamp text="MUSEUM INDEX" rotation="-2deg" color="gold" />
          <LotusMotif color="#D19A24" className="w-7 h-7 opacity-80" />
        </div>
        <p className="font-mono text-[#D19A24] text-[10px] tracking-[0.3em] font-bold uppercase mb-1">HYDERABAD / INDIA // EST. 2016</p>
        <h2 className="relative display leading-[0.82] text-[#E7D5A4] ink-bleed -rotate-1 origin-left" style={{ fontSize: 'clamp(3.2rem,13vw,10.5rem)' }}>
          <span className="absolute inset-0 text-[#D91E18] opacity-30 translate-x-[6px] -translate-y-[4px] mix-blend-screen pointer-events-none select-none -z-10" aria-hidden="true">
            TANGY SESSIONS™
          </span>
          TANGY SESSIONS™
        </h2>
        <HandDrawnUnderline color="#D19A24" className="w-52 h-3 mt-1 ml-1 opacity-60" />
        <p className="font-mono text-xs text-[#E7D5A4]/70 mt-3 uppercase tracking-[0.3em] border-l-2 border-[#D19A24] pl-3">PEOPLE • MUSIC • PLACES • STORIES</p>

        {/* COLOPHON ROW — vinyl artifact + archive index + contact, laid out as a proper */}
        {/* editorial back-matter grid with a vertical rule, not three loosely flexed blobs. */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-[auto_1px_1fr_1fr] gap-8 md:gap-10 items-start">

          <div className="flex md:flex-col items-center gap-3 group cursor-pointer">
            <div className="w-16 h-16 md:w-20 md:h-20 relative animate-[spin_10s_linear_infinite] shrink-0">
              <img src="/media/vinyl.png" alt="Vinyl Catalog" className="w-full h-full object-contain filter drop-shadow-xl" />
            </div>
            <span className="font-mono text-[8px] text-[#D19A24] font-bold tracking-widest uppercase">CATALOG NO.<br className="hidden md:block" /> 1974-END ✦</span>
          </div>

          <div className="hidden md:flex relative w-px h-full bg-[#E7D5A4]/15" aria-hidden="true">
            <div className="absolute -top-2 -left-2"><PushPin /></div>
          </div>

          <div className="flex flex-col gap-2 font-mono text-xs tracking-widest text-[#E7D5A4]">
            <span className="text-[#D19A24] font-bold uppercase">ARCHIVE INDEX</span>
            <a href="#hero" className="hover:text-[#D19A24] transition-colors">01 COVER POSTER</a>
            <a href="#manifesto" className="hover:text-[#D19A24] transition-colors">02 MANIFESTO</a>
            <a href="#history" className="hover:text-[#D19A24] transition-colors">03 CHRONOLOGY</a>
            <a href="#sessions" className="hover:text-[#D19A24] transition-colors">04 SESSIONS</a>
            <a href="#founders" className="hover:text-[#D19A24] transition-colors">05 FOUNDERS</a>
          </div>

          <div className="flex flex-col gap-2 font-mono text-xs tracking-widest text-[#E7D5A4]">
            <span className="text-[#D19A24] font-bold uppercase">CONTACT & CREDITS</span>
            <span>ARCHIVE 2016 — 2026</span>
            <span>HELLO@TANGYSESSIONS.COM</span>
            <span>HYDERABAD, TELANGANA</span>
          </div>
        </div>

      </div>

      <div className="max-w-[1300px] mx-auto mt-12 pt-6 border-t-2 border-[#E7D5A4]/20 flex flex-col md:flex-row justify-between font-mono text-[9px] text-[#E7D5A4]/70 relative z-10 uppercase">
        <span>© 2016–2026 TANGY SESSIONS. ALL RIGHTS RESERVED.</span>
        <span>AN INTERACTIVE PHYSICAL MUSIC ARCHIVE BOX</span>
      </div>

    </footer>
  );
};
