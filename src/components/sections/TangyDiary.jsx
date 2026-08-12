import { useState, useRef } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PAPER_BG = 'linear-gradient(170deg, #F5EEE0 0%, #EADFC5 45%, #E3D4AC 100%)';
const SH_R = 'inset -8px 0 20px rgba(90,64,50,0.18), 8px 10px 32px rgba(0,0,0,0.48)';
const SH_L = 'inset  8px 0 20px rgba(90,64,50,0.18), -8px 10px 32px rgba(0,0,0,0.48)';

const leafStyle = (i) => ({
  position: 'absolute',
  top: 0, right: 0, bottom: 0,
  width: '50%',
  transformOrigin: 'left center',
  transformStyle: 'preserve-3d',
  zIndex: 10 - i,
  willChange: 'transform',
});

const frontFace = (extra = {}) => ({
  position: 'absolute', inset: 0,
  backfaceVisibility: 'hidden',
  borderRadius: '0 2px 2px 0',
  overflow: 'hidden',
  ...extra,
});

const backFace = (extra = {}) => ({
  position: 'absolute', inset: 0,
  backfaceVisibility: 'hidden',
  transform: 'rotateY(180deg)',
  borderRadius: '2px 0 0 2px',
  overflow: 'hidden',
  ...extra,
});

// Mobile Interactive Touch Swipe-To-Turn-Pages Diary Component
const MobileSwipeDiary = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('next');
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  const pages = [
    // Page 0: Cover
    {
      id: 'cover',
      type: 'cover',
      title: 'TANGY DIARY',
      subtitle: 'Field Notes · Vol. I',
      date: 'Hyderabad · Since 2016',
      number: 'Archive No. 001',
    },
    // Page 1: Stepwell
    {
      id: 'spread1',
      spread: 'Spread #01',
      date: '14 Oct, 2024',
      title: 'The Beginning & Bansilalpet Stepwell',
      location: 'BANSILALPET STEPWELL',
      content: 'The stepwell echoes before the crowd arrives. Water dripping against 350-year-old stone, acoustic instruments humming without amplification.',
      note: 'Echo off 350-year-old stone.',
      botanical: 'stem',
    },
    // Page 2: Monsoon
    {
      id: 'spread2',
      spread: 'Spread #02',
      date: '21 Dec, 2024',
      title: 'Monsoon Acoustics & Old City Haveli',
      tag: '300 AUDIENCE // MIDNIGHT',
      content: 'When the lights dropped at midnight, 300 people stood completely still under rain-soaked arches. No phones in the air.',
      note: '300 people stayed till sunrise.',
      botanical: 'wildflower',
    },
    // Page 3: Performers
    {
      id: 'spread3',
      spread: 'Spread #03',
      date: '05 Jan, 2025',
      title: 'Artists & Performers',
      content: 'The artists gathered around ribbon microphones for an unscripted acoustic jam. Someone pulled out a tanpura, another started a vocal chant.',
      badge: 'PERFORMER PASS // BACKSTAGE',
      botanical: 'daisy',
    },
    // Page 4: Backstage
    {
      id: 'spread4',
      spread: 'Spread #04',
      date: 'Backstage',
      title: 'Backstage Notes & Hidden Spaces',
      content: 'A 300-year-old sanctuary tucked behind stone arches. We mapped the acoustics by hand, with no digital tools.',
      box: '[ NORTH WALL: REVERB 1.8s ]\n[ SOUTHERN ARCH: BASS TRAP ]',
    },
    // Page 5: Handwritten Note Card
    {
      id: 'spread5',
      spread: 'Spread #05',
      date: 'Community',
      type: 'letter',
      title: 'Dear You,',
      content: 'Every gathering leaves something behind.\n\nA song.\nA conversation.\nA place.\nA memory.\n\nAnd somehow, we carry it with us.',
      author: '— Tangy',
    },
    // Page 6: Final Page
    {
      id: 'spread6',
      type: 'end',
      label: 'Continue Reading',
      title: 'More stories are waiting.',
      content: 'The diary continues with every new Tangy Session.',
      footer: 'TANGY DIARY · FIELD NOTES · VOL. I',
    }
  ];

  const handleNext = () => {
    if (currentPage < pages.length - 1 && !isFlipping) {
      setFlipDirection('next');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setIsFlipping(false);
      }, 250);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0 && !isFlipping) {
      setFlipDirection('prev');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1);
        setIsFlipping(false);
      }, 250);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (e) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Determine if user is swiping horizontally
    if (!isHorizontalSwipe.current && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isHorizontalSwipe.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (isHorizontalSwipe.current && Math.abs(deltaX) > 35) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const page = pages[currentPage];

  return (
    <div className="mobile-diary-wrap lg:hidden w-full px-4 pt-28 pb-16 flex flex-col items-center select-none"
      style={{ background: 'linear-gradient(180deg, #241A14 0%, #1F1713 100%)', touchAction: 'pan-y' }}>

      {/* Archival Section Label */}
      <div className="font-mono text-[9px] text-[#A68853] tracking-[0.25em] font-bold uppercase mb-4 text-center">
        SWIPE DIARY // PAGE {currentPage + 1} OF {pages.length}
      </div>

      {/* 3D Physical Book Card Container */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-[360px] min-h-[460px] cursor-grab active:cursor-grabbing transition-transform duration-300"
        style={{ perspective: '1000px' }}
      >
        {/* Leather spine background shadow */}
        <div className="absolute -left-2 top-0 bottom-0 w-4 bg-[#140D08] z-30 rounded-l shadow-2xl opacity-80" />

        {/* Page Content with Curl Flip Transition */}
        <div 
          className={`w-full min-h-[460px] p-6 rounded-sm shadow-[0_12px_30px_rgba(0,0,0,0.6)] border border-[#5A4032]/40 relative overflow-hidden transition-all duration-300 ${
            isFlipping 
              ? (flipDirection === 'next' ? 'rotate-y-[-18deg] scale-95 opacity-80' : 'rotate-y-[18deg] scale-95 opacity-80') 
              : 'rotate-y-0 scale-100 opacity-100'
          }`}
          style={{
            background: page.type === 'cover' 
              ? 'linear-gradient(145deg,#6B4B39 0%,#5A4032 45%,#4B3529 100%)'
              : 'linear-gradient(170deg,#F5EEE0 0%,#EADFC5 45%,#E3D4AC 100%)',
            color: page.type === 'cover' ? '#EADFC5' : '#2E221B',
            boxShadow: 'inset 0 0 25px rgba(90,64,50,0.15), 0 12px 35px rgba(0,0,0,0.65)'
          }}
        >
          {/* Masking Tape Decor */}
          <div className="absolute -top-2 left-1/3 w-16 h-4 bg-[rgba(201,168,83,0.4)] rotate-[-1deg] border border-black/20 z-20 pointer-events-none" />

          {/* PAGE 0: COVER */}
          {page.type === 'cover' && (
            <div className="flex flex-col items-center justify-center text-center h-full py-8">
              <div className="font-mono text-[8px] tracking-[0.22em] uppercase text-[#EADFC5]/55 mb-4">
                {page.number}
              </div>
              <div className="font-serif font-bold text-[#A68853] leading-none mb-2" style={{ fontSize: 38 }}>
                TANGY<br/>DIARY
              </div>
              <div className="font-mono text-[10px] tracking-[0.35em] text-[#EADFC5]/75 mb-1 uppercase">
                {page.subtitle}
              </div>
              <div className="font-serif italic text-xs text-[#EADFC5]/50 mb-6">
                {page.date}
              </div>
              
              <svg width="48" height="48" viewBox="0 0 52 52" fill="none" stroke="#A68853" strokeWidth="1.1" strokeLinecap="round" className="opacity-45 my-2">
                <line x1="26" y1="52" x2="26" y2="28"/>
                <path d="M26,42 Q16,36 14,26 Q24,28 26,42"/>
                <path d="M26,36 Q36,30 38,20 Q28,22 26,36"/>
                <circle cx="26" cy="22" r="5" fill="none"/>
                <circle cx="26" cy="22" r="2" fill="#A68853"/>
              </svg>

              <div className="font-mono text-[7px] tracking-[0.14em] uppercase text-[#EADFC5]/40 mt-8">
                Swipe left to open journal →
              </div>
            </div>
          )}

          {/* PAGE 1-4: JOURNAL SPREADS */}
          {!page.type && (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between font-mono text-[9px] tracking-[0.09em] uppercase text-[#5A4032] mb-2 pb-1 border-b border-[#5A4032]/20">
                  <span>{page.spread}</span>
                  <span className="text-[#A44A34] font-bold">{page.date}</span>
                </div>
                
                <h3 className="font-serif italic text-xl text-[#2E221B] leading-tight mb-2">
                  {page.title}
                </h3>
                
                {page.location && (
                  <div className="font-mono text-[8px] text-[#A44A34] uppercase tracking-wider mb-3">
                    LOCATION: {page.location}
                  </div>
                )}
                {page.tag && (
                  <div className="font-mono text-[8px] text-[#5A4032] uppercase tracking-wider mb-3">
                    {page.tag}
                  </div>
                )}

                <p style={{ fontFamily: 'Caveat, cursive', fontSize: '17px', lineHeight: '1.5' }} className="mt-3 text-[#2E221B] opacity-95">
                  {page.content}
                </p>

                {/* Botanical doodle */}
                <svg className="my-4 opacity-30 mx-auto" width="32" height="48" viewBox="0 0 32 60" fill="none" stroke="#5A4032" strokeWidth="1.1" strokeLinecap="round">
                  <line x1="16" y1="60" x2="16" y2="30"/>
                  <path d="M16,48 Q8,42 6,34 Q14,36 16,48"/>
                  <path d="M16,38 Q24,32 26,24 Q18,26 16,38"/>
                  <circle cx="16" cy="26" r="4"/>
                </svg>

                {page.note && (
                  <div className="bg-[#E6D8B7] p-2.5 -rotate-1 shadow-xs border border-[rgba(166,136,83,0.32)] max-w-[220px]">
                    <div style={{ fontFamily: 'Caveat, cursive', fontSize: '14px', color: '#2E221B' }}>
                      {page.note}
                    </div>
                  </div>
                )}

                {page.badge && (
                  <div className="inline-block text-[#EADFC5] font-mono text-[8px] rotate-1 px-2.5 py-1.5 bg-[#A44A34] shadow-sm">
                    {page.badge}
                  </div>
                )}

                {page.box && (
                  <div className="font-mono text-[8px] text-[#5A4032] p-2 border border-dashed border-[#5A4032]/40 whitespace-pre-line">
                    {page.box}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAGE 5: HANDWRITTEN LETTER CARD */}
          {page.type === 'letter' && (
            <div className="relative h-full flex flex-col justify-between p-2">
              <div className="flex justify-between font-mono text-[9px] tracking-[0.09em] uppercase text-[#5A4032] mb-3">
                <span>{page.spread}</span>
                <span className="text-[#A44A34] font-bold">{page.date}</span>
              </div>

              <div 
                className="relative p-5 shadow-md -rotate-1 border border-[#5A4032]/15"
                style={{
                  background: 'linear-gradient(170deg, #FDFAF4 0%, #F8F3E8 60%, #F2EBD8 100%)',
                  clipPath: 'polygon(0% 2%, 3% 0%, 97% 1%, 100% 0%, 100% 98%, 96% 100%, 3% 99%, 0% 100%)',
                }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-[rgba(201,168,83,0.45)] -rotate-1 border border-[#A07814]/30 pointer-events-none" />

                <p style={{ fontFamily: 'Caveat, cursive', fontSize: '18px', lineHeight: '1.55', color: '#2E221B' }}>
                  {page.title}
                  <br/><br/>
                  {page.content}
                </p>
                <p style={{ fontFamily: 'Caveat, cursive', fontSize: '17px', color: '#A44A34', textAlign: 'right', marginTop: 12 }}>
                  {page.author}
                </p>
              </div>
            </div>
          )}

          {/* PAGE 6: END PAGE */}
          {page.type === 'end' && (
            <div className="flex flex-col items-center justify-center text-center h-full py-8">
              <div className="font-mono text-[9px] tracking-widest uppercase text-[#5A4032] mb-3 pb-1 border-b border-[#5A4032]/40">
                {page.label}
              </div>
              <h3 className="font-serif italic text-2xl text-[#2E221B] mb-2">
                {page.title}
              </h3>
              <p style={{ fontFamily: 'Caveat, cursive', fontSize: '15px', color: '#5A4032' }} className="mb-6">
                {page.content}
              </p>

              <svg className="my-2 opacity-35" width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="#5A4032" strokeWidth="1.1" strokeLinecap="round">
                <line x1="32" y1="64" x2="32" y2="32"/><path d="M32,52 Q20,44 16,32 Q28,36 32,52"/>
                <path d="M32,42 Q44,34 48,22 Q36,26 32,42"/><circle cx="32" cy="26" r="6"/>
              </svg>

              <div style={{ fontFamily: 'Caveat, cursive', fontSize: '18px', fontWeight: 700, color: '#2E221B', opacity: 0.6 }}>
                To be continued…
              </div>
              <div className="font-mono text-[7px] tracking-[0.2em] uppercase text-[#A44A34] mt-4 opacity-70">
                {page.footer}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Swipe Controls & Pagination Dots */}
      <div className="flex items-center justify-between w-full max-w-[360px] mt-4 px-2">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="font-mono text-[10px] font-bold text-[#EADFC5] border border-[#A68853] px-3 py-1.5 rounded-sm disabled:opacity-30 disabled:border-transparent active:scale-95 transition-all"
        >
          ← PREV
        </button>

        {/* Pagination Dots */}
        <div className="flex items-center gap-1.5">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentPage ? 'bg-[#A68853] w-4' : 'bg-[#EADFC5]/30'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === pages.length - 1}
          className="font-mono text-[10px] font-bold text-[#EADFC5] border border-[#A68853] px-3 py-1.5 rounded-sm disabled:opacity-30 disabled:border-transparent active:scale-95 transition-all"
        >
          NEXT →
        </button>
      </div>

      <div className="font-serif italic text-xs text-[#EADFC5]/60 mt-3 text-center">
        💡 Touch &amp; swipe left/right across paper to turn pages
      </div>

      {/* Read Complete Diary CTA */}
      <div className="flex flex-col items-center gap-2 mt-6">
        <a 
          href="/blogs"
          className="bg-[#A68853] text-[#1F1713] border-2 border-[#1F1713] px-6 py-2.5 font-mono text-xs font-bold tracking-widest uppercase shadow-[4px_4px_0px_#2E221B] active:scale-95"
        >
          Read the Complete Tangy Diary →
        </a>
      </div>

    </div>
  );
};

export const TangyDiary = () => {
  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (isMobile) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=900%',
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        onUpdate(self) {
          gsap.to('.diary-mic-wire', {
            rotate: Math.sin(self.progress * Math.PI * 10) * 2,
            duration: 0.4,
            ease: 'power1.out'
          });
        }
      }
    });

    // Leaf 0 flip
    tl.to('.diary-left-base', { opacity: 1, duration: 0.25 }, 0.05)
      .to('.diary-leaf:nth-child(5)', { rotateY: -180, duration: 1, ease: 'power2.inOut' }, 0);
    // Leaf 1 flip
    tl.to('.diary-leaf:nth-child(6)', { rotateY: -180, duration: 1, ease: 'power2.inOut' }, 1);
    // Leaf 2 flip
    tl.to('.diary-leaf:nth-child(7)', { rotateY: -180, duration: 1, ease: 'power2.inOut' }, 2);
    // Leaf 3 flip
    tl.to('.diary-leaf:nth-child(8)', { rotateY: -180, duration: 1, ease: 'power2.inOut' }, 3);
    // Leaf 4 flip
    tl.to('.diary-leaf:nth-child(9)', { rotateY: -180, duration: 1, ease: 'power2.inOut' }, 4);
    // Leaf 5 flip
    tl.to('.diary-leaf:nth-child(10)', { rotateY: -180, duration: 1, ease: 'power2.inOut' }, 5);
  }, []);

  return (
    <section ref={sectionRef} id="diary"
      className="relative w-full bg-[#241A14] overflow-hidden flex flex-col items-center justify-center border-t-8 border-[#4A3529]"
      style={{ minHeight: '100svh' }}>

      {/* Leather/Parchment noise overlay */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.14] pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />

      {/* SVG Definitions */}
      <svg className="hidden">
        <defs>
          <symbol id="sym-compass" viewBox="0 0 40 40">
            <g fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="20" cy="20" r="16"/>
              <path d="M20,4 L23,17 L20,20 L17,17 Z" fill="currentColor" stroke="none"/>
              <path d="M20,36 L23,23 L20,20 L17,23 Z" fill="currentColor" stroke="none" opacity="0.5"/>
              <path d="M4,20  L17,17 L20,20 L17,23 Z" fill="currentColor" stroke="none" opacity="0.7"/>
              <path d="M36,20 L23,17 L20,20 L23,23 Z" fill="currentColor" stroke="none" opacity="0.7"/>
              <circle cx="20" cy="20" r="2.2" fill="currentColor" stroke="none"/>
            </g>
          </symbol>
          <symbol id="sym-rain" viewBox="0 0 26 26">
            <path d="M6,12 a5,5 0 0 1 9.5,-2 a4,4 0 0 1 1,7.9 h-11 a3.8,3.8 0 0 1 0.5,-5.9 z"
              fill="none" stroke="#5A4032" strokeWidth="1.3"/>
            <line x1="9" y1="21" x2="7"  y2="24" stroke="#5A4032" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="13" y1="21" x2="12" y2="25" stroke="#5A4032" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="17" y1="21" x2="16" y2="24" stroke="#5A4032" strokeWidth="1.3" strokeLinecap="round"/>
          </symbol>
        </defs>
      </svg>

      {/* Archive header */}
      <div className="absolute top-5 left-10 right-10 flex justify-between items-center z-20 pointer-events-none hidden lg:flex">
        <div>
          <div className="font-mono text-[9px] md:text-[10px] text-[#A68853] tracking-[0.25em] font-bold uppercase opacity-85">
            ARCHIVAL FIELD JOURNAL // FILE NO. 1974-TS
          </div>
          <p className="font-serif italic text-xs text-[#EADFC5]/75 mt-0.5">"Every room has a memory."</p>
        </div>
      </div>

      {/* MOBILE INTERACTIVE TOUCH SWIPE DIARY */}
      <MobileSwipeDiary />

      {/* DESKTOP 3D BOOK STAGE */}
      <div className="hidden lg:block" style={{ perspective: '2200px', perspectiveOrigin: '50% 40%', position: 'relative' }}>
        <div className="absolute left-1/2 -bottom-5 -translate-x-1/2 bg-black blur-[55px] opacity-[0.22]"
          style={{ width: '72%', height: '54px' }}/>

        <div id="diary-book" style={{ position: 'relative', width: 'min(880px, 92vw)', height: 'min(620px, 74vh)', transformStyle: 'preserve-3d' }}>
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%',
            zIndex: 0, borderRadius: '0 2px 2px 0',
            background: 'linear-gradient(155deg,#2E1E14 0%,#3A2718 14%,#4B3529 34%,#5A4032 50%,#4B3529 66%,#3A2718 86%,#2E1E14 100%)',
            boxShadow: '8px 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1F1310', borderLeft: 'none',
          }}>
            <div style={{ position:'absolute', inset:0, opacity:0.17, borderRadius:'0 2px 2px 0',
              background:'repeating-linear-gradient(0deg,rgba(166,136,83,0.22) 0 1px,transparent 1px 6px)' }}/>
          </div>

          <div className="diary-left-base" style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%',
            zIndex: 0, borderRadius: '2px 0 0 2px', opacity: 0,
            background: 'linear-gradient(155deg,#2E1E14 0%,#3A2718 14%,#4B3529 34%,#5A4032 50%,#4B3529 66%,#3A2718 86%,#2E1E14 100%)',
            boxShadow: '-8px 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1F1310', borderRight: 'none',
          }}>
            <div style={{ position:'absolute', inset:0, opacity:0.17, borderRadius:'2px 0 0 2px',
              background:'repeating-linear-gradient(0deg,rgba(166,136,83,0.22) 0 1px,transparent 1px 6px)' }}/>
          </div>

          <div style={{
            position: 'absolute', left: 'calc(50% - 14px)', width: '28px', top: '-5px', bottom: '-5px',
            zIndex: 99, borderRadius: '2px',
            background: 'linear-gradient(90deg,#140D08 0%,#2E1E14 10%,#4B3529 28%,#6B4B39 50%,#4B3529 72%,#2E1E14 90%,#140D08 100%)',
            boxShadow: 'inset 0 0 16px rgba(0,0,0,0.75)',
          }}>
            <div className="font-mono text-[9.5px] tracking-[0.18em] text-[#A68853] opacity-90 whitespace-nowrap select-none"
              style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%) rotate(90deg)' }}>
              TANGY DIARY · VOL. I · 2016–2026
            </div>
          </div>

          {/* LEAF 0: Front Cover */}
          <div className="diary-leaf" style={leafStyle(0)}>
            <div style={frontFace({ background: 'linear-gradient(145deg,#6B4B39 0%,#5A4032 45%,#4B3529 100%)' })}>
              <div style={{ position:'absolute', inset:0, padding:24, display:'flex', flexDirection:'column' }} className="text-[#EADFC5]">
                <div className="font-mono text-[7px] tracking-[0.22em] uppercase text-[#EADFC5]/55 text-center mt-3">Archive No. 001</div>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="font-serif font-bold leading-none tracking-wide text-[#A68853]" style={{ fontSize:'min(50px,5vw)' }}>TANGY<br/>DIARY</div>
                  <div className="font-mono text-[10px] tracking-[0.42em] text-[#EADFC5]/72 mt-3 uppercase">Field Notes</div>
                  <div className="font-serif italic text-xs text-[#EADFC5]/50 mt-1">Hyderabad · Since 2016</div>
                  <svg className="w-6 h-6 mx-auto mt-3 opacity-45 text-[#A68853]"><use href="#sym-compass"/></svg>
                </div>
              </div>
            </div>
            <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="flex flex-col items-center justify-center text-center text-[#2E221B]">
                <div className="font-serif italic text-[22px]">Field Journal</div>
                <div className="font-mono text-[8px] tracking-[0.1em] uppercase text-[#5A4032] mt-2">Vol. I · 2016 — 2026</div>
              </div>
            </div>
          </div>

          {/* LEAF 1: Stepwell */}
          <div className="diary-leaf" style={leafStyle(1)}>
            <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="flex justify-between font-mono text-[9px] tracking-[0.09em] uppercase text-[#5A4032] mb-1.5">
                  <span>Spread #01</span><span className="text-[#A44A34] font-bold">14 Oct, 2024</span>
                </div>
                <div className="font-serif italic text-xl leading-tight">The Beginning &amp;<br/>Bansilalpet Stepwell</div>
                <p style={{ fontFamily:'Caveat, cursive', fontSize:'15px' }} className="mt-2 leading-relaxed opacity-90 text-[#2E221B]">
                  The stepwell echoes before the crowd arrives. Water dripping against 350-year-old stone, acoustic instruments humming without amplification.
                </p>
              </div>
            </div>
            <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="font-mono text-[9px] uppercase mb-2">Spread #02 — Left</div>
                <p className="font-serif italic text-[13px] opacity-80">"The acoustic echo bounced off limestone steps."</p>
              </div>
            </div>
          </div>

          {/* LEAF 2: Monsoon */}
          <div className="diary-leaf" style={leafStyle(2)}>
            <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="flex justify-between font-mono text-[9px] uppercase text-[#5A4032] mb-1.5">
                  <span>Spread #02</span><span className="text-[#A44A34] font-bold">21 Dec, 2024</span>
                </div>
                <div className="font-serif italic text-xl leading-tight">Monsoon Acoustics</div>
                <p style={{ fontFamily:'Caveat, cursive', fontSize:'15px' }} className="mt-2 opacity-90 text-[#2E221B]">
                  When the lights dropped at midnight, 300 people stood completely still under rain-soaked arches.
                </p>
              </div>
            </div>
            <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="font-mono text-[9px] uppercase mb-2">Spread #03 — Left</div>
              </div>
            </div>
          </div>

          {/* LEAF 3: Performers */}
          <div className="diary-leaf" style={leafStyle(3)}>
            <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="flex justify-between font-mono text-[9px] uppercase text-[#5A4032] mb-1.5">
                  <span>Spread #03</span><span className="text-[#A44A34] font-bold">05 Jan, 2025</span>
                </div>
                <div className="font-serif italic text-xl leading-tight">Artists &amp; Performers</div>
                <p style={{ fontFamily:'Caveat, cursive', fontSize:'15px' }} className="mt-2 opacity-90 text-[#2E221B]">
                  The artists gathered around ribbon microphones for an unscripted acoustic jam.
                </p>
              </div>
            </div>
            <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="font-mono text-[9px] uppercase mb-2">Spread #04 — Left</div>
              </div>
            </div>
          </div>

          {/* LEAF 4: Backstage */}
          <div className="diary-leaf" style={leafStyle(4)}>
            <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="font-serif italic text-xl">Backstage Notes</div>
              </div>
            </div>
            <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="font-mono text-[9px] uppercase mb-2">Spread #05 — Left</div>
              </div>
            </div>
          </div>

          {/* LEAF 5: Community Note */}
          <div className="diary-leaf" style={leafStyle(5)}>
            <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
              <div style={{ position:'absolute', inset:0, padding:16 }} className="text-[#2E221B]">
                <div className="relative mx-auto p-4 -rotate-1 shadow-sm" style={{ background: 'linear-gradient(170deg,#FDFAF4 0%,#F8F3E8 60%,#F2EBD8 100%)' }}>
                  <p style={{ fontFamily:'Caveat, cursive', fontSize:'16px' }}>Dear You,<br/><br/>Every gathering leaves something behind.<br/><br/>— Tangy</p>
                </div>
              </div>
            </div>
            <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="flex flex-col items-center justify-center text-center text-[#2E221B]">
                <div className="font-serif italic text-lg">The story continues.</div>
              </div>
            </div>
          </div>

          {/* LEAF 6: End */}
          <div className="diary-leaf" style={leafStyle(6)}>
            <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
              <div style={{ position:'absolute', inset:0, padding:22 }} className="flex flex-col items-center justify-center text-center text-[#2E221B]">
                <div className="font-serif italic text-2xl">More stories<br/>are waiting.</div>
                <div style={{ fontFamily:'Caveat, cursive', fontSize:'18px', fontWeight:700 }} className="mt-4 opacity-60">To be continued…</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Desktop Read More CTA */}
      <div className="read-more-cta hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex-col items-center">
        <p className="font-serif italic text-xs text-[#EADFC5]/70 mb-2">
          Every Tangy Session leaves another page waiting to be written.
        </p>
        <a href="/blogs"
          className="bg-[#A68853] text-[#1F1713] hover:bg-[#EADFC5] border-2 border-[#1F1713] px-6 py-2.5 font-mono text-xs font-bold tracking-widest uppercase transition-colors shadow-[4px_4px_0px_#2E221B]">
          Read the Complete Tangy Diary →
        </a>
      </div>

      {/* Desktop Scroll hint */}
      <div className="read-hint hidden lg:block absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none" style={{ zIndex: 10000 }}>
        <div className="font-serif italic text-sm tracking-wider text-[#A68853]">Scroll to Open Journal</div>
        <div className="text-xs text-[#A68853] opacity-75 mt-0.5 animate-bounce">↓</div>
      </div>

    </section>
  );
};
