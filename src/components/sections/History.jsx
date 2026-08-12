import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { useAudio } from '../../audio/AudioContext';
import { ArchiveStamp } from '../ui/ArchiveStamp';
import { PaperTape } from '../ui/PaperTape';

const CHRONOLOGY_DATA = [
  {
    year: '2016',
    title: 'WHERE IT ALL BEGAN',
    subtitle: 'THE FIRST TANGY GATHERING',
    venue: 'HYDERABAD // SECRET BASEMENT',
    description: 'Born out of a refusal to let music stay generic. 40 people, two subwoofers, and a cassette deck in a subterranean room.',
    image: '/media/gallery/tangy1.jpg',
    archiveNo: 'NO. 001',
    bg: '#E7D5A4',
    text: '#11100C',
    accent: '#5A120D',
    format: 'BEGINNING'
  },
  {
    year: '2017–2018',
    title: 'THE MOVEMENT GROWS',
    subtitle: 'UNDERGROUND SOUNDSCAPES',
    venue: 'HERITAGE COURTYARDS',
    description: 'Word spread through physical tickets and hand-printed fliers. The crowd grew from 40 to 400 midnight listeners.',
    image: '/media/gallery/tabgy2.jpg',
    archiveNo: 'NO. 004',
    bg: '#C99A2E',
    text: '#11100C',
    accent: '#B94717',
    format: 'SCRAPBOOK'
  },
  {
    year: '2019',
    title: 'BANSILALPET STEPWELL',
    subtitle: 'HERITAGE RESONANCE',
    venue: 'BANSILALPET / HYDERABAD',
    description: 'We collaborated with ancient stone for the first time. Transforming a forgotten 17th-century stepwell into a living stage.',
    image: '/media/gallery/tngy7.jpg',
    archiveNo: 'NO. 008',
    bg: '#B94717',
    text: '#E7D5A4',
    accent: '#C99A2E',
    format: 'POSTER'
  },
  {
    year: '2020',
    title: 'THE WORLD WENT QUIET',
    subtitle: 'PAUSE IN THE ARCHIVE',
    venue: 'SILENT STAGES',
    description: 'The stages were empty, but the sub-frequencies kept playing in private archives.',
    image: '/media/gallery/tangy4.jpg',
    archiveNo: 'NO. 010',
    bg: '#11100C',
    text: '#E7D5A4',
    accent: '#5A120D',
    format: 'QUIET'
  },
  {
    year: '2021–2022',
    title: 'THE RETURN TO STONE',
    subtitle: 'ACOUSTIC RECOVERY',
    venue: 'HERITAGE MONUMENTS',
    description: 'Doors reopened. 300 listeners gathered under solstice skies to hear sub-bass echo off 300-year-old limestone walls.',
    image: '/media/gallery/tangy3.jpg',
    archiveNo: 'NO. 014',
    bg: '#5A120D',
    text: '#E7D5A4',
    accent: '#C99A2E',
    format: 'RETURN'
  },
  {
    year: '2023',
    title: 'ANALOGUE FILM ERA',
    subtitle: '35MM CONTACT SHEETS',
    venue: 'PAN-INDIA SESSIONS',
    description: 'Every session documented on 35mm film. Raw contact prints capturing musicians in unscripted midnight jams.',
    image: '/media/gallery/tangy8.jpg',
    archiveNo: 'NO. 018',
    bg: '#11100C',
    text: '#E7D5A4',
    accent: '#B94717',
    format: 'FILMSTRIP'
  },
  {
    year: '2024',
    title: 'THE YEAR IN SOUND',
    subtitle: 'EDITORIAL MAGAZINE COVERAGE',
    venue: 'HYDERABAD // CULTURAL ARCHIVE',
    description: 'Tangy Sessions featured across independent music publications as a benchmark for heritage acoustic preservation.',
    image: '/media/gallery/tangy5.jpg',
    archiveNo: 'NO. 022',
    bg: '#C99A2E',
    text: '#11100C',
    accent: '#5A120D',
    format: 'MAGAZINE'
  },
  {
    year: '2025',
    title: 'POSTER WALL ERA',
    subtitle: 'SOLD OUT CONCERT SERIES',
    venue: 'STEPWELL ACOUSTICS',
    description: 'Tangy Sessions Vol. 1, Vol. 2 & Solstice sold out completely within 48 hours of ticket release.',
    image: '/media/gallery/tangy9.jpg',
    archiveNo: 'NO. 028',
    bg: '#B94717',
    text: '#E7D5A4',
    accent: '#C99A2E',
    format: 'POSTER_WALL'
  },
  {
    year: '2026',
    title: 'THE PRESENT ERA',
    subtitle: 'THE STORY IS STILL BEING WRITTEN',
    venue: 'HYDERABAD / GLOBAL',
    description: 'ARCHIVE STATUS: RECORDING ● Join us for the next chapter in subterranean sound.',
    image: '/media/gallery/tangy10.jpg',
    archiveNo: 'NO. 032',
    bg: '#41261B',
    text: '#E7D5A4',
    accent: '#C99A2E',
    format: 'PRESENT'
  }
];

export const History = () => {
  const { playSFX } = useAudio();

  const sectionRef = useGSAPContext((ctx) => {
    const eraBlocks = gsap.utils.toArray('.chronology-era-block');

    eraBlocks.forEach((block, index) => {
      gsap.fromTo(block.querySelector('.bg-year-text'),
        { scale: 0.7, opacity: 0 },
        { 
          scale: 1, 
          opacity: 0.15, 
          ease: 'power2.out',
          scrollTrigger: {
            trigger: block,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 0.5
          }
        }
      );

      gsap.fromTo(block.querySelector('.era-card'),
        { y: 80, opacity: 0, rotation: index % 2 === 0 ? -4 : 4 },
        { 
          y: 0, 
          opacity: 1, 
          rotation: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: block,
            start: 'top 75%'
          }
        }
      );

      const stamp = block.querySelector('.era-stamp');
      if (stamp) {
        gsap.fromTo(stamp,
          { scale: 1.8, opacity: 0, rotation: -20 },
          { 
            scale: 1, 
            opacity: 0.85, 
            rotation: -8,
            duration: 0.5,
            ease: 'bounce.out',
            scrollTrigger: {
              trigger: block,
              start: 'top 60%',
              onEnter: () => playSFX('ticketClick')
            }
          }
        );
      }
    });

  }, []);

  const handleNextSession = () => {
    document.querySelector('#sessions')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} id="history" className="relative w-full bg-[#11100C] text-[#E7D5A4] overflow-hidden border-t-8 border-[#5A120D]">
      
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-overlay pointer-events-none" />

      {/* GIANT FADED BACKGROUND TYPOGRAPHY "HISTORY" AT 4% OPACITY */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.04]">
        <span className="display text-[25vw] leading-none text-[#E7D5A4] uppercase">HISTORY</span>
      </div>

      {/* CROP MARKS & ARCHIVE METADATA */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#C99A2E] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // EXHIBITION PANEL
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#E7D5A4]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        33⅓ RPM STEREO // 10 YEARS ARCHIVE
      </div>

      {/* SECTION HEADER */}
      <div className="relative w-full py-28 md:py-36 px-6 text-center bg-[#E7D5A4] text-[#11100C] border-b-8 border-[#11100C] flex flex-col items-center justify-center">
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-10">
          <span className="display text-[16vw] md:text-[22vw] leading-none text-[#11100C]">2016—2026</span>
        </div>

        <div className="relative z-10 max-w-4xl">
          <ArchiveStamp text="EXHIBITION PANEL" rotation="-3deg" color="red" className="mb-4" />

          <h2 className="display text-5xl md:text-9xl text-[#11100C] leading-[0.85] tracking-tighter ink-bleed mb-6">
            ARCHIVE / 2016–2026<br/>
            <span className="italic text-[#B94717] font-normal">THE CHRONOLOGY</span>
          </h2>

          <p className="font-mono text-xs md:text-sm text-[#11100C]/80 tracking-[0.25em] max-w-xl mx-auto uppercase border-t-2 border-[#11100C]/30 pt-4">
            TEN YEARS OF MUSIC, PEOPLE, PLACES & STORIES.
          </p>
        </div>

      </div>

      {/* CONTINUOUS VERTICAL MICROPHONE CABLE TIMELINE */}
      <div className="relative w-full">
        
        <div className="absolute top-0 bottom-0 left-6 md:left-1/2 -translate-x-1/2 w-[3px] bg-[linear-gradient(180deg,#B9471B_0%,#C99A2E_50%,#5A120D_100%)] z-10 shadow-[0_0_15px_rgba(201,154,46,0.3)] pointer-events-none" />

        {/* ERA BLOCKS */}
        {CHRONOLOGY_DATA.map((era, index) => (
          <div 
            key={era.year}
            className="chronology-era-block relative w-full py-16 md:py-36 px-5 md:px-16 flex flex-col items-center justify-center border-b-4 border-[#11100C] overflow-hidden"
            style={{ backgroundColor: era.bg, color: era.text }}
          >
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-multiply pointer-events-none" />

            <div className="bg-year-text absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
              <span 
                className="display text-[25vw] leading-none font-bold tracking-tighter opacity-15"
                style={{ color: era.accent }}
              >
                {era.year}
              </span>
            </div>

            <div className="relative z-20 w-full max-w-[1100px] flex flex-col items-center">
              
              <div 
                className="w-8 h-8 rounded-full border-4 border-[#11100C] mb-8 flex items-center justify-center shadow-xl font-mono text-[9px] font-bold z-30"
                style={{ backgroundColor: era.accent, color: '#E7D5A4' }}
              >
                ✦
              </div>

              {/* FORMAT 1: 2016 — THE BEGINNING */}
              {era.format === 'BEGINNING' && (
                <div className="era-card w-full max-w-[340px] sm:max-w-2xl bg-[#F5E9C9] p-6 md:p-14 border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C] sm:shadow-[20px_20px_0px_#11100C] text-[#11100C] relative text-center">
                  <ArchiveStamp text={`ENTRY ${era.archiveNo}`} rotation="-8deg" color="red" className="era-stamp absolute -top-4 right-6 z-30" />
                  <span className="font-mono text-xs font-bold text-[#B94717] tracking-widest uppercase block mb-2">{era.year} // {era.venue}</span>
                  <h3 className="display text-4xl md:text-6xl text-[#11100C] mb-4 ink-bleed">{era.title}</h3>
                  <div className="my-6 relative inline-block bg-[#11100C] p-2 border-2 border-[#11100C] shadow-lg rotate-[-3deg]">
                    <PaperTape rotation="-2deg" width="w-16" className="absolute -top-3 left-1/3 z-20" />
                    <img src={era.image} alt={era.title} className="w-full max-w-[320px] aspect-[4/3] object-cover filter grayscale sepia-[0.4]" />
                    <span className="absolute bottom-2 left-3 font-mono text-[8px] text-[#E7D5A4]">✎ the beginning.</span>
                  </div>
                  <p className="font-body text-base md:text-lg text-[#11100C]/90 leading-relaxed max-w-lg mx-auto italic border-t border-[#11100C]/20 pt-4">
                    "{era.description}"
                  </p>
                </div>
              )}

              {/* FORMAT 2: 2017-2018 — SCRAPBOOK COLLAGE */}
              {era.format === 'SCRAPBOOK' && (
                <div className="era-card w-full max-w-[340px] sm:max-w-4xl flex flex-col md:flex-row items-center gap-6 sm:gap-10 bg-[#E7D5A4] p-6 md:p-12 border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C] sm:shadow-[20px_20px_0px_#11100C] text-[#11100C] relative">
                  <ArchiveStamp text={`FILED ${era.archiveNo}`} rotation="5deg" color="orange" className="era-stamp absolute top-4 right-4 z-30" />
                  <div className="w-full md:w-1/2 relative bg-[#11100C] p-3 shadow-xl border-2 border-[#11100C] rotate-[-2deg]">
                    <img src={era.image} alt={era.title} className="w-full aspect-[4/3] object-cover filter grayscale contrast-125" />
                  </div>
                  <div className="w-full md:w-1/2 flex flex-col">
                    <span className="font-mono text-xs font-bold text-[#B94717] tracking-widest uppercase mb-1">{era.year}</span>
                    <h3 className="display text-4xl md:text-5xl text-[#11100C] mb-3 ink-bleed">{era.title}</h3>
                    <p className="font-body text-base text-[#11100C]/90 leading-relaxed italic border-l-4 border-[#B94717] pl-4">
                      "{era.description}"
                    </p>
                  </div>
                </div>
              )}

              {/* FORMAT 3: 2019 — CONCERT POSTER */}
              {era.format === 'POSTER' && (
                <div className="era-card w-full max-w-[340px] sm:max-w-xl bg-[#E7D5A4] p-5 md:p-8 border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C] sm:shadow-[25px_25px_0px_#11100C] text-[#11100C] relative">
                  <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#11100C] border-b-2 border-[#11100C] pb-2 mb-4">
                    <span>TANGY CONCERT SERIES</span>
                    <span>YEAR {era.year}</span>
                  </div>
                  <div className="w-full aspect-[16/9] bg-black overflow-hidden border-2 border-[#11100C] mb-4 relative">
                    <img src={era.image} alt={era.title} className="w-full h-full object-cover filter grayscale contrast-125" />
                    <span className="absolute top-2 right-2 bg-[#5A120D] text-[#E7D5A4] font-mono text-[8px] px-2 py-0.5">BANSILALPET STEPWELL</span>
                  </div>
                  <h3 className="display text-4xl md:text-5xl text-[#11100C] mb-2 ink-bleed">{era.title}</h3>
                  <p className="font-mono text-xs text-[#B94717] font-bold tracking-widest uppercase mb-4">{era.venue}</p>
                  <p className="font-body text-sm md:text-base text-[#11100C]/90 leading-relaxed italic border-t border-[#11100C]/30 pt-3">
                    "{era.description}"
                  </p>
                </div>
              )}

              {/* FORMAT 4: 2020 — THE WORLD WENT QUIET */}
              {era.format === 'QUIET' && (
                <div className="era-card w-full max-w-2xl bg-[#11100C] p-10 md:p-16 border-4 border-[#5A120D] text-center shadow-2xl text-[#E7D5A4] relative">
                  <span className="font-mono text-xs font-bold text-[#5A120D] tracking-[0.4em] uppercase block mb-4">YEAR 2020 // PAUSE</span>
                  <h3 className="display text-5xl md:text-7xl text-[#E7D5A4] mb-4 leading-none ink-bleed">
                    THE WORLD<br/><span className="italic text-[#5A120D]">WENT QUIET.</span>
                  </h3>
                  <div className="my-6 w-16 h-[2px] bg-[#5A120D] mx-auto" />
                  <p className="font-mono text-xs text-[#E7D5A4]/70 tracking-widest uppercase max-w-md mx-auto">
                    "{era.description}"
                  </p>
                </div>
              )}

              {/* FORMAT 5: 2021-2022 — RETURN TO STONE */}
              {era.format === 'RETURN' && (
                <div className="era-card w-full max-w-[340px] sm:max-w-3xl bg-[#F5E9C9] p-6 md:p-12 border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C] sm:shadow-[20px_20px_0px_#11100C] text-[#11100C] relative">
                  <ArchiveStamp text={`RE-OPENED ${era.archiveNo}`} rotation="-6deg" color="dark" className="era-stamp absolute -top-4 left-6 z-30" />
                  <span className="font-mono text-xs font-bold text-[#5A120D] tracking-widest uppercase block mb-2">{era.year}</span>
                  <h3 className="display text-4xl md:text-6xl text-[#11100C] mb-4 ink-bleed">{era.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center border-t-2 border-[#11100C] pt-6">
                    <img src={era.image} alt={era.title} className="w-full aspect-[4/3] object-cover border-2 border-[#11100C] filter grayscale contrast-125" />
                    <p className="font-body text-base text-[#11100C]/90 italic border-l-2 border-[#5A120D] pl-4">
                      "{era.description}"
                    </p>
                  </div>
                </div>
              )}

              {/* FORMAT 6: 2023 — 35MM FILM STRIP */}
              {era.format === 'FILMSTRIP' && (
                <div className="era-card w-full max-w-[340px] sm:max-w-4xl bg-[#11100C] p-5 md:p-10 border-4 border-[#B94717] shadow-2xl text-[#E7D5A4] relative">
                  <div className="flex justify-between font-mono text-[9px] text-[#C99A2E] tracking-[0.3em] uppercase mb-4 border-b border-[#B94717]/40 pb-2">
                    <span>KODAK SAFETY FILM 5063</span>
                    <span>YEAR {era.year}</span>
                    <span>35MM CONTACT STRIP</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="border border-[#E7D5A4]/30 p-2 bg-black">
                      <img src="/media/gallery/tangy8.jpg" className="w-full aspect-[4/3] object-cover filter grayscale" />
                      <span className="font-mono text-[8px] text-[#C99A2E] mt-1 block">FRAME 031</span>
                    </div>
                    <div className="border border-[#E7D5A4]/30 p-2 bg-black">
                      <img src="/media/gallery/tangy1.jpg" className="w-full aspect-[4/3] object-cover filter grayscale" />
                      <span className="font-mono text-[8px] text-[#C99A2E] mt-1 block">FRAME 032</span>
                    </div>
                    <div className="border border-[#E7D5A4]/30 p-2 bg-black hidden md:block">
                      <img src="/media/gallery/tangy3.jpg" className="w-full aspect-[4/3] object-cover filter grayscale" />
                      <span className="font-mono text-[8px] text-[#C99A2E] mt-1 block">FRAME 033</span>
                    </div>
                  </div>
                  <h3 className="display text-4xl md:text-5xl text-[#E7D5A4] mb-2 ink-bleed">{era.title}</h3>
                  <p className="font-body text-sm md:text-base text-[#E7D5A4]/90 italic">{era.description}</p>
                </div>
              )}

              {/* FORMAT 7: 2024 — MAGAZINE SPREAD */}
              {era.format === 'MAGAZINE' && (
                <div className="era-card w-full max-w-[340px] sm:max-w-4xl bg-[#E7D5A4] p-6 md:p-12 border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C] sm:shadow-[20px_20px_0px_#11100C] text-[#11100C] relative">
                  <span className="font-mono text-xs font-bold text-[#5A120D] tracking-widest uppercase block mb-1">ISSUE 2024 // EDITORIAL</span>
                  <h3 className="display text-5xl md:text-7xl text-[#11100C] mb-6 ink-bleed">{era.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t-2 border-[#11100C] pt-6">
                    <p className="font-body text-base md:text-lg text-[#11100C]/90 leading-relaxed italic border-l-4 border-[#C99A2E] pl-4">
                      "{era.description}"
                    </p>
                    <img src={era.image} alt={era.title} className="w-full aspect-[4/3] object-cover border-2 border-[#11100C] filter grayscale contrast-125" />
                  </div>
                </div>
              )}

              {/* FORMAT 8: 2025 — POSTER WALL */}
              {era.format === 'POSTER_WALL' && (
                <div className="era-card w-full max-w-[340px] sm:max-w-3xl bg-[#E7D5A4] p-6 md:p-12 border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C] sm:shadow-[25px_25px_0px_#11100C] text-[#11100C] relative">
                  <ArchiveStamp text={`SOLD OUT ${era.archiveNo}`} rotation="-4deg" color="orange" className="era-stamp absolute top-4 right-4 z-30" />
                  <span className="font-mono text-xs font-bold text-[#B9471B] tracking-widest uppercase block mb-2">{era.year}</span>
                  <h3 className="display text-4xl md:text-6xl text-[#11100C] mb-4 ink-bleed">{era.title}</h3>
                  <p className="font-body text-base md:text-lg text-[#11100C]/90 leading-relaxed mb-6 italic border-l-4 border-[#B9471B] pl-4">
                    "{era.description}"
                  </p>
                </div>
              )}

              {/* FORMAT 9: 2026 — THE PRESENT ERA */}
              {era.format === 'PRESENT' && (
                <div className="era-card w-full max-w-[340px] sm:max-w-2xl bg-[#E7D5A4] p-6 md:p-14 border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C] sm:shadow-[25px_25px_0px_#11100C] text-[#11100C] relative text-center">
                  <div className="inline-block border-4 border-[#B9471B] text-[#B9471B] font-mono text-xs font-bold tracking-[0.3em] px-4 py-1.5 rotate-[-4deg] mb-6 uppercase">
                    RECORDING ● NOW IN PROGRESS
                  </div>
                  <h3 className="display text-5xl md:text-7xl text-[#11100C] mb-4 leading-none ink-bleed">
                    THE STORY IS STILL<br/>
                    <span className="italic text-[#B9471B] font-normal">BEING WRITTEN.</span>
                  </h3>
                  <p className="font-mono text-xs text-[#11100C]/80 tracking-widest uppercase mb-8 border-y-2 border-[#11100C]/30 py-3">
                    HYDERABAD / GLOBAL // {era.archiveNo}
                  </p>
                  <button 
                    onClick={handleNextSession}
                    className="btn-ticket"
                  >
                    NEXT SESSION → BOOK TICKETS
                  </button>
                </div>
              )}

            </div>

          </div>
        ))}

      </div>

    </section>
  );
};
