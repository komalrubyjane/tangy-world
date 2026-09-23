import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { TextileBorderStrip, HandDrawnCircle } from '../ui/CulturalMotifs';
import { PushPin, TapeStrip } from '../ui/BackgroundDecorations';
import { RangoliDecoration, LotusStamp, PatternBackground } from '../ui/RetroAssets';

export const BaodiSangam = () => {
  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: isMobile ? 'top 80%' : 'top top',
        end: isMobile ? '+=50%' : '+=150%',
        scrub: 1,
        pin: !isMobile
      }
    });

    tl.fromTo('.baodi-water',
        { y: '50%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 1 }
      )
      .fromTo('.baodi-text',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        '-=0.5'
      );
  }, []);

  return (
    <section ref={sectionRef} id="baodi" className="scene relative w-full h-screen overflow-hidden bg-tangy-black isolate flex flex-col lg:flex-row">

      {/* LEFT GRAPHIC PANEL — a dominant colour-blocked field carrying the Rangoli and lotus */}
      {/* motifs at real scale, not a background hint. Split-page poster composition instead */}
      {/* of a single centered field. */}
      <div className="relative w-full lg:w-[42%] h-[34%] lg:h-full shrink-0 overflow-hidden bg-[#16323A] border-b-4 lg:border-b-0 lg:border-r-4 border-[#0d1a1f]">
        <PatternBackground category="bandhani" index={1} size="cover" blend="normal" />
        {/* REAL RANGOLI PHOTOGRAPH standing in for the stepwell's concentric ripples */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[74%] aspect-square max-w-none opacity-45 animate-[spin_110s_linear_infinite] pointer-events-none">
          <RangoliDecoration index={1} spin={false} className="w-full h-full" />
        </div>
        <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 w-[26%] max-w-[120px] aspect-square opacity-90">
          <LotusStamp index={0} border="#ECDCAF" bg="transparent" className="w-full h-full" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(0,0,0,0.55)_100%)]" />
        {/* PUSH PIN — pins the panel divider like a physically-assembled poster piece */}
        <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 -right-2 z-20">
          <PushPin />
        </div>
      </div>

      {/* RIGHT CONTENT PANEL */}
      <div className="relative flex-1 h-full overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#1a3642_0%,var(--color-tangy-black)_65%)]" />

        {/* Water reflection effect */}
        <div className="baodi-water absolute bottom-0 left-0 right-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(82,107,128,0.25))] blur-sm" />

        <TextileBorderStrip className="absolute top-0 left-0 right-0 z-10" height={10} colorA="#315D73" colorB="#0d1a1f" />
        <TextileBorderStrip className="absolute bottom-0 left-0 right-0 z-10" height={10} colorA="#315D73" colorB="#0d1a1f" />

        {/* Oversized outline edition numeral, poster-feature style */}
        <span
          className="absolute top-[6%] right-[6%] font-condensed font-black leading-none text-transparent pointer-events-none select-none"
          style={{ fontSize: 'clamp(90px,16vw,220px)', WebkitTextStroke: '2px rgba(95,168,184,0.3)' }}
          aria-hidden="true"
        >
          03
        </span>

        <div className="absolute top-6 right-6 md:right-9 font-mono text-[9px] text-[#5FA8B8] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
          [ ✚ ] FIELD RECORDING // BAODI
        </div>

        {/* REAL CUTOUT FRAGMENT — a physical collage scrap tucked in the corner */}
        

        {/* REAL HALFTONE PRINT FRAGMENT — a screen-printed scrap pinned near the top */}
        <div className="baodi-text relative z-10 h-full flex flex-col items-start justify-center text-left px-[8%] lg:px-[10%]">
          <div className="relative inline-block mb-4">
            <TapeStrip className="absolute -top-2 -left-3 w-14 h-4 rotate-3" />
            <p className="eyebrow-mono text-tangy-dusty-blue">SPECIAL PROJECT — VOL. 03</p>
            <HandDrawnCircle color="#5FA8B8" className="absolute -inset-x-3 -inset-y-2 opacity-40 pointer-events-none" />
          </div>
          <h2 className="relative font-condensed font-black text-[clamp(46px,9vw,130px)] leading-[0.86] text-tangy-cream mb-5 -rotate-1 origin-left">
            <span className="absolute inset-0 text-[#5FA8B8] opacity-35 translate-x-[6px] -translate-y-[4px] mix-blend-screen pointer-events-none select-none -z-10" aria-hidden="true">
              BAODI<br />SANGAM
            </span>
            BAODI<br />SANGAM
          </h2>
          <p className="font-body italic text-lg md:text-xl text-tangy-paper max-w-md border-l-2 border-[#5FA8B8] pl-4">
            Reclaiming the lost stepwells of Hyderabad through art, music, and community.
          </p>
        </div>
      </div>
    </section>
  );
};
