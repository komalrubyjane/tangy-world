import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import {
  NotebookGridPattern,
  CassetteTapeGraphic,
  TornNewspaperScrap,
  CoffeeStain
} from '../ui/BackgroundDecorations';
import {
  RisographOffset,
  ArchiveNumber,
  VintageFilmFrame,
  RegistrationMark,
  HandDrawnUnderline,
  TextileBorderStrip,
} from '../ui/CulturalMotifs';
import { RangoliDecoration, LotusStamp, PatternBackground, PosterFragment, RetroGrain } from '../ui/RetroAssets';

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
      <RetroGrain index={0} opacity={0.12} blend="multiply" className="z-10" />

      {/* MUSEUM ARCHIVE NOTEBOOK GRID PATTERN */}
      <NotebookGridPattern opacity={0.07} />

      {/* BANDHANI DOT FIELD — a real textile layer across the section, not a hint */}
      <PatternBackground category="bandhani" index={2} opacity={0.38} size="cover" blend="normal" className="z-0" />

      {/* CASSETTE TAPE ACCENTS */}
      <CassetteTapeGraphic className="absolute top-10 right-10 w-44 hidden md:block" />
      <TornNewspaperScrap className="absolute bottom-12 left-10 w-48 hidden md:block" />
      <CoffeeStain className="-bottom-16 left-1/4 w-52 h-52 rotate-45 pointer-events-none" />

      {/* GIANT OUTLINE ARCHIVE NUMBER — bleeds behind the newspaper card */}
      <ArchiveNumber color="#11100C" size="clamp(140px,22vw,320px)" className="hidden lg:block absolute top-[8%] left-[4%] opacity-[0.14] z-0">02</ArchiveNumber>

      {/* MOBILE — a cropped Rangoli corner + large partially-hidden floral medallion, */}
      {/* the mobile-specific stand-ins for the desktop archive numeral/cassette/torn-paper. */}
      <div className="lg:hidden absolute top-0 right-0 w-[42%] max-w-[170px] aspect-square opacity-[0.14] pointer-events-none z-0">
        <RangoliDecoration index={0} spin={false} className="w-full h-full" />
      </div>
      <div className="lg:hidden absolute -bottom-4 left-3 z-20 w-16">
        <PosterFragment category="illustrations" index={0} rotate={-6} tape={false} />
      </div>

      {/* CROP MARKS & PRINT REGISTRATION CROSSES */}
      <div className="absolute top-4 left-4 font-mono text-[8px] sm:text-[9px] text-[#B94717] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // ARCHIVE NO. 1974-M
      </div>
      <RegistrationMark color="#11100C" className="hidden md:block absolute top-4 right-4 w-6 h-6 opacity-70 z-20 pointer-events-none" />

      {/* TEXTILE BORDER — frames the whole manifesto sheet top and bottom */}
      <TextileBorderStrip className="absolute top-0 left-0 right-0 z-20" height={10} colorA="#B94717" colorB="#11100C" />
      <TextileBorderStrip className="absolute bottom-0 left-0 right-0 z-20" height={10} colorA="#B94717" colorB="#11100C" />

      {/* 1975 NEWSPAPER / MUSEUM MANIFESTO DOCUMENT */}
      <div className="manifesto-newspaper relative w-full max-w-[1100px] bg-[#F5E9C9] border-4 border-[#11100C] p-5 sm:p-8 md:p-14 shadow-[14px_14px_0px_#11100C] sm:shadow-[20px_20px_0px_#11100C] z-10 my-auto">

        {/* COFFEE STAIN GRAPHIC ACCENT */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-[14px] border-[#5A2B15]/20 opacity-30 pointer-events-none mix-blend-multiply rotate-12 hidden sm:block" />

        {/* REAL RISOGRAPH PRINT FRAGMENT — a pinned offset-print scrap, tucked into the */}
        {/* newspaper's own top-right corner. */}
        <div className="hidden md:block absolute -top-6 right-16 w-12 z-20">
          <PosterFragment category="risograph" index={0} rotate={7} tape />
        </div>

        {/* MASKING TAPE AT TOP CENTER */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-[rgba(231,213,164,0.85)] rotate-[-1deg] border border-black/30 z-30 pointer-events-none" />

        {/* CORNER REGISTRATION MARKS ON THE SHEET ITSELF */}
        <RegistrationMark color="#11100C" className="hidden sm:block absolute -top-3 -left-3 w-6 h-6 opacity-40 pointer-events-none" />
        <RegistrationMark color="#11100C" className="hidden sm:block absolute -bottom-3 -right-3 w-6 h-6 opacity-40 pointer-events-none" />

        {/* Newspaper Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-[#11100C] pb-2 sm:pb-3 mb-4 sm:mb-6 font-mono text-[8.5px] sm:text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase gap-1 text-center sm:text-left">
          <span>TANGY ARCHIVE // MUSEUM EXHIBIT</span>
          <span>ISSUE NO. 02</span>
          <span>HYDERABAD · EST. 2016</span>
        </div>

        {/* Headline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center border-b-2 border-[#11100C] pb-6 sm:pb-8 mb-6 sm:mb-8">
          <div className="md:col-span-2 relative">
            <div className="hidden sm:block absolute -top-6 -left-8 w-24 h-24 opacity-[0.16] pointer-events-none -z-10">
              <LotusStamp index={1} border="transparent" bg="transparent" className="w-full h-full" />
            </div>
            <h2 className="display text-5xl sm:text-7xl md:text-[8vw] text-[#11100C] leading-[0.85] tracking-tighter ink-bleed">
              <RisographOffset colors={['#D91E18']} offsets={[[5, -4]]} opacity={0.3}>
                WHY<br/>TANGY?
              </RisographOffset>
            </h2>
            <p className="font-mono text-xs sm:text-sm md:text-base font-bold text-[#B94717] tracking-wider sm:tracking-widest mt-3 sm:mt-4 uppercase">
              WE DON'T JUST HOST SHOWS. WE CREATE MEMORIES.
            </p>
            <HandDrawnUnderline color="#B94717" className="w-40 h-2.5 mt-1 opacity-70" />
          </div>

          {/* Archival Photo Frame with Paper Clip — film-frame sprocket holes sit in the */}
          {/* card's own black padding margin, never over the photo's own pixels. */}
          <div className="relative bg-[#11100C] p-2 border-2 border-[#11100C] shadow-md rotate-[-3deg] max-w-[240px] md:max-w-none mx-auto md:mx-0">
            <VintageFilmFrame color="#11100C" holeColor="#5A2B15" className="opacity-80" />
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
