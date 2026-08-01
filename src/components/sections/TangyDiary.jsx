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
  TornNewspaperScrap,
  CassetteTapeGraphic,
  SoundWaveGraphic
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
    <section ref={sectionRef} id="diary" className="relative w-full h-screen bg-[#3B2016] text-[#E7D5A4] overflow-hidden flex items-center justify-center border-t-8 border-[#11100C] p-4 md:p-10 perspective-[2000px]">
      
      {/* HANDMADE PAPER FIBER TEXTURE & VIGNETTE */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-multiply pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.85)] pointer-events-none z-10" />

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
        <div className="book-cover-front absolute inset-0 bg-[#23120B] rounded-xl border-8 border-[#11100C] shadow-[40px_40px_110px_rgba(0,0,0,0.95)] z-40 origin-left flex flex-col justify-between p-8 md:p-16 text-center preserve-3d">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-35 mix-blend-overlay pointer-events-none" />

          {/* Embossed Antique Brass Corners */}
          <div className="absolute top-3 left-3 w-9 h-9 border-t-4 border-l-4 border-[#C99A2E]" />
          <div className="absolute top-3 right-3 w-9 h-9 border-t-4 border-r-4 border-[#C99A2E]" />
          <div className="absolute bottom-3 left-3 w-9 h-9 border-b-4 border-l-4 border-[#C99A2E]" />
          <div className="absolute bottom-3 right-3 w-9 h-9 border-b-4 border-r-4 border-[#C99A2E]" />

          {/* Masking Tape Snippet Holding Vintage Photo on Cover */}
          <TapeStrip className="top-8 right-16 w-24 h-6 rotate-[-12deg]" />
          <div className="absolute top-10 right-14 w-28 bg-[#E7D5A4] p-1.5 pb-6 border border-[#11100C] shadow-xl rotate-[-5.5deg] hidden md:block">
            <img src="/media/gallery/tangy1.jpg" alt="Stepwell Cover Snippet" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125 border border-[#11100C]" />
            <span className="font-mono text-[7px] text-[#11100C] font-bold block mt-1">FIG 01. COVER</span>
          </div>

          <div className="border-b-2 border-[#C99A2E]/50 pb-4 font-mono text-xs text-[#C99A2E] font-bold tracking-[0.3em] uppercase relative z-10">
            PRIVATE ARCHIVE // RESTRICTED ACCESS NO. 1974-D
          </div>

          <div className="relative z-10 my-auto">
            <h3 className="display text-5xl md:text-8xl text-[#E7D5A4] tracking-tighter ink-bleed drop-shadow-2xl">
              TANGY<br/>DIARY
            </h3>
            <p className="font-mono text-xs text-[#C99A2E] tracking-[0.4em] uppercase mt-4 font-bold border-y border-[#C99A2E]/40 py-2 inline-block px-6 bg-black/50 backdrop-blur-xs">
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

          {/* DYNAMIC 3D TURNING SCRAPBOOK PAGES WITH UNIQUE ASYMMETRICAL LAYOUTS */}
          {diaryEntries.map((entry, idx) => (
            <div 
              key={entry.id}
              className="scrapbook-flip-page absolute inset-3 md:inset-6 bg-[#E7D5A4] border-2 border-[#11100C] rounded-lg shadow-2xl p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-between text-[#11100C] overflow-hidden preserve-3d origin-left backface-hidden"
            >
              {/* ------------------------------------------------------------- */}
              {/* SPREAD 1: BANSILALPET STEPWELL (POLAROID & TICKET STUB)       */}
              {/* ------------------------------------------------------------- */}
              {idx === 0 && (
                <>
                  {/* LEFT PAGE */}
                  <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-center border-b-2 md:border-b-0 md:border-r-2 border-[#11100C]/20 pb-6 md:pb-0 md:pr-8 relative">
                    <PaperClip className="top-2 left-4 rotate-[-15deg]" />
                    
                    <div className="w-full flex justify-between font-mono text-[10px] font-bold text-[#B94717] uppercase border-b border-[#11100C]/20 pb-2 mb-4 pl-6">
                      <span>SCRAPBOOK VOL. 01</span>
                      <span>{entry.date}</span>
                    </div>

                    {/* Main Polaroid Photo Mat */}
                    <div className="relative w-full max-w-[340px] bg-[#F5E9C9] p-3 pb-10 shadow-[18px_18px_45px_rgba(0,0,0,0.8)] border border-[#11100C] rotate-[-3.5deg] group hover:-translate-y-1 hover:rotate-0 transition-transform duration-300">
                      <TapeStrip className="-top-3 left-1/2 -translate-x-1/2 w-24 h-5 rotate-[4.2deg]" />
                      <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover filter grayscale sepia-[0.35] contrast-125 border border-[#11100C]" />
                      <p className="absolute bottom-2.5 left-3 font-mono text-[9px] font-bold text-[#11100C]">
                        ✎ {entry.location}
                      </p>
                      <span className="absolute bottom-2.5 right-3 font-mono text-[8px] text-[#B94717] font-bold border border-[#B94717] px-1.5 py-0.5">
                        TICKET #09100
                      </span>
                    </div>

                    <div className="w-full mt-4 font-mono text-[9px] text-[#11100C]/70 tracking-widest flex justify-between uppercase">
                      <span>35MM FILM STUFF</span>
                      <span>ENTRY #001</span>
                    </div>
                  </div>

                  {/* RIGHT PAGE */}
                  <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-start md:pl-4 relative">
                    <div className="absolute top-2 right-2 border-2 border-[#C2272A] text-[#C2272A] px-2.5 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase rotate-[-7deg] opacity-85 pointer-events-none">
                      CLASSIFIED LOG ✦
                    </div>

                    <div>
                      <span className="font-mono text-[10px] font-bold text-[#C99A2E] bg-[#11100C] text-[#E7D5A4] px-2 py-0.5 tracking-widest uppercase mb-3 inline-block">
                        RESTRICTED FILE NO. 1974-D
                      </span>
                      
                      <h3 className="display text-3xl md:text-5xl text-[#11100C] mb-4 leading-none ink-bleed">
                        {entry.title.toUpperCase()}
                      </h3>

                      <p className="font-body text-sm md:text-base text-[#11100C]/90 leading-relaxed border-l-4 border-[#B94717] pl-4 italic mb-6">
                        "{entry.content}"
                      </p>
                    </div>

                    {/* Handwritten Annotation Note Taped to Page */}
                    <div className="relative w-full p-3 bg-[#F5E9C9] border border-[#11100C] shadow-md font-mono text-[9.5px] text-[#5A120D] font-bold flex justify-between items-center rotate-[1.5deg]">
                      <TapeStrip className="-top-2 left-4 w-16 h-4 rotate-[-2deg]" />
                      <span>✎ "Soundcheck lasted till 2 AM."</span>
                      <span className="border border-[#5A120D] px-2 py-0.5 rotate-[-3deg]">33⅓ RPM</span>
                    </div>
                  </div>
                </>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SPREAD 2: TARAMATI BARADARI (NEWSPAPER SCRAP & PERFORMER PASS) */}
              {/* ------------------------------------------------------------- */}
              {idx === 1 && (
                <>
                  {/* LEFT PAGE */}
                  <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-center border-b-2 md:border-b-0 md:border-r-2 border-[#11100C]/20 pb-6 md:pb-0 md:pr-8 relative">
                    <div className="w-full flex justify-between font-mono text-[10px] font-bold text-[#5A120D] uppercase border-b border-[#11100C]/20 pb-2 mb-4">
                      <span>SCRAPBOOK VOL. 02</span>
                      <span>{entry.date}</span>
                    </div>

                    {/* Overlapping Photo Mat & Newspaper Fragment */}
                    <div className="relative w-full max-w-[340px] flex flex-col items-center">
                      <TornNewspaperScrap className="absolute -top-4 -left-4 w-44 z-20 rotate-[-5deg]" />
                      
                      <div className="relative w-full bg-[#F5E9C9] p-3 pb-10 shadow-[18px_18px_45px_rgba(0,0,0,0.8)] border border-[#11100C] rotate-[3.2deg] group hover:-translate-y-1 hover:rotate-0 transition-transform duration-300 z-10">
                        <TapeStrip className="-top-3 right-4 w-20 h-5 rotate-[-3deg]" />
                        <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover filter grayscale sepia-[0.35] contrast-125 border border-[#11100C]" />
                        <p className="absolute bottom-2.5 left-3 font-mono text-[9px] font-bold text-[#11100C]">
                          ✎ {entry.location}
                        </p>
                        <span className="absolute bottom-2.5 right-3 font-mono text-[8px] text-[#5A120D] font-bold border border-[#5A120D] px-1.5 py-0.5">
                          STAGE PASS #02
                        </span>
                      </div>
                    </div>

                    <div className="w-full mt-4 font-mono text-[9px] text-[#11100C]/70 tracking-widest flex justify-between uppercase">
                      <span>HYDERABAD HERITAGE DOC</span>
                      <span>ENTRY #002</span>
                    </div>
                  </div>

                  {/* RIGHT PAGE */}
                  <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-start md:pl-4 relative">
                    <div className="absolute top-2 right-2 border-2 border-[#5A120D] text-[#5A120D] px-2.5 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase rotate-[6deg] opacity-85 pointer-events-none">
                      FILED UNDER: MONSOON NOCTURNE ✦
                    </div>

                    <div>
                      <span className="font-mono text-[10px] font-bold text-[#E7D5A4] bg-[#5A120D] px-2 py-0.5 tracking-widest uppercase mb-3 inline-block">
                        PERFORMER PASS FILE
                      </span>
                      
                      <h3 className="display text-3xl md:text-5xl text-[#11100C] mb-4 leading-none ink-bleed">
                        {entry.title.toUpperCase()}
                      </h3>

                      <p className="font-body text-sm md:text-base text-[#11100C]/90 leading-relaxed border-l-4 border-[#5A120D] pl-4 italic mb-6">
                        "{entry.content}"
                      </p>
                    </div>

                    {/* Stenciled Library Checkout Note */}
                    <div className="relative w-full p-3 bg-[#F5E9C9] border border-[#11100C] shadow-md font-mono text-[9.5px] text-[#B94717] font-bold flex justify-between items-center rotate-[-2deg]">
                      <TapeStrip className="-top-2 left-6 w-18 h-4 rotate-[2deg]" />
                      <span>✎ "300 people stayed till sunrise."</span>
                      <span className="border border-[#B94717] px-2 py-0.5 rotate-[3deg]">REOPENED 2025</span>
                    </div>
                  </div>
                </>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SPREAD 3: OLD CITY HAVELI (CASSETTE GRAPHIC & SOUND WAVE)     */}
              {/* ------------------------------------------------------------- */}
              {idx === 2 && (
                <>
                  {/* LEFT PAGE */}
                  <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-center border-b-2 md:border-b-0 md:border-r-2 border-[#11100C]/20 pb-6 md:pb-0 md:pr-8 relative">
                    <PaperClip className="top-2 right-4 rotate-[14deg]" />

                    <div className="w-full flex justify-between font-mono text-[10px] font-bold text-[#C99A2E] uppercase border-b border-[#11100C]/20 pb-2 mb-4">
                      <span>SCRAPBOOK VOL. 03</span>
                      <span>{entry.date}</span>
                    </div>

                    {/* Cassette Tape & Polaroid Presentation */}
                    <div className="relative w-full max-w-[340px] flex flex-col items-center">
                      <CassetteTapeGraphic className="absolute -top-5 right-2 w-36 z-20 rotate-[4deg]" />

                      <div className="relative w-full bg-[#F5E9C9] p-3 pb-10 shadow-[18px_18px_45px_rgba(0,0,0,0.8)] border border-[#11100C] rotate-[-2.8deg] group hover:-translate-y-1 hover:rotate-0 transition-transform duration-300 z-10">
                        <TapeStrip className="-top-3 left-4 w-20 h-5 rotate-[-2deg]" />
                        <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover filter grayscale sepia-[0.35] contrast-125 border border-[#11100C]" />
                        <p className="absolute bottom-2.5 left-3 font-mono text-[9px] font-bold text-[#11100C]">
                          ✎ {entry.location}
                        </p>
                        <span className="absolute bottom-2.5 right-3 font-mono text-[8px] text-[#C99A2E] bg-[#11100C] text-[#E7D5A4] px-1.5 py-0.5">
                          TAPE REEL #03
                        </span>
                      </div>
                    </div>

                    <div className="w-full mt-4 font-mono text-[9px] text-[#11100C]/70 tracking-widest flex justify-between uppercase">
                      <span>ANALOG TAPE REEL</span>
                      <span>ENTRY #003</span>
                    </div>
                  </div>

                  {/* RIGHT PAGE */}
                  <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-start md:pl-4 relative">
                    <SoundWaveGraphic color="#B94717" opacity={0.18} className="absolute right-2 top-10 w-44 h-44 pointer-events-none" />

                    <div className="absolute top-2 right-2 border-2 border-[#C99A2E] text-[#C99A2E] bg-[#11100C] px-2.5 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase rotate-[-4deg] opacity-90 pointer-events-none">
                      UNRELEASED TAPE LOG ✦
                    </div>

                    <div>
                      <span className="font-mono text-[10px] font-bold text-[#11100C] bg-[#C99A2E] px-2 py-0.5 tracking-widest uppercase mb-3 inline-block">
                        FIELD NOTEBOOK FILE #04
                      </span>
                      
                      <h3 className="display text-3xl md:text-5xl text-[#11100C] mb-4 leading-none ink-bleed">
                        {entry.title.toUpperCase()}
                      </h3>

                      <p className="font-body text-sm md:text-base text-[#11100C]/90 leading-relaxed border-l-4 border-[#C99A2E] pl-4 italic mb-6">
                        "{entry.content}"
                      </p>
                    </div>

                    {/* Handwritten Lyrics Quote Card */}
                    <div className="relative w-full p-3 bg-[#F5E9C9] border border-[#11100C] shadow-md font-mono text-[9.5px] text-[#11100C] font-bold flex justify-between items-center rotate-[1.8deg]">
                      <TapeStrip className="-top-2 left-4 w-16 h-4 rotate-[-1deg]" />
                      <span>✎ "Water speaks in whispers."</span>
                      <span className="border border-[#11100C] px-2 py-0.5 rotate-[-2deg]">UNSOLICITED JAM</span>
                    </div>
                  </div>
                </>
              )}

            </div>
          ))}

        </div>

      </div>

    </section>
  );
};
