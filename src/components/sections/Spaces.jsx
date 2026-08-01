import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';

export const Spaces = () => {
  const sectionRef = useGSAPContext((ctx) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        end: 'bottom 25%',
        scrub: 0.5
      }
    });

    tl.to('.heritage-title', { 
      scale: 1.5, 
      opacity: 0, 
      ease: 'power2.inOut',
      duration: 1 
    }, 0)
    
    .fromTo('.heritage-bg', 
      { scale: 1, filter: 'contrast(110%) brightness(75%)' },
      { scale: 1.25, filter: 'contrast(125%) brightness(95%)', ease: 'none', duration: 2.5 }, 0
    )

    .fromTo('.heritage-card', 
      { opacity: 0, y: 80, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 1 }, 1.2
    );

  }, []);

  return (
    <section ref={sectionRef} id="spaces" className="relative w-full h-screen overflow-hidden bg-[#59613A]">
      
      <img 
        src="/media/gallery/tngy7.jpg" 
        alt="Bansilalpet Stepwell" 
        loading="eager"
        decoding="async"
        className="heritage-bg absolute inset-0 w-full h-full object-cover origin-center pointer-events-none" 
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#11100C]/80 via-[#59613A]/40 to-[#11100C]/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-multiply pointer-events-none" />

      {/* Typography */}
      <div className="heritage-title absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-4 text-center">
        <p className="font-mono text-tangy-mustard text-[11px] md:text-xs tracking-[0.4em] uppercase mb-4 font-bold">
          ARCHITECTURAL RESONANCE // 1970s ARCHIVE
        </p>
        <h2 className="display text-6xl md:text-[9vw] leading-[0.85] tracking-tighter text-[#E3D4AC] drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] ink-bleed">
          WHERE<br/>
          <span className="italic text-tangy-mustard font-normal">HERITAGE</span><br/>
          MEETS MUSIC.
        </h2>
      </div>

      {/* Heritage Details Card */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none px-4">
        <div className="heritage-card bg-[#E3D4AC] p-8 md:p-14 border-4 border-[#11100C] text-center max-w-2xl pointer-events-auto opacity-0 shadow-[20px_20px_0px_#11100C] text-[#11100C]">
          <p className="font-mono text-[10px] md:text-[11px] tracking-[0.3em] text-tangy-orange mb-4 font-bold uppercase">17TH CENTURY MONUMENT</p>
          <h3 className="display text-4xl md:text-6xl text-[#11100C] mb-6 ink-bleed">BANSILALPET<br/>STEPWELL</h3>
          <p className="font-body text-[#11100C]/90 text-base md:text-lg leading-relaxed mb-8 border-l-2 border-tangy-orange pl-4">
            Resurrected through acoustic sub-frequencies and community gathering. We don't build stages; we collaborate with ancient stone.
          </p>
          <div className="font-mono text-[10px] tracking-widest text-[#11100C] border-t-2 border-[#11100C] pt-4 font-bold uppercase flex justify-between">
            <span>HYDERABAD · INDIA</span>
            <span>SESSION 014</span>
          </div>
        </div>
      </div>

    </section>
  );
};
