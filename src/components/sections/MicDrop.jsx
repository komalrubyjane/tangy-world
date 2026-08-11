import { useRef } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import { HangingMicrophone } from '../world/HangingMicrophone';
import gsap from 'gsap';
import { EASES } from '../../utils/animations';

export const MicDrop = () => {
  const micRef = useRef(null);

  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: isMobile ? 'top 80%' : 'top top',
        end: isMobile ? '+=50%' : '+=160%',
        scrub: 1,
        pin: !isMobile,
        anticipatePin: isMobile ? 0 : 1
      }
    });

    tl.fromTo('.mic-cable', { height: 0 }, { height: 230, duration: 1, ease: 'power2.out' })
      .fromTo('.mic-swing', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: EASES.micDrop }, '<')
      .to('.mic-swing', { rotate: 20, duration: 0.45, ease: EASES.micSwing })
      .to('.mic-swing', { rotate: -14, duration: 0.45, ease: EASES.micSwing })
      .to('.mic-swing', { rotate: 9, duration: 0.35, ease: EASES.micSwing })
      .to('.mic-swing', { rotate: -4, duration: 0.3, ease: EASES.micSwing })
      .to('.mic-swing', { rotate: 0, duration: 0.25, ease: EASES.micSwing })
      .to('.mic-caption', { opacity: 1, duration: 0.5 }, '-=0.5')
      .to('.scene-inner', { opacity: 0, duration: 0.3 }, '+=0.15');
  }, []);

  return (
    <section ref={sectionRef} id="mic" className="scene relative w-full h-screen overflow-hidden bg-tangy-black">
      <div className="scene-inner absolute inset-0 z-3">
        <HangingMicrophone forwardRef={micRef} />
      </div>
    </section>
  );
};
