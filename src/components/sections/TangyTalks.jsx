import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';

export const TangyTalks = () => {
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

    tl.from('.talks-title .char', {
      y: 100,
      opacity: 0,
      stagger: 0.05,
      ease: 'back.out(1.7)'
    }).from('.talks-desc', {
      opacity: 0,
      y: 20,
      duration: 0.5
    }, '-=0.5');
  }, []);

  const title = "TANGY TALKS";

  return (
    <section ref={sectionRef} id="talks" className="scene relative w-full h-screen overflow-hidden bg-[linear-gradient(45deg,var(--color-tangy-black),var(--color-tangy-wine))] flex flex-col items-center justify-center">
      <div className="absolute top-[10%] w-full h-[1px] bg-tangy-gold opacity-20" />
      <div className="absolute bottom-[10%] w-full h-[1px] bg-tangy-gold opacity-20" />
      
      <p className="eyebrow-mono mb-4 text-tangy-cream">CONVERSATIONS THAT MATTER</p>
      
      <h2 className="talks-title flex text-[clamp(50px,10vw,140px)] font-display font-black text-tangy-paper leading-none overflow-hidden">
        {title.split('').map((char, i) => (
          <span key={i} className="char inline-block">
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h2>
      
      <p className="talks-desc mt-8 font-mono text-xs tracking-widest text-tangy-gold max-w-[400px] text-center leading-relaxed">
        BEYOND THE MUSIC, WE EXPLORE THE MINDS BEHIND THE ART. DEEP DIVES, STORIES, AND SHARED EXPERIENCES.
      </p>

      <button className="talks-desc mt-12 px-8 py-3 border border-tangy-cream text-tangy-cream font-mono text-[10px] tracking-[.3em] hover:bg-tangy-cream hover:text-tangy-black transition-colors" data-cursor="LISTEN">
        LISTEN TO PODCAST
      </button>
    </section>
  );
};
