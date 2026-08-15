import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { 
  NotebookGridPattern, 
  CassetteTapeGraphic, 
  TornNewspaperScrap, 
  CoffeeStain
} from '../ui/BackgroundDecorations';

export const Manifesto = () => {
  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    if (isMobile) {
      gsap.from('.manifesto-newspaper', {
        opacity: 0,
        y: 40,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 82%',
          toggleActions: 'play none none none',
        }
      });
      return;
    }

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
    <section ref={sectionRef} id="manifesto" 
      className="relative w-full min-h-screen lg:h-screen bg-[#E7D5A4] text-[#11100C] overflow-hidden flex items-center justify-center border-t-8 border-[#11100C] p-4 sm:p-8 md:p-12 py-20 lg:py-0">
      
      {/* NOISE & AGED HANDMADE PAPER FIBER TEXTURE */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-13 mix-blend-multiply pointer-events-none z-10" />

      {/* MUSEUM ARCHIVE NOTEBOOK GRID PATTERN */}
      <NotebookGridPattern opacity={0.07} />

      {/* CASSETTE TAPE ACCENTS */}
      <CassetteTapeGraphic className="absolute top-10 right-10 w-44 hidden md:block" />
      <TornNewspaperScrap className="absolute bottom-12 left-10 w-48 hidden md:block" />
      <CoffeeStain className="-bottom-16 left-1/4 w-52 h-52 rotate-45 pointer-events-none" />

      {/* CROP MARKS & PRINT REGISTRATION CROSSES */}
      <div className="absolute top-4 left-4 font-mono text-[8px] sm:text-[9px] text-[#B94717] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // ARCHIVE NO. 1974-M
      </div>

      {/* 1975 NEWSPAPER / MUSEUM MANIFESTO DOCUMENT */}
      <div className="manifesto-newspaper relative w-full max-w-[1100px] bg-[#F5E9C9] border-4 border-[#11100C] p-5 sm:p-8 md:p-14 shadow-[14px_14px_0px_#11100C] sm:shadow-[20px_20px_0px_#11100C] z-10 my-auto">
        
        {/* COFFEE STAIN GRAPHIC ACCENT */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-[14px] border-[#5A2B15]/20 opacity-30 pointer-events-none mix-blend-multiply rotate-12 hidden sm:block" />

        {/* MASKING TAPE AT TOP CENTER */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-[rgba(231,213,164,0.85)] rotate-[-1deg] border border-black/30 z-30 pointer-events-none" />

        {/* Newspaper Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-[#11100C] pb-2 sm:pb-3 mb-4 sm:mb-6 font-mono text-[8.5px] sm:text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase gap-1 text-center sm:text-left">
          <span>TANGY ARCHIVE // MUSEUM EXHIBIT</span>
          <span>ISSUE NO. 02</span>
          <span>HYDERABAD · EST. 2016</span>
        </div>

        {/* Headline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center border-b-2 border-[#11100C] pb-6 sm:pb-8 mb-6 sm:mb-8">
          <div className="md:col-span-2">
            <h2 className="display text-5xl sm:text-7xl md:text-[8vw] text-[#11100C] leading-[0.85] tracking-tighter ink-bleed">
              WHY<br/>TANGY?
            </h2>
            <p className="font-mono text-xs sm:text-sm md:text-base font-bold text-[#B94717] tracking-wider sm:tracking-widest mt-3 sm:mt-4 uppercase">
              WE DON'T JUST HOST SHOWS. WE CREATE MEMORIES.
            </p>
          </div>

          {/* Archival Photo Frame with Paper Clip */}
          <div className="relative bg-[#11100C] p-2 border-2 border-[#11100C] shadow-md rotate-[-3deg] max-w-[240px] md:max-w-none mx-auto md:mx-0">
            <div className="absolute -top-3 left-4 w-3 h-9 border-2 border-slate-700 rounded-full z-30 pointer-events-none" />
            <img src="/media/gallery/tangy4.jpg" alt="Tangy Crowd" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125" />
            <span className="absolute bottom-1 right-2 font-mono text-[8px] text-[#E7D5A4]">FIG 02.1</span>
          </div>
        </div>

        {/* Multi-Column Newspaper Article */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 font-body text-sm sm:text-base md:text-lg leading-relaxed text-[#11100C]/90 text-left">
          <p className="border-l-2 border-[#B94717] pl-3 sm:pl-4">
            A room became a stage. A stage became a gathering. A gathering became a memory — and the memory kept playing. Tangy Sessions was born out of a refusal to let music stay quiet or generic.
          </p>
          <p className="border-l-2 border-[#C99A2E] pl-3 sm:pl-4">
            We collaborate with ancient stepwells, heritage architecture, and underground soundscapes to give independent Indian artists a home where every note echoes through history.
          </p>
        </div>

        {/* Editorial Storytelling Transition & Contextual CTA */}
        <div className="mt-6 sm:mt-8 pt-4 border-t-2 border-[#11100C] flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-xs font-bold">
          <p className="font-serif italic text-xs sm:text-sm text-[#11100C]/90 text-center sm:text-left">
            "We started with one forgotten stepwell. Today, every performance carries another story."
          </p>
          <a 
            href="/about" 
            className="bg-[#B94717] text-[#E7D5A4] hover:bg-[#11100C] border-2 border-[#11100C] px-4 py-2 font-mono font-bold tracking-widest uppercase transition-colors shadow-[4px_4px_0px_#11100C] shrink-0"
          >
            WHY TANGY → VIEW MORE
          </a>
        </div>

      </div>

    </section>
  );
};
