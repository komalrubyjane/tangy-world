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

  return (
    <section 
      ref={sectionRef} 
      id="volunteer" 
      className="relative w-full py-28 md:py-36 bg-[#4B2D22] text-[#D9C6A0] overflow-hidden border-t-8 border-[#3A241A]"
    >
      
      {/* INK GRAIN OVERLAY */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-overlay pointer-events-none z-10" />

      {/* TECHNICAL BACKSTAGE BLUEPRINT GRID PATTERN */}
      <BlueprintGridPattern opacity={0.06} />

      {/* OVERSIZED BACKGROUND WATERMARK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-10 z-5">
        <span className="font-poster text-[24vw] leading-none text-[#D9C6A0] uppercase">CLASSIFIED 1974</span>
      </div>

      {/* ARCHIVAL CORNER METADATA */}
      <div className="absolute top-8 left-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#9E6D35] font-bold pointer-events-none uppercase hidden md:block">
        TANGY SESSIONS // RECRUITMENT ARCHIVE
      </div>

      <div className="absolute top-8 right-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#D9C6A0]/70 pointer-events-none uppercase hidden md:block">
        HYDERABAD / EST. 2016
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION HEADER                                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="crew-header max-w-4xl mx-auto text-center px-6 relative z-20 mb-16 md:mb-24">
        <span className="font-mono text-[10px] md:text-xs font-bold text-[#9E6D35] tracking-[0.35em] uppercase mb-2 block">
          1970s CLASSIFIED RECRUITMENT DESK // TANGY MUSIC LABEL
        </span>
        <h2 className="font-poster text-6xl md:text-9xl text-[#D9C6A0] leading-none mb-3 uppercase">
          JOIN THE CREW
        </h2>
        <p className="font-handwritten text-xl text-[#D9C6A0] max-w-xl mx-auto mb-4">
          "Great experiences are built by passionate people behind the scenes."
        </p>
        <p className="font-mono text-xs md:text-sm text-[#D9C6A0]/90 tracking-[0.3em] uppercase border-y-2 border-[#35251A] py-2 inline-block px-6 bg-[#35251A]/80 shadow-md">
          BEHIND THE SOUND · ON THE STAGE
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE CLASSIFIED DOSSIER ARCHIVE GRID                    */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 relative z-20 items-stretch">

        {/* ----------------------------------------------------------- */}
        {/* DOSSIER 1: VOLUNTEER (AGED MANILA FOLDER ARCHIVE)            */}
        {/* ----------------------------------------------------------- */}
        <div 
          className="dossier-volunteer group bg-[#CBB38C] text-[#35251A] p-6 md:p-12 border-4 border-[#35251A] shadow-archival hover:-translate-y-2 hover:rotate-[-2deg] transition-all duration-300 relative flex flex-col justify-between"
          onClick={() => setActiveTab(activeTab === 'vol' ? null : 'vol')}
        >
          
          {/* MANILA FOLDER TAB AT TOP */}
          <div className="absolute -top-6 left-6 bg-[#CBB38C] border-t-4 border-x-4 border-[#35251A] px-4 py-1 font-mono text-[9px] font-bold text-[#4B2D22] uppercase tracking-widest">
            DOSSIER NO. 07-V // BEHIND THE SCENES
          </div>

          {/* PAPER CLIP DECORATION */}
          <div className="absolute -top-3 left-44 w-3 h-10 border-2 border-[#35251A]/60 rounded-full z-30 pointer-events-none rotate-[-6deg]" />

          {/* MASKING TAPE OVERLAY */}
          <div className="absolute -top-3 right-28 w-20 h-5 bg-[rgba(203,179,140,0.85)] rotate-[-3deg] border border-[#35251A]/30 z-30 pointer-events-none" />

          {/* CLASSIFIED RED STAMP */}
          <div className="crew-stamp-1 absolute -top-5 right-4 border-4 border-[#35251A] bg-[#7A2B24] text-[#D9C6A0] font-mono text-[10px] font-bold px-3.5 py-1 uppercase rotate-[-8deg] shadow-lg z-30 pointer-events-none">
            CLASSIFIED // HYD 1974 ✦
          </div>

          <div>
            <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#4B2D22] border-b-2 border-[#35251A]/30 pb-3 mb-6 uppercase">
              <span>PATH 01 // PRODUCTION DESK</span>
              <span>CONFIDENTIAL FILE</span>
            </div>

            <h3 className="font-poster text-5xl md:text-7xl text-[#35251A] leading-none mb-3 uppercase">
              VOLUNTEER
            </h3>

            {/* HANDWRITTEN ARCHIVAL NOTE */}
            <p className="font-handwritten text-base md:text-lg text-[#35251A]/90 leading-relaxed border-l-4 border-[#9E6D35] pl-3.5 my-4">
              "Help build the nights, the stories and everything that happens between them."
            </p>

            {/* ATTACHED POLAROID PHOTO */}
            <div className="dossier-polaroid-1 relative w-[160px] md:w-[210px] bg-[#D9C6A0] p-2 pb-7 border-2 border-[#35251A] shadow-md rotate-[-4deg] my-6 transition-transform group-hover:scale-105">
              <img src={gallery[4]?.src || "/media/gallery/tangy5.jpg"} alt="Stagehands Sound Check" className="w-full aspect-[4/3] object-cover scanned-photo border border-[#35251A]" />
              <p className="font-mono text-[7.5px] text-[#35251A] font-bold tracking-wider mt-1.5">✎ STAGE & PRODUCTION</p>
            </div>

            {/* CLASSIFIED DEPARTMENT TAGS */}
            <div className="flex flex-wrap gap-2 mb-8 font-mono text-[9px] font-bold text-[#35251A]">
              <span className="bg-[#D9C6A0] border border-[#35251A] px-2.5 py-1 uppercase">EVENTS</span>
              <span className="bg-[#D9C6A0] border border-[#35251A] px-2.5 py-1 uppercase">PRODUCTION</span>
              <span className="bg-[#D9C6A0] border border-[#35251A] px-2.5 py-1 uppercase">CREATIVE</span>
              <span className="bg-[#D9C6A0] border border-[#35251A] px-2.5 py-1 uppercase">HOSPITALITY</span>
            </div>
          </div>

          {/* Volunteer Action Button */}
          <a 
            href="/apply/crew"
            className="btn-ticket w-full text-center block !bg-[#9E6D35] !text-[#35251A] hover:!bg-[#35251A] hover:!text-[#D9C6A0] !border-2 !border-[#35251A] shadow-sm font-mono text-xs font-bold uppercase tracking-widest py-3"
          >
            JOIN THE CREW → APPLY NOW
          </a>

        </div>

        {/* ----------------------------------------------------------- */}
        {/* DOSSIER 2: ARTIST (VINTAGE VINYL SLEEVE AUDITION PORTFOLIO)    */}
        {/* ----------------------------------------------------------- */}
        <div 
          className="dossier-artist group bg-[#CBB38C] text-[#35251A] p-6 md:p-12 border-4 border-[#35251A] shadow-archival hover:-translate-y-2 hover:rotate-[2deg] transition-all duration-300 relative flex flex-col justify-between"
          onClick={() => setActiveTab(activeTab === 'art' ? null : 'art')}
        >
          
          {/* MANILA FOLDER TAB AT TOP */}
          <div className="absolute -top-6 left-6 bg-[#7A2B24] border-t-4 border-x-4 border-[#35251A] px-4 py-1 font-mono text-[9px] font-bold text-[#D9C6A0] uppercase tracking-widest">
            DOSSIER NO. 08-A // ON THE STAGE
          </div>

          {/* GUITAR PICK ACCENT */}
          <div className="absolute -top-4 right-32 w-7 h-9 bg-[#9E6D35] rounded-t-xl rounded-b-sm border-2 border-[#35251A] rotate-[12deg] z-30 pointer-events-none flex items-center justify-center font-mono text-[6px] font-black text-[#35251A]">
            PICK
          </div>

          {/* MASKING TAPE OVERLAY */}
          <div className="absolute -top-3 left-32 w-18 h-5 bg-[rgba(203,179,140,0.85)] rotate-[4deg] border border-[#35251A]/30 z-30 pointer-events-none" />

          {/* GOLD FOIL AUDITION STAMP */}
          <div className="crew-stamp-2 absolute -top-5 right-4 border-4 border-[#35251A] bg-[#7A2B24] text-[#D9C6A0] font-mono text-[10px] font-bold px-3.5 py-1 uppercase rotate-[6deg] shadow-lg z-30 pointer-events-none">
            AUDITION // 33⅓ RPM ✦
          </div>

          <div>
            <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#7A2B24] border-b-2 border-[#35251A]/30 pb-3 mb-6 uppercase">
              <span>PATH 02 // ARTIST PORTFOLIO</span>
              <span>AUDITION FILE</span>
            </div>

            <h3 className="font-poster text-5xl md:text-7xl text-[#35251A] leading-none mb-3 uppercase">
              ARTIST
            </h3>

            {/* HANDWRITTEN ARCHIVAL NOTE */}
            <p className="font-handwritten text-base md:text-lg text-[#35251A]/90 leading-relaxed border-l-4 border-[#7A2B24] pl-3.5 my-4">
              "Bring your sound, your story and your energy into the Tangy world."
            </p>

            {/* ATTACHED POLAROID PHOTO */}
            <div className="dossier-polaroid-2 relative w-[160px] md:w-[210px] bg-[#D9C6A0] p-2 pb-7 border-2 border-[#35251A] shadow-md rotate-[4deg] my-6 transition-transform group-hover:scale-105">
              <img src={artists[6]?.image || "/media/artists/artist7.jpg"} alt="Live Vocalist Performing" className="w-full aspect-[4/3] object-cover scanned-photo border border-[#35251A]" />
              <p className="font-mono text-[7.5px] text-[#35251A] font-bold tracking-wider mt-1.5">✎ LIVE AUDITION // STAGE A</p>
            </div>

            {/* CLASSIFIED GENRE TAGS */}
            <div className="flex flex-wrap gap-2 mb-8 font-mono text-[9px] font-bold text-[#35251A]">
              <span className="bg-[#D9C6A0] border border-[#35251A] px-2.5 py-1 uppercase">MUSICIANS</span>
              <span className="bg-[#D9C6A0] border border-[#35251A] px-2.5 py-1 uppercase">DJs</span>
              <span className="bg-[#D9C6A0] border border-[#35251A] px-2.5 py-1 uppercase">BANDS</span>
              <span className="bg-[#D9C6A0] border border-[#35251A] px-2.5 py-1 uppercase">PRODUCERS</span>
            </div>
          </div>

          {/* Artist Action Button */}
          <a 
            href="/artist/register"
            className="btn-ticket w-full text-center block !bg-[#7A2B24] !text-[#D9C6A0] hover:!bg-[#35251A] !border-2 !border-[#35251A] shadow-sm font-mono text-xs font-bold uppercase tracking-widest py-3"
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
          <span className="font-mono text-[10px] md:text-xs font-bold text-[#9E6D35] tracking-[0.35em] uppercase mb-2 block">
            COLLABORATION ARCHIVE // TANGY SESSIONS
          </span>
          <h2 className="font-poster text-4xl md:text-7xl text-[#D9C6A0] leading-none mb-3 uppercase">
            BUILD THIS WORLD TOGETHER
          </h2>
          <p className="font-handwritten text-lg text-[#D9C6A0] max-w-xl mx-auto">
            "Artists, venues, partners and dreamers have always shaped Tangy."
          </p>
        </div>

        {/* THREE CARDS: VENDORS, SPONSORS, VENUE / HOST */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* CARD 1: VENDORS */}
          <div className="bg-[#CBB38C] text-[#35251A] p-6 md:p-8 border-4 border-[#35251A] shadow-archival flex flex-col justify-between rotate-[-1deg] hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#4B2D22] border-b-2 border-[#35251A]/30 pb-2 mb-4 uppercase">
                <span>FILE NO. 01</span>
                <span>PARTNER</span>
              </div>
              <h3 className="font-poster text-3xl text-[#35251A] leading-none mb-3 uppercase">VENDORS</h3>
              <p className="font-mono text-xs text-[#35251A]/90 leading-relaxed mb-6">
                Chai stalls, artisanal food popups, vintage print presses, and craft makers bringing local flavor to every session.
              </p>
            </div>
            <a 
              href="/apply/vendors"
              className="btn-ticket w-full text-center block text-xs font-mono font-bold uppercase !bg-[#4B2D22] !text-[#D9C6A0] !border-2 !border-[#35251A] py-2.5 hover:!bg-[#35251A]"
            >
              COLLABORATE → EXPLORE OPPORTUNITIES
            </a>
          </div>

          {/* CARD 2: SPONSORS */}
          <div className="bg-[#CBB38C] text-[#35251A] p-6 md:p-8 border-4 border-[#35251A] shadow-archival flex flex-col justify-between rotate-[1.5deg] hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#7A2B24] border-b-2 border-[#35251A]/30 pb-2 mb-4 uppercase">
                <span>FILE NO. 02</span>
                <span>SPONSOR</span>
              </div>
              <h3 className="font-poster text-3xl text-[#35251A] leading-none mb-3 uppercase">SPONSORS</h3>
              <p className="font-mono text-xs text-[#35251A]/90 leading-relaxed mb-6">
                Cultural foundations, audio gear brands, and independent supporters powering heritage music preservation.
              </p>
            </div>
            <a 
              href="/apply/sponsors"
              className="btn-ticket w-full text-center block text-xs font-mono font-bold uppercase !bg-[#7A2B24] !text-[#D9C6A0] !border-2 !border-[#35251A] py-2.5 hover:!bg-[#35251A]"
            >
              COLLABORATE → EXPLORE OPPORTUNITIES
            </a>
          </div>

          {/* CARD 3: VENUE / HOST */}
          <div className="bg-[#CBB38C] text-[#35251A] p-6 md:p-8 border-4 border-[#35251A] shadow-archival flex flex-col justify-between rotate-[-1deg] hover:-translate-y-1 transition-transform">
            <div>
              <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#9E6D35] border-b-2 border-[#35251A]/30 pb-2 mb-4 uppercase">
                <span>FILE NO. 03</span>
                <span>HERITAGE</span>
              </div>
              <h3 className="font-poster text-3xl text-[#35251A] leading-none mb-3 uppercase">VENUE / HOST</h3>
              <p className="font-mono text-xs text-[#35251A]/90 leading-relaxed mb-6">
                Have a 300-year-old stepwell, private Nizam-era courtyard, or historic acoustic sanctuary? Host a session.
              </p>
            </div>
            <a 
              href="/apply/venue-host"
              className="btn-ticket w-full text-center block text-xs font-mono font-bold uppercase !bg-[#9E6D35] !text-[#35251A] !border-2 !border-[#35251A] py-2.5 hover:!bg-[#35251A] hover:!text-[#D9C6A0]"
            >
              COLLABORATE → EXPLORE OPPORTUNITIES
            </a>
          </div>

        </div>

      </div>

    </section>
  );
};
