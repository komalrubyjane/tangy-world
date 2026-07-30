import React, { useEffect, useState } from 'react';

export const HeroMicrophone = ({ className = "", isMobile = false }) => {
  const [scrollPos, setScrollPos] = useState({ y: 6, rot: 0 });

  useEffect(() => {
    if (!isMobile) return;

    let animId;
    let targetY = 6;
    let currentY = 6;
    let currentRot = 0;
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docH > 0 ? Math.min(Math.max(scrollY / docH, 0), 1) : 0;

      // Smoothly map scroll position down the mobile page (6vh in Hero -> 74vh near footer)
      targetY = 6 + progress * 68;

      const diff = scrollY - lastScrollY;
      lastScrollY = scrollY;

      // Dynamic tilt based on scroll velocity (-12deg to +12deg)
      const targetRot = Math.min(Math.max(diff * 0.35, -12), 12);
      currentRot += (targetRot - currentRot) * 0.12;

      currentY += (targetY - currentY) * 0.1;

      setScrollPos({ y: currentY, rot: currentRot });
      animId = requestAnimationFrame(onScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isMobile]);

  if (isMobile) {
    return (
      <div 
        className="fixed z-[85] left-1/2 -translate-x-1/2 pointer-events-none transition-transform will-change-transform"
        style={{
          top: `${scrollPos.y}vh`,
          transform: `translateX(-50%) rotate(${scrollPos.rot}deg)`,
          filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.85))'
        }}
      >
        <div className="w-16 sm:w-20 h-32 sm:h-40 origin-top animate-mic-sway">
          <img 
            src="/media/vintage-mic2.png" 
            alt="Tangy Vintage Microphone" 
            className="w-full h-full object-contain" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`mic absolute z-35 top-0 left-1/2 -translate-x-1/2 pointer-events-none ${className}`}>
      <div className="w-full h-full origin-top animate-mic-sway">
        <img 
          src="/media/vintage-mic2.png" 
          alt="Tangy Vintage Microphone" 
          className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.75)]" 
        />
      </div>
    </div>
  );
};
