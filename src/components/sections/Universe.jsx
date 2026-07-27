import { useGSAPContext } from '../../hooks/useGSAPContext';
import { useRef } from 'react';
import gsap from 'gsap';
import { artists } from '../../data/mockData';

export const Universe = () => {
  const containerRef = useRef(null);

  const sectionRef = useGSAPContext((ctx) => {
    // Parallax mouse movement
    const onMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 2;
      const y = (clientY / window.innerHeight - 0.5) * 2;
      
      gsap.to('.memory-layer', {
        x: (index, target) => {
          const depth = parseFloat(target.dataset.depth) || 0.1;
          return x * depth * 100;
        },
        y: (index, target) => {
          const depth = parseFloat(target.dataset.depth) || 0.1;
          return y * depth * 100;
        },
        duration: 2,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', onMouseMove);
    }

    return () => {
      if (container) container.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <section ref={sectionRef} id="universe" className="relative w-full h-[150vh] bg-tangy-grey overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(14,13,11,1)_100%)] z-10 pointer-events-none" />
      
      <div className="relative z-20 text-center mix-blend-difference pointer-events-none">
        <h2 className="font-display font-black text-8xl md:text-[12rem] text-tangy-cream leading-none">
          THE<br/>UNIVERSE
        </h2>
      </div>

      <div ref={containerRef} className="absolute inset-0 perspective-[1000px] z-0">
        {/* Memory Objects using Real Artists */}
        {artists.map((artist, i) => (
          <div
            key={artist.id}
            className="memory-layer absolute"
            data-depth={0.1 + (i * 0.1)}
            style={{
              top: `${15 + (i * 12)}%`,
              left: `${10 + (i % 3) * 30}%`,
              width: `${100 + (i % 2) * 50}px`,
              height: `${120 + (i % 2) * 60}px`
            }}
          >
            <div className="w-full h-full bg-tangy-paper border border-[rgba(0,0,0,0.1)] shadow-2xl p-2 pb-8 rotate-[5deg] hover:rotate-0 transition-transform duration-500 hover:scale-110 cursor-pointer">
               <img src={artist.image} className="w-full h-full object-cover filter grayscale sepia-[0.3]" alt={artist.name} />
               <div className="absolute bottom-2 text-center w-full font-mono text-[8px] text-tangy-grey tracking-widest">{artist.name}</div>
            </div>
          </div>
        ))}

        {/* Additional decorative elements */}
        <div className="memory-layer absolute top-[40%] left-[70%] w-64 h-24 border border-tangy-gold p-4 flex flex-col justify-between" data-depth="0.7">
          <p className="font-mono text-[10px] text-tangy-gold">TICKET // ADMIT ONE</p>
          <p className="font-display text-2xl text-tangy-cream">BANSILALPET</p>
        </div>
      </div>
    </section>
  );
};
