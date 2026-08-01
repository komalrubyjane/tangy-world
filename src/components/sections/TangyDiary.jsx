import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { diaryEntries } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { 
  NotebookGridPattern, 
  TapeStrip, 
  PaperClip,
  PressedFlower,
  PerformerPassStub
} from '../ui/BackgroundDecorations';

export const TangyDiary = () => {
  const { playSFX } = useAudio();

  const sectionRef = useGSAPContext((ctx) => {
    const pages = gsap.utils.toArray('.scrapbook-flip-page');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=260%',
        scrub: 0.6,
        pin: true,
        anticipatePin: 1
      }
    });

    // Initial States
    gsap.set('.diary-hero-container', { scale: 0.95, rotateZ: 0, y: 0 });
    gsap.set('.book-cover-front', { rotateY: 0, opacity: 1, zIndex: 40 });
    gsap.set('.book-interior', { opacity: 0, scale: 0.95 });

    // Initialize all interior flip pages stacked flat (rotateY: 0deg)
    pages.forEach((page, index) => {
      gsap.set(page, { 
        rotateY: 0, 
        transformOrigin: 'left center', 
        zIndex: pages.length - index,
        display: 'flex'
      });
    });

    // SCROLL STEP 1: DIARY ROTATES SLIGHTLY, LIFTS & CAMERA ZOOMS IN (FIRST SCROLL)
    tl.to('.diary-hero-container', {
      scale: 1.04,
      rotateZ: -2.5,
      y: -15,
      duration: 0.25,
      ease: 'power1.inOut'
    }, 0)

    // SCROLL STEP 2: COVER SLOWLY ROTATES OPEN & TRANSITIONS TO FIRST SPREAD (SECOND SCROLL)
      .to('.book-interior', { 
        opacity: 1, 
        scale: 1, 
        duration: 0.25, 
        ease: 'power2.out' 
      }, 0.25)
      .to('.book-cover-front', { 
        rotateY: -140, 
        opacity: 0, 
        duration: 0.30, 
        ease: 'power2.inOut',
        onStart: () => playSFX('pageTurn')
      }, 0.25)

    // SCROLL STEP 3+: PHYSICAL PAGE TURNS INSIDE DIARY
      .to('.diary-hero-container', {
        scale: 1.08,
        rotateZ: 0,
        y: 0,
        duration: 0.20,
        ease: 'power1.out'
      }, 0.55);

    pages.forEach((page, i) => {
      if (i < pages.length - 1) {
        tl.to(page, {
          rotateY: -180,
          duration: 0.35,
          ease: 'power2.inOut',
          onStart: () => playSFX('pageTurn'),
          onUpdate: function() {
            if (this.progress() > 0.5) {
              gsap.set(page, { zIndex: i + 1 });
            } else {
              gsap.set(page, { zIndex: pages.length - i });
            }
          }
        }, 0.55 + i * 0.25);
      }
    });

  }, []);

  return (
    <section ref={sectionRef} id="diary" className="relative w-full h-screen bg-[#1C0E08] text-[#E7D5A4] overflow-hidden flex items-center justify-center border-t-8 border-[#11100C] p-4 md:p-8 perspective-[2000px]">
      
      {/* FILM GRAIN, WARM MUSEUM SPOTLIGHT & DUST PARTICLES */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-multiply pointer-events-none z-10" />
      <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.96)] pointer-events-none z-10" />
      
      {/* WARM SPOTLIGHT FALLOFF GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,175,108,0.08)_0%,transparent_70%)] pointer-events-none z-10" />

      {/* TOP ARCHIVE LABEL */}
      <div className="absolute top-6 left-8 font-mono text-[9.5px] md:text-[10.5px] text-[#D19A24] tracking-[0.3em] font-bold uppercase z-20 pointer-events-none opacity-80">
        TANGY SESSIONS // PRIVATE ARCHIVE EST. 2016
      </div>

      {/* CENTER DIARY HERO CONTAINER (65–75% VIEWPORT FOCUS) */}
      <div className="diary-hero-container relative w-[min(540px,82vw)] lg:w-[min(880px,65vw)] h-[min(650px,78vh)] preserve-3d mx-auto z-20 flex items-center justify-center">

        {/* REALISTIC HARDCOVER JOURNAL FRAME */}
        <div className="absolute inset-0 bg-[#23120B] rounded-xl border-4 border-[#100804] shadow-[45px_45px_120px_rgba(0,0,0,0.98)] z-10 flex flex-col justify-center preserve-3d">
          
          {/* Leather Spine & Center Brass Rings */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 md:w-10 bg-[linear-gradient(90deg,#190d07,#351c11_50%,#190d07)] border-x-2 border-[#11100C] z-30 pointer-events-none flex flex-col justify-around items-center py-6 shadow-2xl">
            <div className="w-5 h-2.5 rounded-full border-2 border-[#C99A2E] bg-black shadow-md" />
            <div className="w-5 h-2.5 rounded-full border-2 border-[#C99A2E] bg-black shadow-md" />
            <div className="w-5 h-2.5 rounded-full border-2 border-[#C99A2E] bg-black shadow-md" />
            <div className="w-5 h-2.5 rounded-full border-2 border-[#C99A2E] bg-black shadow-md" />
          </div>

          {/* Hanging Woven Bookmark Ribbon */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-3.5 h-16 bg-[#7C2D18] border-x border-[#11100C] rounded-b-md shadow-xl z-20 pointer-events-none" />

          {/* CLOSED LEATHER FRONT COVER (MATCHING REFERENCE IMAGE EXACTLY!) */}
          <div className="book-cover-front absolute inset-0 bg-[#23120B] rounded-xl border-4 border-[#100804] border-r-[14px] border-b-[14px] border-r-[#D6C19A] border-b-[#C2B08B] shadow-[45px_45px_120px_rgba(0,0,0,0.98)] z-40 origin-left flex flex-col items-center justify-between p-8 md:p-12 text-center preserve-3d">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-35 mix-blend-overlay pointer-events-none" />

            {/* Worn Leather Edges & Faded Gold Corner Details */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#C99A2E]/50" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#C99A2E]/50" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#C99A2E]/50" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#C99A2E]/50" />

            {/* Header Embossed Text */}
            <div className="font-mono text-[10px] md:text-xs text-[#D19A24]/90 font-bold tracking-[0.35em] uppercase z-10 pt-2">
              <div>TANGY SESSIONS</div>
              <div className="text-[8.5px] tracking-[0.25em] opacity-75 mt-0.5">HYDERABAD · EST. 2016</div>
            </div>

            {/* Dried Flower Sprig with Masking Tape on Left Side of String */}
            <PressedFlower className="absolute top-[42%] left-7 -translate-y-1/2 -rotate-12 z-30 scale-90" />

            {/* Horizontal Jute Twine String Wrapped Twice around Book */}
            <div className="absolute top-[46%] left-0 right-0 h-4 -translate-y-1/2 border-t-2 border-b-2 border-[#8C6B41]/90 pointer-events-none z-20 flex items-center justify-end pr-6">
              <div className="w-9 h-9 rounded-full border-2 border-[#8C6B41] flex items-center justify-center font-bold text-sm text-[#8C6B41] bg-[#23120B]">
                ⌘
              </div>
            </div>

            {/* Faded Gold Cursive Calligraphic Title: Tangy Diary */}
            <div className="relative z-10 my-auto flex flex-col items-center">
              <h3 className="font-serif italic text-6xl md:text-8xl text-[#E7D5A4] font-normal leading-none tracking-normal drop-shadow-2xl">
                Tangy
              </h3>
              <h4 className="font-serif italic text-5xl md:text-7xl text-[#E7D5A4] font-normal leading-none tracking-normal drop-shadow-2xl -mt-2">
                Diary
              </h4>
            </div>

            {/* Aged Paper Card Snippet at Bottom Center */}
            <div className="relative bg-[#E7D5A4] text-[#11100C] p-3 md:p-4 border border-[#11100C] shadow-lg font-mono text-[9px] md:text-[10px] font-bold z-10 w-4/5 max-w-[320px] mb-2 rotate-[-1deg]">
              <div className="border-b border-[#11100C]/30 pb-1 tracking-widest uppercase text-center text-[#7C2D18]">
                NOTES. MOMENTS. MEMORIES.
              </div>
              <p className="font-serif italic text-xs text-[#11100C] my-1 text-center font-normal leading-tight">
                A RECORD OF EVERYTHING THAT HAPPENED IN BETWEEN THE MUSIC.
              </p>
              <div className="font-bold text-[#7C2D18] tracking-[0.3em] uppercase text-center mt-1 text-[10px]">
                ★ 1974 ★
              </div>
            </div>

          </div>

          {/* INTERIOR SCRAPBOOK WITH 3D TURNING PAGES */}
          <div className="book-interior absolute inset-0 bg-[#11100C] rounded-xl p-3 md:p-6 border-4 border-[#11100C] shadow-[30px_30px_90px_rgba(0,0,0,0.95)] z-10 flex flex-col justify-center preserve-3d">
            
            {/* DYNAMIC 3D TURNING SCRAPBOOK PAGES */}
            {diaryEntries.map((entry, idx) => (
              <div 
                key={entry.id}
                className="scrapbook-flip-page absolute inset-2 md:inset-4 bg-[#F2E5C6] border-2 border-[#11100C] rounded-md shadow-2xl p-4 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-between text-[#11100C] overflow-hidden preserve-3d origin-left backface-hidden"
              >
                {/* SPREAD 1: BANSILALPET STEPWELL */}
                {idx === 0 && (
                  <>
                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-start border-b-2 md:border-b-0 md:border-r-2 border-[#11100C]/20 pb-4 md:pb-0 md:pr-6 relative">
                      <NotebookGridPattern opacity={0.05} />
                      
                      <div className="w-full flex justify-between font-mono text-[9px] font-bold text-[#7C2D18] uppercase border-b border-[#11100C]/20 pb-1.5 mb-2">
                        <span>ENTRY #001</span>
                        <span>{entry.date}</span>
                      </div>

                      <h3 className="font-serif italic text-2xl md:text-3xl text-[#11100C] leading-tight font-bold">
                        Why We Play Inside a Stepwell
                      </h3>

                      <div className="font-mono text-[8.5px] text-[#7C2D18] font-bold my-1 uppercase">
                        DATE: 14 OCT, 2024 | LOCATION: BANSILALPET STEPWELL
                      </div>

                      <p className="font-body text-xs md:text-sm text-[#11100C]/90 leading-relaxed text-justify mb-2">
                        The stepwell echoes before the crowd arrives. Water dripping against 350-year-old stone, acoustic instruments humming without amplification.
                      </p>

                      <div className="bg-[#E7D5A4] p-2 border border-[#11100C] font-serif italic text-xs text-[#3D2517] shadow-sm rotate-[-1.5deg] relative w-4/5">
                        <TapeStrip className="-top-2 left-3 w-14 h-3.5 rotate-[1deg]" />
                        "Acoustic echoes off 350-year-old stone."
                      </div>

                      <div className="relative w-44 bg-[#F5E9C9] p-2 pb-6 shadow-xl border border-[#11100C] rotate-[-4deg] self-center mt-2 group hover:-translate-y-1 transition-transform">
                        <PaperClip className="-top-2 left-2 rotate-[-10deg]" />
                        <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover filter grayscale sepia-[0.35] contrast-125 border border-[#11100C]" />
                        <p className="absolute bottom-1.5 left-2 font-mono text-[7.5px] font-bold text-[#11100C]">
                          BANSILALPET STEPWELL 14.10.24
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-start md:pl-4 relative">
                      <NotebookGridPattern opacity={0.05} />
                      <PressedFlower className="absolute top-2 right-2" />

                      <div className="w-full border-b border-[#11100C]/20 pb-1 mb-2 font-mono text-[9px] font-bold text-[#7C2D18] uppercase">
                        HANDWRITTEN NOTE
                      </div>

                      <p className="font-serif italic text-sm md:text-base text-[#11100C] leading-relaxed mb-3">
                        "The acoustic echo bounced off limestone steps for 2.4 seconds before fading."
                      </p>

                      <PerformerPassStub date="14/10/24" className="mb-3 self-end" />

                      <div className="w-full bg-[#E7D5A4] p-2 border border-[#11100C] font-mono text-[8px] text-[#11100C] flex flex-col gap-0.5">
                        <div className="font-bold text-[#7C2D18] border-b border-[#11100C]/30 pb-0.5 uppercase">SOUND CHECK LOG</div>
                        <div>MIC: RIBBON R44 | PREAMP: TUBE U47</div>
                        <div>REEL: STUDER A80 | TAPE: AMPEX 456</div>
                        <span className="border border-[#7C2D18] text-[#7C2D18] font-bold px-1 py-0.5 self-start mt-1 rotate-[-2deg]">UNRELEASED</span>
                      </div>

                      <div className="relative w-28 bg-[#F5E9C9] p-1.5 pb-4 shadow-lg border border-[#11100C] rotate-[4deg] self-end mt-2">
                        <img src="/media/gallery/tangy2.jpg" alt="Acoustic Setup" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125" />
                      </div>
                    </div>
                  </>
                )}

                {/* SPREAD 2: TARAMATI BARADARI */}
                {idx === 1 && (
                  <>
                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-start border-b-2 md:border-b-0 md:border-r-2 border-[#11100C]/20 pb-4 md:pb-0 md:pr-6 relative">
                      <NotebookGridPattern opacity={0.05} />
                      
                      <div className="w-full flex justify-between font-mono text-[9px] font-bold text-[#7C2D18] uppercase border-b border-[#11100C]/20 pb-1.5 mb-2">
                        <span>ENTRY #002</span>
                        <span>{entry.date}</span>
                      </div>

                      <h3 className="font-serif italic text-2xl md:text-3xl text-[#11100C] leading-tight font-bold">
                        Monsoon Acoustic Sessions
                      </h3>

                      <div className="font-mono text-[8.5px] text-[#7C2D18] font-bold my-1 uppercase">
                        DATE: 21 DEC, 2024 | LOCATION: TARAMATI BARADARI
                      </div>

                      <p className="font-body text-xs md:text-sm text-[#11100C]/90 leading-relaxed text-justify mb-2">
                        When the lights dropped at midnight, 300 people stood completely still under rain-soaked arches. No phones in the air.
                      </p>

                      <div className="bg-[#E7D5A4] p-2 border border-[#11100C] font-serif italic text-xs text-[#3D2517] shadow-sm rotate-[2deg] relative w-4/5">
                        <TapeStrip className="-top-2 left-4 w-14 h-3.5 rotate-[-1deg]" />
                        "300 people stayed till sunrise."
                      </div>

                      <div className="relative w-44 bg-[#F5E9C9] p-2 pb-6 shadow-xl border border-[#11100C] rotate-[3.5deg] self-center mt-2 group hover:-translate-y-1 transition-transform">
                        <PaperClip className="-top-2 right-2 rotate-[12deg]" />
                        <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover filter grayscale sepia-[0.35] contrast-125 border border-[#11100C]" />
                        <p className="absolute bottom-1.5 left-2 font-mono text-[7.5px] font-bold text-[#11100C]">
                          TARAMATI BARADARI 21.12.24
                        </p>
                      </div>
                    </div>

                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-start md:pl-4 relative">
                      <NotebookGridPattern opacity={0.05} />
                      <PressedFlower className="absolute top-2 right-2" />

                      <div className="w-full border-b border-[#11100C]/20 pb-1 mb-2 font-mono text-[9px] font-bold text-[#7C2D18] uppercase">
                        HANDWRITTEN NOTE
                      </div>

                      <p className="font-serif italic text-sm md:text-base text-[#11100C] leading-relaxed mb-3">
                        "Taramati pavilion was built so voice travels 2 miles without amplifiers."
                      </p>

                      <PerformerPassStub date="21/12/24" className="mb-3 self-end" />

                      <div className="w-full bg-[#E7D5A4] p-2 border border-[#11100C] font-mono text-[8px] text-[#11100C] flex flex-col gap-0.5">
                        <div className="font-bold text-[#7C2D18] border-b border-[#11100C]/30 pb-0.5 uppercase">SOUND CHECK LOG</div>
                        <div>MIC: SHURE SM7B | PREAMP: NEVE 1073</div>
                        <div>REEL: NAGRA IV-S | TAPE: TDK SA90</div>
                        <span className="border border-[#7C2D18] text-[#7C2D18] font-bold px-1 py-0.5 self-start mt-1 rotate-[2deg]">LIVE ARCHIVE</span>
                      </div>

                      <div className="relative w-28 bg-[#F5E9C9] p-1.5 pb-4 shadow-lg border border-[#11100C] rotate-[-3deg] self-end mt-2">
                        <img src="/media/gallery/tangy4.jpg" alt="Violin Solo" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125" />
                      </div>
                    </div>
                  </>
                )}

                {/* SPREAD 3: OLD CITY HAVELI */}
                {idx === 2 && (
                  <>
                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-start border-b-2 md:border-b-0 md:border-r-2 border-[#11100C]/20 pb-4 md:pb-0 md:pr-6 relative">
                      <NotebookGridPattern opacity={0.05} />
                      
                      <div className="w-full flex justify-between font-mono text-[9px] font-bold text-[#7C2D18] uppercase border-b border-[#11100C]/20 pb-1.5 mb-2">
                        <span>ENTRY #003</span>
                        <span>{entry.date}</span>
                      </div>

                      <h3 className="font-serif italic text-2xl md:text-3xl text-[#11100C] leading-tight font-bold">
                        Behind the Microphones
                      </h3>

                      <div className="font-mono text-[8.5px] text-[#7C2D18] font-bold my-1 uppercase">
                        DATE: 05 JAN, 2025 | LOCATION: OLD CITY HAVELI | TIME: 03:00 AM
                      </div>

                      <p className="font-body text-xs md:text-sm text-[#11100C]/90 leading-relaxed text-justify mb-2">
                        The artists gathered around the ribbon microphones for an unscripted acoustic jam. Someone pulled out a tanpura, another started a vocal chant. No plan. No setlist. Just the night deciding what to play.
                      </p>

                      <div className="bg-[#E7D5A4] p-2 border border-[#11100C] font-serif italic text-xs text-[#3D2517] shadow-sm rotate-[-1deg] relative w-4/5">
                        <TapeStrip className="-top-2 left-3 w-14 h-3.5 rotate-[2deg]" />
                        "300 people stayed till sunrise."
                      </div>

                      <div className="relative w-48 bg-[#F5E9C9] p-2 pb-6 shadow-2xl border border-[#11100C] rotate-[-2.5deg] self-center mt-2 group hover:-translate-y-1 transition-transform">
                        <PaperClip className="-top-3 left-3 rotate-[-10deg]" />
                        <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover filter grayscale sepia-[0.35] contrast-125 border border-[#11100C]" />
                        <div className="flex justify-between items-center mt-1.5 font-mono text-[7.5px] font-bold text-[#11100C]">
                          <span>OLD CITY HAVELI</span>
                          <span>21.09.75</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-1/2 h-full flex flex-col justify-between items-start md:pl-4 relative">
                      <NotebookGridPattern opacity={0.05} />
                      <PressedFlower className="absolute top-2 right-2" />

                      <div className="w-full border-b border-[#11100C]/20 pb-1 mb-2 font-mono text-[9px] font-bold text-[#7C2D18] uppercase">
                        HANDWRITTEN NOTE
                      </div>

                      <p className="font-serif italic text-sm md:text-base text-[#11100C] leading-relaxed mb-3">
                        "The rain almost ruined the set. Then it became the set."
                      </p>

                      <PerformerPassStub date="21/09/75" className="mb-3 self-end" />

                      <div className="w-full bg-[#E7D5A4] p-2 border border-[#11100C] font-mono text-[8px] text-[#11100C] flex flex-col gap-0.5">
                        <div className="font-bold text-[#7C2D18] border-b border-[#11100C]/30 pb-0.5 uppercase">SOUND CHECK LOG</div>
                        <div>MIC: RIBBON R44 | PREAMP: TUBE U47</div>
                        <div>REEL: STUDER A80 | TAPE: AMPEX 456 | SPEED: 15 IPS</div>
                        <span className="border border-[#7C2D18] text-[#7C2D18] font-bold px-1 py-0.5 self-start mt-1 rotate-[-2deg]">UNRELEASED</span>
                      </div>

                      <div className="relative w-32 bg-[#F5E9C9] p-1.5 pb-4 shadow-lg border border-[#11100C] rotate-[4deg] self-end mt-2">
                        <img src="/media/gallery/tangy9.jpg" alt="Late Night Crowd" className="w-full aspect-[4/3] object-cover filter grayscale contrast-125" />
                      </div>
                    </div>
                  </>
                )}

              </div>
            ))}

          </div>

        </div>

      </div>

    </section>
  );
};
