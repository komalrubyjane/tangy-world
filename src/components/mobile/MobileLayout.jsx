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
  const [foundersRef, foundersInView] = useMobileInView();
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
    { label: "08 FOUNDERS", target: "#m-founders" },
    { label: "09 CREW", target: "#m-crew" },
    { label: "10 PRIVATE SESSIONS", target: "#m-private" },
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
    <div className="w-full min-h-[100dvh] bg-[#11100C] text-[#F6E7C3] font-sans antialiased overflow-x-hidden selection:bg-[#991B1B] selection:text-[#F6E7C3]">
      
      {/* 1. TOUCH-NATIVE MOBILE NAVIGATION BAR & SLIDE-IN MENU OVERLAY */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#15120D]/95 backdrop-blur-md border-b border-[#F6E7C3]/20 z-[100] flex items-center justify-between px-4 pt-[max(0px,env(safe-area-inset-top))]">
        <button
          onClick={() => { playSFX('ticketClick'); setIsMenuOpen(true); }}
          className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#F6E7C3] flex items-center gap-1.5 border border-[#F6E7C3]/30 px-2.5 py-1 rounded-sm active:scale-95 transition-transform"
        >
          <span>☰</span>
          <span>MENU</span>
        </button>

        <span className="font-poster text-sm font-bold tracking-widest text-[#F6E7C3] uppercase">
          TANGY SESSIONS
        </span>

        <span className="font-mono text-[9px] font-bold text-[#F2B533] tracking-widest border border-[#F2B533]/40 px-2 py-0.5">
          HYD
        </span>
      </header>

      {/* RIGHT SLIDE-IN MOBILE MENU WITH FADE BACKDROP */}
      <div 
        className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div 
          onClick={() => setIsMenuOpen(false)} 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <div 
          className={`absolute top-0 right-0 bottom-0 w-[85%] max-w-[360px] bg-[#15120D] text-[#F6E7C3] flex flex-col justify-between p-6 pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex justify-between items-center border-b border-[#F6E7C3]/20 pb-4">
            <span className="font-mono text-xs text-[#F2B533] tracking-[0.3em] font-bold">PROGRAMME INDEX</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="font-mono text-xs font-bold border-2 border-[#F6E7C3] px-3 py-1 text-[#F6E7C3] active:scale-95 transition-transform"
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
                className={`text-left font-poster text-2xl text-[#F6E7C3] active:text-[#991B1B] border-b border-[#F6E7C3]/10 pb-2 transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="font-mono text-[10px] text-[#F6E7C3]/60 text-center tracking-widest uppercase pt-4 border-t border-[#F6E7C3]/20">
            TANGY SESSIONS // HYDERABAD // EST. 2016
          </div>
        </div>
      </div>

      {/* 2. MOBILE HERO SECTION (100DVH ASYMMETRIC CONCERT POSTER) */}
      <section 
        id="m-hero" 
        className="w-full min-h-[100dvh] bg-[#991B1B] text-[#F6E7C3] flex flex-col items-center justify-between text-center box-border relative overflow-hidden"
        style={{
          paddingTop: 'max(68px, calc(env(safe-area-inset-top) + 56px))',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(20px, env(safe-area-inset-left))',
          paddingRight: 'max(20px, env(safe-area-inset-right))',
        }}
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-multiply pointer-events-none z-10" />

        {/* TOP METADATA BAR */}
        <div className={`w-full max-w-[340px] flex flex-col items-center gap-1.5 z-20 transition-all duration-700 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <span className="font-mono text-[8.5px] sm:text-[9.5px] font-bold text-[#F6E7C3] tracking-[0.25em] uppercase border-y border-[#15120D]/40 py-1 px-3 w-full">
            HYDERABAD // LIVE ARCHIVE // EST. 2016
          </span>
          <span className="font-mono text-[8px] font-bold text-[#F2B533] tracking-[0.2em] uppercase">
            ○ 1974 ASYMMETRIC POSTER
          </span>
        </div>

        {/* MIDDLE SECTION: HANGING MIC + ASYMMETRIC STACKED CHUNKY TYPOGRAPHY */}
        <div className="w-full max-w-[340px] flex flex-col items-center gap-2.5 my-auto z-20 py-2">
          
          {/* STATIC HANGING MICROPHONE */}
          <div className={`w-full flex flex-col items-center pointer-events-none mb-1 transition-all duration-800 delay-200 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
            <div className="w-[1.5px] h-[75px] sm:h-[90px] bg-[#15120D]" />
            <div className="w-13 h-17 sm:w-15 sm:h-19 shadow-xl flex items-center justify-center p-1 -mt-0.5 animate-[spin_8s_ease-in-out_infinite_alternate]">
              <img src="/media/vintage-mic.png" alt="Microphone" className="w-full h-full object-contain filter drop-shadow-md" />
            </div>
          </div>

          {/* ASYMMETRIC POSTER TITLE STACK */}
          <div className={`flex flex-col items-start w-full transition-all duration-700 delay-300 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h1 className="font-poster text-[clamp(58px,16vw,86px)] text-[#F6E7C3] leading-[0.76] tracking-tighter drop-shadow-[6px_6px_0px_#111111] uppercase font-black self-start">
              TANGY
            </h1>
            <h1 className="font-poster text-[clamp(44px,12.5vw,64px)] italic text-[#F2B533] font-black leading-[0.76] tracking-tight drop-shadow-[6px_6px_0px_#111111] -mt-2 uppercase self-end pr-2">
              SESSIONS
            </h1>
            <h1 className="font-poster text-[clamp(24px,7vw,36px)] text-[#F6E7C3] font-bold leading-[0.8] tracking-widest drop-shadow-[4px_4px_0px_#111111] -mt-1 uppercase self-end pr-4 opacity-95">
              HYDERABAD
            </h1>
          </div>

        </div>

        {/* BOTTOM SECTION: ATTACHED CONCERT TICKET CTA */}
        <div className={`w-full max-w-[340px] flex flex-col items-center gap-2.5 z-20 transition-all duration-700 delay-500 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="font-mono text-[9px] sm:text-[10px] font-bold text-[#F6E7C3] tracking-[0.2em] uppercase border-y border-[#15120D]/40 py-1 px-3 w-full">
            UNDERGROUND SERIES • VOL. 09
          </p>

          <button
            onClick={() => handleNavClick('#m-manifesto')}
            className="w-full h-[56px] bg-[#F6E7C3] text-[#111111] border-2 border-[#111111] shadow-[5px_5px_0px_#111111] font-mono text-xs sm:text-sm font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 active:scale-95 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-150 cursor-pointer rotate-[-1deg]"
          >
            <span>[ ENTER TANGY → ]</span>
            <span className="text-[#991B1B] font-black">✦</span>
          </button>
        </div>
      </section>

      {/* 3. MOBILE MANIFESTO */}
      <section 
        ref={manifestoRef}
        id="m-manifesto" 
        className={`w-full bg-[#F6E7C3] text-[#111111] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${manifestoInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5">
          <span className="font-mono text-[10px] font-bold text-[#991B1B] tracking-[0.3em] uppercase">01 MANIFESTO</span>
          <div className="w-full bg-[#15120D] p-2 border-2 border-[#15120D] shadow-[6px_6px_0px_#991B1B] rotate-[1deg]">
            <img src="/media/gallery/tangy1.jpg" alt="Stepwell" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125" />
          </div>
          <h2 className="font-poster text-2xl sm:text-3xl text-[#111111] leading-tight">
            AN INTERACTIVE SCREEN-PRINTED MUSIC ARCHIVE.
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#111111]/90 leading-relaxed">
            Tangy Sessions is a living archive of music, people, and historic spaces in Hyderabad.
          </p>
          <blockquote className="w-full bg-[#991B1B] text-[#F6E7C3] p-5 border-2 border-[#15120D] shadow-[5px_5px_0px_#15120D] font-poster text-lg sm:text-xl italic my-2">
            "This world has a sound. Listen closely."
          </blockquote>
        </div>
      </section>

      {/* 4. MOBILE CHRONOLOGY */}
      <section 
        ref={historyRef}
        id="m-history" 
        className={`w-full bg-[#991B1B] text-[#F6E7C3] py-14 px-5 flex flex-col items-center transition-all duration-700 ${historyInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center">
          <span className="font-mono text-[10px] font-bold text-[#F2B533] tracking-[0.3em] uppercase mb-6">02 CHRONOLOGY // 10 YEARS</span>
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
                className={`w-full bg-[#15120D] border-2 border-[#F2B533] p-5 shadow-[5px_5px_0px_#F2B533] flex flex-col items-start text-left gap-2 transition-all duration-500 ${historyInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-poster text-2xl sm:text-3xl text-[#F2B533]">{item.year}</span>
                  <span className="text-[#991B1B] font-bold">○</span>
                </div>
                <h3 className="font-poster text-base sm:text-lg text-[#F6E7C3]">{item.title}</h3>
                <p className="font-sans text-xs sm:text-sm text-[#F6E7C3]/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. MOBILE SESSIONS */}
      <section 
        ref={sessionsRef}
        id="m-sessions" 
        className={`w-full bg-[#991B1B] py-14 px-5 flex flex-col items-center transition-all duration-700 ${sessionsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[420px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#F6E7C3] tracking-[0.3em] uppercase">03 SESSIONS // TICKETS</span>

          {events.map((evt) => (
            <div key={evt.id} className="w-full bg-[#F6E7C3] text-[#111111] border-2 border-[#15120D] p-4 sm:p-5 shadow-[6px_6px_0px_#15120D] flex flex-col gap-3">
              <img src={evt.image} alt={evt.title} className="w-full aspect-[4/3] object-cover border border-[#15120D]" />
              <div className="flex flex-col gap-1 text-left">
                <span className="font-mono text-[9px] font-bold text-[#991B1B] tracking-widest">{evt.city} · {evt.status}</span>
                <h3 className="font-poster text-xl sm:text-2xl text-[#111111]">{evt.title}</h3>
                <p className="font-mono text-xs opacity-80">{evt.venue} · {evt.date}</p>
                <p className="font-sans text-xs sm:text-sm mt-1">{evt.description}</p>
              </div>

              <button
                onClick={() => { playSFX('ticketClick'); onSelectBooking(evt); }}
                className="w-full h-[56px] bg-[#15120D] text-[#F6E7C3] font-mono text-xs font-bold tracking-[0.2em] uppercase border border-[#15120D] active:scale-95 active:bg-[#991B1B] transition-transform"
              >
                BOOK TICKET ({evt.price}) →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. MOBILE RAW FOOTAGE */}
      <section 
        ref={footageRef}
        id="m-footage" 
        className={`w-full bg-[#0D0A07] text-[#F6E7C3] py-14 px-4 flex flex-col items-center transition-all duration-700 ${footageInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5">
          <span className="font-mono text-[10px] font-bold text-[#F2B533] tracking-[0.3em] uppercase">04 RAW FOOTAGE // 16MM REEL</span>

          <div className="grid grid-cols-2 gap-3 w-full">
            {videoList.map((vid) => (
              <div key={vid.id} className="relative aspect-[3/4] bg-[#15120D] border border-[#F6E7C3]/20 rounded-md overflow-hidden flex flex-col justify-end p-2 group active:scale-95 transition-transform">
                <video src={vid.src} loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" />
                <div className="relative z-10 bg-[#15120D]/90 p-1.5 rounded text-left">
                  <p className="font-mono text-[8.5px] font-bold text-[#F6E7C3] truncate">{vid.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. MOBILE ARCHIVE & SPACES */}
      <section 
        ref={archiveRef}
        id="m-archive" 
        className={`w-full bg-[#315D73] text-[#F6E7C3] py-14 px-5 flex flex-col items-center transition-all duration-700 ${archiveInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#F6E7C3] tracking-[0.3em] uppercase">05 ARCHIVE & SPACES</span>

          {archive.map((item, idx) => (
            <div key={idx} className="w-full bg-[#15120D] text-[#F6E7C3] border-2 border-[#F6E7C3]/30 p-4 sm:p-5 shadow-[6px_6px_0px_#15120D] flex flex-col gap-3 text-left">
              <img src={item.image} alt={item.title} className="w-full aspect-[4/3] object-cover border border-[#F6E7C3]/20" />
              <span className="font-mono text-[9px] font-bold text-[#F2B533]">{item.year} · {item.venue}</span>
              <h3 className="font-poster text-lg sm:text-xl text-[#F6E7C3]">{item.title}</h3>
              <p className="font-sans text-xs sm:text-sm opacity-90">{item.description}</p>
              <button
                onClick={() => playSFX('ticketClick')}
                className="w-full h-[48px] mt-1 border border-[#F6E7C3] text-[#F6E7C3] font-mono text-xs font-bold tracking-widest uppercase active:scale-95 active:bg-[#F6E7C3] active:text-[#111111] transition-transform"
              >
                READ STORY →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 8. MOBILE DIARY */}
      <section 
        ref={diaryRef}
        id="m-diary" 
        className={`w-full bg-[#F6E7C3] text-[#111111] py-14 px-5 flex flex-col items-center transition-all duration-700 ${diaryInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#991B1B] tracking-[0.3em] uppercase">06 TANGY DIARY</span>

          {diaryEntries.map((entry) => (
            <div key={entry.id} className="w-full bg-[#15120D] text-[#F6E7C3] border-2 border-[#15120D] p-4 sm:p-5 shadow-[6px_6px_0px_#991B1B] flex flex-col gap-3 text-left">
              <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover border border-[#F6E7C3]/20" />
              <span className="font-mono text-[9px] font-bold text-[#F2B533]">{entry.date} · {entry.location}</span>
              <h3 className="font-poster text-lg sm:text-xl text-[#F6E7C3]">{entry.title}</h3>
              <p className="font-sans text-xs sm:text-sm text-[#F6E7C3]/90">{entry.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. MOBILE FOUNDERS ARCHIVE */}
      <section 
        ref={foundersRef}
        id="m-founders" 
        className={`w-full bg-[#1C140E] text-[#F6E7C3] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${foundersInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#F2B533] tracking-[0.3em] uppercase">07 FOUNDERS ARCHIVE // FILE 001</span>

          {/* ARJUNA */}
          <div className="w-full bg-[#F6E7C3] text-[#111111] border-2 border-[#15120D] p-5 shadow-[6px_6px_0px_#15120D] flex flex-col gap-3 text-left rotate-[-1deg]">
            <span className="font-mono text-[9px] font-bold text-[#991B1B] tracking-widest">FOUNDER & CREATOR // EST. 2016</span>
            <h3 className="font-poster text-2xl text-[#111111]">ARJUNA</h3>
            <img src="/media/arjun.png" alt="Arjuna" className="w-full aspect-[3/4] object-cover border border-[#15120D]" />
            <p className="font-mono text-xs text-[#111111]/90 border-l-4 border-[#991B1B] pl-3 italic">
              "Born from an obsession with underground sound and ancient spaces."
            </p>
          </div>

          {/* DEEPA */}
          <div className="w-full bg-[#F6E7C3] text-[#111111] border-2 border-[#15120D] p-5 shadow-[6px_6px_0px_#15120D] flex flex-col gap-3 text-left rotate-[1deg]">
            <span className="font-mono text-[9px] font-bold text-[#991B1B] tracking-widest">CO-FOUNDER // EST. 2018</span>
            <h3 className="font-poster text-2xl text-[#111111]">DEEPA</h3>
            <img src="/media/deepa.jpg" alt="Deepa" className="w-full aspect-[3/4] object-cover border border-[#15120D]" />
            <p className="font-mono text-xs text-[#111111]/90 border-l-4 border-[#991B1B] pl-3 italic">
              "The architect of community. Deepa ensures every event feels like a homecoming."
            </p>
          </div>
        </div>
      </section>

      {/* 10. MOBILE CREW */}
      <section 
        ref={crewRef}
        id="m-crew" 
        className={`w-full bg-[#991B1B] text-[#F6E7C3] py-16 px-4 flex flex-col items-center transition-all duration-700 ${crewInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[360px] flex flex-col items-center gap-10">
          <span className="font-mono text-[10px] font-bold text-[#F2B533] tracking-[0.3em] uppercase border-y border-[#15120D]/40 py-1 px-4">
            08 JOIN THE CREW // RECRUITMENT DESK
          </span>

          {/* POSTER 01: VOLUNTEER */}
          <div 
            className={`w-full bg-[#F6E7C3] text-[#111111] p-5 sm:p-6 border-4 border-[#15120D] shadow-[10px_10px_0px_#15120D] rotate-[2deg] relative flex flex-col gap-4 transition-all duration-500 ${crewInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="absolute top-0 right-0 w-6 h-6 bg-[#F2B533] border-b-2 border-l-2 border-[#15120D] shadow-sm pointer-events-none" />
            <div className="absolute -top-3 left-6 w-20 h-5 bg-[rgba(246,231,195,0.9)] rotate-[-3deg] border border-black/30 pointer-events-none" />
            <div className="absolute -top-4 right-8 border-2 border-[#15120D] bg-[#5A120D] text-[#F6E7C3] font-mono text-[8.5px] font-bold px-2.5 py-0.5 uppercase rotate-[-6deg] shadow-md pointer-events-none">
              REC • LIVE // ARCHIVE 08 ✦
            </div>

            <div className="flex justify-between items-center font-mono text-[8.5px] font-bold text-[#315D73] border-b border-[#15120D]/30 pb-2 uppercase">
              <span>ARCHIVE 08 // FILE NO. 204</span>
              <span>HYDERABAD</span>
            </div>

            <div className="flex flex-col text-left">
              <span className="font-mono text-[9px] text-[#991B1B] font-black tracking-widest uppercase">PATH 01 // VOLUNTEER</span>
              <h3 className="font-poster text-3xl sm:text-4xl text-[#111111] leading-none my-1">
                BEHIND THE SCENES
              </h3>
            </div>

            <div className="flex items-center gap-2 font-mono text-[9px] font-bold bg-[#F5E9C9] p-2 border border-[#15120D]">
              <span>🎧 HEADPHONES</span>
              <span>·</span>
              <span>🎙 MIC</span>
              <span>·</span>
              <span>⚡ SPOTLIGHT</span>
            </div>

            <p className="font-mono text-xs text-[#111111]/90 border-l-4 border-[#F2B533] pl-3 py-0.5 italic">
              ✎ "Help build the nights, the stories and everything that happens between them."
            </p>

            <button
              onClick={() => { playSFX('ticketClick'); onArtistSubmit(); }}
              className="w-full h-[56px] bg-[#F2B533] text-[#111111] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#15120D] shadow-[4px_4px_0px_#15120D] active:scale-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150"
            >
              [ APPLY AS VOLUNTEER → ]
            </button>
          </div>

          {/* POSTER 02: ARTIST */}
          <div 
            className={`w-full bg-[#15120D] text-[#F6E7C3] p-5 sm:p-6 border-4 border-[#F2B533] shadow-[10px_10px_0px_#15120D] rotate-[-2deg] relative flex flex-col gap-4 transition-all duration-500 delay-200 ${crewInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="absolute -top-3 right-6 w-20 h-5 bg-[rgba(242,181,51,0.85)] rotate-[4deg] border border-black/30 pointer-events-none" />
            <div className="absolute -top-4 left-6 border-2 border-[#15120D] bg-[#991B1B] text-[#F6E7C3] font-mono text-[8.5px] font-bold px-2 py-0.5 uppercase rotate-[4deg] shadow-md pointer-events-none">
              PROPERTY OF TANGY // BACKSTAGE ✦
            </div>

            <div className="flex justify-between items-center font-mono text-[8.5px] font-bold text-[#F2B533] border-b border-[#F6E7C3]/20 pb-2 uppercase">
              <span>SIDE A // 33⅓ RPM STEREO</span>
              <span>AUDITION FILE</span>
            </div>

            <div className="flex flex-col text-left">
              <span className="font-mono text-[9px] text-[#F2B533] font-black tracking-widest uppercase">PATH 02 // ARTIST</span>
              <h3 className="font-poster text-3xl sm:text-4xl text-[#F6E7C3] leading-none my-1">
                TAKE THE STAGE
              </h3>
            </div>

            <div className="flex items-center justify-between bg-[#1C140E] p-2.5 border border-[#F2B533]/40 font-mono text-[9px]">
              <div className="flex items-center gap-2">
                <img src="/media/vinyl.png" alt="Vinyl" className="w-6 h-6 object-contain animate-[spin_6s_linear_infinite]" />
                <span className="font-bold text-[#F2B533]">33⅓ RPM LIVE RECORDING</span>
              </div>
              <span className="bg-[#991B1B] text-[#F6E7C3] px-1.5 py-0.5 text-[7.5px] font-bold uppercase">GUITAR PICK ✦</span>
            </div>

            <p className="font-mono text-xs text-[#F6E7C3]/90 border-l-4 border-[#991B1B] pl-3 py-0.5 italic">
              ✎ "Bring your sound, your story and your energy into the Tangy world."
            </p>

            <button
              onClick={() => { playSFX('ticketClick'); onArtistSubmit(); }}
              className="w-full h-[56px] bg-[#991B1B] text-[#F6E7C3] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#15120D] shadow-[4px_4px_0px_#15120D] active:scale-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150"
            >
              [ APPLY AS ARTIST → ]
            </button>
          </div>

        </div>
      </section>

      {/* 11. MOBILE PRIVATE SESSIONS */}
      <section 
        ref={privateRef}
        id="m-private" 
        className={`w-full bg-[#315D73] text-[#F6E7C3] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${privateInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5">
          <span className="font-mono text-[10px] font-bold text-[#F2B533] tracking-[0.3em] uppercase">09 PRIVATE SESSIONS</span>

          <div className="w-full bg-[#15120D] p-2 border-2 border-[#F6E7C3]/30 shadow-[6px_6px_0px_#15120D]">
            <img src="/media/gallery/tangy4.jpg" alt="Private Session" className="w-full aspect-[4/3] object-cover border border-[#F6E7C3]/20" />
          </div>

          <h2 className="font-poster text-2xl sm:text-3xl text-[#F6E7C3] leading-tight">
            MAKE THE NIGHT YOUR OWN.
          </h2>

          <p className="font-sans text-xs sm:text-sm text-[#F6E7C3]/90 leading-relaxed font-normal">
            Bring the Tangy music experience to your space — private gatherings, house sessions, brand experiences, and curated intimate events.
          </p>

          <button
            onClick={() => { playSFX('ticketClick'); onRequestPrivate(); }}
            className="w-full max-w-[340px] h-[56px] bg-[#F6E7C3] text-[#111111] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#15120D] shadow-[5px_5px_0px_#15120D] active:scale-95 active:bg-[#991B1B] active:text-[#F6E7C3] transition-transform animate-[pulse_4s_ease-in-out_infinite]"
          >
            REQUEST PRIVATE SESSION →
          </button>
        </div>
      </section>

      {/* 12. MOBILE FOOTER */}
      <footer className="w-full bg-[#11100C] text-[#F6E7C3] py-10 px-5 flex flex-col items-center text-center border-t border-[#F6E7C3]/20">
        <div className="w-full max-w-[480px] flex flex-col items-center gap-3">
          <span className="font-poster text-xl text-[#F2B533]">TANGY SESSIONS</span>
          <p className="font-mono text-xs opacity-70">HYDERABAD · INDIA</p>
          <div className="flex gap-4 font-mono text-xs text-[#F6E7C3]/80 my-1">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="underline">INSTAGRAM</a>
            <span>·</span>
            <a href="mailto:hello@tangysessions.com" className="underline">EMAIL</a>
          </div>
          <span className="font-mono text-[8.5px] opacity-40 uppercase pt-3 border-t border-[#F6E7C3]/10 w-full">
            © 2026 TANGY SESSIONS // ALL RIGHTS RESERVED
          </span>
        </div>
      </footer>

    </div>
  );
};
