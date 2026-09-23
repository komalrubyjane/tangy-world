import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { TextileBorderStrip, HandDrawnUnderline, HandDrawnCircle } from '../ui/CulturalMotifs';
import { TapeStrip } from '../ui/BackgroundDecorations';
import { RangoliDecoration, PatternBackground } from '../ui/RetroAssets';

export const TangyTalks = () => {
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

    tl.from('.talks-title .char', {
      y: 100,
      opacity: 0,
      stagger: 0.05,
      ease: 'back.out(1.7)'
    }).from('.talks-desc', {
      opacity: 0,
      y: 20,
      duration: 0.5
    }, '-=0.5');
  }, []);

  const title = "TANGY TALKS";

  return (
    <section ref={sectionRef} id="talks" className="scene relative w-full h-screen overflow-hidden bg-[#0D0A08] isolate">

      {/* UNDERGROUND-POSTER DIAGONAL COLOR BLOCKS — two overlapping riso-style bands, */}
      {/* asymmetric rather than centered, standing in for the flat brand gradient. */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(100deg, #0D0A08 0%, #0D0A08 30%, #4C1210 30%, #4C1210 68%, #0D0A08 68%, #0D0A08 100%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-0 opacity-80 mix-blend-screen"
        style={{ background: 'linear-gradient(100deg, transparent 28.5%, #D91E18 28.5%, #D91E18 30%, transparent 30%, transparent 68%, #D81B73 68%, #D81B73 69.5%, transparent 69.5%)' }}
        aria-hidden="true"
      />
      {/* large halftone dot panel filling the right third — real print-graphic texture, */}
      {/* not a faint overlay. */}
      <div
        className="absolute inset-y-0 right-0 z-0 w-[42%] opacity-25 mix-blend-screen pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #ECDCAF 38%, transparent 40%)', backgroundSize: '13px 13px' }}
        aria-hidden="true"
      />

      {/* REAL BANDHANI PHOTOGRAPH — the supplied textile reference, low-opacity full-bleed */}
      <PatternBackground category="bandhani" index={2} size="cover" blend="normal" className="z-0" />

      {/* GIANT REAL RANGOLI PHOTOGRAPH — bleeds off the top-right corner, the actual */}
      {/* supplied reference image rather than a generated pattern. */}
      <div className="absolute -top-[16vw] -right-[12vw] w-[52vw] h-[52vw] max-w-none opacity-[0.18] animate-[spin_130s_linear_infinite] pointer-events-none z-0">
        <RangoliDecoration index={0} spin={false} className="w-full h-full" />
      </div>

      {/* TORN POSTER EDGE FRAME */}
      <div className="absolute inset-[10px] sm:inset-[18px] z-10 border-2 border-[#D19A24]/45 pointer-events-none" />

      {/* REAL VINTAGE POSTER FRAGMENT — a taped physical scrap pinned in the corner, */}
      {/* the underground-flyer-pasted-on-a-wall feeling this section wants. */}
      <TextileBorderStrip className="absolute top-0 left-0 right-0 z-10" height={10} colorA="#D19A24" colorB="#0D0A08" />
      <TextileBorderStrip className="absolute bottom-0 left-0 right-0 z-10" height={10} colorA="#D19A24" colorB="#0D0A08" />

      {/* CROP MARK LABEL — same archival-metadata language used across the other flagship */}
      {/* sections, so this reads as one series. */}
      <div className="absolute top-6 left-6 md:left-9 font-mono text-[9px] text-[#D19A24] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] SIDE B // TAKE 01
      </div>

      {/* ASYMMETRIC CONTENT BLOCK — left-anchored, not centered, with an oversized outline */}
      {/* edition numeral bleeding behind the title like a magazine feature spread. */}
      <div className="relative z-20 h-full w-full flex flex-col justify-center px-[7vw] md:px-[9vw]">

        <span
          className="absolute top-[8%] right-[6%] md:right-[10%] font-display font-black leading-none text-transparent pointer-events-none select-none"
          style={{ fontSize: 'clamp(120px,22vw,340px)', WebkitTextStroke: '2px rgba(217,30,24,0.35)' }}
          aria-hidden="true"
        >
          02
        </span>

        <div className="relative inline-block mb-3">
          <TapeStrip className="absolute -top-2 -left-3 w-14 h-4 -rotate-6" />
          <p className="eyebrow-mono text-tangy-cream text-left">EPISODE 02 — CONVERSATIONS THAT MATTER</p>
          <HandDrawnCircle color="#D19A24" className="absolute -inset-x-3 -inset-y-2 opacity-40 pointer-events-none" />
        </div>

        <h2 className="talks-title relative flex text-left text-[clamp(46px,9.5vw,130px)] font-display font-black text-tangy-paper leading-[0.88] overflow-visible -rotate-1 origin-left">
          <span className="absolute inset-0 flex -z-10 text-[#D81B73] opacity-40 translate-x-[8px] -translate-y-[5px] mix-blend-screen pointer-events-none select-none" aria-hidden="true">
            {title.split('').map((char, i) => (
              <span key={i} className="inline-block">{char === ' ' ? ' ' : char}</span>
            ))}
          </span>
          {title.split('').map((char, i) => (
            <span key={i} className="char inline-block">
              {char === ' ' ? ' ' : char}
            </span>
          ))}
        </h2>

        <HandDrawnUnderline color="#D19A24" className="w-44 h-3 mt-2 ml-1 opacity-80" />

        <p className="talks-desc mt-7 font-mono text-xs tracking-widest text-tangy-gold max-w-[380px] text-left leading-relaxed">
          BEYOND THE MUSIC, WE EXPLORE THE MINDS BEHIND THE ART. DEEP DIVES, STORIES, AND SHARED EXPERIENCES.
        </p>

        <button className="talks-desc mt-10 self-start px-8 py-3 -rotate-1 border-2 border-tangy-cream bg-[#0D0A08]/60 text-tangy-cream font-mono text-[10px] tracking-[.3em] shadow-[4px_4px_0_rgba(217,30,24,0.55)] hover:bg-tangy-cream hover:text-tangy-black transition-colors" data-cursor="LISTEN">
          LISTEN TO PODCAST →
        </button>
      </div>
    </section>
  );
};
