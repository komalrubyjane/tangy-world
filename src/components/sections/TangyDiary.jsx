import { useState } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { diaryEntries } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { VintageDiaryShell } from '../ui/VintageDiaryShell';
import { 
  NotebookGridPattern, 
  TapeStrip, 
  PaperClip,
  PressedFlower,
  PerformerPassStub
} from '../ui/BackgroundDecorations';

export const TangyDiary = () => {
  const { playSFX } = useAudio();
  const [isCoverOpen, setIsCoverOpen] = useState(false);

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
    gsap.set('.diary-shell-wrapper', { scale: 0.96, rotateZ: 0, y: 0 });
    gsap.set('.book-cover-front', { rotateY: 0, opacity: 1, zIndex: 40 });
    gsap.set('.book-interior', { opacity: 0, scale: 0.96 });

    // Initialize all interior flip pages stacked flat (rotateY: 0deg)
    pages.forEach((page, index) => {
      gsap.set(page, { 
        rotateY: 0, 
        transformOrigin: 'left center', 
        zIndex: pages.length - index,
        display: 'flex'
      });
    });

    // SCROLL STEP 1: DIARY SHELL TILTS SLIGHTLY & ZOOMS (FIRST SCROLL)
    tl.to('.diary-shell-wrapper', {
      scale: 1.03,
      rotateZ: -2,
      y: -10,
      duration: 0.25,
      ease: 'power1.inOut'
    }, 0)

    // SCROLL STEP 2: COVER ROTATES OPEN TO REVEAL INTERIOR SPREAD (SECOND SCROLL)
      .to('.book-interior', { 
        opacity: 1, 
        scale: 1, 
        duration: 0.25, 
        ease: 'power2.out',
        onStart: () => setIsCoverOpen(true)
      }, 0.25)
      .to('.book-cover-front', { 
        rotateY: -140, 
        opacity: 0, 
        duration: 0.30, 
        ease: 'power2.inOut',
        onStart: () => playSFX('pageTurn')
      }, 0.25)

    // SCROLL STEP 3+: PHYSICAL PAGE TURNS INSIDE SPREAD
      .to('.diary-shell-wrapper', {
        scale: 1.06,
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
      
      {/* FILM GRAIN, WARM MUSEUM SPOTLIGHT & VIGNETTE */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-multiply pointer-events-none z-10" />
      <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.96)] pointer-events-none z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,175,108,0.08)_0%,transparent_70%)] pointer-events-none z-10" />

      {/* TOP ARCHIVE LABEL */}
      <div className="absolute top-6 left-8 font-mono text-[9.5px] md:text-[10.5px] text-[#D19A24] tracking-[0.3em] font-bold uppercase z-20 pointer-events-none opacity-80">
        TANGY SESSIONS // ANTIQUE VINTAGE DIARY ARCHIVE
      </div>

      {/* CENTERPIECE VINTAGE DIARY SHELL (OCCUPIES ~70% VIEWPORT) */}
      <div className="diary-shell-wrapper relative w-full flex items-center justify-center z-20">
        <VintageDiaryShell isCoverOpen={isCoverOpen}>
          
          {/* DYNAMIC 3D TURNING SCRAPBOOK PAGES INSIDE SHELL */}
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

        </VintageDiaryShell>
      </div>

    </section>
  );
};
