import { useState } from 'react';
import { events, gallery, diaryEntries, archive, founders } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

export const MobileLayout = ({ onSelectBooking, onArtistSubmit, onRequestPrivate }) => {
  const { playSFX } = useAudio();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  const navLinks = [
    { label: "01 COVER", target: "#m-hero" },
    { label: "02 MANIFESTO", target: "#m-manifesto" },
    { label: "03 CHRONOLOGY", target: "#m-history" },
    { label: "04 SESSIONS", target: "#m-sessions" },
    { label: "05 RAW FOOTAGE", target: "#m-footage" },
    { label: "06 ARCHIVE", target: "#m-archive" },
    { label: "07 DIARY", target: "#m-diary" },
    { label: "08 CREW", target: "#m-crew" },
    { label: "09 PRIVATE SESSIONS", target: "#m-private" },
  ];

  const handleNavClick = (target) => {
    playSFX('ticketClick');
    setIsMenuOpen(false);
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  };

  const videoList = [
    { id: 1, title: "Damini Bhatla Live", src: "/media/background-video/Fresh from the archives, when @daminibhatlach performed for us, the space softened around her, w.mp4" },
    { id: 2, title: "Stepwell Acoustics", src: "/media/background-video/Video-63639.mp4" },
    { id: 3, title: "After Midnight Jam", src: "/media/background-video/Video-22402.mp4" },
    { id: 4, title: "Tangy Rituals", src: "/media/videos/tangy.mp4" },
  ];

  return (
    <div className="w-full min-h-screen bg-[#11100C] text-[#EAD9A6] font-sans antialiased overflow-x-hidden selection:bg-[#B9471B] selection:text-[#EAD9A6]">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. MOBILE TOP NAVIGATION BAR & FULLSCREEN OVERLAY               */}
      {/* ------------------------------------------------------------- */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#15120D]/95 backdrop-blur-md border-b border-[#EAD9A6]/20 z-[100] flex items-center justify-between px-4">
        <button
          onClick={() => { playSFX('ticketClick'); setIsMenuOpen(true); }}
          className="font-mono text-xs font-bold tracking-[0.2em] text-[#EAD9A6] flex items-center gap-2 border border-[#EAD9A6]/30 px-3 py-1.5 rounded-sm active:bg-[#B9471B]"
        >
          <span>☰</span>
          <span>MENU</span>
        </button>

        <span className="font-display text-sm font-bold tracking-widest text-[#EAD9A6] uppercase">
          TANGY SESSIONS
        </span>

        <span className="font-mono text-[9px] font-bold text-[#D19A24] tracking-widest border border-[#D19A24]/40 px-2 py-1">
          HYD
        </span>
      </header>

      {/* FULLSCREEN MOBILE MENU OVERLAY */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[200] bg-[#15120D] text-[#EAD9A6] flex flex-col justify-between p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-[#EAD9A6]/20 pb-4">
            <span className="font-mono text-xs text-[#D19A24] tracking-[0.3em] font-bold">PROGRAMME INDEX</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="font-mono text-xs font-bold border-2 border-[#EAD9A6] px-3 py-1 text-[#EAD9A6] active:bg-[#EAD9A6] active:text-[#15120D]"
            >
              ✕ CLOSE
            </button>
          </div>

          <nav className="flex flex-col gap-4 my-8">
            {navLinks.map((link) => (
              <button
                key={link.target}
                onClick={() => handleNavClick(link.target)}
                className="text-left font-display text-2xl text-[#EAD9A6] hover:text-[#D19A24] active:text-[#B9471B] border-b border-[#EAD9A6]/10 pb-2 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="font-mono text-[10px] text-[#EAD9A6]/60 text-center tracking-widest uppercase pt-4 border-t border-[#EAD9A6]/20">
            TANGY SESSIONS // HYDERABAD // EST. 2016
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MOBILE HERO SECTION (SOLID BURNT ORANGE)                     */}
      {/* ------------------------------------------------------------- */}
      <section id="m-hero" className="w-full bg-[#B9471B] pt-20 pb-16 px-6 relative flex flex-col items-center text-center">
        
        {/* STATIC VINTAGE MICROPHONE WITH GENTLE IDLE SWING */}
        <div className="w-full flex flex-col items-center mb-6 pointer-events-none">
          <div className="w-[1.5px] h-24 bg-[#15120D]" />
          <div className="w-12 h-24 border border-black/40 rounded-b-xl shadow-xl flex items-center justify-center bg-[linear-gradient(135deg,#8a8a8a_0%,#2a2a2a_50%,#555_100%)] p-1 animate-[spin_8s_ease-in-out_infinite_alternate]">
            <img src="/media/vintage-mic.png" alt="Microphone" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* METADATA STAMP */}
        <span className="font-mono text-[10px] font-bold text-[#EAD9A6] tracking-[0.25em] uppercase border-y border-[#15120D]/40 py-1 px-4 mb-4">
          TANGY SESSIONS // HYDERABAD // EST. 2016
        </span>

        {/* MAIN COVER PHOTO */}
        <div className="w-full max-w-[360px] bg-[#EAD9A6] p-2.5 pb-8 border-2 border-[#15120D] shadow-[10px_10px_0px_#15120D] rotate-[-1.5deg] my-4">
          <img src="/media/gallery/tangy3.jpg" alt="Tangy Concert" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125 sepia-[0.2] border border-[#15120D]" />
          <p className="font-mono text-[9px] text-[#15120D] font-bold tracking-wider mt-2 text-left">✎ BANSILALPET // 11:42 PM</p>
        </div>

        {/* MOBILE HERO TITLE */}
        <h1 className="font-display text-[clamp(56px,16vw,82px)] text-[#EAD9A6] leading-[0.8] tracking-tighter drop-shadow-[5px_5px_0px_#15120D] mt-4 mb-1">
          TANGY
        </h1>
        <h1 className="font-display text-[clamp(48px,14vw,72px)] italic text-[#D19A24] font-normal leading-[0.8] tracking-tight drop-shadow-[5px_5px_0px_#15120D] mb-6">
          WORLD
        </h1>

        <p className="font-mono text-xs font-bold text-[#EAD9A6] tracking-[0.25em] uppercase mb-8">
          MUSIC • PEOPLE • PLACES • STORIES
        </p>

        {/* FULL-WIDTH 56PX CTA BUTTON */}
        <button
          onClick={() => handleNavClick('#m-manifesto')}
          className="w-full max-w-[360px] h-[56px] bg-[#EAD9A6] text-[#15120D] border-2 border-[#15120D] shadow-[6px_6px_0px_#15120D] font-mono text-sm font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <span>EXPLORE THE WORLD ↓</span>
        </button>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. MOBILE MANIFESTO (AGED CREAM BACKGROUND)                   */}
      {/* ------------------------------------------------------------- */}
      <section id="m-manifesto" className="w-full bg-[#EAD9A6] text-[#15120D] py-16 px-6 flex flex-col items-center text-center">
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#B9471B] tracking-[0.3em] uppercase">01 MANIFESTO</span>
          
          <div className="w-full bg-[#15120D] p-2 border-2 border-[#15120D] shadow-[8px_8px_0px_#B9471B] rotate-[1deg]">
            <img src="/media/gallery/tangy1.jpg" alt="Stepwell" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125" />
          </div>

          <h2 className="font-display text-3xl text-[#15120D] leading-tight">
            AN INTERACTIVE SCREEN-PRINTED MUSIC ARCHIVE.
          </h2>

          <p className="font-sans text-base text-[#15120D]/90 leading-relaxed font-normal">
            Tangy Sessions is a living archive of music, people, and historic spaces in Hyderabad. We transform forgotten stepwells, secret courtyards, and ancient stone corridors into intimate gathering spaces where sound vibrates through masonry.
          </p>

          <blockquote className="w-full bg-[#B9471B] text-[#EAD9A6] p-6 border-2 border-[#15120D] shadow-[6px_6px_0px_#15120D] font-display text-xl italic my-2">
            "This world has a sound. Listen closely."
          </blockquote>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. MOBILE CHRONOLOGY (HISTORY - BURNT ORANGE / RED)          */}
      {/* ------------------------------------------------------------- */}
      <section id="m-history" className="w-full bg-[#B9471B] text-[#EAD9A6] py-16 px-6 flex flex-col items-center">
        <div className="w-full max-w-[480px] flex flex-col items-center">
          <span className="font-mono text-[10px] font-bold text-[#D19A24] tracking-[0.3em] uppercase mb-8">02 CHRONOLOGY // 10 YEARS</span>

          <div className="w-full flex flex-col gap-8">
            {[
              { year: "2016", title: "THE FIRST SPARK", desc: "First acoustic sessions inside private living rooms & stepwells." },
              { year: "2018", title: "THE MOVEMENT GROWS", desc: "Underground electronic producers join the lineage." },
              { year: "2020", title: "THE ARCHIVE RECORDINGS", desc: "Bansilalpet Stepwell becomes our primary sonic sanctuary." },
              { year: "2023", title: "PAN-INDIA EXPANSION", desc: "Curating intimate nights across Mumbai, Delhi, and Goa." },
              { year: "2025", title: "TANGY WORLD TODAY", desc: "Over 200+ artists and thousands of listeners united by sound." },
            ].map((item, idx) => (
              <div key={idx} className="w-full bg-[#15120D] border-2 border-[#D19A24] p-6 shadow-[6px_6px_0px_#D19A24] flex flex-col items-start text-left gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-display text-3xl text-[#D19A24]">{item.year}</span>
                  <span className="text-[#B9471B] font-bold">○</span>
                </div>
                <h3 className="font-display text-lg text-[#EAD9A6]">{item.title}</h3>
                <p className="font-sans text-sm text-[#EAD9A6]/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. MOBILE SESSIONS (UPCOMING EVENTS CARDS)                     */}
      {/* ------------------------------------------------------------- */}
      <section id="m-sessions" className="w-full bg-[#B9471B] py-16 px-6 flex flex-col items-center">
        <div className="w-full max-w-[420px] flex flex-col items-center gap-8">
          <span className="font-mono text-[10px] font-bold text-[#EAD9A6] tracking-[0.3em] uppercase">03 SESSIONS // TICKETS</span>

          {events.map((evt) => (
            <div key={evt.id} className="w-full bg-[#EAD9A6] text-[#15120D] border-2 border-[#15120D] p-5 shadow-[8px_8px_0px_#15120D] flex flex-col gap-4">
              <img src={evt.image} alt={evt.title} className="w-full aspect-[4/3] object-cover border border-[#15120D]" />
              <div className="flex flex-col gap-1 text-left">
                <span className="font-mono text-[9px] font-bold text-[#B9471B] tracking-widest">{evt.city} · {evt.status}</span>
                <h3 className="font-display text-2xl text-[#15120D]">{evt.title}</h3>
                <p className="font-mono text-xs opacity-80">{evt.venue} · {evt.date}</p>
                <p className="font-sans text-sm mt-1">{evt.description}</p>
              </div>

              <button
                onClick={() => { playSFX('ticketClick'); onSelectBooking(evt); }}
                className="w-full h-[56px] bg-[#15120D] text-[#EAD9A6] font-mono text-xs font-bold tracking-[0.2em] uppercase border border-[#15120D] active:bg-[#B9471B]"
              >
                BOOK TICKET ({evt.price}) →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. MOBILE RAW FOOTAGE (2-COLUMN VIDEO GRID)                   */}
      {/* ------------------------------------------------------------- */}
      <section id="m-footage" className="w-full bg-[#0D0A07] text-[#EAD9A6] py-16 px-4 flex flex-col items-center">
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#D19A24] tracking-[0.3em] uppercase">04 RAW FOOTAGE // 16MM REEL</span>

          <div className="grid grid-cols-2 gap-3 w-full">
            {videoList.map((vid) => (
              <div key={vid.id} className="relative aspect-[3/4] bg-[#15120D] border border-[#EAD9A6]/20 rounded-md overflow-hidden flex flex-col justify-end p-2">
                <video src={vid.src} loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div className="relative z-10 bg-[#15120D]/90 p-2 rounded text-left">
                  <p className="font-mono text-[9px] font-bold text-[#EAD9A6] truncate">{vid.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. MOBILE ARCHIVE & SPACES (VINTAGE BLUE BACKGROUND)           */}
      {/* ------------------------------------------------------------- */}
      <section id="m-archive" className="w-full bg-[#315D73] text-[#EAD9A6] py-16 px-6 flex flex-col items-center">
        <div className="w-full max-w-[480px] flex flex-col items-center gap-8">
          <span className="font-mono text-[10px] font-bold text-[#EAD9A6] tracking-[0.3em] uppercase">05 ARCHIVE & SPACES</span>

          {archive.map((item, idx) => (
            <div key={idx} className="w-full bg-[#15120D] text-[#EAD9A6] border-2 border-[#EAD9A6]/30 p-5 shadow-[6px_6px_0px_#15120D] flex flex-col gap-3 text-left">
              <img src={item.image} alt={item.title} className="w-full aspect-[4/3] object-cover border border-[#EAD9A6]/20" />
              <span className="font-mono text-[9px] font-bold text-[#D19A24]">{item.year} · {item.venue}</span>
              <h3 className="font-display text-xl text-[#EAD9A6]">{item.title}</h3>
              <p className="font-sans text-sm opacity-90">{item.description}</p>
              <button
                onClick={() => playSFX('ticketClick')}
                className="w-full h-[48px] mt-2 border border-[#EAD9A6] text-[#EAD9A6] font-mono text-xs font-bold tracking-widest uppercase active:bg-[#EAD9A6] active:text-[#15120D]"
              >
                READ STORY →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. MOBILE DIARY (AGED CREAM EDITORIAL CARD)                   */}
      {/* ------------------------------------------------------------- */}
      <section id="m-diary" className="w-full bg-[#EAD9A6] text-[#15120D] py-16 px-6 flex flex-col items-center">
        <div className="w-full max-w-[480px] flex flex-col items-center gap-8">
          <span className="font-mono text-[10px] font-bold text-[#B9471B] tracking-[0.3em] uppercase">06 TANGY DIARY</span>

          {diaryEntries.map((entry) => (
            <div key={entry.id} className="w-full bg-[#15120D] text-[#EAD9A6] border-2 border-[#15120D] p-5 shadow-[8px_8px_0px_#B9471B] flex flex-col gap-3 text-left">
              <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover border border-[#EAD9A6]/20" />
              <span className="font-mono text-[9px] font-bold text-[#D19A24]">{entry.date} · {entry.location}</span>
              <h3 className="font-display text-xl text-[#EAD9A6]">{entry.title}</h3>
              <p className="font-sans text-sm text-[#EAD9A6]/90">{entry.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. MOBILE CREW (BURNT ORANGE STACKED CARDS)                    */}
      {/* ------------------------------------------------------------- */}
      <section id="m-crew" className="w-full bg-[#B9471B] text-[#EAD9A6] py-16 px-6 flex flex-col items-center">
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#D19A24] tracking-[0.3em] uppercase">07 JOIN THE CREW</span>

          {/* VOLUNTEER CARD */}
          <div className="w-full bg-[#15120D] border-2 border-[#EAD9A6] p-6 shadow-[8px_8px_0px_#15120D] flex flex-col gap-4 text-left">
            <span className="font-mono text-[9px] font-bold text-[#D19A24] tracking-widest">VOLUNTEER</span>
            <h3 className="font-display text-2xl text-[#EAD9A6]">BEHIND THE SCENES.</h3>
            <p className="font-sans text-sm text-[#EAD9A6]/80">Help build the nights, the stories and everything that happens between them.</p>
            <button
              onClick={() => { playSFX('ticketClick'); onArtistSubmit(); }}
              className="w-full h-[56px] bg-[#EAD9A6] text-[#15120D] font-mono text-xs font-bold tracking-[0.2em] uppercase border border-[#15120D] active:bg-[#B9471B] active:text-[#EAD9A6]"
            >
              APPLY AS VOLUNTEER →
            </button>
          </div>

          {/* ARTIST CARD */}
          <div className="w-full bg-[#15120D] border-2 border-[#D19A24] p-6 shadow-[8px_8px_0px_#15120D] flex flex-col gap-4 text-left">
            <span className="font-mono text-[9px] font-bold text-[#B9471B] tracking-widest">ARTIST</span>
            <h3 className="font-display text-2xl text-[#EAD9A6]">TAKE THE STAGE.</h3>
            <p className="font-sans text-sm text-[#EAD9A6]/80">Bring your sound, your story and your energy into the Tangy world.</p>
            <button
              onClick={() => { playSFX('ticketClick'); onArtistSubmit(); }}
              className="w-full h-[56px] bg-[#D19A24] text-[#15120D] font-mono text-xs font-bold tracking-[0.2em] uppercase border border-[#15120D] active:bg-[#B9471B] active:text-[#EAD9A6]"
            >
              APPLY AS ARTIST →
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. MOBILE PRIVATE SESSIONS (VINTAGE BLUE BACKGROUND)           */}
      {/* ------------------------------------------------------------- */}
      <section id="m-private" className="w-full bg-[#315D73] text-[#EAD9A6] py-16 px-6 flex flex-col items-center text-center">
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#D19A24] tracking-[0.3em] uppercase">08 PRIVATE SESSIONS</span>

          <div className="w-full bg-[#15120D] p-2 border-2 border-[#EAD9A6]/30 shadow-[8px_8px_0px_#15120D]">
            <img src="/media/gallery/tangy4.jpg" alt="Private Session" className="w-full aspect-[4/3] object-cover border border-[#EAD9A6]/20" />
          </div>

          <h2 className="font-display text-3xl text-[#EAD9A6] leading-tight">
            MAKE THE NIGHT YOUR OWN.
          </h2>

          <p className="font-sans text-base text-[#EAD9A6]/90 leading-relaxed font-normal">
            Bring the Tangy music experience to your space — private gatherings, house sessions, brand experiences, and curated intimate events.
          </p>

          <button
            onClick={() => { playSFX('ticketClick'); onRequestPrivate(); }}
            className="w-full max-w-[360px] h-[56px] bg-[#EAD9A6] text-[#15120D] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#15120D] shadow-[6px_6px_0px_#15120D] active:bg-[#B9471B] active:text-[#EAD9A6]"
          >
            REQUEST PRIVATE SESSION →
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 11. MOBILE FOOTER (INK BLACK BACKGROUND)                     */}
      {/* ------------------------------------------------------------- */}
      <footer className="w-full bg-[#11100C] text-[#EAD9A6] py-12 px-6 flex flex-col items-center text-center border-t border-[#EAD9A6]/20">
        <div className="w-full max-w-[480px] flex flex-col items-center gap-4">
          <span className="font-display text-2xl text-[#D19A24]">TANGY SESSIONS</span>
          <p className="font-mono text-xs opacity-70">HYDERABAD · INDIA</p>
          <div className="flex gap-4 font-mono text-xs text-[#EAD9A6]/80 my-2">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="underline">INSTAGRAM</a>
            <span>·</span>
            <a href="mailto:hello@tangysessions.com" className="underline">EMAIL</a>
          </div>
          <span className="font-mono text-[9px] opacity-40 uppercase pt-4 border-t border-[#EAD9A6]/10 w-full">
            © 2026 TANGY SESSIONS // ALL RIGHTS RESERVED
          </span>
        </div>
      </footer>

    </div>
  );
};
