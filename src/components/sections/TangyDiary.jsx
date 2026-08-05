import { useState } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { diaryEntries } from '../../data/mockData';
import { VintageDiaryShell } from '../ui/VintageDiaryShell';
import { 
  TornNewspaperScrap, 
  InkSplatter, 
  PaperClip, 
  PushPin 
} from '../ui/BackgroundDecorations';

export const TangyDiary = () => {
  const [activeEntryIdx, setActiveEntryIdx] = useState(0);

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

    tl.fromTo('.diary-hero-shell', 
      { scale: 0.82, rotateX: 18, opacity: 0.4 },
      { scale: 1, rotateX: 0, opacity: 1, duration: 1, ease: 'power2.out' }
    );

  }, []);

  const currentEntry = diaryEntries[activeEntryIdx] || diaryEntries[0];

  return (
    <section 
      ref={sectionRef} 
      id="diary" 
      className="relative w-full h-screen bg-[#4B2D22] text-[#D9C6A0] overflow-hidden flex items-center justify-center border-t-8 border-[#3A241A] p-4 md:p-8"
    >
      {/* PAPER GRAIN NOISE & WARM TUNGSTEN GLOW */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-overlay pointer-events-none z-10" />
      <div className="absolute inset-0 tungsten-glow pointer-events-none z-10" />

      {/* TOP ARCHIVE LABEL & READ MORE CTA */}
      <div className="absolute top-6 left-8 right-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 z-20 pointer-events-auto">
        <div>
          <div className="font-mono text-[9.5px] md:text-[10.5px] text-[#9E6D35] tracking-[0.3em] font-bold uppercase opacity-80">
            TANGY SESSIONS // ANTIQUE VINTAGE DIARY ARCHIVE
          </div>
          <p className="font-handwritten text-lg text-[#D9C6A0]">
            "Some stories deserve more than a caption."
          </p>
        </div>
        <a 
          href="/blogs"
          className="bg-[#9E6D35] text-[#35251A] hover:bg-[#D9C6A0] border-2 border-[#35251A] px-3.5 py-1.5 font-mono text-xs font-bold tracking-widest uppercase transition-colors shadow-archival shrink-0"
        >
          TANGY DIARY → READ MORE
        </a>
      </div>

      {/* BACKGROUND DECORATIVE ARCHIVAL OBJECTS */}
      <TornNewspaperScrap className="absolute top-16 left-6 w-44 hidden md:block opacity-35" />
      <InkSplatter className="bottom-12 right-12 w-36 h-36 opacity-30" />
      <PaperClip className="top-12 right-1/3" />
      <PushPin className="top-16 left-1/4" />

      {/* ------------------------------------------------------------- */}
      {/* 70% VIEWPORT REUSABLE VINTAGE DIARY SHELL                       */}
      {/* ------------------------------------------------------------- */}
      <div className="diary-hero-shell relative w-full flex items-center justify-center z-20">
        <VintageDiaryShell 
          isCoverOpen={true} 
          className="shadow-archival"
        >
          {/* TWO-PAGE OPEN SPREAD INSIDE VINTAGE SHELL */}
          <div className="w-full h-full bg-[#D9C6A0] text-[#35251A] p-4 md:p-8 rounded-md flex flex-col md:flex-row gap-6 relative overflow-hidden">
            
            {/* PAPER NOISE LAYER */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-multiply pointer-events-none" />

            {/* LEFT PAGE: HEADING, ENTRY METADATA & TEXT */}
            <div className="flex-1 flex flex-col justify-between relative z-10 border-b md:border-b-0 md:border-r border-[#35251A]/20 pb-4 md:pb-0 md:pr-6">
              <div>
                <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#7A2B24] uppercase tracking-wider mb-2">
                  <span>ENTRY NO. 0{activeEntryIdx + 1}</span>
                  <span>{currentEntry.date}</span>
                </div>

                <h3 className="font-poster text-3xl md:text-5xl text-[#35251A] leading-none mb-3 uppercase">
                  {currentEntry.title}
                </h3>

                <p className="font-serif-book text-sm md:text-base leading-relaxed text-[#35251A]/90 italic mb-4">
                  "{currentEntry.excerpt}"
                </p>
              </div>

              {/* ENTRY SELECTOR TABS AT BOTTOM OF PAGE */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#35251A]/20">
                <span className="font-mono text-[8px] font-bold uppercase text-[#35251A]/60">PAGES:</span>
                {diaryEntries.slice(0, 4).map((entry, idx) => (
                  <button
                    key={entry.id}
                    onClick={() => setActiveEntryIdx(idx)}
                    className={`px-2 py-0.5 font-mono text-[9px] font-bold border ${
                      idx === activeEntryIdx 
                        ? 'bg-[#7A2B24] text-[#D9C6A0] border-[#35251A]' 
                        : 'bg-[#CBB38C] text-[#35251A] border-[#35251A]/40 hover:bg-[#D9C6A0]'
                    }`}
                  >
                    0{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT PAGE: SCANNED POLAROID PHOTO & HANDWRITTEN FIELD NOTES */}
            <div className="flex-1 flex flex-col justify-between relative z-10 md:pl-2">
              <div>
                <div className="relative bg-[#CBB38C] p-2 border-2 border-[#35251A] shadow-md rotate-[1.5deg] mb-4">
                  <img 
                    src={currentEntry.image || "/media/gallery/tangy1.jpg"} 
                    alt={currentEntry.title} 
                    className="w-full aspect-[4/3] object-cover scanned-photo border border-[#35251A]" 
                  />
                  <div className="font-mono text-[7.5px] text-[#35251A] font-bold tracking-wider mt-1.5">
                    ✎ HYDERABAD FIELD PHOTO // ARCHIVE 1974
                  </div>
                </div>

                <p className="font-handwritten text-lg md:text-xl text-[#35251A] leading-snug">
                  "The stepwell echoes like an ancient auditorium. Notes hang in the air long after the strings stop."
                </p>
              </div>

              <div className="text-right pt-2">
                <a 
                  href={`/blogs#entry-${currentEntry.id}`}
                  className="font-mono text-[10px] font-bold text-[#7A2B24] uppercase tracking-widest hover:underline"
                >
                  READ FULL ENTRY →
                </a>
              </div>
            </div>

          </div>
        </VintageDiaryShell>
      </div>

    </section>
  );
};
