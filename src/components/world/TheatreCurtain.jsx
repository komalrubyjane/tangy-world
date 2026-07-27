import clsx from 'clsx';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const TheatreCurtain = ({ leftRef, rightRef, className }) => {
  const reduced = useReducedMotion();
  if (reduced) return null;

  const curtainStyle = "absolute top-0 bottom-0 w-[54%] z-10 bg-[repeating-linear-gradient(90deg,var(--color-tangy-red-curtain)_0_16px,var(--color-tangy-wine)_16px_34px),linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.55))]";

  return (
    <>
      <div 
        ref={leftRef} 
        className={clsx(curtainStyle, "left-0 -translate-x-full shadow-[24px_0_60px_rgba(0,0,0,.6)]", className)} 
      />
      <div 
        ref={rightRef} 
        className={clsx(curtainStyle, "right-0 translate-x-full shadow-[-24px_0_60px_rgba(0,0,0,.6)]", className)} 
      />
    </>
  );
};
