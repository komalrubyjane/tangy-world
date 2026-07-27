import { useRef } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import { sequenceReveal } from '../../utils/animations';

export const Tunnel = () => {
  const itemsRef = useRef([]);
  const addToRefs = (el) => {
    if (el && !itemsRef.current.includes(el)) {
      itemsRef.current.push(el);
    }
  };

  const sectionRef = useGSAPContext((ctx) => {
    sequenceReveal(sectionRef, itemsRef, { 
      end: '+=320%', 
      y: 34, 
      scaleFrom: 0.85, 
      scaleTo: 1.15, 
      inFrac: 0.32, 
      outFrac: 0.28, 
      holdTo: 0.6 
    });
  }, []);

  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const positions = [
    {top: '16%', left: '12%', r: '-6deg'}, 
    {top: '70%', left: '16%', r: '8deg'},
    {top: '20%', left: '78%', r: '5deg'}, 
    {top: '72%', left: '76%', r: '-9deg'}
  ];

  return (
    <section ref={sectionRef} id="tunnel" className="scene relative w-full h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#0f0b0a_0%,var(--color-tangy-black)_70%)]">
      <p className="scene-eyebrow eyebrow-mono">03 — HOW IT STARTED</p>
      
      <div className="absolute inset-0 z-[1] pointer-events-none">
        {positions.map((p, idx) => (
          <div 
            key={idx}
            className="absolute w-[84px] h-[104px] bg-[linear-gradient(160deg,var(--color-tangy-paper),var(--color-tangy-grey))] border-[6px] border-tangy-cream shadow-[0_12px_26px_rgba(0,0,0,.5)] font-mono text-[8px] text-tangy-wine flex items-end justify-center pb-[6px] text-center opacity-50 animate-[chipFloat_9s_ease-in-out_infinite]"
            style={{ top: p.top, left: p.left, '--r': p.r, animationDelay: `${idx * 1.4}s` }}
          >
            SESSION {String(idx + 1).padStart(2, '0')}
          </div>
        ))}
      </div>

      <div className="absolute inset-0 z-[2]">
        {years.map((y, idx) => (
          <div 
            key={y} 
            ref={addToRefs} 
            className="absolute inset-0 flex flex-col items-center justify-center gap-[10px] opacity-0"
          >
            <span className="font-display font-black text-[min(22vw,220px)] text-tangy-cream">{y}</span>
            <span className="font-mono text-[10px] tracking-[.3em] text-tangy-gold">
              TANGY SESSIONS ARCHIVE &mdash; VOL. {String(idx + 1).padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
