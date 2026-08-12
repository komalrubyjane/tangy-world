import { useRef, useEffect } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { useAudio } from '../../audio/AudioContext';

export const Founders = () => {
  const { playSFX } = useAudio();
  const sectionRef = useRef(null);

  useGSAPContext((ctx) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%'
      }
    });

    // 1. Folder Open & Header Reveal
    tl.fromTo('.founders-folder-header',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
    )

    // 2. Profile Dossiers Slide In
    .fromTo('.founder-dossier-1',
      { x: -80, opacity: 0, rotation: -4 },
      { x: 0, opacity: 1, rotation: -2, duration: 0.8, ease: 'back.out(1.2)' }, 0.2
    )
    .fromTo('.founder-dossier-2',
      { x: 80, opacity: 0, rotation: 4 },
      { x: 0, opacity: 1, rotation: 2, duration: 0.8, ease: 'back.out(1.2)' }, 0.3
    )

    // 3. Stamps Slap Down with Impact
    .fromTo('.founder-stamp-1',
      { scale: 1.8, opacity: 0, rotation: -20 },
      { scale: 1, opacity: 0.95, rotation: -6, duration: 0.4, ease: 'bounce.out' }, 0.8
    )
    .fromTo('.founder-stamp-2',
      { scale: 1.8, opacity: 0, rotation: 20 },
      { scale: 1, opacity: 0.95, rotation: 6, duration: 0.4, ease: 'bounce.out', onStart: () => playSFX('ticketClick') }, 0.9
    );

  }, sectionRef);

  // Desktop Mouse Parallax (Paper Depth Movement)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      const moveX = (clientX / window.innerWidth - 0.5) * 12;
      const moveY = (clientY / window.innerHeight - 0.5) * 12;

      gsap.to('.founder-dossier-1', { x: moveX * 0.15, y: moveY * 0.15, duration: 1.2, ease: 'power2.out' });
      gsap.to('.founder-dossier-2', { x: -moveX * 0.18, y: -moveY * 0.18, duration: 1.2, ease: 'power2.out' });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const foundersData = [
    {
      id: "001-A",
      name: "ARJUNA",
      role: "FOUNDER & CREATOR",
      year: "EST. 2016",
      image: "/media/arjun.png",
      quote: "Born from an obsession with underground sound and ancient spaces. Tangy Sessions exists because we refused to let music stay ordinary.",
      tag: "PATHFINDER",
      rotation: "-2deg",
      stampClass: "founder-stamp-1"
    },
    {
      id: "001-D",
      name: "DEEPA",
      role: "CO-FOUNDER & COMMUNITY ARCHITECT",
      year: "EST. 2018",
      image: "/media/deepa.jpg",
      quote: "The architect of community. Deepa ensures every event feels like a homecoming, transforming historical monuments into intimate gathering spaces.",
      tag: "ARCHITECT",
      rotation: "2deg",
      stampClass: "founder-stamp-2"
    }
  ];

  return (
    <section 
      ref={sectionRef} 
      id="founders" 
      className="relative w-full py-16 md:py-28 lg:py-36 bg-[#1C140E] text-[#EAD9A6] overflow-hidden border-t-8 border-[#D19A24]"
    >
      
      {/* WOODEN DESK & NOISE TEXTURE */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay pointer-events-none z-10" />

      {/* OVERSIZED DESK WATERMARK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-5 z-5">
        <span className="display text-[22vw] leading-none text-[#EAD9A6] uppercase">FILE 001</span>
      </div>

      {/* ARCHIVAL METADATA */}
      <div className="absolute top-8 left-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#D19A24] font-bold pointer-events-none uppercase hidden md:block">
        TANGY SESSIONS // FOUNDERS ARCHIVE
      </div>

      <div className="absolute top-8 right-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#EAD9A6]/60 pointer-events-none uppercase hidden md:block">
        PROPERTY OF TANGY SESSIONS
      </div>

      <div className="absolute bottom-8 left-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#EAD9A6]/60 pointer-events-none uppercase hidden md:block">
        STRICTLY CONFIDENTIAL // HYD 17°23'N
      </div>

      {/* SECTION HEADER */}
      <div className="founders-folder-header max-w-4xl mx-auto text-center px-6 relative z-20 mb-16 md:mb-24">
        <span className="font-mono text-[10px] md:text-xs font-bold text-[#D19A24] tracking-[0.35em] uppercase mb-2 block">
          OPENED ARCHIVAL DESK FOLDER // FILE 001
        </span>
        <h2 className="display text-6xl md:text-9xl text-[#EAD9A6] leading-none ink-bleed mb-4">
          FOUNDERS ARCHIVE
        </h2>
        <p className="font-mono text-xs md:text-sm text-[#EAD9A6]/90 tracking-[0.3em] uppercase border-y-2 border-[#15120D] py-2 inline-block px-6 bg-[#15120D]/90 backdrop-blur-xs shadow-md">
          THE ARCHITECTS OF TANGY WORLD
        </p>
      </div>

      {/* 2 VINTAGE DOSSIER FOLDER CARDS (ARJUNA & DEEPA) */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 relative z-20 items-stretch">
        
        {foundersData.map((founder, idx) => (
          <div 
            key={founder.id}
            className={`founder-dossier-${idx + 1} group bg-[#EAD9A6] text-[#15120D] p-5 md:p-8 lg:p-12 border-4 border-[#15120D] shadow-[8px_8px_0px_#15120D] md:shadow-[20px_20px_0px_#15120D] hover:shadow-[12px_12px_0px_#15120D] md:hover:shadow-[28px_28px_0px_#15120D] transition-all duration-300 relative flex flex-col justify-between`}
            style={{ transform: window.innerWidth >= 768 ? `rotate(${founder.rotation})` : 'none' }}
          >
            
            {/* MANILA TAB */}
            <div className="absolute -top-6 left-6 bg-[#15120D] text-[#EAD9A6] px-4 py-1 font-mono text-[9px] font-bold uppercase tracking-widest border-t-2 border-x-2 border-[#D19A24]">
              FILE {founder.id} // {founder.tag}
            </div>

            {/* PAPER CLIP */}
            <div className="absolute -top-3 left-40 w-3 h-10 border-2 border-slate-700 rounded-full z-30 pointer-events-none rotate-[-6deg]" />

            {/* MASKING TAPE */}
            <div className="absolute -top-3 right-28 w-20 h-5 bg-[rgba(234,217,166,0.85)] rotate-[-3deg] border border-black/30 z-30 pointer-events-none" />

            {/* CONFIDENTIAL STAMP */}
            <div className={`${founder.stampClass} absolute -top-5 right-4 border-4 border-[#15120D] bg-[#5A120D] text-[#EAD9A6] font-mono text-[10px] font-bold px-3.5 py-1 uppercase shadow-lg z-30 pointer-events-none`}>
              CONFIDENTIAL // FILE 001 ✦
            </div>

            <div>
              <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#B9471B] border-b-2 border-[#15120D] pb-3 mb-6 uppercase">
                <span>FOUNDER FILE // {founder.year}</span>
                <span>HYDERABAD</span>
              </div>

              <h3 className="display text-5xl md:text-7xl text-[#15120D] leading-none mb-2 ink-bleed">
                {founder.name}
              </h3>
              
              <span className="font-mono text-xs text-[#B9471B] font-bold tracking-[0.2em] uppercase block mb-4">
                {founder.role}
              </span>

              {/* POLAROID PHOTO */}
              <div className="relative w-[140px] sm:w-[180px] md:w-[230px] bg-[#F5E9C9] p-2.5 pb-8 border-2 border-[#15120D] shadow-md rotate-[-3deg] my-4 transition-transform group-hover:scale-105">
                <img src={founder.image} alt={founder.name} className="w-full aspect-[3/4] object-cover filter grayscale contrast-130 border border-[#15120D]" />
                <p className="font-mono text-[8px] text-[#15120D] font-bold tracking-wider mt-2">✎ FOUNDER ARCHIVE // {founder.year}</p>
              </div>

              {/* HANDWRITTEN QUOTE */}
              <p className="font-mono text-xs md:text-sm text-[#15120D]/90 leading-relaxed border-l-4 border-[#5A120D] pl-3.5 my-4">
                ✎ "{founder.quote}"
              </p>
            </div>

            {/* SIGNATURE STAMP FOOTER */}
            <div className="pt-4 border-t-2 border-dashed border-[#15120D] flex justify-between items-center font-mono text-[9px] opacity-80">
              <span className="font-bold uppercase">SIGNATURE: {founder.name}</span>
              <span className="text-[#5A120D] font-bold">VERIFIED ✦</span>
            </div>

          </div>
        ))}

      </div>

      {/* ARCHIVAL MUSICAL DIVIDER AT SECTION BOTTOM */}
      <div className="w-full max-w-4xl mx-auto text-center mt-20 font-mono text-xs font-bold text-[#D19A24] tracking-[0.3em] uppercase flex items-center justify-center gap-4">
        <span className="h-[1px] w-24 bg-[#D19A24]/40" />
        <span>─────── 🎻 VINYL COLLECTION ───────</span>
        <span className="h-[1px] w-24 bg-[#D19A24]/40" />
      </div>

    </section>
  );
};
