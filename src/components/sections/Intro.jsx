import { useRef } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import { DustParticles } from '../world/DustParticles';
import gsap from 'gsap';

export const Intro = ({ isLoaded }) => {
  const sectionRef = useGSAPContext((ctx) => {
    if (!isLoaded) return;
    
    const tl = gsap.timeline({ delay: 0.15 });
    
    tl.to('.opening-presents', { opacity: 1, y: 0, duration: 1.1, ease: 'power2.out' })
      .to('.opening-presents', { opacity: 0, y: -10, duration: 0.7, ease: 'power1.in' }, '+=0.9')
      .fromTo('.opening-title .word', 
        { opacity: 0, y: 44 }, 
        { opacity: 1, y: 0, duration: 1.3, stagger: 0.16, ease: 'power3.out' }, 
        '-=0.15'
      )
      .fromTo('.opening-sub', { opacity: 0 }, { opacity: 1, duration: 1 }, '-=0.4')
      .fromTo('.opening-cta', { opacity: 0 }, { opacity: 1, duration: 1 }, '-=0.3');
  }, [isLoaded]);

  return (
    <section ref={sectionRef} id="opening" className="scene relative w-full h-screen overflow-hidden bg-tangy-black">
      <DustParticles count={26} id="dustOpening" />
      <div className="scene-inner absolute inset-0 flex flex-col items-center justify-center text-center z-3 gap-[26px]">
        <p className="opening-presents font-mono text-[clamp(11px,1.4vw,14px)] tracking-[.5em] text-tangy-paper opacity-0 translate-y-[14px]">
          TANGY SESSIONS<br/>PRESENTS
        </p>
        <div className="opening-title flex flex-col gap-0">
          <span className="word font-display font-black text-[clamp(64px,15vw,180px)] leading-[.86] text-tangy-cream opacity-0 translate-y-[40px]">TANGY</span>
          <span className="word font-display font-black text-[clamp(64px,15vw,180px)] leading-[.86] text-tangy-cream opacity-0 translate-y-[40px]">WORLD</span>
        </div>
        <p className="opening-sub font-mono text-[clamp(10px,1.1vw,12px)] tracking-[.3em] text-tangy-gold opacity-0">
          A WORLD OF&nbsp;&nbsp;MUSIC&nbsp;·&nbsp;PEOPLE&nbsp;·&nbsp;PLACES&nbsp;·&nbsp;STORIES
        </p>
        <div className="opening-cta opacity-0 mt-[18px] flex flex-col items-center gap-[10px]">
          <span className="font-mono text-[11px] tracking-[.3em] text-tangy-paper">SCROLL TO ENTER</span>
          <div className="w-[1px] h-[46px] bg-gradient-to-b from-tangy-gold to-transparent animate-[pulseLine_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </section>
  );
};
