import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { gallery } from '../../data/mockData';
import { 
  TornPaperEdgeTop, 
  NotebookGridPattern, 
  PushPin 
} from '../ui/BackgroundDecorations';

export const Archive = () => {
  const sectionRef = useGSAPContext((ctx) => {
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

    tl.to('.archive-track', {
      xPercent: -70,
      ease: 'none'
    });

    tl.to('.heritage-expand-photo', {
      scale: 8,
      z: 500,
      ease: 'power2.in'
    }, 0.8);

  }, []);

  return (
    <section ref={sectionRef} id="archive" className="relative w-full h-screen bg-[#3A241A] overflow-hidden flex items-center border-t-8 border-[#7A2B24] perspective-[1000px]">
      
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.12] pointer-events-none mix-blend-overlay" />

      {/* TORN PAPER EDGE AT SECTION TOP */}
      <TornPaperEdgeTop fill="#3A241A" />

      {/* NOTEBOOK GRID FRAGMENT UNDERLAY */}
      <div className="absolute top-16 left-1/4 w-72 h-48 opacity-10 pointer-events-none z-0">
        <NotebookGridPattern opacity={0.5} />
      </div>

      {/* PUSHPIN ACCENT */}
      <PushPin className="top-8 left-1/3" />
      <PushPin className="top-12 right-1/4" />

      {/* RUBBER STAMP OVERLAY ACCENT */}
      <div className="absolute bottom-16 right-16 z-20 pointer-events-none border-2 border-[#7A2B24] text-[#7A2B24] px-4 py-1.5 font-mono text-xs font-bold tracking-[0.3em] uppercase rotate-[-8deg] opacity-75">
        CLASSIFIED // ARCHIVAL RECORD ✦
      </div>

      {/* FLOATING VINTAGE MUSICAL OBJECTS */}
      <div className="absolute top-16 right-20 w-28 md:w-40 pointer-events-auto z-20 group cursor-pointer opacity-85">
        <img 
          src="/media/vinyl.png" 
          alt="Spinning Vinyl Record" 
          className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(53,37,26,0.8)] transition-transform duration-700 group-hover:rotate-180" 
        />
        <span className="font-mono text-[7px] text-[#9E6D35] bg-[#35251A] px-1.5 py-0.5 border border-[#9E6D35] absolute -bottom-2 left-2 uppercase">33⅓ RPM STEREO</span>
      </div>

      <div className="absolute bottom-12 left-16 w-32 md:w-48 pointer-events-none z-20 opacity-70">
        <img src="/media/gramophone.png" alt="Vintage Gramophone" className="w-full h-full object-contain filter drop-shadow-2xl" />
      </div>

      {/* Film Registration & Crop Marks */}
      <div className="absolute top-6 left-6 font-mono text-[9px] text-[#9E6D35] tracking-[0.3em] pointer-events-none uppercase">
        ✦ KODAK SAFETY FILM 5063 // 35MM ✦ REC • LIVE • HYDERABAD
      </div>
      <div className="absolute bottom-6 left-6 font-mono text-[9px] text-[#D9C6A0]/40 tracking-[0.3em] pointer-events-none uppercase">
        REGISTRATION: [ ✚ ] CROSS-MARK // SIDE A
      </div>

      <div className="absolute top-10 left-12 right-12 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pointer-events-auto">
        <div>
          <p className="font-mono text-[#9E6D35] text-[10px] tracking-[0.3em] uppercase font-bold">ANALOGUE CONTACT SHEET // FILE 35MM</p>
          <h2 className="font-poster text-5xl md:text-8xl text-[#D9C6A0] opacity-35 leading-none uppercase">THE ARCHIVE</h2>
          <p className="font-handwritten text-lg text-[#D9C6A0] mt-1 max-w-xl">
            "Every gathering leaves behind more than photographs. It leaves behind history."
          </p>
        </div>
        <a 
          href="/archive" 
          className="bg-[#9E6D35] text-[#35251A] hover:bg-[#D9C6A0] hover:text-[#35251A] border-2 border-[#35251A] px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase transition-colors shadow-archival shrink-0"
        >
          ARCHIVE → VIEW MORE
        </a>
      </div>

      {/* Contact Sheet Horizontal Track */}
      <div className="archive-track flex items-center gap-12 md:gap-24 pl-[30vw] pr-[20vw] relative z-10 will-change-transform">
        {gallery.map((photo, i) => (
          <div 
            key={photo.id}
            className={`shrink-0 w-[280px] md:w-[400px] bg-[#CBB38C] p-3 pb-12 shadow-archival border-2 border-[#35251A] rotate-[${(i % 3 - 1) * 4}deg] ${i === gallery.length - 1 ? 'heritage-expand-photo origin-center' : ''}`}
          >
            {/* Masking Tape Overlay */}
            <div className="absolute -top-3 left-1/3 w-16 h-4 bg-[rgba(203,179,140,0.85)] rotate-[-2deg] border border-[#35251A]/30 z-30 pointer-events-none" />

            {/* Film Edge Numbers */}
            <div className="flex justify-between font-mono text-[8px] text-[#35251A] font-bold px-1 mb-1">
              <span>{String(i + 1).padStart(2, '0')}A</span>
              <span>EASTMAN 5247</span>
              <span>▲ {i + 1}</span>
            </div>

            {/* Photo */}
            <div className="w-full aspect-[4/3] bg-[#35251A] overflow-hidden relative border border-[#35251A]">
              <img src={photo.src} alt={photo.label} loading="eager" decoding="async" className="w-full h-full object-cover scanned-photo" />
            </div>

            <div className="mt-3 flex justify-between items-baseline font-mono text-[10px] text-[#35251A]">
              <span className="font-bold tracking-wider">{photo.label.toUpperCase()}</span>
              <span className="opacity-70">HYD · 2025</span>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};
