import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';

export const Manifesto = () => {
  const sectionRef = useGSAPContext((ctx) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=250%',
        scrub: 0.5,
        pin: true,
        anticipatePin: 1
      }
    });

    tl.fromTo('.manifesto-newspaper', 
      { scale: 0.85, opacity: 0, y: 80 },
      { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
    );

  }, []);

  return (
    <section ref={sectionRef} id="manifesto" className="relative w-full h-screen bg-[#E7D5A4] text-[#11100C] overflow-hidden flex items-center justify-center border-t-8 border-[#11100C] p-6 md:p-12">
      
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-multiply pointer-events-none" />

      {/* 1975 NEWSPAPER / MUSIC MANIFESTO CONTAINER */}
      <div className="manifesto-newspaper relative w-full max-w-[1100px] bg-[#F5E9C9] border-4 border-[#11100C] p-6 md:p-14 shadow-[20px_20px_0px_#11100C] z-10">
        
        {/* Newspaper Header Bar */}
        <div className="flex justify-between items-center border-b-2 border-[#11100C] pb-3 mb-6 font-mono text-[10px] md:text-xs font-bold tracking-[0.25em] uppercase">
          <span>TANGY ARCHIVE // MANIFESTO</span>
          <span>ISSUE NO. 02</span>
          <span>HYDERABAD · EST. 2016</span>
        </div>

        {/* Headline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b-2 border-[#11100C] pb-8 mb-8">
          <div className="md:col-span-2">
            <h2 className="display text-6xl md:text-[8vw] text-[#11100C] leading-[0.85] tracking-tighter ink-bleed">
              WHY<br/>TANGY?
            </h2>
            <p className="font-mono text-sm md:text-base font-bold text-[#B94717] tracking-widest mt-4 uppercase">
              WE DON'T JUST HOST SHOWS. WE CREATE MEMORIES.
            </p>
          </div>

          {/* Archival Photo Frame */}
          <div className="relative bg-[#11100C] p-2 border-2 border-[#11100C] shadow-md rotate-[-3deg]">
            <img src="/media/gallery/tangy4.jpg" alt="Tangy Crowd" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125" />
            <span className="absolute bottom-1 right-2 font-mono text-[8px] text-[#E7D5A4]">FIG 02.1</span>
          </div>
        </div>

        {/* Multi-Column Newspaper Article */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-body text-base md:text-lg leading-relaxed text-[#11100C]/90 text-justify">
          <p className="border-l-2 border-[#B94717] pl-4">
            A room became a stage. A stage became a gathering. A gathering became a memory — and the memory kept playing. Tangy Sessions was born out of a refusal to let music stay quiet or generic.
          </p>
          <p className="border-l-2 border-[#C99A2E] pl-4">
            We collaborate with ancient stepwells, heritage architecture, and underground soundscapes to give independent Indian artists a home where every note echoes through history.
          </p>
        </div>

        {/* Newspaper Footer Stamp */}
        <div className="mt-8 pt-4 border-t-2 border-[#11100C] flex justify-between items-center font-mono text-[10px] font-bold">
          <span>FILED UNDER: CULTURAL PRESERVATION</span>
          <span className="border border-[#5A120D] text-[#5A120D] px-2 py-0.5 rotate-[-5deg]">DO NOT DISCARD ✦</span>
        </div>

      </div>

    </section>
  );
};
