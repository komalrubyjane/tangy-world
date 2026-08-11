import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { gallery } from '../../data/mockData';

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
      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
        <p className="font-display font-black text-6xl text-tangy-cream opacity-50 mix-blend-overlay">MOMENTS<br/>WE KEPT.</p>
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
              <div className="w-[300px] md:w-[400px] aspect-[4/3] bg-tangy-paper border-[8px] border-tangy-cream shadow-2xl overflow-hidden p-2 pb-12 relative group transition-transform duration-500 hover:scale-105 cursor-pointer">
                <img src={photo.src} alt={photo.label} className="w-full h-full object-cover filter grayscale sepia-[0.3] contrast-125 group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500" />
                <div className="absolute bottom-3 w-full text-center font-mono text-[10px] tracking-widest text-tangy-grey">
                  {photo.label.toUpperCase()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
