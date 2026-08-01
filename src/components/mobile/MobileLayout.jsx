import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { events, gallery, diaryEntries, archive } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { GlobalMicrophoneJourney } from '../ui/GlobalMicrophoneJourney';
import { 
  NotebookGridPattern, 
  MusicManuscriptPattern, 
  BlueprintGridPattern, 
  WarpedCheckerPattern, 
  SoundWaveGraphic,
  CassetteTapeGraphic,
  GinghamRibbonPattern,
  TornNewspaperScrap,
  PushPin
} from '../ui/BackgroundDecorations';

// Lightweight 60 FPS IntersectionObserver Hook for Mobile Scroll Animations
const useMobileInView = (options = { threshold: 0.12 }) => {
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

export const MobileLayout = ({ 
  onSelectBooking, 
  onArtistSubmit, 
  onRequestPrivate,
  onOpenSoundArchive,
  onOpenVinyl,
  onOpenProgramme,
  onOpenArchive,
  onOpenShop,
  onOpenPassport,
  onOpenPostcard
}) => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const ticketRef = useRef(null);

  // Mobile InView Refs for All Sections
  const [manifestoRef, manifestoInView] = useMobileInView();
  const [historyRef, historyInView] = useMobileInView();
  const [sessionsRef, sessionsInView] = useMobileInView();
  const [footageRef, footageInView] = useMobileInView();
  const [archiveRef, archiveInView] = useMobileInView();
  const [spacesRef, spacesInView] = useMobileInView();
  const [diaryRef, diaryInView] = useMobileInView();
  const [artistsRef, artistsInView] = useMobileInView();
  const [foundersRef, foundersInView] = useMobileInView();
  const [crewRef, crewInView] = useMobileInView();
  const [privateRef, privateInView] = useMobileInView();
  const [newsletterRef, newsletterInView] = useMobileInView();
  const [closingRef, closingInView] = useMobileInView();

  const navLinks = [
    { label: "01 COVER", target: "#m-hero" },
    { label: "02 MANIFESTO", target: "#m-manifesto" },
    { label: "03 SESSIONS & TICKETS", target: "#m-sessions" },
    { label: "04 ARTIST PORTAL ✦", route: "/artists" },
    { label: "05 ARCHIVE RECORDINGS", target: "#m-archive" },
    { label: "06 DIARY & JOURNAL", target: "#m-diary" },
    { label: "07 JOIN THE CREW ✦", route: "/crew" },
    { label: "08 PRIVATE SESSIONS ✦", route: "/private-sessions" },
    { label: "09 CHRONOLOGY", target: "#m-history" },
    { label: "10 RAW FOOTAGE", target: "#m-footage" },
    { label: "11 SANCTUARY SPACES", target: "#m-spaces" },
    { label: "12 ARCHIVE SPREADS", action: onOpenArchive },
    { label: "13 VINYL TURNTABLE", action: onOpenVinyl },
    { label: "14 SOUND ARCHIVE", action: onOpenSoundArchive },
    { label: "15 TODAY'S PROGRAMME", action: onOpenProgramme },
    { label: "16 GENERAL STORE", action: onOpenShop },
    { label: "17 MEMBER PASSPORT", action: onOpenPassport },
    { label: "18 POSTCARD MAILBOX", action: onOpenPostcard }
  ];

  const handleNavClick = (link) => {
    playSFX('ticketClick');
    setIsMenuOpen(false);
    if (link.route) {
      navigate(link.route);
    } else if (link.action) {
      link.action();
    } else if (link.target) {
      const el = document.querySelector(link.target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTicketClick = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    playSFX('ticketClick');
    if (ticketRef.current) {
      ticketRef.current.animate(
        [
          { transform: 'translate(-50%, -50%) rotate(-3deg) scale(1)' },
          { transform: 'translate(-50%, -50%) rotate(-3deg) scale(0.97)' },
          { transform: 'translate(-50%, -50%) rotate(-3deg) scale(1)' }
        ],
        { duration: 220 }
      );
    }
    const manifestoEl = document.querySelector('#m-manifesto') || document.querySelector('#manifesto');
    if (manifestoEl) {
      manifestoEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    playSFX('ticketClick');
    setSubscribed(true);
  };

  const videoList = [
    { id: 1, title: "Damini Bhatla Live", src: "/media/background-video/Fresh from the archives, when @daminibhatlach performed for us, the space softened around her, w.mp4" },
    { id: 2, title: "Stepwell Acoustics", src: "/media/background-video/Video-63639.mp4" },
    { id: 3, title: "After Midnight Jam", src: "/media/background-video/Video-22402.mp4" },
    { id: 4, title: "Tangy Rituals", src: "/media/videos/tangy.mp4" },
  ];

  const spacesList = [
    { id: 1, title: "Bansilalpet Stepwell", type: "Stepwell Sanctuary", location: "Secunderabad", image: "/media/gallery/tangy1.jpg", notes: "17th century stepwell with natural acoustic resonance." },
    { id: 2, title: "Taramati Baradari", type: "Heritage Amphitheatre", location: "Ibrahim Bagh", image: "/media/gallery/tangy2.jpg", notes: "Historic pavilion built for music and acoustic projection." },
    { id: 3, title: "Old City Courtyard", type: "Private Heritage Haveli", location: "Charminar Lane", image: "/media/gallery/tangy3.jpg", notes: "Open-air courtyard sheltered by stone arches." },
  ];

  const artistList = [
    { id: 1, name: "Damini Bhatla", genre: "Sufi & Contemporary", role: "Vocalist", image: "/media/gallery/tangy3.jpg" },
    { id: 2, name: "Varun Rao", genre: "Carnatic Fusion", role: "Violin", image: "/media/gallery/tangy4.jpg" },
    { id: 3, name: "Nikhil & Band", genre: "Acoustic Folk", role: "Ensemble", image: "/media/gallery/tangy5.jpg" },
  ];

  return (
    <div className="w-full min-h-[100dvh] bg-[#191410] text-[#ecdcaf] font-sans antialiased overflow-x-hidden selection:bg-[#c2272a] selection:text-[#ecdcaf]">
      
      {/* GLOBAL CONTINUOUS HANGING MICROPHONE STORYTELLING JOURNEY (<1024px) */}
      <GlobalMicrophoneJourney active={true} />

      {/* 1. TOUCH-NATIVE MOBILE NAVIGATION BAR & SLIDE-IN MENU OVERLAY */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#191410]/95 backdrop-blur-md border-b border-[#ecdcaf]/20 z-[100] flex items-center justify-between px-4 pt-[max(0px,env(safe-area-inset-top))]">
        <button
          onClick={() => { playSFX('ticketClick'); setIsMenuOpen(true); }}
          className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#ecdcaf] flex items-center gap-1.5 border border-[#ecdcaf]/30 px-2.5 py-1 rounded-sm active:scale-95 transition-transform"
        >
          <span>☰</span>
          <span>INDEX ({navLinks.length})</span>
        </button>

        <span 
          onClick={() => navigate('/')}
          className="font-poster text-sm font-bold tracking-widest text-[#ecdcaf] uppercase cursor-pointer"
        >
          TANGY SESSIONS
        </span>

        <span className="font-mono text-[9px] font-bold text-[#d1a437] tracking-widest border border-[#d1a437]/40 px-2 py-0.5">
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
          className={`absolute top-0 right-0 bottom-0 w-[88%] max-w-[360px] bg-[#191410] text-[#ecdcaf] flex flex-col justify-between p-5 pt-[max(20px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex justify-between items-center border-b border-[#ecdcaf]/20 pb-3">
            <span className="font-mono text-xs text-[#d1a437] tracking-[0.3em] font-bold">PROGRAMME INDEX</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="font-mono text-xs font-bold border-2 border-[#ecdcaf] px-2.5 py-1 text-[#ecdcaf] active:scale-95 transition-transform"
            >
              ✕ CLOSE
            </button>
          </div>

          <nav className="flex flex-col gap-2 my-4">
            {navLinks.map((link, idx) => (
              <button
                key={idx}
                onClick={() => handleNavClick(link)}
                style={{ transitionDelay: `${idx * 25}ms` }}
                className={`text-left font-poster text-lg text-[#ecdcaf] active:text-[#c2272a] border-b border-[#ecdcaf]/10 pb-1.5 transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="font-mono text-[10px] text-[#ecdcaf]/60 text-center tracking-widest uppercase pt-3 border-t border-[#ecdcaf]/20">
            TANGY SESSIONS // HYDERABAD // EST. 2016
          </div>
        </div>
      </div>

      {/* 2. MOBILE HERO SECTION — GROUNDED REFINED 1970S CONCERT POSTER */}
      <section 
        id="m-hero" 
        className="relative w-full h-[100dvh] bg-[#3c0f0e] overflow-hidden p-0 m-0 select-none isolate pt-14"
      >
        {/* SVG ROUGHEN FILTER */}
        <svg className="absolute width-0 height-0 overflow-hidden pointer-events-none z-0">
          <filter id="m-roughen" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="7" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </svg>

        {/* POSTER CANVAS */}
        <div className="poster absolute inset-0 w-full h-full bg-[radial-gradient(120%_90%_at_50%_8%,#8a2320_0%,#6e1a19_45%,#4c1210_100%)] overflow-hidden container-inline-size">
          
          {/* CORNER CROSSHAIRS */}
          <div className="absolute z-30 w-7 h-7 opacity-85 top-16 left-3 pointer-events-none">
            <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
          </div>
          <div className="absolute z-30 w-7 h-7 opacity-85 top-16 right-3 pointer-events-none">
            <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
          </div>

          {/* TOP METADATA BAR (z-40) */}
          <div className="absolute z-40 top-16 left-4 right-4 flex justify-between items-center font-mono text-[8.5px] font-bold tracking-widest text-[#ecdcaf] uppercase pointer-events-none">
            <span>HYDERABAD, INDIA</span>
            <span className="text-[#d1a437]">33⅓ RPM STEREO</span>
          </div>

          {/* STEPWELL SILHOUETTE (z-2) */}
          <svg className="absolute z-2 left-0 bottom-0 w-64 h-72 opacity-45 mix-blend-multiply pointer-events-none" viewBox="0 0 400 420" preserveAspectRatio="xMinYMax meet">
            <g fill="#3c0f0e">
              <rect x="0" y="360" width="400" height="60"/>
              <rect x="0" y="300" width="360" height="60"/>
              <rect x="0" y="245" width="310" height="55"/>
              <rect x="0" y="195" width="260" height="50"/>
              <rect x="0" y="150" width="210" height="45"/>
              <rect x="0" y="110" width="165" height="40"/>
              <rect x="0" y="75" width="120" height="35"/>
              <g stroke="#5a1717" strokeWidth="4" fill="none" opacity=".8">
                <path d="M20 360 v-60 a20 20 0 0 1 40 0 v60"/>
                <path d="M80 360 v-60 a20 20 0 0 1 40 0 v60"/>
                <path d="M140 360 v-60 a20 20 0 0 1 40 0 v60"/>
                <path d="M200 300 v-55 a18 18 0 0 1 36 0 v55"/>
                <path d="M255 300 v-55 a18 18 0 0 1 36 0 v55"/>
                <path d="M40 245 v-50 a16 16 0 0 1 32 0 v50"/>
                <path d="M95 245 v-50 a16 16 0 0 1 32 0 v50"/>
              </g>
            </g>
          </svg>

          {/* HEADLINE "TANGY SESSIONS" (z-15) — HELD AT TOP-[18%] (~70% VISIBLE) */}
          <div className="headline absolute z-15 top-[18%] left-0 right-0 text-center flex flex-col items-center justify-center [filter:url(#m-roughen)] pointer-events-none">
            <span className="word block font-poster text-[clamp(58px,18vw,84px)] leading-[0.80] tracking-tight text-[#ecdcaf] uppercase [-webkit-text-stroke:1.2px_#191410] relative drop-shadow-[5px_5px_0px_#191410]">
              TANGY
            </span>
            <span className="word block font-poster text-[clamp(50px,15vw,74px)] leading-[0.80] tracking-tight text-[#ecdcaf] uppercase [-webkit-text-stroke:1.2px_#191410] relative -mt-1 drop-shadow-[5px_5px_0px_#191410]">
              SESSIONS
            </span>
          </div>

          {/* 1970S SCREEN-PRINTED PERFORMER CUTOUT IMAGE (z-20) */}
          <div className="portrait-wrap absolute z-20 left-1/2 -translate-x-1/2 top-[32%] w-[72vw] max-w-[310px] h-[55vh] max-h-[460px] pointer-events-none opacity-98">
            <img 
              src="/media/hero-performer.png" 
              alt="Tangy 1970s Performer Cutout" 
              className="relative w-full h-full object-contain filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.7)] z-2" 
            />
          </div>


          {/* ADMISSION TICKET (z-60) AT EXACTLY TOP: 76% */}
          <div 
            ref={ticketRef}
            className="hero-ticket ticket absolute z-[60] pointer-events-auto left-1/2 top-[76%] -translate-x-1/2 -translate-y-1/2 -rotate-3 w-[88vw] max-w-[340px] bg-[#e9decb] text-[#241a12] shadow-[0_10px_24px_rgba(0,0,0,0.75)] flex relative origin-center before:content-[''] before:absolute before:top-1/2 before:w-4 before:h-4 before:bg-[#4c1210] before:rounded-full before:-translate-y-1/2 before:z-5 before:-left-2 after:content-[''] after:absolute after:top-1/2 after:w-4 after:h-4 after:bg-[#4c1210] after:rounded-full after:-translate-y-1/2 after:z-5 after:-right-2"
          >
            {/* Masking Tape Overlay (z-61) */}
            <div className="absolute -top-3 left-[36%] -rotate-4 w-[60px] h-5 bg-[rgba(255,255,255,0.45)] border border-[rgba(255,255,255,0.5)] z-[61] pointer-events-none" />

            <div className="w-7 flex items-center justify-center border-r border-dashed border-[rgba(36,26,18,0.35)] [writing-mode:vertical-rl] font-mono text-[9px] tracking-wider text-[#241a12] opacity-75">
              TS-2016-001
            </div>

            <div className="flex-1 p-2.5 flex flex-col justify-between">
              <div className="flex justify-between items-center font-mono font-semibold text-[8.5px] tracking-wider uppercase opacity-80 border-b border-dashed border-[rgba(36,26,18,0.35)] pb-1">
                <span>Admit One</span>
                <span>Vol. 01</span>
                <span>Archive No. 001</span>
              </div>

              <div className="flex flex-col gap-1.5 my-1">
                <button 
                  type="button"
                  onClick={handleTicketClick}
                  onTouchEnd={(e) => { e.preventDefault(); handleTicketClick(e); }}
                  className="enter relative z-[70] pointer-events-auto touch-manipulation font-poster text-lg tracking-tight flex items-center justify-between cursor-pointer bg-transparent border-none text-[#241a12] p-0 active:text-[#c2272a]"
                >
                  <span>Enter Tangy</span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  onClick={() => { playSFX('ticketClick'); navigate('/book/vol-1'); }}
                  onTouchEnd={(e) => { e.preventDefault(); playSFX('ticketClick'); navigate('/book/vol-1'); }}
                  className="book-tickets-mobile relative z-[70] pointer-events-auto touch-manipulation font-mono text-[9px] font-bold tracking-wider uppercase px-2 py-1 bg-[#c2272a] text-[#ecdcaf] border border-[#191410] shadow-[2px_2px_0px_#191410] active:scale-95 text-center"
                >
                  BOOK TICKETS →
                </button>
              </div>

              <div className="font-mono font-medium text-[7.5px] tracking-widest uppercase text-center opacity-75 border-t border-dashed border-[rgba(36,26,18,0.35)] pt-1">
                Live Music · Community · Heritage
              </div>
            </div>

            <div className="w-7 flex items-center justify-center border-l border-dashed border-[rgba(36,26,18,0.35)] [writing-mode:vertical-rl] font-mono text-[9.5px] tracking-widest text-[#c2272a]">
              09100
            </div>
          </div>

          {/* BALANCED BADGES & EPHEMERA (z-40) */}
          
          {/* LEFT SIDE BADGES */}
          <div className="badge absolute z-40 left-2 top-[34%] w-16 h-16 rounded-full bg-[#ecdcaf] border-2 border-[#c2272a] flex flex-col items-center justify-center text-center text-[#c2272a] shadow-md -rotate-6 pointer-events-none">
            <div className="font-poster text-xs leading-none">33⅓</div>
            <div className="font-mono font-bold text-[7px] tracking-widest">RPM</div>
            <div className="font-mono text-[6px] tracking-widest">STEREO</div>
          </div>

          <div className="badge absolute z-40 left-2.5 bottom-[10%] bg-[#191410] text-[#ecdcaf] -rotate-4 px-2 py-1 shadow-md border border-[#ecdcaf]/30 pointer-events-none">
            <div className="font-mono font-bold text-[8px] tracking-wider">BANSILALPET ★</div>
            <div className="font-mono text-[7px] text-[#d1a437]">STEPWELL</div>
          </div>

          {/* RIGHT SIDE BADGES */}
          <div className="badge absolute z-40 right-2 top-[34%] w-14 h-14 rounded-full border border-dashed border-[#ecdcaf] bg-[radial-gradient(circle,rgba(194,39,42,0.18),transparent_70%)] flex flex-col items-center justify-center rotate-8 shadow-md pointer-events-none">
            <div className="font-mono font-semibold text-[6px] text-[#ecdcaf]">RECORDED</div>
            <div className="font-poster text-xs text-[#c2272a] leading-none my-0.5">LIVE</div>
            <div className="font-mono font-semibold text-[5.5px] text-[#ecdcaf]">AT STEPWELL</div>
          </div>

          <div className="badge absolute z-40 right-2.5 bottom-[18%] bg-[#e9decb] text-[#241a12] -rotate-3 px-2 py-0.5 shadow-md flex items-center gap-1 border border-[#191410]/20 pointer-events-none">
            <span className="font-mono font-bold text-[8px] tracking-wider">REC</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#c2272a] animate-pulse" />
          </div>

          <div className="badge absolute z-40 right-2.5 bottom-[6%] text-right text-[#ecdcaf] pointer-events-none">
            <div className="font-mono font-semibold text-[8px] leading-tight tracking-wider">KEEP THE CULTURE</div>
            <div className="font-mono font-semibold text-[8px] leading-tight tracking-wider text-[#d1a437]">ALIVE ★</div>
            <div className="font-serif italic font-bold text-lg text-[#d1a437] -rotate-6 mt-0.5">
              Tangy
            </div>
          </div>

          {/* SCROLL TO VIEW INDICATOR */}
          <div className="absolute z-40 bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 font-mono text-[8px] font-bold tracking-[0.2em] text-[#ecdcaf]/80 uppercase animate-bounce pointer-events-none">
            <span>SCROLL TO VIEW</span>
            <svg className="w-3 h-3 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>

          {/* TEXTURE OVERLAYS (z-10) */}
          <div className="spatter absolute inset-0 z-10 pointer-events-none opacity-50 bg-[radial-gradient(circle_at_6%_88%,rgba(0,0,0,0.35)_0_3px,transparent_4px)]" />
          <div className="scratches absolute inset-0 z-10 pointer-events-none opacity-50 mix-blend-soft-light bg-[repeating-linear-gradient(78deg,rgba(0,0,0,0.12)_0_1px,transparent_1px_140px)]" />
          <div className="grain absolute inset-0 z-10 bg-[url('/noise.png')] opacity-30 mix-blend-multiply pointer-events-none" />
          <div className="vignette absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(120%_100%_at_50%_45%,transparent_55%,rgba(0,0,0,0.45)_100%)]" />

        </div>
      </section>

      {/* 3. MOBILE MANIFESTO */}
      <section 
        ref={manifestoRef}
        id="m-manifesto" 
        className={`w-full bg-[#ecdcaf] text-[#191410] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 relative overflow-hidden ${manifestoInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <NotebookGridPattern opacity={0.07} />
        <CassetteTapeGraphic className="absolute -top-2 -right-2 w-32 rotate-12" />
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5 relative z-10">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">01 MANIFESTO</span>
          <div className="w-full bg-[#191410] p-2 border-2 border-[#191410] shadow-[6px_6px_0px_#c2272a] rotate-[1deg]">
            <img src="/media/gallery/tangy1.jpg" alt="Stepwell" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125" />
          </div>
          <h2 className="font-poster text-2xl sm:text-3xl text-[#191410] leading-tight">
            AN INTERACTIVE SCREEN-PRINTED MUSIC ARCHIVE.
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#191410]/90 leading-relaxed">
            Tangy Sessions is a living archive of music, people, and historic spaces in Hyderabad.
          </p>
          <blockquote className="w-full bg-[#c2272a] text-[#ecdcaf] p-5 border-2 border-[#191410] shadow-[5px_5px_0px_#191410] font-poster text-lg sm:text-xl italic my-2">
            "This world has a sound. Listen closely."
          </blockquote>
        </div>
      </section>

      {/* 4. MOBILE CHRONOLOGY */}
      <section 
        ref={historyRef}
        id="m-history" 
        className={`w-full bg-[#8a2320] text-[#ecdcaf] py-14 px-5 flex flex-col items-center transition-all duration-700 ${historyInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center">
          <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase mb-6">02 CHRONOLOGY // 10 YEARS</span>
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
                className={`w-full bg-[#191410] border-2 border-[#ecdcaf] p-5 shadow-[5px_5px_0px_#ecdcaf] flex flex-col items-start text-left gap-2 transition-all duration-500 ${historyInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-poster text-2xl sm:text-3xl text-[#ecdcaf]">{item.year}</span>
                  <span className="text-[#c2272a] font-bold">○</span>
                </div>
                <h3 className="font-poster text-base sm:text-lg text-[#ecdcaf]">{item.title}</h3>
                <p className="font-sans text-xs sm:text-sm text-[#ecdcaf]/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. MOBILE SESSIONS */}
      <section 
        ref={sessionsRef}
        id="m-sessions" 
        className={`w-full bg-[#8a2320] py-14 px-5 flex flex-col items-center transition-all duration-700 relative overflow-hidden ${sessionsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="absolute top-0 left-0 right-0 h-8 overflow-hidden pointer-events-none z-5">
          <WarpedCheckerPattern opacity={0.08} />
        </div>
        <div className="w-full max-w-[420px] flex flex-col items-center gap-6 relative z-10">
          <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">03 SESSIONS // TICKETS</span>

          {events.map((evt) => (
            <div key={evt.id} className="w-full bg-[#ecdcaf] text-[#191410] border-2 border-[#191410] p-4 sm:p-5 shadow-[6px_6px_0px_#191410] flex flex-col gap-3">
              <img src={evt.image} alt={evt.title} className="w-full aspect-[4/3] object-cover border border-[#191410]" />
              <div className="flex flex-col gap-1 text-left">
                <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-widest">{evt.city} · {evt.status}</span>
                <h3 className="font-poster text-xl sm:text-2xl text-[#191410]">{evt.title}</h3>
                <p className="font-mono text-xs opacity-80">{evt.venue} · {evt.date}</p>
                <p className="font-sans text-xs sm:text-sm mt-1">{evt.description}</p>
              </div>

              <button
                onClick={() => { playSFX('ticketClick'); onSelectBooking(evt); }}
                className="w-full h-[52px] bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <span>BOOK TICKETS</span>
                <span>→</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. MOBILE RAW FOOTAGE */}
      <section 
        ref={footageRef}
        id="m-footage" 
        className={`w-full bg-[#0D0A07] text-[#ecdcaf] py-14 px-4 flex flex-col items-center transition-all duration-700 ${footageInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">04 RAW FOOTAGE // 16MM REEL</span>

          <div className="grid grid-cols-2 gap-3 w-full">
            {videoList.map((vid) => (
              <div key={vid.id} className="relative aspect-[3/4] bg-[#191410] border border-[#ecdcaf]/20 rounded-md overflow-hidden flex flex-col justify-end p-2 group active:scale-95 transition-transform">
                <video src={vid.src} loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" />
                <div className="relative z-10 bg-[#191410]/90 p-1.5 rounded text-left">
                  <p className="font-mono text-[8.5px] font-bold text-[#ecdcaf] truncate">{vid.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. MOBILE ARCHIVE RECORDINGS */}
      <section 
        ref={archiveRef}
        id="m-archive" 
        className={`w-full bg-[#315D73] text-[#ecdcaf] py-14 px-5 flex flex-col items-center transition-all duration-700 ${archiveInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">05 ARCHIVE RECORDINGS</span>

          {archive.map((item, idx) => (
            <div key={idx} className="w-full bg-[#191410] text-[#ecdcaf] border-2 border-[#ecdcaf]/30 p-4 sm:p-5 shadow-[6px_6px_0px_#191410] flex flex-col gap-3 text-left">
              <img src={item.image} alt={item.title} className="w-full aspect-[4/3] object-cover border border-[#ecdcaf]/20" />
              <span className="font-mono text-[9px] font-bold text-[#ecdcaf]">{item.year} · {item.venue}</span>
              <h3 className="font-poster text-lg sm:text-xl text-[#ecdcaf]">{item.title}</h3>
              <p className="font-sans text-xs sm:text-sm opacity-90">{item.description}</p>
              <button
                onClick={() => { playSFX('ticketClick'); onOpenArchive && onOpenArchive(); }}
                className="w-full h-[48px] mt-1 border border-[#ecdcaf] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase active:scale-95 active:bg-[#ecdcaf] active:text-[#191410] transition-transform"
              >
                READ MAGAZINE SPREAD →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 8. MOBILE SPACES & ARCHITECTURE */}
      <section 
        ref={spacesRef}
        id="m-spaces" 
        className={`w-full bg-[#4c1210] text-[#ecdcaf] py-14 px-5 flex flex-col items-center transition-all duration-700 ${spacesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">06 SANCTUARY SPACES // HERITAGE</span>

          <div className="flex flex-col gap-5 w-full">
            {spacesList.map((space) => (
              <div key={space.id} className="w-full bg-[#191410] border-2 border-[#d1a437]/40 p-4 shadow-[5px_5px_0px_#191410] flex flex-col gap-2.5 text-left">
                <img src={space.image} alt={space.title} className="w-full aspect-[16/9] object-cover border border-[#d1a437]/20" />
                <span className="font-mono text-[9px] font-bold text-[#d1a437] uppercase">{space.type} · {space.location}</span>
                <h3 className="font-poster text-xl text-[#ecdcaf]">{space.title}</h3>
                <p className="font-mono text-xs text-[#ecdcaf]/80 italic">"{space.notes}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. MOBILE DIARY */}
      <section 
        ref={diaryRef}
        id="m-diary" 
        className={`w-full bg-[#ecdcaf] text-[#191410] py-14 px-5 flex flex-col items-center transition-all duration-700 ${diaryInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">07 TANGY DIARY</span>

          {diaryEntries.map((entry) => (
            <div key={entry.id} className="w-full bg-[#191410] text-[#ecdcaf] border-2 border-[#191410] p-4 sm:p-5 shadow-[6px_6px_0px_#c2272a] flex flex-col gap-3 text-left">
              <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover border border-[#ecdcaf]/20" />
              <span className="font-mono text-[9px] font-bold text-[#ecdcaf]">{entry.date} · {entry.location}</span>
              <h3 className="font-poster text-lg sm:text-xl text-[#ecdcaf]">{entry.title}</h3>
              <p className="font-sans text-xs sm:text-sm text-[#ecdcaf]/90">{entry.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 10. MOBILE FEATURED ARTISTS */}
      <section 
        ref={artistsRef}
        id="m-artists" 
        className={`w-full bg-[#191410] text-[#ecdcaf] py-14 px-5 flex flex-col items-center transition-all duration-700 relative overflow-hidden ${artistsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <MusicManuscriptPattern opacity={0.06} color="#E7D5A4" />
        <SoundWaveGraphic color="#E7D5A4" opacity={0.12} className="absolute -bottom-6 -right-6 w-48 h-64 rotate-[-10deg]" />
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6 relative z-10">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">08 ARTISTS LINEAGE // SONIC ARCHIVE</span>

          <div className="grid grid-cols-1 gap-4 w-full">
            {artistList.map((artist) => (
              <div key={artist.id} className="w-full bg-[#ecdcaf] text-[#191410] border-2 border-[#191410] p-4 shadow-[5px_5px_0px_#c2272a] flex items-center gap-4 text-left">
                <img src={artist.image} alt={artist.name} className="w-20 h-20 object-cover border border-[#191410] rounded-sm" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[8.5px] font-bold text-[#c2272a] uppercase">{artist.role} · {artist.genre}</span>
                  <h3 className="font-poster text-xl text-[#191410]">{artist.name}</h3>
                  <button onClick={() => navigate('/artists')} className="font-mono text-[9px] text-[#c2272a] underline font-bold mt-1 text-left">VIEW ARTIST PORTAL →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. MOBILE FOUNDERS ARCHIVE */}
      <section 
        ref={foundersRef}
        id="m-founders" 
        className={`w-full bg-[#1C140E] text-[#ecdcaf] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${foundersInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">09 FOUNDERS ARCHIVE // FILE 001</span>

          {/* ARJUNA */}
          <div className="w-full bg-[#ecdcaf] text-[#191410] border-2 border-[#191410] p-5 shadow-[6px_6px_0px_#191410] flex flex-col gap-3 text-left rotate-[-1deg]">
            <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-widest">FOUNDER & CREATOR // EST. 2016</span>
            <h3 className="font-poster text-2xl text-[#191410]">ARJUNA</h3>
            <img src="/media/arjun.png" alt="Arjuna" className="w-full aspect-[3/4] object-cover border border-[#191410]" />
            <p className="font-mono text-xs text-[#191410]/90 border-l-4 border-[#c2272a] pl-3 italic">
              "Born from an obsession with underground sound and ancient spaces."
            </p>
          </div>

          {/* DEEPA */}
          <div className="w-full bg-[#ecdcaf] text-[#191410] border-2 border-[#191410] p-5 shadow-[6px_6px_0px_#191410] flex flex-col gap-3 text-left rotate-[1deg]">
            <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-widest">CO-FOUNDER // EST. 2018</span>
            <h3 className="font-poster text-2xl text-[#191410]">DEEPA</h3>
            <img src="/media/deepa.jpg" alt="Deepa" className="w-full aspect-[3/4] object-cover border border-[#191410]" />
            <p className="font-mono text-xs text-[#191410]/90 border-l-4 border-[#c2272a] pl-3 italic">
              "The architect of community. Deepa ensures every event feels like a homecoming."
            </p>
          </div>
        </div>
      </section>

      {/* 12. MOBILE JOIN THE CREW */}
      <section 
        ref={crewRef}
        id="m-crew" 
        className={`w-full bg-[#315B66] text-[#ecdcaf] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 relative overflow-hidden ${crewInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <BlueprintGridPattern opacity={0.08} />
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6 relative z-10">
          <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase border-y border-[#191410]/40 py-1 px-4">
            10 JOIN THE CREW // RECRUITMENT DESK
          </span>

          {/* POSTER 01: VOLUNTEER */}
          <div className="w-full bg-[#ecdcaf] text-[#191410] p-5 sm:p-6 border-4 border-[#191410] shadow-[10px_10px_0px_#191410] rotate-[2deg] relative flex flex-col gap-4">
            <div className="flex justify-between items-center font-mono text-[8.5px] font-bold text-[#315D73] border-b border-[#191410]/30 pb-2 uppercase">
              <span>ARCHIVE 08 // FILE NO. 204</span>
              <span>HYDERABAD</span>
            </div>

            <div className="flex flex-col text-left">
              <span className="font-mono text-[9px] text-[#c2272a] font-black tracking-widest uppercase">PATH 01 // VOLUNTEER</span>
              <h3 className="font-poster text-3xl sm:text-4xl text-[#191410] leading-none my-1">
                BEHIND THE SCENES
              </h3>
            </div>

            <p className="font-mono text-xs text-[#191410]/90 border-l-4 border-[#c2272a] pl-3 py-0.5 italic">
              ✎ "Help build the nights, the stories and everything that happens between them."
            </p>

            <button
              onClick={() => { playSFX('ticketClick'); navigate('/crew'); }}
              className="w-full h-[56px] bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all"
            >
              [ APPLY AS VOLUNTEER → ]
            </button>
          </div>

          {/* POSTER 02: ARTIST */}
          <div className="w-full bg-[#191410] text-[#ecdcaf] p-5 sm:p-6 border-4 border-[#ecdcaf] shadow-[10px_10px_0px_#191410] rotate-[-2deg] relative flex flex-col gap-4">
            <div className="flex justify-between items-center font-mono text-[8.5px] font-bold text-[#ecdcaf] border-b border-[#ecdcaf]/20 pb-2 uppercase">
              <span>SIDE A // 33⅓ RPM STEREO</span>
              <span>AUDITION FILE</span>
            </div>

            <div className="flex flex-col text-left">
              <span className="font-mono text-[9px] text-[#ecdcaf] font-black tracking-widest uppercase">PATH 02 // ARTIST</span>
              <h3 className="font-poster text-3xl sm:text-4xl text-[#ecdcaf] leading-none my-1">
                TAKE THE STAGE
              </h3>
            </div>

            <p className="font-mono text-xs text-[#ecdcaf]/90 border-l-4 border-[#c2272a] pl-3 py-0.5 italic">
              ✎ "Bring your sound, your story and your energy into the Tangy world."
            </p>

            <button
              onClick={() => { playSFX('ticketClick'); navigate('/artists'); }}
              className="w-full h-[56px] bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all"
            >
              [ APPLY AS ARTIST → ]
            </button>
          </div>

        </div>
      </section>

      {/* 13. MOBILE PRIVATE SESSIONS */}
      <section 
        ref={privateRef}
        id="m-private" 
        className={`w-full bg-[#315D73] text-[#ecdcaf] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${privateInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5">
          <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">11 PRIVATE SESSIONS</span>

          <div className="w-full bg-[#191410] p-2 border-2 border-[#ecdcaf]/30 shadow-[6px_6px_0px_#191410]">
            <img src="/media/gallery/tangy4.jpg" alt="Private Session" className="w-full aspect-[4/3] object-cover border border-[#ecdcaf]/20" />
          </div>

          <h2 className="font-poster text-2xl sm:text-3xl text-[#ecdcaf] leading-tight">
            MAKE THE NIGHT YOUR OWN.
          </h2>

          <p className="font-sans text-xs sm:text-sm text-[#ecdcaf]/90 leading-relaxed font-normal">
            Bring the Tangy music experience to your space — private gatherings, house sessions, brand experiences, and curated intimate events.
          </p>

          <button
            onClick={() => { playSFX('ticketClick'); navigate('/private-sessions'); }}
            className="w-full max-w-[340px] h-[56px] bg-[#ecdcaf] text-[#191410] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[5px_5px_0px_#191410] active:scale-95 active:bg-[#c2272a] active:text-[#ecdcaf] transition-transform animate-[pulse_4s_ease-in-out_infinite]"
          >
            REQUEST PRIVATE SESSION →
          </button>
        </div>
      </section>

      {/* 14. MOBILE NEWSLETTER DISPATCH */}
      <section 
        ref={newsletterRef}
        id="m-newsletter" 
        className={`w-full bg-[#c2272a] text-[#ecdcaf] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${newsletterInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[440px] flex flex-col items-center gap-4 border-4 border-[#191410] bg-[#8a2320] p-6 shadow-[8px_8px_0px_#191410]">
          <span className="font-mono text-[9px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">12 DISPATCH // SECRET SESSIONS</span>
          <h2 className="font-poster text-2xl sm:text-3xl text-[#ecdcaf]">RECEIVE INVITATIONS</h2>
          <p className="font-mono text-xs text-[#ecdcaf]/80">Subscribe to receive dispatch codes for secret pop-up sessions.</p>

          {subscribed ? (
            <div className="w-full p-3 bg-[#ecdcaf] text-[#191410] font-mono text-xs font-bold border border-[#191410]">
              ✓ DISPATCH CONFIRMED // YOU'RE ON THE LIST
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="w-full flex flex-col gap-2 mt-2">
              <input 
                type="email" 
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="YOUR EMAIL ADDRESS" 
                className="w-full h-12 bg-[#ecdcaf] text-[#191410] font-mono text-xs px-3 border border-[#191410] placeholder:text-[#191410]/60 outline-none"
              />
              <button 
                type="submit" 
                className="w-full h-12 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-[0.2em] uppercase border border-[#191410] active:scale-95 transition-transform"
              >
                JOIN DISPATCH LIST →
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 15. MOBILE CLOSING SIGNATURE */}
      <section 
        ref={closingRef}
        id="m-closing" 
        className={`w-full bg-[#191410] text-[#ecdcaf] py-16 px-5 flex flex-col items-center text-center transition-all duration-700 ${closingInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[420px] flex flex-col items-center gap-6">
          <h2 className="font-poster text-3xl text-[#ecdcaf]">"THIS WORLD HAS A SOUND."</h2>
          <p className="font-mono text-xs text-[#ecdcaf]/70 uppercase tracking-widest">TANGY SESSIONS // HYDERABAD // EST. 2016</p>
        </div>
      </section>

      {/* 16. MOBILE FOOTER */}
      <footer className="w-full bg-[#0D0A07] text-[#ecdcaf] py-10 px-5 flex flex-col items-center text-center border-t border-[#ecdcaf]/20 pb-20">
        <div className="w-full max-w-[480px] flex flex-col items-center gap-3">
          <span className="font-poster text-xl text-[#ecdcaf]">TANGY SESSIONS</span>
          <p className="font-mono text-xs opacity-70">HYDERABAD · INDIA</p>
          <div className="flex gap-4 font-mono text-xs text-[#ecdcaf]/80 my-1">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="underline">INSTAGRAM</a>
            <span>·</span>
            <a href="mailto:hello@tangysessions.com" className="underline">EMAIL</a>
          </div>
          <span className="font-mono text-[8.5px] opacity-40 uppercase pt-3 border-t border-[#ecdcaf]/10 w-full">
            © 2026 TANGY SESSIONS // ALL RIGHTS RESERVED
          </span>
        </div>
      </footer>

    </div>
  );
};
