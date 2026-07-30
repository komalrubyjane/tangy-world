import React from 'react';

export const HeroMicrophone = ({ className = "" }) => {
  return (
    <div className={`mic absolute z-35 top-0 left-1/2 origin-top animate-mic-sway pointer-events-none ${className}`}>
      <img 
        src="/media/vintage-mic2.png" 
        alt="Tangy Vintage Microphone" 
        className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.75)]" 
      />
    </div>
  );
};
