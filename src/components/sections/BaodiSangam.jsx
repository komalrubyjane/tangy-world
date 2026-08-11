import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';

export const BaodiSangam = () => {
  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: isMobile ? 'top 80%' : 'top top',
        end: isMobile ? '+=50%' : '+=150%',
        scrub: 1,
        pin: !isMobile
      }
    });

    tl.fromTo('.baodi-water', 
        { y: '50%', opacity: 0 }, 
        { y: '0%', opacity: 1, duration: 1 }
      )
      .fromTo('.baodi-text',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        '-=0.5'
      );
  }, []);

  return (
    <section ref={sectionRef} id="baodi" className="scene relative w-full h-screen overflow-hidden bg-tangy-black flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#1a3642_0%,var(--color-tangy-black)_60%)]" />
      
      {/* Water reflection effect */}
      <div className="baodi-water absolute bottom-0 left-0 right-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(82,107,128,0.2))] blur-sm" />

      <div className="baodi-text relative z-10 text-center flex flex-col items-center">
        <p className="eyebrow-mono mb-4 text-tangy-dusty-blue">SPECIAL PROJECT</p>
        <h2 className="font-display font-black text-6xl md:text-8xl text-tangy-cream mb-4">BAODI SANGAM</h2>
        <p className="font-body italic text-xl text-tangy-paper max-w-md">
          Reclaiming the lost stepwells of Hyderabad through art, music, and community.
        </p>
      </div>
    </section>
  );
};
