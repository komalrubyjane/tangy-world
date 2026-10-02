import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { pastMemories } from '../../data/mock/archive';
import { archiveItems } from '../../data/mockData';
import { RetroGrain, LotusStamp } from '../../components/ui/RetroAssets';
import { PageCrumbs, SectionNav } from '../../components/layout/SectionNav';
import { usePageMeta } from '../../hooks/usePageMeta';

export const PastMemoriesPage = () => {
  usePageMeta({ title: 'Past Memories', description: 'Moments from past Tangy Sessions.' });
  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono selection:bg-[#C89D35] selection:text-[#11100C] overflow-x-hidden printNoise">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="relative z-10">
          <PageCrumbs />
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            PAST MEMORIES // PHYSICAL ARTEFACTS &amp; FIELD DOCUMENTS
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-9xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            PAST<br/>MEMORIES
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            MOMENTS AND ARTEFACTS PRESERVED FROM SESSIONS PAST, HELD IN THE HYDERABAD ARCHIVE.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="font-mono text-[10px] text-[#C99A2E] font-bold uppercase tracking-[0.3em] mb-6 border-b border-[#C99A2E]/30 pb-2">
          MEMORY REEL // {pastMemories.length} PRESERVED FRAMES
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-14">
          {pastMemories.map((mem, mi) => (
            <figure key={mem.id} className="relative bg-[#1A1510] border border-[#E7D5A4]/15 p-1.5 sm:p-2">
              <RetroGrain index={mi % 2} opacity={0.12} blend="overlay" />
              <div className="relative w-full aspect-square bg-black overflow-hidden mb-1.5">
                <img src={mem.image} alt={mem.caption} className="w-full h-full object-cover filter grayscale sepia-[0.25] contrast-125" />
              </div>
              <figcaption className="relative font-mono text-[8px] sm:text-[9px] text-[#E7D5A4]/70 leading-tight">{mem.caption}</figcaption>
            </figure>
          ))}
        </div>

        <div className="font-mono text-[10px] text-[#C99A2E] font-bold uppercase tracking-[0.3em] mb-6 border-b border-[#C99A2E]/30 pb-2">
          PHYSICAL ARCHIVE OBJECTS
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
          {archiveItems.map((item, ii) => (
            <div key={item.id} className="relative bg-[#EFE2C0] paperTexture text-[#11100C] border-2 border-[#11100C] p-4 sm:p-6 shadow-[4px_4px_0px_#11100C] sm:shadow-[4px_4px_0px_#11100C] flex gap-4 items-start overflow-hidden">
              <RetroGrain index={ii % 2} opacity={0.1} blend="overlay" />
              
              <div className="relative w-20 sm:w-28 flex-shrink-0 border-2 border-[#11100C] overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full aspect-[3/4] object-cover filter grayscale sepia-[0.4]" />
                <LotusStamp index={ii} bg="transparent" border="#C99A24" className="absolute -bottom-2 -right-2 w-7 h-7 shadow-md -rotate-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[8px] sm:text-[9px] font-bold text-[#B94717] uppercase tracking-wider mb-1">{item.category} // {item.year}</div>
                <h3 className="display text-base sm:text-xl text-[#11100C] mb-2 leading-tight">{item.title}</h3>
                <p className="font-mono text-[10px] sm:text-xs text-[#B94717] font-bold uppercase mb-1">{item.headline}</p>
                <p className="font-mono text-[9px] sm:text-[10px] text-[#11100C]/75 leading-relaxed">{item.details}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-[#211915] printNoise border-t-8 border-[#11100C] px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold block mb-4">EXPLORE MORE OF THE ARCHIVE</span>
        <SectionNav section="Archive" />
      </section>

      <Footer />
    </div>
  );
};
