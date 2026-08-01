import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { diaryEntries } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { 
  NotebookGridPattern, 
  TapeStrip, 
  PushPin, 
  CoffeeStain, 
  PaperClip,
  TornNewspaperScrap
} from '../ui/BackgroundDecorations';

export const TangyDiary = () => {
  const { playSFX } = useAudio();

  const sectionRef = useGSAPContext((ctx) => {
    const pages = gsap.utils.toArray('.scrapbook-flip-page');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=400%',
        scrub: 0.5,
        pin: true,
        anticipatePin: 1
      }
    });

    // Initial States: Closed Cover covers the book
    gsap.set('.book-cover-front', { rotateY: 0, opacity: 1, zIndex: 40 });
    gsap.set('.book-interior', { opacity: 0, scale: 0.95 });

    // Initialize all flip pages stacked flat on the right side (rotateY: 0deg)
    pages.forEach((page, index) => {
      gsap.set(page, { 
        rotateY: 0, 
        transformOrigin: 'left center', 
        zIndex: pages.length - index,
        display: 'flex'
      });
    });

    // STAGE 1: BOOK COVER OPENS ON SCROLL
    tl.to('.book-interior', { opacity: 1, scale: 1, duration: 0.20, ease: 'power2.out' }, 0.05)
      .to('.book-cover-front', { 
        rotateY: -140, 
        opacity: 0, 
        duration: 0.25, 
        ease: 'power2.inOut',
        onStart: () => playSFX('pageTurn')
      }, 0.05);

    // STAGE 2: PHYSICAL 3D PAGE TURNS
    pages.forEach((page, i) => {
      if (i < pages.length - 1) {
        tl.to(page, {
          rotateY: -180,
          duration: 0.45,
          ease: 'power2.inOut',
          onStart: () => playSFX('pageTurn'),
          onUpdate: function() {
            if (this.progress() > 0.5) {
              gsap.set(page, { zIndex: i + 1 });
            } else {
              gsap.set(page, { zIndex: pages.length - i });
            }
          }
        }, 0.25 + i * 0.30);
      }
    });

  }, []);

  return (
    <section ref={sectionRef} id="diary" className="relative w-full h-screen bg-[#41261B] text-[#E7D5A4] overflow-hidden flex items-center justify-center border-t-8 border-[#11100C] p-4 md:p-10 perspective-[2000px]">
      
      {/* HANDMADE PAPER FIBER TEXTURE */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-multiply pointer-events-none" />

      {/* NOTEBOOK GRAPH GRID BACKGROUND UNDERLAY */}
      <NotebookGridPattern opacity={0.06} />

      {/* COFFEE STAIN RING ACCENTS IN BACKGROUND */}
      <CoffeeStain className="-top-12 -left-12 w-56 h-56 rotate-12" />
      <CoffeeStain className="-bottom-16 -right-16 w-64 h-64 rotate-[-45deg]" />

      {/* RED PUSHPIN ACCENT ON TOP EDGE */}
      <PushPin className="top-6 left-1/4" />

      {/* FLOATING VINTAGE MUSICAL OBJECTS */}
      <div className="absolute top-12 left-10 w-24 md:w-36 pointer-events-none z-20 opacity-85 animate-[bounce_4s_ease-in-out_infinite]">
        <img src="/media/violin.png" alt="Acoustic Violin" className="w-full h-full object-contain filter drop-shadow-2xl" />
      </div>

      <div className="absolute bottom-10 right-12 w-28 md:w-44 pointer-events-none z-20 opacity-85">
        <img src="/media/radio.png" alt="Vintage Tube Radio" className="w-full h-full object-contain filter drop-shadow-2xl" />
      </div>

      {/* Section Header */}
      <div className="absolute top-6 left-6 md:top-10 md:left-12 z-20 pointer-events-none">
        <p className="font-mono text-[#D19A24] text-[10px] tracking-[0.3em] font-bold uppercase">PHYSICAL HANDPRINTED SCRAPBOOK // FIELD LOGS</p>
        <h2 className="display text-4xl md:text-6xl text-[#E7D5A4]">THE DIARY</h2>
      </div>

      {/* 3D SCRAPBOOK CONTAINER */}
      <div className="relative w-[min(1100px,94vw)] h-[min(640px,76vh)] preserve-3d">

        {/* CLOSED LEATHER FRONT COVER */}
        <div className="book-cover-front absolute inset-0 bg-[#2A160F] rounded-xl border-8 border-[#11100C] shadow-[35px_35px_100px_rgba(0,0,0,0.95)] z-40 origin-left flex flex-col justify-between p-8 md:p-16 text-center preserve-3d">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay pointer-events-none" />

          {/* Embossed Antique Brass Corners */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-[#C99A2E]" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-[#C99A2E]" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-[#C99A2E]" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-[#C99A2E]" />

          {/* Masking Tape Snippet Holding Vintage Photo on Cover */}
          <TapeStrip className="top-8 right-16 w-24 h-6 rotate-[-12deg]" />
          <div className="absolute top-10 right-14 w-28 bg-[#E7D5A4] p-1.5 pb-6 border border-[#11100C] shadow-lg rotate-[-6deg] hidden md:block">
            <img src="/media/gallery/tangy1.jpg" alt="Stepwell Cover Snippet" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125" />
            <span className="font-mono text-[7px] text-[#11100C] font-bold block mt-1">FIG 01. COVER</span>
          </div>

          <div className="border-b-2 border-[#C99A2E]/50 pb-4 font-mono text-xs text-[#C99A2E] font-bold tracking-[0.3em] uppercase relative z-10">
            PRIVATE ARCHIVE // RESTRICTED ACCESS NO. 1974-D
          </div>

          <div className="relative z-10 my-auto">
            <h3 className="display text-5xl md:text-8xl text-[#E7D5A4] tracking-tighter ink-bleed drop-shadow-2xl">
              TANGY<br/>DIARY
            </h3>
            <p className="font-mono text-xs text-[#C99A2E] tracking-[0.4em] uppercase mt-4 font-bold border-y border-[#C99A2E]/40 py-2 inline-block px-6 bg-black/40 backdrop-blur-xs">
              1974 – 2026 // HANDCRAFTED FIELD LOGS
            </p>
          </div>

          <div className="border-t-2 border-[#C99A2E]/50 pt-4 font-mono text-[10px] text-[#E7D5A4]/70 tracking-widest uppercase flex justify-between items-center relative z-10">
            <span>HYDERABAD · INDIA</span>
            <span className="border-2 border-[#C99A2E] text-[#C99A2E] px-3 py-1 font-bold">SCROLL TO TURN PAGES ↓</span>
          </div>
        </div>

        {/* INTERIOR SCRAPBOOK WITH 3D TURNING PAGES */}
        <div className="book-interior absolute inset-0 bg-[#11100C] rounded-xl p-3 md:p-6 border-4 border-[#11100C] shadow-[30px_30px_90px_rgba(0,0,0,0.95)] z-10 flex flex-col justify-center preserve-3d">
          
          {/* Leather Spine & Center Brass Rings */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 md:w-12 bg-[linear-gradient(90deg,#22140e,#41261b_50%,#22140e)] border-x-2 border-[#11100C] z-30 pointer-events-none hidden md:flex flex-col justify-around items-center py-6">
            <div className="w-6 h-3 rounded-full border-2 border-[#C99A2E] bg-black shadow-md" />
            <div className="w-6 h-3 rounded-full border-2 border-[#C99A2E] bg-black shadow-md" />
            <div className="w-6 h-3 rounded-full border-2 border-[#C99A2E] bg-black shadow-md" />
            <div className="w-6 h-3 rounded-full border-2 border-[#C99A2E] bg-black shadow-md" />
          </div>

          {/* DYNAMIC 3D TURNING SCRAPBOOK PAGES */}
          {diaryEntries.map((entry, idx) => (
            <div 
              key={entry.id}
              className="scrapbook-flip-page absolute inset-3 md:inset-6 bg-[#E7D5A4] border-2 border-[#11100C] rounded-lg shadow-2xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-between text-[#11100C] overflow-hidden preserve-3d origin-left backface-hidden"
            >
              {/* LEFT PAGE */}
              <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-center border-b-2 md:border-b-0 md:border-r-2 border-[#11100C]/20 pb-6 md:pb-0 md:pr-8 relative">
                
                {/* Paper Clip on Left Page */}
                <PaperClip className="top-2 left-4 rotate-[-12deg]" />

                {/* Stenciled Header */}
                <div className="w-full flex justify-between font-mono text-[10px] font-bold text-[#B94717] uppercase border-b border-[#11100C]/20 pb-2 mb-4 pl-6">
                  <span>SCRAPBOOK VOL. 0{entry.id}</span>
                  <span>{entry.date}</span>
                </div>

                {/* Polaroid Photo Presentation with Masking Tape */}
                <div className="relative w-full max-w-[340px] bg-[#F5E9C9] p-3 pb-10 shadow-[15px_15px_40px_rgba(0,0,0,0.8)] border border-[#11100C] rotate-[-2deg]">
                  <TapeStrip className="-top-3 left-1/2 -translate-x-1/2 w-24 h-5 rotate-[2deg]" />
                  <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover filter grayscale sepia-[0.35] contrast-125 border border-[#11100C]" />
                  <p className="absolute bottom-2.5 left-3 font-mono text-[9px] font-bold text-[#11100C]">
                    ✎ {entry.location}
                  </p>
                  <span className="absolute bottom-2.5 right-3 font-mono text-[8px] text-[#B94717] font-bold border border-[#B94717] px-1">
                    FIELD LOG #{String(entry.id).padStart(3, '0')}
                  </span>
                </div>

                {/* Filmstrip Footer Metadata */}
                <div className="w-full mt-4 font-mono text-[9px] text-[#11100C]/70 tracking-widest flex justify-between uppercase">
                  <span>KODAK 35MM SAFETY FILM</span>
                  <span>ENTRY #{String(entry.id).padStart(3, '0')}</span>
                </div>
              </div>

              {/* RIGHT PAGE */}
              <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-start md:pl-4 relative">
                
                {/* Red Archival Stamp */}
                <div className="absolute top-2 right-2 border-2 border-[#C2272A] text-[#C2272A] px-2.5 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase rotate-[-6deg] opacity-80 pointer-events-none">
                  CLASSIFIED LOG ✦
                </div>

                <div>
                  <span className="font-mono text-[10px] font-bold text-[#C99A2E] bg-[#11100C] text-[#E7D5A4] px-2 py-0.5 tracking-widest uppercase mb-3 inline-block">
                    PRIVATE ARCHIVE
                  </span>
                  
                  <h3 className="display text-3xl md:text-5xl text-[#11100C] mb-4 leading-none ink-bleed">
                    {entry.title.toUpperCase()}
                  </h3>

                  <p className="font-body text-sm md:text-base text-[#11100C]/90 leading-relaxed border-l-4 border-[#B94717] pl-4 italic mb-6">
                    "{entry.content}"
                  </p>
                </div>

                {/* Handwritten Annotation Note Card with Tape Strip */}
                <div className="relative w-full p-3 bg-[#F5E9C9] border border-[#11100C] shadow-sm font-mono text-[10px] text-[#5A120D] font-bold flex justify-between items-center rotate-[-1deg]">
                  <TapeStrip className="-top-2 left-4 w-16 h-4 rotate-[1deg]" />
                  <span>HANDWRITTEN NOTE</span>
                  <span className="border border-[#5A120D] px-2 py-0.5 rotate-[-2deg]">─────── 33⅓ RPM ───────</span>
                </div>
              </div>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
};
