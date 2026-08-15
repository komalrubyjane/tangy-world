import { useRef, useState, useEffect } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { useAudio } from '../../audio/AudioContext';
import { gallery, artists } from '../../data/mockData';
import { BlueprintGridPattern } from '../ui/BackgroundDecorations';

export const Volunteer = ({ onApplyVolunteer, onApplyArtist }) => {
  const { playSFX } = useAudio();
  const [activeTab, setActiveTab] = useState(null);

  const sectionRef = useGSAPContext((ctx) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%'
      }
    });

    // 1. Header Reveal
    tl.fromTo('.crew-header',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
    )

    // 2. Dossier Folders Slide In Asymmetrically
    .fromTo('.dossier-volunteer',
      { x: -90, opacity: 0, rotation: -5 },
      { x: 0, opacity: 1, rotation: -1.5, duration: 0.8, ease: 'back.out(1.2)' }, 0.2
    )
    .fromTo('.dossier-artist',
      { x: 90, opacity: 0, rotation: 5 },
      { x: 0, opacity: 1, rotation: 1.5, duration: 0.8, ease: 'back.out(1.2)' }, 0.3
    )

    // 3. Polaroids & Tape Stick
    .fromTo('.dossier-polaroid-1',
      { scale: 0.8, opacity: 0, rotation: -10 },
      { scale: 1, opacity: 1, rotation: -4, duration: 0.5, ease: 'power3.out' }, 0.6
    )
    .fromTo('.dossier-polaroid-2',
      { scale: 0.8, opacity: 0, rotation: 10 },
      { scale: 1, opacity: 1, rotation: 4, duration: 0.5, ease: 'power3.out' }, 0.7
    )

    // 4. Archive Stamps Slap Down with Impact
    .fromTo('.crew-stamp-1',
      { scale: 1.8, opacity: 0, rotation: -25 },
      { scale: 1, opacity: 0.95, rotation: -8, duration: 0.4, ease: 'bounce.out' }, 0.9
    )
    .fromTo('.crew-stamp-2',
      { scale: 1.8, opacity: 0, rotation: 25 },
      { scale: 1, opacity: 0.95, rotation: 6, duration: 0.4, ease: 'bounce.out', onStart: () => playSFX('ticketClick') }, 1.0
    );

  }, []);

  // Desktop Mouse Parallax (Subtle Dossier Tilt & Shadow Shift)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      const moveX = (clientX / window.innerWidth - 0.5) * 12;
      const moveY = (clientY / window.innerHeight - 0.5) * 12;

      gsap.to('.dossier-volunteer', { x: moveX * 0.15, y: moveY * 0.15, duration: 1.2, ease: 'power2.out' });
      gsap.to('.dossier-artist', { x: -moveX * 0.18, y: -moveY * 0.18, duration: 1.2, ease: 'power2.out' });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleVolunteerClick = () => {
    playSFX('ticketClick');
    if (onApplyVolunteer) onApplyVolunteer();
  };

  const handleArtistClick = () => {
    playSFX('ticketClick');
    if (onApplyArtist) onApplyArtist();
  };

  return (
    <section 
      ref={sectionRef} 
      id="volunteer" 
      className="relative w-full py-28 md:py-36 bg-[#315B66] text-[#E7D5A4] overflow-hidden border-t-8 border-[#E7D5A4]"
    >
      
      {/* INK GRAIN OVERLAY */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-13 mix-blend-overlay pointer-events-none z-10" />

      {/* TECHNICAL BACKSTAGE BLUEPRINT GRID PATTERN */}
      <BlueprintGridPattern opacity={0.08} />

      {/* OVERSIZED BACKGROUND SCREEN-PRINTED WATERMARK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-10 z-5">
        <span className="display text-[24vw] leading-none text-[#5F7D80] uppercase">CLASSIFIED 1974</span>
      </div>

      {/* ARCHIVAL CORNER METADATA */}
      <div className="absolute top-8 left-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#C69A32] font-bold pointer-events-none uppercase hidden md:block">
        TANGY SESSIONS // RECRUITMENT ARCHIVE
      </div>

      <div className="absolute top-8 right-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#E7D5A4]/70 pointer-events-none uppercase hidden md:block">
        HYDERABAD / EST. 2016
      </div>

      <div className="absolute bottom-8 left-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#E7D5A4]/70 pointer-events-none uppercase hidden md:block">
        PEOPLE MAKE THE SESSION.
      </div>

      <div className="absolute bottom-8 right-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#C69A32] font-bold pointer-events-none uppercase hidden md:block">
        DOSSIER NO. 07-V & 08-A
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION HEADER                                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="crew-header max-w-4xl mx-auto text-center px-6 relative z-20 mb-16 md:mb-24">
        <span className="font-mono text-[10px] md:text-xs font-bold text-[#C69A32] tracking-[0.35em] uppercase mb-2 block">
          1970s CLASSIFIED RECRUITMENT DESK // TANGY MUSIC LABEL
        </span>
        <h2 className="display text-6xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed mb-4">
          JOIN THE CREW
        </h2>
        <p className="font-serif italic text-sm md:text-base text-[#E7D7AC] max-w-xl mx-auto mb-3">
          "Great experiences are built by passionate people behind the scenes."
        </p>
        <p className="font-mono text-xs md:text-sm text-[#E7D7AC]/90 tracking-[0.3em] uppercase border-y-2 border-[#17120D] py-2 inline-block px-6 bg-[#172E33]/90 backdrop-blur-xs shadow-md">
          BEHIND THE SOUND · ON THE STAGE
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE CLASSIFIED DOSSIER ARCHIVE GRID                    */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 relative z-20 items-stretch">

        {/* ----------------------------------------------------------- */}
        {/* DOSSIER 1: VOLUNTEER (AGED CREAM MANILA FOLDER ARCHIVE)       */}
        {/* ----------------------------------------------------------- */}
        <div 
          className="dossier-volunteer group bg-[#E7D7AC] text-[#17120D] p-6 md:p-12 border-4 border-[#17120D] shadow-[20px_20px_0px_#17120D] hover:shadow-[28px_28px_0px_#17120D] hover:-translate-y-2 hover:rotate-[-2deg] transition-all duration-300 relative flex flex-col justify-between"
          onClick={() => setActiveTab(activeTab === 'vol' ? null : 'vol')}
        >
          
          {/* MANILA FOLDER TAB AT TOP */}
          <div className="absolute -top-6 left-6 bg-[#E7D7AC] border-t-4 border-x-4 border-[#17120D] px-4 py-1 font-mono text-[9px] font-bold text-[#315B66] uppercase tracking-widest">
            DOSSIER NO. 07-V // BEHIND THE SCENES
          </div>

          {/* PAPER CLIP DECORATION */}
          <div className="absolute -top-3 left-44 w-3 h-10 border-2 border-slate-700 rounded-full z-30 pointer-events-none rotate-[-6deg]" />

          {/* MASKING TAPE OVERLAY */}
          <div className="absolute -top-3 right-28 w-20 h-5 bg-[rgba(231,215,172,0.85)] rotate-[-3deg] border border-black/30 z-30 pointer-events-none" />

          {/* CLASSIFIED RED STAMP */}
          <div className="crew-stamp-1 absolute -top-5 right-4 border-4 border-[#17120D] bg-[#5A120D] text-[#E7D7AC] font-mono text-[10px] font-bold px-3.5 py-1 uppercase rotate-[-8deg] shadow-lg z-30 pointer-events-none">
            CLASSIFIED // HYD 1974 ✦
          </div>

          <div>
            <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#315B66] border-b-2 border-[#17120D] pb-3 mb-6 uppercase">
              <span>PATH 01 // PRODUCTION DESK</span>
              <span>CONFIDENTIAL FILE</span>
            </div>

            <h3 className="display text-5xl md:text-7xl text-[#17120D] leading-none mb-3 ink-bleed">
              VOLUNTEER
            </h3>

            {/* HANDWRITTEN ARCHIVAL NOTE */}
            <p className="font-mono text-xs md:text-sm text-[#17120D]/90 leading-relaxed border-l-4 border-[#C69A32] pl-3.5 my-4">
              ✎ "Help build the nights, the stories and everything that happens between them."
            </p>

            {/* ATTACHED POLAROID PHOTO */}
            <div className="dossier-polaroid-1 relative w-[160px] md:w-[210px] bg-[#F5E9C9] p-2 pb-7 border-2 border-[#17120D] shadow-md rotate-[-4deg] my-6 transition-transform group-hover:scale-105">
              <img src={gallery[4]?.src || "/media/gallery/tangy5.jpg"} alt="Stagehands Sound Check" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125 border border-[#17120D]" />
              <p className="font-mono text-[7.5px] text-[#17120D] font-bold tracking-wider mt-1.5">✎ STAGE & PRODUCTION</p>
            </div>

            {/* CLASSIFIED DEPARTMENT TAGS */}
            <div className="flex flex-wrap gap-2 mb-8 font-mono text-[9px] font-bold text-[#17120D]">
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase shadow-xs">EVENTS</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase shadow-xs">PRODUCTION</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase shadow-xs">CREATIVE</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase shadow-xs">HOSPITALITY</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase shadow-xs">COMMUNITY</span>
            </div>

            {/* MOBILE TAP DETAILS TOGGLE */}
            {activeTab === 'vol' && (
              <div className="font-mono text-[10px] text-[#17120D] bg-[#F5E9C9] p-3 border border-[#17120D] mb-4 animate-in fade-in">
                <p className="font-bold mb-1">RECRUITMENT DETAILS:</p>
                <p>• Access to all 2025-2026 Tangy Sessions behind-the-scenes.</p>
                <p>• Hands-on experience with analogue sound rigs & monument lighting.</p>
              </div>
            )}
          </div>

          {/* Volunteer Action Button */}
          <a 
            href="/apply/crew"
            className="btn-ticket w-full text-center block !bg-[#C69A32] !text-[#17120D] !border-2 !border-[#17120D] shadow-[6px_6px_0px_#17120D] active:translate-x-1 active:translate-y-1 active:shadow-none font-mono text-xs font-bold uppercase tracking-widest py-3"
          >
            JOIN THE CREW → APPLY NOW
          </a>

        </div>

        {/* ----------------------------------------------------------- */}
        {/* DOSSIER 2: ARTIST (VINTAGE VINYL SLEEVE AUDITION PORTFOLIO)    */}
        {/* ----------------------------------------------------------- */}
        <div 
          className="dossier-artist group bg-[#E7D7AC] text-[#17120D] p-6 md:p-12 border-4 border-[#17120D] shadow-[20px_20px_0px_#17120D] hover:shadow-[28px_28px_0px_#17120D] hover:-translate-y-2 hover:rotate-[2deg] transition-all duration-300 relative flex flex-col justify-between"
          onClick={() => setActiveTab(activeTab === 'art' ? null : 'art')}
        >
          
          {/* MANILA FOLDER TAB AT TOP */}
          <div className="absolute -top-6 left-6 bg-[#B84718] border-t-4 border-x-4 border-[#17120D] px-4 py-1 font-mono text-[9px] font-bold text-[#E7D7AC] uppercase tracking-widest">
            DOSSIER NO. 08-A // ON THE STAGE
          </div>

          {/* CASSETTE TAPE / GUITAR PICK ACCENT */}
          <div className="absolute -top-4 right-32 w-7 h-9 bg-[#C69A32] rounded-t-xl rounded-b-sm border-2 border-[#17120D] rotate-[12deg] z-30 pointer-events-none flex items-center justify-center font-mono text-[6px] font-black text-[#17120D]">
            PICK
          </div>

          {/* MASKING TAPE OVERLAY */}
          <div className="absolute -top-3 left-32 w-18 h-5 bg-[rgba(231,215,172,0.85)] rotate-[4deg] border border-black/30 z-30 pointer-events-none" />

          {/* GOLD FOIL AUDITION STAMP */}
          <div className="crew-stamp-2 absolute -top-5 right-4 border-4 border-[#17120D] bg-[#B84718] text-[#E7D7AC] font-mono text-[10px] font-bold px-3.5 py-1 uppercase rotate-[6deg] shadow-lg z-30 pointer-events-none">
            AUDITION // 33⅓ RPM ✦
          </div>

          <div>
            <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#B84718] border-b-2 border-[#17120D] pb-3 mb-6 uppercase">
              <span>PATH 02 // ARTIST PORTFOLIO</span>
              <span>AUDITION FILE</span>
            </div>

            <h3 className="display text-5xl md:text-7xl text-[#17120D] leading-none mb-3 ink-bleed">
              ARTIST
            </h3>

            {/* HANDWRITTEN ARCHIVAL NOTE */}
            <p className="font-mono text-xs md:text-sm text-[#17120D]/90 leading-relaxed border-l-4 border-[#B84718] pl-3.5 my-4">
              ✎ "Bring your sound, your story and your energy into the Tangy world."
            </p>

            {/* ATTACHED POLAROID PHOTO */}
            <div className="dossier-polaroid-2 relative w-[160px] md:w-[210px] bg-[#F5E9C9] p-2 pb-7 border-2 border-[#17120D] shadow-md rotate-[4deg] my-6 transition-transform group-hover:scale-105">
              <img src={artists[6]?.image || "/media/artists/artist7.jpg"} alt="Live Vocalist Performing" className="w-full aspect-[4/3] object-cover filter grayscale contrast-130 border border-[#17120D]" />
              <p className="font-mono text-[7.5px] text-[#17120D] font-bold tracking-wider mt-1.5">✎ LIVE AUDITION // STAGE A</p>
            </div>

            {/* CLASSIFIED GENRE TAGS */}
            <div className="flex flex-wrap gap-2 mb-8 font-mono text-[9px] font-bold text-[#17120D]">
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase shadow-xs">MUSICIANS</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase shadow-xs">DJs</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase shadow-xs">BANDS</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase shadow-xs">PRODUCERS</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase shadow-xs">PERFORMERS</span>
            </div>

            {/* MOBILE TAP DETAILS TOGGLE */}
            {activeTab === 'art' && (
              <div className="font-mono text-[10px] text-[#17120D] bg-[#F5E9C9] p-3 border border-[#17120D] mb-4 animate-in fade-in">
                <p className="font-bold mb-1">AUDITION CRITERIA:</p>
                <p>• Performers of all analog, live electronic & acoustic genres welcome.</p>
                <p>• Submit demo recordings for season curation.</p>
              </div>
            )}
          </div>

          {/* Artist Action Button */}
          <a 
            href="/artist/register"
            className="btn-ticket w-full text-center block !bg-[#B84718] !text-[#E7D7AC] !border-2 !border-[#17120D] shadow-[6px_6px_0px_#17120D] active:translate-x-1 active:translate-y-1 active:shadow-none font-mono text-xs font-bold uppercase tracking-widest py-3"
          >
            APPLY AS ARTIST →
          </a>

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. LET'S BUILD THIS WORLD TOGETHER (3 CARDS: VENDORS, SPONSORS, HOST) */}
      {/* ------------------------------------------------------------- */}
      <div id="build-together" className="max-w-[1200px] mx-auto px-6 mt-28 md:mt-36 relative z-20">
        
        {/* SINGLE-LINE CTA HEADING & EDITORIAL COPY */}
        <div className="text-center mb-12">
          <span className="font-mono text-[10px] md:text-xs font-bold text-[#C69A32] tracking-[0.35em] uppercase mb-2 block">
            COLLABORATION ARCHIVE // TANGY SESSIONS
          </span>
          <h2 className="display text-4xl md:text-7xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-3">
            BUILD THIS WORLD TOGETHER
          </h2>
          <p className="font-serif italic text-sm md:text-base text-[#E7D7AC] max-w-xl mx-auto">
            "Artists, venues, partners and dreamers have always shaped Tangy."
          </p>
        </div>

        {/* THREE CARDS: VENDORS, SPONSORS, VENUE / HOST */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* CARD 1: VENDORS */}
          <div className="bg-[#E7D7AC] text-[#17120D] p-6 md:p-8 border-4 border-[#17120D] shadow-[12px_12px_0px_#17120D] flex flex-col justify-between rotate-[-1deg] hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#315B66] border-b-2 border-[#17120D] pb-2 mb-4 uppercase">
                <span>FILE NO. 01</span>
                <span>PARTNER</span>
              </div>
              <h3 className="display text-3xl text-[#17120D] leading-none mb-3">VENDORS</h3>
              <p className="font-mono text-xs text-[#17120D]/90 leading-relaxed mb-6">
                Chai stalls, artisanal food popups, vintage print presses, and craft makers bringing local flavor to every session.
              </p>
            </div>
            <a 
              href="/apply/vendors"
              className="btn-ticket w-full text-center block text-xs font-mono font-bold uppercase !bg-[#315B66] !text-[#E7D7AC] !border-2 !border-[#17120D] py-2.5"
            >
              COLLABORATE → EXPLORE OPPORTUNITIES
            </a>
          </div>

          {/* CARD 2: SPONSORS */}
          <div className="bg-[#E7D7AC] text-[#17120D] p-6 md:p-8 border-4 border-[#17120D] shadow-[12px_12px_0px_#17120D] flex flex-col justify-between rotate-[1.5deg] hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#B84718] border-b-2 border-[#17120D] pb-2 mb-4 uppercase">
                <span>FILE NO. 02</span>
                <span>SPONSOR</span>
              </div>
              <h3 className="display text-3xl text-[#17120D] leading-none mb-3">SPONSORS</h3>
              <p className="font-mono text-xs text-[#17120D]/90 leading-relaxed mb-6">
                Cultural foundations, audio gear brands, and independent supporters powering heritage music preservation.
              </p>
            </div>
            <a 
              href="/apply/sponsors"
              className="btn-ticket w-full text-center block text-xs font-mono font-bold uppercase !bg-[#B84718] !text-[#E7D7AC] !border-2 !border-[#17120D] py-2.5"
            >
              COLLABORATE → EXPLORE OPPORTUNITIES
            </a>
          </div>

          {/* CARD 3: VENUE / HOST */}
          <div className="bg-[#E7D7AC] text-[#17120D] p-6 md:p-8 border-4 border-[#17120D] shadow-[12px_12px_0px_#17120D] flex flex-col justify-between rotate-[-1deg] hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#C69A32] border-b-2 border-[#17120D] pb-2 mb-4 uppercase">
                <span>FILE NO. 03</span>
                <span>HERITAGE</span>
              </div>
              <h3 className="display text-3xl text-[#17120D] leading-none mb-3">VENUE / HOST</h3>
              <p className="font-mono text-xs text-[#17120D]/90 leading-relaxed mb-6">
                Have a 300-year-old stepwell, private Nizam-era courtyard, or historic acoustic sanctuary? Host a session.
              </p>
            </div>
            <a 
              href="/apply/venue-host"
              className="btn-ticket w-full text-center block text-xs font-mono font-bold uppercase !bg-[#C69A32] !text-[#17120D] !border-2 !border-[#17120D] py-2.5"
            >
              COLLABORATE → EXPLORE OPPORTUNITIES
            </a>
          </div>

        </div>

      </div>

    </section>
  );
};
