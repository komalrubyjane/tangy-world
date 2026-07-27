import clsx from 'clsx';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const HangingMicrophone = ({ 
  className,
  cableHeight = '0px', 
  isIdle = false,
  forwardRef
}) => {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div className={clsx("absolute top-[-30px] left-1/2 z-4 pointer-events-none -translate-x-1/2", className)}>
      <div 
        ref={forwardRef}
        className={clsx(
          "relative origin-[top_center]", 
          isIdle && "animate-[micIdle_6s_ease-in-out_infinite]"
        )}
      >
        <div 
          className="mic-cable w-[3px] mx-auto bg-gradient-to-b from-tangy-grey to-[#2a2a2a]"
          style={{ height: cableHeight }}
        />
        <div className="mic-body w-[44px] md:w-[56px] h-[92px] md:h-[118px] mx-auto relative rounded-[28px_28px_16px_16px] bg-[linear-gradient(135deg,#4a4a4a,#141414_55%,#5c5c5c)] shadow-[0_30px_50px_rgba(0,0,0,.65)]">
          <div className="mic-grille absolute top-[9px] left-[7px] right-[7px] h-[38px] md:h-[50px] rounded-[50%/42%] bg-[repeating-linear-gradient(0deg,#0a0a0a_0_2px,#2e2e2e_2px_4px)]" />
        </div>
        <p className="mic-caption absolute top-[130px] left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 font-mono text-[10px] tracking-[.3em] text-tangy-gold">
          TANGY SESSIONS &mdash; LIVE
        </p>
      </div>
    </div>
  );
};
