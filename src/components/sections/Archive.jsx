import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { gallery } from '../../data/mockData';

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
    <section ref={sectionRef} id="archive" className="relative w-full h-screen bg-[#11100C] overflow-hidden flex items-center border-t-8 border-[#4A0C0C] perspective-[1000px]">
      
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.08] pointer-events-none mix-blend-overlay" />

      {/* Film Registration & Crop Marks */}
      <div className="absolute top-6 left-6 font-mono text-[9px] text-tangy-mustard tracking-[0.3em] pointer-events-none uppercase">
        ✦ KODAK SAFETY FILM 5063 // 35MM ✦
      </div>
      <div className="absolute bottom-6 left-6 font-mono text-[9px] text-tangy-paper/40 tracking-[0.3em] pointer-events-none uppercase">
        REGISTRATION: [ ✚ ] CROSS-MARK
      </div>

      <div className="absolute top-12 left-12 z-20 pointer-events-none">
        <p className="font-mono text-tangy-mustard text-[10px] tracking-[0.3em] uppercase">ANALOGUE CONTACT SHEET</p>
        <h2 className="display text-6xl md:text-8xl text-tangy-cream opacity-30">THE ARCHIVE</h2>
      </div>

      {/* Contact Sheet Horizontal Track */}
      <div className="archive-track flex items-center gap-12 md:gap-24 pl-[30vw] pr-[20vw] relative z-10 will-change-transform">
        {gallery.map((photo, i) => (
          <div 
            key={photo.id}
            className={`shrink-0 w-[280px] md:w-[400px] bg-[#E3D4AC] p-3 pb-12 shadow-2xl border-2 border-[#11100C] rotate-[${(i % 3 - 1) * 4}deg] ${i === gallery.length - 1 ? 'heritage-expand-photo origin-center' : ''}`}
          >
            {/* Film Edge Numbers */}
            <div className="flex justify-between font-mono text-[8px] text-[#11100C] font-bold px-1 mb-1">
              <span>{String(i + 1).padStart(2, '0')}A</span>
              <span>EASTMAN 5247</span>
              <span>▲ {i + 1}</span>
            </div>

            {/* Photo */}
            <div className="w-full aspect-[4/3] bg-black overflow-hidden relative border border-[#11100C]">
              <img src={photo.src} alt={photo.label} loading="eager" decoding="async" className="w-full h-full object-cover filter grayscale sepia-[0.35] contrast-125" />
            </div>

            <div className="mt-3 flex justify-between items-baseline font-mono text-[10px] text-[#11100C]">
              <span className="font-bold tracking-wider">{photo.label.toUpperCase()}</span>
              <span className="opacity-70">HYD · 2025</span>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};
