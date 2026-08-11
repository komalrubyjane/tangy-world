import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { events, gallery, diaryEntries, archive, artists } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { GlobalMicrophoneJourney } from '../ui/GlobalMicrophoneJourney';
import { Hero } from '../sections/Hero';
import { 
  NotebookGridPattern, 
  MusicManuscriptPattern, 
  BlueprintGridPattern, 
  WarpedCheckerPattern, 
  SoundWaveGraphic,
  CassetteTapeGraphic,
  GinghamRibbonPattern,
  TornNewspaperScrap,
  PushPin,
  TapeStrip
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
  const [photoBoothCaptured, setPhotoBoothCaptured] = useState(false);
  const ticketRef = useRef(null);

  // Mobile InView Refs for All Sections
  const [manifestoRef, manifestoInView] = useMobileInView();
  const [baodiRef, baodiInView] = useMobileInView();
  const [historyRef, historyInView] = useMobileInView();
  const [sessionsRef, sessionsInView] = useMobileInView();
  const [cameraRef, cameraInView] = useMobileInView();
  const [footageRef, footageInView] = useMobileInView();
  const [tunnelRef, tunnelInView] = useMobileInView();
  const [archiveRef, archiveInView] = useMobileInView();
  const [spacesRef, spacesInView] = useMobileInView();
  const [diaryRef, diaryInView] = useMobileInView();
  const [talksRef, talksInView] = useMobileInView();
  const [universeRef, universeInView] = useMobileInView();
  const [artistsRef, artistsInView] = useMobileInView();
  const [foundersRef, foundersInView] = useMobileInView();
  const [crewRef, crewInView] = useMobileInView();
  const [privateRef, privateInView] = useMobileInView();
  const [newsletterRef, newsletterInView] = useMobileInView();
  const [closingRef, closingInView] = useMobileInView();

  const navLinks = [
    { label: "01 COVER // POSTER", target: "#m-hero" },
    { label: "02 MANIFESTO", target: "#m-manifesto" },
    { label: "03 BAODI SANGAM", target: "#m-baodi" },
    { label: "04 CHRONOLOGY // 10 YRS", target: "#m-history" },
    { label: "05 SESSIONS & TICKETS", target: "#m-sessions" },
    { label: "06 35MM PHOTO BOOTH", target: "#m-camera" },
    { label: "07 16MM RAW FOOTAGE", target: "#m-footage" },
    { label: "08 REVERB SONIC TUNNEL", target: "#m-tunnel" },
    { label: "09 ARCHIVE RECORDINGS", target: "#m-archive" },
    { label: "10 SANCTUARY SPACES", target: "#m-spaces" },
    { label: "11 FIELD LOG DIARY", target: "#m-diary" },
    { label: "12 TANGY TALKS PODCAST", target: "#m-talks" },
    { label: "13 SONIC UNIVERSE MAP", target: "#m-universe" },
    { label: "14 ARTISTS PORTAL ✦", route: "/artists" },
    { label: "15 FOUNDERS ARCHIVE", target: "#m-founders" },
    { label: "16 RECRUITMENT DESK ✦", route: "/crew" },
    { label: "17 PRIVATE SESSIONS ✦", route: "/private-sessions" },
    { label: "18 TANGY KIRANA ✦", action: onOpenShop },
    { label: "19 VINYL TURNTABLE ✦", action: onOpenVinyl },
    { label: "20 SOUND ARCHIVE ✦", action: onOpenSoundArchive },
    { label: "21 TODAY'S PROGRAMME ✦", action: onOpenProgramme },
    { label: "22 PASSPORT & MAILBOX ✦", action: onOpenPassport }
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
      
      {/* GLOBAL CONTINUOUS HANGING MICROPHONE STORYTELLING JOURNEY */}
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
                style={{ transitionDelay: `${idx * 20}ms` }}
                className={`text-left font-poster text-base text-[#ecdcaf] active:text-[#c2272a] border-b border-[#ecdcaf]/10 pb-1.5 transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
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

      {/* 2. MOBILE HERO SECTION — UNIFIED MASTER HERO COMPONENT */}
      <section 
        id="m-hero" 
        className="relative w-full h-[100dvh] overflow-hidden p-0 m-0 select-none isolate pt-14"
      >
        <Hero />
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

      {/* 4. MOBILE BAODI SANGAM PROJECT */}
      <section 
        ref={baodiRef}
        id="m-baodi" 
        className={`w-full bg-[#1A3642] text-[#ecdcaf] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 relative overflow-hidden ${baodiInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-4 relative z-10">
          <span className="font-mono text-[10px] font-bold text-[#526B80] tracking-[0.3em] uppercase">SPECIAL PROJECT // STEPWELL RECLAMATION</span>
          <h2 className="font-poster text-3xl sm:text-4xl text-[#ecdcaf] leading-tight">
            BAODI SANGAM
          </h2>
          <div className="w-full bg-[#191410] p-2 border-2 border-[#526B80] shadow-[6px_6px_0px_#191410]">
            <img src="/media/gallery/tangy1.jpg" alt="Baodi Sangam" className="w-full aspect-[16/9] object-cover filter contrast-110" />
          </div>
          <p className="font-sans text-sm text-[#ecdcaf]/90 italic leading-relaxed">
            Reclaiming the lost stepwells of Hyderabad through art, music, and acoustic water resonance.
          </p>
        </div>
      </section>

      {/* 5. MOBILE CHRONOLOGY */}
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
                className="w-full bg-[#191410] border-2 border-[#ecdcaf] p-5 shadow-[5px_5px_0px_#ecdcaf] flex flex-col items-start text-left gap-2"
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

      {/* 6. MOBILE SESSIONS */}
      <section 
        ref={sessionsRef}
        id="m-sessions" 
        className={`w-full bg-[#8a2320] py-14 px-5 flex flex-col items-center transition-all duration-700 relative overflow-hidden ${sessionsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
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

      {/* 7. MOBILE 35MM PHOTO BOOTH */}
      <section 
        ref={cameraRef}
        id="m-camera" 
        className={`w-full bg-[#0D0A07] text-[#ecdcaf] py-14 px-5 flex flex-col items-center transition-all duration-700 ${cameraInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5 text-center">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">04 35MM PHOTO BOOTH // INSTANT SNAP</span>
          <h2 className="font-poster text-2xl text-[#ecdcaf]">VINTAGE CAMERA SNAPSHOT</h2>
          <div className="w-full bg-[#191410] border-2 border-[#ecdcaf]/30 p-4 shadow-[6px_6px_0px_#c2272a] flex flex-col items-center gap-3">
            <div className="relative w-full aspect-[4/3] bg-black border border-[#ecdcaf]/20 overflow-hidden flex items-center justify-center">
              <img src="/media/gallery/tangy2.jpg" alt="Photo Booth Snap" className={`w-full h-full object-cover ${photoBoothCaptured ? 'filter sepia contrast-125' : ''}`} />
              <div className="absolute top-2 left-2 font-mono text-[8px] text-[#c2272a] font-bold">REC ● 35MM</div>
            </div>
            <button
              onClick={() => { playSFX('ticketClick'); setPhotoBoothCaptured(!photoBoothCaptured); }}
              className="w-full py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase border border-[#191410] active:scale-95"
            >
              {photoBoothCaptured ? '📷 SNAP ANOTHER PHOTO' : '📷 TAKE VINTAGE SNAPSHOT'}
            </button>
          </div>
        </div>
      </section>

      {/* 8. MOBILE RAW FOOTAGE REEL */}
      <section 
        ref={footageRef}
        id="m-footage" 
        className={`w-full bg-[#0D0A07] text-[#ecdcaf] py-14 px-4 flex flex-col items-center transition-all duration-700 ${footageInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">05 RAW FOOTAGE // 16MM REEL</span>
          <div className="grid grid-cols-2 gap-3 w-full">
            {videoList.map((vid) => (
              <div key={vid.id} className="relative aspect-[3/4] bg-[#191410] border border-[#ecdcaf]/20 rounded-md overflow-hidden flex flex-col justify-end p-2 group active:scale-95 transition-transform">
                <video src={vid.src} loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-85" />
                <div className="relative z-10 bg-[#191410]/90 p-1.5 rounded text-left">
                  <p className="font-mono text-[8.5px] font-bold text-[#ecdcaf] truncate">{vid.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. MOBILE REVERB SONIC TUNNEL */}
      <section 
        ref={tunnelRef}
        id="m-tunnel" 
        className={`w-full bg-[#0F0B0A] text-[#ecdcaf] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${tunnelInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-4">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">06 SONIC TUNNEL // REVERB CHAMBER</span>
          <h2 className="font-poster text-3xl text-[#ecdcaf]">ULTRASONIC ECHO</h2>
          <p className="font-mono text-xs text-[#ecdcaf]/80">2.4 seconds of natural acoustic reverberation through limestone arches.</p>
          <div className="w-full bg-[#191410] border-2 border-[#d1a437]/40 p-4 shadow-[5px_5px_0px_#191410] flex flex-col gap-2">
            <span className="font-mono text-[9px] text-[#c2272a] font-bold">REVERB DELAY: 2.4s</span>
            <span className="font-mono text-xs italic">"Stone remembers every note played."</span>
          </div>
        </div>
      </section>

      {/* 10. MOBILE ARCHIVE RECORDINGS */}
      <section 
        ref={archiveRef}
        id="m-archive" 
        className={`w-full bg-[#315D73] text-[#ecdcaf] py-14 px-5 flex flex-col items-center transition-all duration-700 ${archiveInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">07 ARCHIVE RECORDINGS</span>
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

      {/* 11. MOBILE SPACES & ARCHITECTURE */}
      <section 
        ref={spacesRef}
        id="m-spaces" 
        className={`w-full bg-[#4c1210] text-[#ecdcaf] py-14 px-5 flex flex-col items-center transition-all duration-700 ${spacesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">08 SANCTUARY SPACES // HERITAGE</span>
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

      {/* 12. MOBILE DIARY (SCRAPBOOK ARCHIVE) */}
      <section 
        ref={diaryRef}
        id="m-diary" 
        className={`w-full bg-[#41261B] text-[#E7D5A4] py-14 px-5 flex flex-col items-center transition-all duration-700 relative overflow-hidden ${diaryInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <NotebookGridPattern opacity={0.06} />
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6 relative z-10">
          <span className="font-mono text-[10px] font-bold text-[#D19A24] tracking-[0.3em] uppercase">09 HANDCRAFTED SCRAPBOOK // FIELD LOGS</span>
          {diaryEntries.map((entry, idx) => (
            <div 
              key={entry.id} 
              className={`w-full bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[14px_14px_0px_#11100C] flex flex-col gap-4 text-left relative ${idx === 0 ? 'rotate-[-2.5deg]' : idx === 1 ? 'rotate-[3.2deg]' : 'rotate-[-1.8deg]'}`}
            >
              <TapeStrip className="-top-3 left-1/2 -translate-x-1/2 w-24 h-5 rotate-[-2deg]" />
              <div className="absolute top-3 right-3 border border-[#C2272A] text-[#C2272A] px-2 py-0.5 font-mono text-[8px] font-bold tracking-widest uppercase rotate-[-5deg]">
                LOG #{String(entry.id).padStart(3, '0')} ✦
              </div>
              <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#B94717] uppercase border-b border-[#11100C]/20 pb-2">
                <span>VOL. 0{entry.id} // FIELD RECORD</span>
                <span>{entry.date}</span>
              </div>
              <div className="relative w-full bg-[#F5E9C9] p-2.5 pb-7 border border-[#11100C] shadow-md rotate-[-1deg]">
                <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover filter grayscale sepia-[0.35] contrast-125 border border-[#11100C]" />
                <span className="absolute bottom-2 left-2 font-mono text-[8.5px] font-bold text-[#11100C]">
                  ✎ {entry.location}
                </span>
                <span className="absolute bottom-2 right-2 font-mono text-[7.5px] font-bold text-[#B94717] border border-[#B94717] px-1">
                  {idx === 0 ? 'TICKET #09100' : idx === 1 ? 'STAGE PASS #02' : 'TAPE REEL #03'}
                </span>
              </div>
              <h3 className="font-poster text-2xl text-[#11100C] leading-tight ink-bleed">
                {entry.title.toUpperCase()}
              </h3>
              <p className="font-mono text-xs text-[#11100C]/90 border-l-4 border-[#B94717] pl-3 italic leading-relaxed">
                "{entry.content}"
              </p>
              <div className="bg-[#F5E9C9] p-2.5 border border-[#11100C] font-mono text-[9px] font-bold text-[#5A120D] flex justify-between items-center rotate-[1deg]">
                <span>✎ {idx === 0 ? '"Soundcheck lasted till 2 AM."' : idx === 1 ? '"300 people stayed till sunrise."' : '"Water speaks in whispers."'}</span>
                <span className="border border-[#5A120D] px-1.5 py-0.5">33⅓ RPM</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 13. MOBILE TANGY TALKS PODCAST REEL */}
      <section 
        ref={talksRef}
        id="m-talks" 
        className={`w-full bg-[#2E1218] text-[#ecdcaf] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${talksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-4">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">10 TANGY TALKS // PODCAST</span>
          <h2 className="font-poster text-3xl text-[#ecdcaf]">CONVERSATIONS THAT MATTER</h2>
          <p className="font-mono text-xs text-[#ecdcaf]/80">Beyond the music, we explore the minds behind the art.</p>
          <button 
            onClick={() => playSFX('ticketClick')}
            className="w-full max-w-[280px] py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase border border-[#191410] active:scale-95"
          >
            🎙️ LISTEN TO PODCAST REEL
          </button>
        </div>
      </section>

      {/* 14. MOBILE SONIC UNIVERSE MAP */}
      <section 
        ref={universeRef}
        id="m-universe" 
        className={`w-full bg-[#14110E] text-[#ecdcaf] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${universeInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">11 SONIC UNIVERSE // CONSTELLATION</span>
          <h2 className="font-poster text-3xl text-[#ecdcaf]">THE TANGY UNIVERSE</h2>
          <div className="grid grid-cols-2 gap-3 w-full">
            {artists.map((artist) => (
              <div key={artist.id} className="bg-[#191410] border border-[#d1a437]/30 p-2.5 flex flex-col items-center text-center gap-1.5">
                <img src={artist.image} alt={artist.name} className="w-full aspect-square object-cover filter grayscale contrast-125 border border-[#ecdcaf]/20" />
                <span className="font-mono text-[9px] font-bold text-[#ecdcaf]">{artist.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 15. MOBILE FEATURED ARTISTS */}
      <section 
        ref={artistsRef}
        id="m-artists" 
        className={`w-full bg-[#191410] text-[#ecdcaf] py-14 px-5 flex flex-col items-center transition-all duration-700 relative overflow-hidden ${artistsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <MusicManuscriptPattern opacity={0.06} color="#E7D5A4" />
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6 relative z-10">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">12 ARTISTS LINEAGE // SONIC ARCHIVE</span>
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

      {/* 16. MOBILE FOUNDERS ARCHIVE */}
      <section 
        ref={foundersRef}
        id="m-founders" 
        className={`w-full bg-[#1C140E] text-[#ecdcaf] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${foundersInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">13 FOUNDERS ARCHIVE // FILE 001</span>
          <div className="w-full bg-[#ecdcaf] text-[#191410] border-2 border-[#191410] p-5 shadow-[6px_6px_0px_#191410] flex flex-col gap-3 text-left rotate-[-1deg]">
            <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-widest">FOUNDER & CREATOR // EST. 2016</span>
            <h3 className="font-poster text-2xl text-[#191410]">ARJUNA</h3>
            <img src="/media/arjun.png" alt="Arjuna" className="w-full aspect-[3/4] object-cover border border-[#191410]" />
            <p className="font-mono text-xs text-[#191410]/90 border-l-4 border-[#c2272a] pl-3 italic">
              "Born from an obsession with underground sound and ancient spaces."
            </p>
          </div>
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

      {/* 17. MOBILE JOIN THE CREW */}
      <section 
        ref={crewRef}
        id="m-crew" 
        className={`w-full bg-[#315B66] text-[#ecdcaf] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 relative overflow-hidden ${crewInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <BlueprintGridPattern opacity={0.08} />
        <div className="w-full max-w-[480px] flex flex-col items-center gap-6 relative z-10">
          <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase border-y border-[#191410]/40 py-1 px-4">
            14 JOIN THE CREW // RECRUITMENT DESK
          </span>
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

      {/* 18. MOBILE PRIVATE SESSIONS */}
      <section 
        ref={privateRef}
        id="m-private" 
        className={`w-full bg-[#315D73] text-[#ecdcaf] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${privateInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[480px] flex flex-col items-center gap-5">
          <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">15 PRIVATE SESSIONS</span>
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

      {/* 19. MOBILE NEWSLETTER DISPATCH */}
      <section 
        ref={newsletterRef}
        id="m-newsletter" 
        className={`w-full bg-[#c2272a] text-[#ecdcaf] py-14 px-5 flex flex-col items-center text-center transition-all duration-700 ${newsletterInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="w-full max-w-[440px] flex flex-col items-center gap-4 border-4 border-[#191410] bg-[#8a2320] p-6 shadow-[8px_8px_0px_#191410]">
          <span className="font-mono text-[9px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">16 DISPATCH // SECRET SESSIONS</span>
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

      {/* 20. MOBILE CLOSING SIGNATURE */}
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

      {/* 21. MOBILE FOOTER */}
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
