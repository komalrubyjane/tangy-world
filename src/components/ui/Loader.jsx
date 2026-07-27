import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useCursor } from '../../hooks/useCursor';
import '../../styles/globals.css';

export const Loader = ({ onComplete }) => {
  const [pct, setPct] = useState(0);
  const [isOn, setIsOn] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('locked');
    document.body.classList.add('locked');

    const steps = [0, 17, 34, 52, 68, 84, 92, 100];
    let i = 0;

    const tick = () => {
      if (i < steps.length) {
        setPct(steps[i]);
        i++;
        setTimeout(tick, i === steps.length ? 260 : 180);
      } else {
        setIsOn(true);
        setTimeout(finishLoad, 420);
      }
    };

    const finishLoad = () => {
      setIsDone(true);
      document.documentElement.classList.remove('locked');
      document.body.classList.remove('locked');
      
      setTimeout(() => {
        onComplete();
      }, 900);
    };

    const timer = setTimeout(tick, 300);

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('locked');
      document.body.classList.remove('locked');
    };
  }, [onComplete]);

  return (
    <div 
      className={clsx(
        "fixed inset-0 z-[100] bg-tangy-black flex flex-col items-center justify-center gap-[22px]",
        isDone && "opacity-0 pointer-events-none transition-opacity duration-900 ease-out"
      )}
    >
      <p className="font-mono text-[12px] tracking-[.4em] text-tangy-paper text-center leading-[1.9]">
        SETTING<br/>THE STAGE&hellip;
      </p>
      <p className="font-display font-bold text-[15vw] text-tangy-cream leading-none">
        {String(pct).padStart(2, '0')}
      </p>
      <span 
        className={clsx(
          "w-2 h-2 rounded-full transition-all duration-500 ease-out",
          isOn 
            ? "bg-tangy-gold shadow-[0_0_40px_10px_rgba(184,138,82,.55)]" 
            : "bg-tangy-wine shadow-[0_0_0_rgba(184,138,82,0)]"
        )}
      ></span>
    </div>
  );
};
