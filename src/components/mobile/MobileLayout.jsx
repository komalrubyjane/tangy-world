import { useState, useEffect, useRef } from 'react';
import { events, gallery, diaryEntries, archive } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

// Lightweight 60 FPS IntersectionObserver Hook for Mobile Scroll Animations
const useMobileInView = (options = { threshold: 0.15 }) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isInView];
};

export const MobileLayout = ({ onSelectBooking, onArtistSubmit, onRequestPrivate }) => {
  const { playSFX } = useAudio();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  // Mobile InView Refs for Section Animations
  const [manifestoRef, manifestoInView] = useMobileInView();
  const [historyRef, historyInView] = useMobileInView();
  const [sessionsRef, sessionsInView] = useMobileInView();
  const [footageRef, footageInView] = useMobileInView();
  const [archiveRef, archiveInView] = useMobileInView();
  const [diaryRef, diaryInView] = useMobileInView();
  const [crewRef, crewInView] = useMobileInView();
  const [privateRef, privateInView] = useMobileInView();

  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="w-full min-h-[100dvh] bg-[#11100C] text-[#EAD9A6] font-sans antialiased overflow-x-hidden selection:bg-[#B9471B] selection:text-[#EAD9A6]">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOUCH-NATIVE MOBILE NAVIGATION BAR & SLIDE-IN MENU OVERLAY */}
      {/* ------------------------------------------------------------- */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#15120D]/95 backdrop-blur-md border-b border-[#EAD9A6]/20 z-[100] flex items-center justify-between px-4 pt-[max(0px,env(safe-area-inset-top))]">
        <button
          onClick={() => { playSFX('ticketClick'); setIsMenuOpen(true); }}
          className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#EAD9A6] flex items-center gap-1.5 border border-[#EAD9A6]/30 px-2.5 py-1 rounded-sm active:scale-95 transition-transform"
        >
          <span>☰</span>
          <span>MENU</span>
        </button>

        <span className="font-display text-sm font-bold tracking-widest text-[#EAD9A6] uppercase">
          TANGY SESSIONS
        </span>

        <span className="font-mono text-[9px] font-bold text-[#D19A24] tracking-widest border border-[#D19A24]/40 px-2 py-0.5">
          HYD
        </span>
      </header>

      {/* RIGHT SLIDE-IN MOBILE MENU WITH FADE BACKDROP */}
      <div 
        className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div 
          onClick={() => setIsMenuOpen(false)} 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Sliding Drawer */}
        <div 
          className={`absolute top-0 right-0 bottom-0 w-[85%] max-w-[360px] bg-[#15120D] text-[#EAD9A6] flex flex-col justify-between p-6 pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex justify-between items-center border-b border-[#EAD9A6]/20 pb-4">
            <span className="font-mono text-xs text-[#D19A24] tracking-[0.3em] font-bold">PROGRAMME INDEX</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="font-mono text-xs font-bold border-2 border-[#EAD9A6] px-3 py-1 text-[#EAD9A6] active:scale-95 transition-transform"
            >
              ✕ CLOSE
            </button>
          </div>

          <nav className="flex flex-col gap-2.5 my-6">
            {navLinks.map((link, idx) => (
              <button
                key={link.target}
                onClick={() => handleNavClick(link.target)}
                style={{ transitionDelay: `${idx * 40}ms` }}
                className={`text-left font-display text-2xl text-[#EAD9A6] active:text-[#B9471B] border-b border-[#EAD9A6]/10 pb-2 transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="font-mono text-[10px] text-[#EAD9A6]/60 text-center tracking-widest uppercase pt-4 border-t border-[#EAD9A6]/20">
            TANGY SESSIONS // HYDERABAD // EST. 2016
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MOBILE HERO SECTION (TOUCH-FIRST 1.5S TIMED INTRO SEQUENCE) */}
      {/* ------------------------------------------------------------- */}
      <section 
        id="m-hero" 
        className="w-full min-h-[100dvh] bg-[#B9471B] text-[#EAD9A6] flex flex-col items-center justify-between text-center box-border relative overflow-hidden"
        style={{
          paddingTop: 'max(68px, calc(env(safe-area-inset-top) + 56px))',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(20px, env(safe-area-inset-left))',
          paddingRight: 'max(20px, env(safe-area-inset-right))',
        }}
      >
        {/* SOLID INK NOISE GRAIN TEXTURE */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-multiply pointer-events-none z-10" />

        {/* TOP METADATA BAR */}
        <div className={`w-full max-w-[340px] flex flex-col items-center gap-1.5 z-20 transition-all duration-700 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <span className="font-mono text-[8.5px] sm:text-[9.5px] font-bold text-[#EAD9A6] tracking-[0.25em] uppercase border-y border-[#15120D]/40 py-1 px-3 w-full">
            TANGY SESSIONS // HYDERABAD // EST. 2016
          </span>
          <span className="font-mono text-[8px] font-bold text-[#D19A24] tracking-[0.2em] uppercase">
            ○ LIVE ARCHIVE
          </span>
        </div>

        {/* MIDDLE SECTION: STATIC SWING MIC + PORTRAIT POLAROID + TITLE */}
        <div className="w-full max-w-[340px] flex flex-col items-center gap-3 my-auto z-20 py-2">
          
          {/* STATIC HANGING MICROPHONE WITH GENTLE IDLE SWING */}
          <div className={`w-full flex flex-col items-center pointer-events-none mb-1 transition-all duration-800 delay-200 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
            <div className="w-[1.5px] h-[75px] sm:h-[90px] bg-[#15120D]" />
            <div className="w-12 h-16 sm:w-14 sm:h-18 border border-black/40 rounded-b-xl shadow-xl flex items-center justify-center bg-[linear-gradient(135deg,#999_0%,#222_40%,#666_70%,#111_100%)] p-1 -mt-0.5 animate-[spin_8s_ease-in-out_infinite_alternate]">
              <img src="/media/vintage-mic.png" alt="Microphone" className="w-full h-full object-contain filter drop-shadow-md" />
            </div>
          </div>

          {/* PORTRAIT POLAROID PHOTO (SCALES & ROTATES IN VIEW) */}
          <div className={`w-[72%] max-w-[280px] sm:max-w-[320px] bg-[#EAD9A6] p-2 sm:p-2.5 pb-6 sm:pb-7 border-2 border-[#15120D] shadow-[8px_8px_0px_#15120D] rotate-[-1.5deg] transition-all duration-700 delay-400 ${heroLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className="absolute -top-2.5 left-1/3 w-16 h-4 bg-[rgba(234,217,166,0.85)] rotate-[-3deg] border border-black/30 z-30" />
            <img 
              src={gallery[2]?.src || "/media/gallery/tangy3.jpg"} 
              alt="Tangy Concert Crowd" 
              className="w-full aspect-[3/4] object-cover filter grayscale contrast-130 sepia-[0.2] border border-[#15120D] block"
            />
            <p className="font-mono text-[8px] text-[#15120D] font-bold tracking-wider mt-1.5 text-left">✎ BANSILALPET // 11:42 PM</p>
          </div>

          {/* CLAMPED RESPONSIVE TITLE */}
          <div className={`flex flex-col items-center mt-2 transition-all duration-700 delay-300 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h1 className="font-display text-[clamp(50px,13.5vw,72px)] text-[#EAD9A6] leading-[0.82] tracking-tighter drop-shadow-[4px_4px_0px_#15120D]">
              TANGY
            </h1>
            <h1 className="font-display text-[clamp(42px,11.5vw,60px)] italic text-[#D19A24] font-normal leading-[0.82] tracking-tight drop-shadow-[4px_4px_0px_#15120D] -mt-1">
              WORLD
            </h1>
          </div>

        </div>

        {/* BOTTOM SECTION: SUBTITLE + TACTILE 56PX BUTTON */}
        <div className={`w-full max-w-[340px] flex flex-col items-center gap-3 z-20 transition-all duration-700 delay-500 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="font-mono text-[9px] sm:text-[10px] font-bold text-[#EAD9A6] tracking-[0.2em] uppercase border-y border-[#15120D]/40 py-1 px-3 w-full">
            MUSIC • PEOPLE • PLACES • STORIES
          </p>

          <button
            onClick={() => handleNavClick('#m-manifesto')}
            className="w-full h-[56px] bg-[#EAD9A6] text-[#15120D] border-2 border-[#15120D] shadow-[5px_5px_0px_#15120D] font-mono text-xs sm:text-sm font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 active:scale-95 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-150 cursor-pointer"
          >
            <span>[ EXPLORE THE WORLD ↓ ]</span>
            <span className="text-[#B9471B] font-black">✦</span>
          </button>
        </div>

      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. MOBILE MANIFESTO (AGED CREAM - SMOOTH SCROLL FADE ENTRANCE) */}
      {/* ------------------------------------------------------------- */}
      <section 
        ref={manifestoRef}
        id="m-manifesto" 
        className={`w-full bg-[#EAD9A6] text-[#15120D] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${manifestoInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5">
          <span className="font-mono text-[10px] font-bold text-[#B9471B] tracking-[0.3em] uppercase">01 MANIFESTO</span>
          
          <div className="w-full bg-[#15120D] p-2 border-2 border-[#15120D] shadow-[6px_6px_0px_#B9471B] rotate-[1deg]">
            <img src="/media/gallery/tangy1.jpg" alt="Stepwell" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125" />
          </div>

          <h2 className="font-display text-2xl sm:text-3xl text-[#15120D] leading-tight">
            AN INTERACTIVE SCREEN-PRINTED MUSIC ARCHIVE.
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#15120D]/90 leading-relaxed">
            Tangy Sessions is a living archive of music, people, and historic spaces in Hyderabad. We transform forgotten stepwells, secret courtyards, and ancient stone corridors into intimate gathering spaces where sound vibrates through masonry.
          </p>

          <blockquote className="w-full bg-[#B9471B] text-[#EAD9A6] p-5 border-2 border-[#15120D] shadow-[5px_5px_0px_#15120D] font-display text-lg sm:text-xl italic my-2">
            "This world has a sound. Listen closely."
          </blockquote>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. MOBILE CHRONOLOGY (HISTORY - STAGGERED YEAR CARDS)        */}
      {/* ------------------------------------------------------------- */}
      <section 
        ref={historyRef}
        id="m-history" 
        className={`w-full bg-[#B9471B] text-[#EAD9A6] py-14 px-5 flex flex-col items-center transition-all duration-700 ${historyInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center">
          <span className="font-mono text-[10px] font-bold text-[#D19A24] tracking-[0.3em] uppercase mb-6">02 CHRONOLOGY // 10 YEARS</span>

          <div className="w-full flex flex-col gap-6">
            {[
              { year: "2016", title: "THE FIRST SPARK", desc: "First acoustic sessions inside private living rooms & stepwells." },
              { year: "2018", title: "THE MOVEMENT GROWS", desc: "Underground electronic producers join the lineage." },
              { year: "2020", title: "THE ARCHIVE RECORDINGS", desc: "Bansilalpet Stepwell becomes our primary sonic sanctuary." },
              { year: "2023", title: "PAN-INDIA EXPANSION", desc: "Curating intimate nights across Mumbai, Delhi, and Goa." },
              { year: "2025", title: "TANGY WORLD TODAY", desc: "Over 200+ artists and thousands of listeners united by sound." },
            ].map((item, idx) => (
              <div 
                key={idx} 
                style={{ transitionDelay: `${idx * 120}ms` }}
                className={`w-full bg-[#15120D] border-2 border-[#D19A24] p-5 shadow-[5px_5px_0px_#D19A24] flex flex-col items-start text-left gap-2 transition-all duration-500 ${historyInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-2xl sm:text-3xl text-[#D19A24]">{item.year}</span>
                  <span className="text-[#B9471B] font-bold">○</span>
                </div>
                <h3 className="font-display text-base sm:text-lg text-[#EAD9A6]">{item.title}</h3>
                <p className="font-sans text-xs sm:text-sm text-[#EAD9A6]/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. MOBILE SESSIONS (TACTILE POSTER TICKET CARDS)              */}
      {/* ------------------------------------------------------------- */}
      <section 
        ref={sessionsRef}
        id="m-sessions" 
        className={`w-full bg-[#B9471B] py-14 px-5 flex flex-col items-center transition-all duration-700 ${sessionsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[420px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#EAD9A6] tracking-[0.3em] uppercase">03 SESSIONS // TICKETS</span>

          {events.map((evt) => (
            <div key={evt.id} className="w-full bg-[#EAD9A6] text-[#15120D] border-2 border-[#15120D] p-4 sm:p-5 shadow-[6px_6px_0px_#15120D] flex flex-col gap-3">
              <img src={evt.image} alt={evt.title} className="w-full aspect-[4/3] object-cover border border-[#15120D]" />
              <div className="flex flex-col gap-1 text-left">
                <span className="font-mono text-[9px] font-bold text-[#B9471B] tracking-widest">{evt.city} · {evt.status}</span>
                <h3 className="font-display text-xl sm:text-2xl text-[#15120D]">{evt.title}</h3>
                <p className="font-mono text-xs opacity-80">{evt.venue} · {evt.date}</p>
                <p className="font-sans text-xs sm:text-sm mt-1">{evt.description}</p>
              </div>

              <button
                onClick={() => { playSFX('ticketClick'); onSelectBooking(evt); }}
                className="w-full h-[56px] bg-[#15120D] text-[#EAD9A6] font-mono text-xs font-bold tracking-[0.2em] uppercase border border-[#15120D] active:scale-95 active:bg-[#B9471B] transition-transform"
              >
                BOOK TICKET ({evt.price}) →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. MOBILE RAW FOOTAGE (FADE & ZOOM 2-COLUMN GRID)              */}
      {/* ------------------------------------------------------------- */}
      <section 
        ref={footageRef}
        id="m-footage" 
        className={`w-full bg-[#0D0A07] text-[#EAD9A6] py-14 px-4 flex flex-col items-center transition-all duration-700 ${footageInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5">
          <span className="font-mono text-[10px] font-bold text-[#D19A24] tracking-[0.3em] uppercase">04 RAW FOOTAGE // 16MM REEL</span>

          <div className="grid grid-cols-2 gap-3 w-full">
            {videoList.map((vid) => (
              <div key={vid.id} className="relative aspect-[3/4] bg-[#15120D] border border-[#EAD9A6]/20 rounded-md overflow-hidden flex flex-col justify-end p-2 group active:scale-95 transition-transform">
                <video src={vid.src} loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" />
                <div className="relative z-10 bg-[#15120D]/90 p-1.5 rounded text-left">
                  <p className="font-mono text-[8.5px] font-bold text-[#EAD9A6] truncate">{vid.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. MOBILE ARCHIVE & SPACES (VINTAGE BLUE BACKGROUND)           */}
      {/* ------------------------------------------------------------- */}
      <section 
        ref={archiveRef}
        id="m-archive" 
        className={`w-full bg-[#315D73] text-[#EAD9A6] py-14 px-5 flex flex-col items-center transition-all duration-700 ${archiveInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#EAD9A6] tracking-[0.3em] uppercase">05 ARCHIVE & SPACES</span>

          {archive.map((item, idx) => (
            <div key={idx} className="w-full bg-[#15120D] text-[#EAD9A6] border-2 border-[#EAD9A6]/30 p-4 sm:p-5 shadow-[6px_6px_0px_#15120D] flex flex-col gap-3 text-left">
              <img src={item.image} alt={item.title} className="w-full aspect-[4/3] object-cover border border-[#EAD9A6]/20" />
              <span className="font-mono text-[9px] font-bold text-[#D19A24]">{item.year} · {item.venue}</span>
              <h3 className="font-display text-lg sm:text-xl text-[#EAD9A6]">{item.title}</h3>
              <p className="font-sans text-xs sm:text-sm opacity-90">{item.description}</p>
              <button
                onClick={() => playSFX('ticketClick')}
                className="w-full h-[48px] mt-1 border border-[#EAD9A6] text-[#EAD9A6] font-mono text-xs font-bold tracking-widest uppercase active:scale-95 active:bg-[#EAD9A6] active:text-[#15120D] transition-transform"
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
      <section 
        ref={diaryRef}
        id="m-diary" 
        className={`w-full bg-[#EAD9A6] text-[#15120D] py-14 px-5 flex flex-col items-center transition-all duration-700 ${diaryInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#B9471B] tracking-[0.3em] uppercase">06 TANGY DIARY</span>

          {diaryEntries.map((entry) => (
            <div key={entry.id} className="w-full bg-[#15120D] text-[#EAD9A6] border-2 border-[#15120D] p-4 sm:p-5 shadow-[6px_6px_0px_#B9471B] flex flex-col gap-3 text-left">
              <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover border border-[#EAD9A6]/20" />
              <span className="font-mono text-[9px] font-bold text-[#D19A24]">{entry.date} · {entry.location}</span>
              <h3 className="font-display text-lg sm:text-xl text-[#EAD9A6]">{entry.title}</h3>
              <p className="font-sans text-xs sm:text-sm text-[#EAD9A6]/90">{entry.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. MOBILE CREW (BURNT ORANGE STACKED CARDS)                    */}
      {/* ------------------------------------------------------------- */}
      <section 
        ref={crewRef}
        id="m-crew" 
        className={`w-full bg-[#B9471B] text-[#EAD9A6] py-14 px-5 flex flex-col items-center transition-all duration-700 ${crewInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#D19A24] tracking-[0.3em] uppercase">07 JOIN THE CREW</span>

          {/* VOLUNTEER CARD */}
          <div className="w-full bg-[#15120D] border-2 border-[#EAD9A6] p-5 shadow-[6px_6px_0px_#15120D] flex flex-col gap-3 text-left">
            <span className="font-mono text-[9px] font-bold text-[#D19A24] tracking-widest">VOLUNTEER</span>
            <h3 className="font-display text-xl sm:text-2xl text-[#EAD9A6]">BEHIND THE SCENES.</h3>
            <p className="font-sans text-xs sm:text-sm text-[#EAD9A6]/80">Help build the nights, the stories and everything that happens between them.</p>
            <button
              onClick={() => { playSFX('ticketClick'); onArtistSubmit(); }}
              className="w-full h-[56px] bg-[#EAD9A6] text-[#15120D] font-mono text-xs font-bold tracking-[0.2em] uppercase border border-[#15120D] active:scale-95 active:bg-[#B9471B] active:text-[#EAD9A6] transition-transform"
            >
              APPLY AS VOLUNTEER →
            </button>
          </div>

          {/* ARTIST CARD */}
          <div className="w-full bg-[#15120D] border-2 border-[#D19A24] p-5 shadow-[6px_6px_0px_#15120D] flex flex-col gap-3 text-left">
            <span className="font-mono text-[9px] font-bold text-[#B9471B] tracking-widest">ARTIST</span>
            <h3 className="font-display text-xl sm:text-2xl text-[#EAD9A6]">TAKE THE STAGE.</h3>
            <p className="font-sans text-xs sm:text-sm text-[#EAD9A6]/80">Bring your sound, your story and your energy into the Tangy world.</p>
            <button
              onClick={() => { playSFX('ticketClick'); onArtistSubmit(); }}
              className="w-full h-[56px] bg-[#D19A24] text-[#15120D] font-mono text-xs font-bold tracking-[0.2em] uppercase border border-[#15120D] active:scale-95 active:bg-[#B9471B] active:text-[#EAD9A6] transition-transform"
            >
              APPLY AS ARTIST →
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. MOBILE PRIVATE SESSIONS (VINTAGE BLUE - GENTLE PULSE CTA) */}
      {/* ------------------------------------------------------------- */}
      <section 
        ref={privateRef}
        id="m-private" 
        className={`w-full bg-[#315D73] text-[#EAD9A6] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${privateInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5">
          <span className="font-mono text-[10px] font-bold text-[#D19A24] tracking-[0.3em] uppercase">08 PRIVATE SESSIONS</span>

          <div className="w-full bg-[#15120D] p-2 border-2 border-[#EAD9A6]/30 shadow-[6px_6px_0px_#15120D]">
            <img src="/media/gallery/tangy4.jpg" alt="Private Session" className="w-full aspect-[4/3] object-cover border border-[#EAD9A6]/20" />
          </div>

          <h2 className="font-display text-2xl sm:text-3xl text-[#EAD9A6] leading-tight">
            MAKE THE NIGHT YOUR OWN.
          </h2>

          <p className="font-sans text-xs sm:text-sm text-[#EAD9A6]/90 leading-relaxed font-normal">
            Bring the Tangy music experience to your space — private gatherings, house sessions, brand experiences, and curated intimate events.
          </p>

          <button
            onClick={() => { playSFX('ticketClick'); onRequestPrivate(); }}
            className="w-full max-w-[340px] h-[56px] bg-[#EAD9A6] text-[#15120D] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#15120D] shadow-[5px_5px_0px_#15120D] active:scale-95 active:bg-[#B9471B] active:text-[#EAD9A6] transition-transform animate-[pulse_4s_ease-in-out_infinite]"
          >
            REQUEST PRIVATE SESSION →
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 11. MOBILE FOOTER (INK BLACK BACKGROUND)                     */}
      {/* ------------------------------------------------------------- */}
      <footer className="w-full bg-[#11100C] text-[#EAD9A6] py-10 px-5 flex flex-col items-center text-center border-t border-[#EAD9A6]/20">
        <div className="w-full max-w-[480px] flex flex-col items-center gap-3">
          <span className="font-display text-xl text-[#D19A24]">TANGY SESSIONS</span>
          <p className="font-mono text-xs opacity-70">HYDERABAD · INDIA</p>
          <div className="flex gap-4 font-mono text-xs text-[#EAD9A6]/80 my-1">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="underline">INSTAGRAM</a>
            <span>·</span>
            <a href="mailto:hello@tangysessions.com" className="underline">EMAIL</a>
          </div>
          <span className="font-mono text-[8.5px] opacity-40 uppercase pt-3 border-t border-[#EAD9A6]/10 w-full">
            © 2026 TANGY SESSIONS // ALL RIGHTS RESERVED
          </span>
        </div>
      </footer>

    </div>
  );
};
