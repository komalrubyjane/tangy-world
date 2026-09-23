import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { gallery } from '../../data/mockData';
import {
  TextileBorderStrip,
  VintageFilmFrame,
  RisographOffset,
} from '../ui/CulturalMotifs';
import {
  PatternBackground,
  RangoliDecoration,
  } from '../ui/RetroAssets';

export const Gallery = () => {
  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: isMobile ? 'top 80%' : 'top top',
        end: isMobile ? '+=50%' : '+=300%',
        scrub: 1,
        pin: !isMobile
      }
    });

    const photos = gsap.utils.toArray('.gallery-photo');
    
    // Spatial movement through photos
    photos.forEach((photo, i) => {
      const depth = parseFloat(photo.getAttribute('data-depth')) || 1;
      tl.to(photo, {
        z: depth * 800,
        opacity: depth < 1 ? 0 : 1, // Photos that get too close disappear
        ease: 'none'
      }, 0);
    });
  }, []);

  return (
    <section ref={sectionRef} id="gallery" className="scene relative w-full h-screen overflow-hidden bg-tangy-wine border-t border-[rgba(231,223,181,.1)] perspective-1000">
      <PatternBackground category="textile" index={2} size="cover" blend="normal" className="z-0" />
      <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] max-w-none opacity-[0.08] animate-[spin_160s_linear_infinite] pointer-events-none z-0">
        <RangoliDecoration index={0} spin={false} className="w-full h-full" />
      </div>
      <TextileBorderStrip className="absolute top-0 left-0 right-0 z-20" height={10} colorA="#E7DFB5" colorB="#3C0F0E" />
      <TextileBorderStrip className="absolute bottom-0 left-0 right-0 z-20" height={10} colorA="#E7DFB5" colorB="#3C0F0E" />
      {/* MOBILE — real cropped Rangoli photo + a film cutout, standing in for the */}
      {/* desktop medallion which is hidden below lg. */}
      <div className="lg:hidden absolute bottom-0 left-0 w-[40%] max-w-[170px] aspect-square opacity-[0.12] pointer-events-none z-0">
        <RangoliDecoration index={0} spin={false} className="w-full h-full" />
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
        <p className="font-display font-black text-6xl text-tangy-cream opacity-50 mix-blend-overlay">
          <RisographOffset colors={['#D91E18']} offsets={[[5, -4]]} opacity={0.35}>MOMENTS<br/>WE KEPT.</RisographOffset>
        </p>
      </div>

      <div className="gallery-container absolute inset-0 preserve-3d">
        {gallery.map((photo, i) => {
          // Calculate semi-random deterministic positions based on index
          const depth = (i % 5) * 1.5;
          const x = (i % 3 - 1) * 35;
          const y = (i % 4 - 1.5) * 25;
          const rotate = (i % 3 - 1) * 8;
          
          return (
            <div 
              key={photo.id}
              className="gallery-photo absolute top-1/2 left-1/2 transform-style-3d origin-center"
              data-depth={depth}
              data-cursor="VIEW"
              style={{
                transform: `translate3d(calc(-50% + ${x}vw), calc(-50% + ${y}vh), ${-depth * 300 - 200}px) rotate(${rotate}deg)`
              }}
            >
              <div className="w-[300px] md:w-[400px] aspect-[4/3] paper-surface border-[8px] border-tangy-cream shadow-2xl overflow-hidden p-2 pb-12 relative group transition-transform duration-500 hover:scale-105 cursor-pointer">
                <VintageFilmFrame color="#3C0F0E" holeColor="#3C0F0E" className="opacity-30" />
                <img src={photo.src} alt={photo.label} className="w-full h-full object-cover filter grayscale sepia-[0.3] contrast-125 group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500" />
                <div className="absolute bottom-3 w-full text-center font-mono text-[10px] tracking-widest text-tangy-grey">
                  {photo.label.toUpperCase()}
                </div>
                <span className="absolute top-1.5 right-2.5 font-mono text-[8px] font-bold text-tangy-grey/70">{String(i + 1).padStart(2, '0')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
