import { useRef } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import { HangingMicrophone } from '../world/HangingMicrophone';
import gsap from 'gsap';
import { EASES } from '../../utils/animations';
import { HandDrawnCircle, HandDrawnArrow, TextileBorderStrip, BandhaniDotField } from '../ui/CulturalMotifs';
import { TapeStrip } from '../ui/BackgroundDecorations';

export const MicDrop = () => {
  const micRef = useRef(null);

  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: isMobile ? 'top 80%' : 'top top',
        end: isMobile ? '+=50%' : '+=160%',
        scrub: 1,
        pin: !isMobile,
        anticipatePin: isMobile ? 0 : 1
      }
    });

    tl.fromTo('.mic-cable', { height: 0 }, { height: 230, duration: 1, ease: 'power2.out' })
      .fromTo('.mic-swing', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: EASES.micDrop }, '<')
      .to('.mic-swing', { rotate: 20, duration: 0.45, ease: EASES.micSwing })
      .to('.mic-swing', { rotate: -14, duration: 0.45, ease: EASES.micSwing })
      .to('.mic-swing', { rotate: 9, duration: 0.35, ease: EASES.micSwing })
      .to('.mic-swing', { rotate: -4, duration: 0.3, ease: EASES.micSwing })
      .to('.mic-swing', { rotate: 0, duration: 0.25, ease: EASES.micSwing })
      .to('.mic-caption', { opacity: 1, duration: 0.5 }, '-=0.5')
      .to('.scene-inner', { opacity: 0, duration: 0.3 }, '+=0.15');
  }, []);

  return (
    <section ref={sectionRef} id="mic" className="scene relative w-full h-screen overflow-hidden bg-[#0D0A08] isolate">

      {/* SAME UNDERGROUND-POSTER SYSTEM AS THE REST OF THE MUSIC TRIO — a diagonal */}
      {/* black/vermilion/magenta colour block instead of a plain radial spotlight, */}
      {/* so all three read as one poster series. */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(-100deg, #0D0A08 0%, #0D0A08 34%, #4C1210 34%, #4C1210 66%, #0D0A08 66%, #0D0A08 100%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-0 opacity-70"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(217,30,24,0.55) 0%, transparent 60%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 left-0 z-0 w-[38%] opacity-20 mix-blend-screen pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #ECDCAF 38%, transparent 40%)', backgroundSize: '12px 12px' }}
        aria-hidden="true"
      />
      <BandhaniDotField color="#D19A24" opacity={0.08} className="z-0" />

      <div className="absolute inset-[10px] sm:inset-[18px] z-10 border-2 border-[#D19A24]/40 pointer-events-none" />
      <TextileBorderStrip className="absolute top-0 left-0 right-0 z-10" height={10} colorA="#D91E18" colorB="#0D0A08" />
      <TextileBorderStrip className="absolute bottom-0 left-0 right-0 z-10" height={10} colorA="#D91E18" colorB="#0D0A08" />

      <div className="absolute top-6 right-6 md:right-9 font-mono text-[9px] text-[#D19A24] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] PLATE 09 // SIDE A
      </div>

      {/* ASYMMETRIC POSTER TYPOGRAPHY — large edition label anchored to one edge, */}
      {/* not centered copy competing with the mic. */}
      <div className="absolute z-10 left-[6%] md:left-[8%] top-[10%] md:top-[12%] pointer-events-none">
        <div className="relative inline-block mb-2">
          <TapeStrip className="absolute -top-2 -left-3 w-14 h-4 -rotate-6" />
          <p className="font-mono text-[10px] md:text-xs tracking-[0.35em] text-[#D19A24] font-bold uppercase">SESSION 09</p>
        </div>
        <h2 className="font-display font-black text-tangy-paper leading-[0.85] text-[clamp(38px,7vw,88px)] -rotate-1 origin-left">
          LIVE<br />DROP
        </h2>
      </div>
      <div className="absolute z-10 right-[6%] md:right-[8%] bottom-[12%] md:bottom-[16%] text-right pointer-events-none">
        <p className="font-mono text-[9px] md:text-[10px] tracking-[0.3em] text-[#ECDCAF]/70 uppercase">HYDERABAD // BANSILALPET STEPWELL</p>
        <p className="font-mono text-[9px] md:text-[10px] tracking-[0.3em] text-[#D91E18] uppercase mt-1">ONE MIC. ONE ROOM. NO RETAKES.</p>
      </div>

      <div className="scene-inner absolute inset-0 z-3">
        <HangingMicrophone forwardRef={micRef} />

        {/* Hand-drawn annotation circling the mic body plus an arrow calling it out — */}
        {/* a printed editor's mark, kept to these two sparing accents. */}
        <HandDrawnCircle
          color="#D19A24"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%-40px)] w-[150px] h-[150px] md:w-[200px] md:h-[200px] opacity-55 pointer-events-none"
        />
        <HandDrawnArrow
          color="#ECDCAF"
          className="absolute top-1/2 left-[calc(50%+90px)] md:left-[calc(50%+120px)] -translate-y-[calc(50%-10px)] w-[90px] md:w-[120px] opacity-70 pointer-events-none -scale-x-100"
        />
      </div>
    </section>
  );
};
