import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { NotebookGridPattern } from '../ui/BackgroundDecorations';

export const Manifesto = () => {
  const sectionRef = useGSAPContext((ctx) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        end: 'bottom 25%',
        scrub: 0.5
      }
    });

    tl.fromTo('.manifesto-newspaper', 
      { scale: 0.85, opacity: 0, y: 80 },
      { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
    );

  }, []);

  return (
    <section ref={sectionRef} id="manifesto" className="relative w-full h-screen bg-[#E7D5A4] text-[#11100C] overflow-hidden flex items-center justify-center border-t-8 border-[#11100C] p-6 md:p-12">
      
      {/* NOISE & AGED HANDMADE PAPER FIBER TEXTURE */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-multiply pointer-events-none z-10" />

      {/* MUSEUM ARCHIVE NOTEBOOK GRID PATTERN */}
      <NotebookGridPattern opacity={0.07} />

      {/* 4% OPACITY HYDERABAD STEPWELL ARCHWAY WATERMARK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] mix-blend-multiply select-none z-5">
        <svg width="600" height="600" viewBox="0 0 100 100" fill="none" stroke="#11100C" strokeWidth="0.8">
          <path d="M 10 90 L 10 50 A 40 40 0 0 1 90 50 L 90 90 Z" />
          <path d="M 20 90 L 20 55 A 30 30 0 0 1 80 55 L 80 90 Z" />
          <path d="M 30 90 L 30 60 A 20 20 0 0 1 70 60 L 70 90 Z" />
        </svg>
      </div>

      {/* CROP MARKS & PRINT REGISTRATION CROSSES */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#B94717] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // ARCHIVE NO. 1974-M
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#11100C]/50 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        HYDERABAD HERITAGE DOC // 33⅓ RPM
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#11100C]/50 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: ALIGNED ✦ MASTER PRINT
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#C99A2E] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        PROPERTY OF TANGY SESSIONS
      </div>

      {/* 1975 NEWSPAPER / MUSEUM MANIFESTO DOCUMENT */}
      <div className="manifesto-newspaper relative w-full max-w-[1100px] bg-[#F5E9C9] border-4 border-[#11100C] p-6 md:p-14 shadow-[20px_20px_0px_#11100C] z-10">
        
        {/* COFFEE STAIN GRAPHIC ACCENT */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-[14px] border-[#5A2B15]/20 opacity-30 pointer-events-none mix-blend-multiply rotate-12" />

        {/* MASKING TAPE AT TOP CENTER */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-[rgba(231,213,164,0.85)] rotate-[-1deg] border border-black/30 z-30 pointer-events-none" />

        {/* Newspaper Header Bar */}
        <div className="flex justify-between items-center border-b-2 border-[#11100C] pb-3 mb-6 font-mono text-[10px] md:text-xs font-bold tracking-[0.25em] uppercase">
          <span>TANGY ARCHIVE // MUSEUM EXHIBIT</span>
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

          {/* Archival Photo Frame with Paper Clip */}
          <div className="relative bg-[#11100C] p-2 border-2 border-[#11100C] shadow-md rotate-[-3deg]">
            <div className="absolute -top-3 left-4 w-3 h-9 border-2 border-slate-700 rounded-full z-30 pointer-events-none" />
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

        {/* Newspaper Footer Stamp & Archival Note */}
        <div className="mt-8 pt-4 border-t-2 border-[#11100C] flex justify-between items-center font-mono text-[10px] font-bold">
          <span>✎ "Every room has a memory." // FILED UNDER: CULTURAL PRESERVATION</span>
          <span className="border border-[#5A120D] text-[#5A120D] px-2.5 py-1 rotate-[-5deg] bg-[#5A120D]/10">DO NOT DISCARD ✦</span>
        </div>

      </div>

    </section>
  );
};
