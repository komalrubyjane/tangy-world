import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { gallery } from '../../data/mockData';
import {
  TornPaperEdgeTop,
  NotebookGridPattern,
  PushPin,
} from '../ui/BackgroundDecorations';

gsap.registerPlugin(ScrollTrigger);

/* --- Shared photo card --- */
const PhotoCard = ({ photo, i, isLast }) => (
  <div className={`relative bg-[#E3D4AC] p-3 pb-12 shadow-2xl border-2 border-[#11100C] ${isLast ? 'heritage-expand-photo origin-center' : ''}`}
    style={{ transform: `rotate(${(i % 3 - 1) * 4}deg)` }}>
    <div className="absolute -top-3 left-1/3 w-16 h-4 bg-[rgba(231,213,164,0.85)] rotate-[-2deg] border border-black/30 z-30 pointer-events-none" />
    <div className="flex justify-between font-mono text-[8px] text-[#11100C] font-bold px-1 mb-1">
      <span>{String(i + 1).padStart(2, '0')}A</span>
      <span>EASTMAN 5247</span>
      <span>▲ {i + 1}</span>
    </div>
    <div className="w-full aspect-[4/3] bg-black overflow-hidden relative border border-[#11100C]">
      <img src={photo.src} alt={photo.label} loading="lazy" decoding="async"
        className="w-full h-full object-cover filter grayscale sepia-[0.35] contrast-125" />
    </div>
    <div className="mt-3 flex justify-between items-baseline font-mono text-[10px] text-[#11100C]">
      <span className="font-bold tracking-wider">{photo.label.toUpperCase()}</span>
      <span className="opacity-70">HYD · 2025</span>
    </div>

    {/* VIEW MORE ARCHIVE overlay — desktop only on last photo */}
    {isLast && (
      <div className="absolute z-40 bottom-[-16px] right-[-12px] w-[190px] -rotate-2 pointer-events-auto hidden lg:block"
        style={{
          background: 'linear-gradient(150deg, #EEE4C8 0%, #E3D4AC 60%, #D8C99A 100%)',
          border: '1.5px solid #11100C',
          boxShadow: '6px 6px 0px rgba(17,16,12,0.65)',
          padding: '10px 12px 12px',
        }}>
        <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-16 h-[13px] rotate-[-1.5deg]"
          style={{ background: 'rgba(201,154,46,0.45)', border: '1px solid rgba(160,120,20,0.3)' }} />
        <div className="font-mono text-[8px] font-bold text-[#C99A2E] tracking-[0.2em] uppercase mb-1.5 mt-1">THE ARCHIVE</div>
        <div className="border-t border-[#11100C]/25 mb-2" />
        <p className="font-serif italic text-[10px] text-[#2A1A0E] leading-snug opacity-90 mb-3">
          More stories, photographs and memories from Tangy Sessions.
        </p>
        <a href="/archive"
          className="block w-full text-center font-mono text-[9px] font-bold tracking-[0.18em] uppercase bg-[#C99A2E] text-[#11100C] hover:bg-[#11100C] hover:text-[#C99A2E] border border-[#11100C] py-1.5 transition-colors"
          style={{ boxShadow: '2px 2px 0px #11100C' }}>
          VIEW MORE ARCHIVE →
        </a>
      </div>
    )}
  </div>
);

export const Archive = () => {
  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    if (isMobile) {
      // Mobile: simple fade-in per photo, no scrub, no pin
      gsap.from('.mobile-archive-photo', {
        opacity: 0,
        y: 40,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.mobile-archive-grid',
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      });
      return;
    }

    // Desktop: pinned horizontal scrub + zoom on last photo
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=400%',
        scrub: 0.5,
        pin: true,
        anticipatePin: 1,
      },
    });
    tl.to('.archive-track', { xPercent: -70, ease: 'none' });
    tl.to('.heritage-expand-photo', { scale: 8, z: 500, ease: 'power2.in' }, 0.8);
  }, []);

  return (
    <section ref={sectionRef} id="archive"
      className="relative w-full bg-[#11100C] border-t-8 border-[#4A0C0C] overflow-hidden lg:h-screen lg:flex lg:items-center perspective-[1000px]">

      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.08] pointer-events-none mix-blend-overlay" />
      <TornPaperEdgeTop fill="#11100C" />

      <div className="absolute top-16 left-1/4 w-72 h-48 opacity-10 pointer-events-none z-0">
        <NotebookGridPattern opacity={0.5} />
      </div>

      <PushPin className="top-8 left-1/3" />
      <PushPin className="top-12 right-1/4" />

      <div className="absolute bottom-16 right-16 z-20 pointer-events-none border-2 border-[#C2272A] text-[#C2272A] px-4 py-1.5 font-mono text-xs font-bold tracking-[0.3em] uppercase rotate-[-8deg] opacity-75 hidden md:block">
        CLASSIFIED // ARCHIVAL RECORD ✦
      </div>

      <div className="absolute top-16 right-5 md:right-20 w-20 md:w-40 pointer-events-auto z-20 group cursor-pointer animate-[bounce_5s_ease-in-out_infinite]">
        <img src="/media/vinyl.png" alt="Spinning Vinyl Record"
          className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)] transition-transform duration-700 group-hover:rotate-180" />
        <span className="font-mono text-[7px] text-[#C99A2E] bg-[#11100C] px-1.5 py-0.5 border border-[#C99A2E] absolute -bottom-2 left-2 uppercase hidden md:block">33⅓ RPM STEREO</span>
      </div>

      <div className="absolute bottom-12 left-4 md:left-16 w-24 md:w-48 pointer-events-none z-20 opacity-80 hidden md:block">
        <img src="/media/gramophone.png" alt="Vintage Gramophone" className="w-full h-full object-contain filter drop-shadow-2xl" />
      </div>

      <div className="absolute top-6 left-6 font-mono text-[9px] text-[#C99A2E] tracking-[0.3em] pointer-events-none uppercase hidden md:block">
        ✦ KODAK SAFETY FILM 5063 // 35MM ✦ REC • LIVE • HYDERABAD
      </div>
      <div className="absolute bottom-6 left-6 font-mono text-[9px] text-[#E7D5A4]/40 tracking-[0.3em] pointer-events-none uppercase hidden md:block">
        REGISTRATION: [ ✚ ] CROSS-MARK // SIDE A
      </div>

      {/* Section header */}
      <div className="absolute top-10 left-5 right-5 md:left-12 md:right-12 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="font-mono text-[#C99A2E] text-[10px] tracking-[0.3em] uppercase font-bold">ANALOGUE CONTACT SHEET // FILE 35MM</p>
          <h2 className="display text-4xl md:text-8xl text-[#E7D5A4] opacity-30 leading-none">THE ARCHIVE</h2>
          <p className="font-serif italic text-xs md:text-sm text-[#E7D5A4]/90 mt-1 max-w-xl hidden md:block">
            "Every gathering leaves behind more than photographs. It leaves behind history."
          </p>
        </div>
        <a href="/archive"
          className="hidden md:block bg-[#C99A2E] text-[#11100C] hover:bg-[#E7D5A4] border-2 border-[#11100C] px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase transition-colors shadow-[4px_4px_0px_#11100C] shrink-0">
          ARCHIVE → VIEW MORE
        </a>
      </div>

      {/* MOBILE: 2-column photo grid */}
      <div className="mobile-archive-grid lg:hidden w-full px-4 pt-36 pb-16">
        <p className="font-serif italic text-xs text-[#E7D5A4]/80 mb-6">
          "Every gathering leaves behind more than photographs."
        </p>
        <div className="grid grid-cols-2 gap-6">
          {gallery.map((photo, i) => (
            <div key={photo.id} className="mobile-archive-photo">
              <PhotoCard photo={photo} i={i} isLast={false} />
            </div>
          ))}
        </div>
        {/* VIEW MORE ARCHIVE card — mobile standalone card at bottom */}
        <div className="mobile-archive-photo mt-10 mx-auto max-w-[260px] -rotate-1"
          style={{
            background: 'linear-gradient(150deg, #EEE4C8 0%, #E3D4AC 60%, #D8C99A 100%)',
            border: '2px solid #11100C',
            boxShadow: '6px 6px 0px rgba(17,16,12,0.7)',
            padding: '16px',
          }}>
          <div className="relative mb-3">
            <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 w-20 h-[14px] rotate-[-1deg]"
              style={{ background: 'rgba(201,154,46,0.5)', border: '1px solid rgba(160,120,20,0.3)' }} />
          </div>
          <div className="font-mono text-[9px] font-bold text-[#C99A2E] tracking-[0.25em] uppercase mb-2 mt-1">THE ARCHIVE</div>
          <div className="border-t border-[#11100C]/25 mb-3" />
          <p className="font-serif italic text-[11px] text-[#2A1A0E] leading-snug opacity-90 mb-4">
            More stories, photographs and memories from Tangy Sessions.
          </p>
          <a href="/archive"
            className="block w-full text-center font-mono text-[10px] font-bold tracking-[0.18em] uppercase bg-[#C99A2E] text-[#11100C] border border-[#11100C] py-2 transition-colors"
            style={{ boxShadow: '3px 3px 0px #11100C' }}>
            VIEW MORE ARCHIVE →
          </a>
        </div>
      </div>

      {/* DESKTOP: pinned horizontal scrub track */}
      <div className="archive-track hidden lg:flex items-center gap-24 pl-[30vw] pr-[20vw] relative z-10 will-change-transform">
        {gallery.map((photo, i) => (
          <div key={photo.id} className="shrink-0 w-[400px]">
            <PhotoCard photo={photo} i={i} isLast={i === gallery.length - 1} />
          </div>
        ))}
      </div>
    </section>
  );
};
