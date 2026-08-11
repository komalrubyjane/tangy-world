import { useEffect, useRef, useState } from 'react';

export const MobileMicrophoneJourney = () => {
  const containerRef = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 15, rot: 0 });

  useEffect(() => {
    let animId;
    let targetYPercent = 15;
    let currentYPercent = 15;
    let currentXPercent = 50;
    let currentRot = 0;
    let velocity = 0;
    let lastScrollY = window.scrollY;
    let swayTime = 0;

    const updatePhysics = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;

      // Map scroll progress to vertical screen position (12vh top in Hero -> 78vh near bottom in Footer)
      targetYPercent = 12 + scrollProgress * 66;

      // Scroll Velocity & Pendulum Physics Calculation
      const scrollDiff = scrollY - lastScrollY;
      lastScrollY = scrollY;
      velocity = velocity * 0.85 + scrollDiff * 0.15;

      // Smooth Lerp Position
      currentYPercent += (targetYPercent - currentYPercent) * 0.08;

      // Dynamic Horizontal Pendulum Sway & Rotation
      swayTime += 0.04 + Math.abs(velocity) * 0.005;
      const baseSway = Math.sin(swayTime) * 4; // Ambient sway
      const velocitySway = Math.min(Math.max(velocity * 0.3, -12), 12);
      
      currentXPercent = 50 + baseSway + Math.sin(swayTime * 1.5) * (Math.abs(velocity) * 0.15);
      
      const targetRot = Math.min(Math.max(-velocity * 0.45 + baseSway * 0.8, -14), 14);
      currentRot += (targetRot - currentRot) * 0.1;

      setPos({
        x: currentXPercent,
        y: currentYPercent,
        rot: currentRot
      });

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[80] overflow-hidden"
    >
      {/* 1. DYNAMIC EXTENDING BRAIDED CABLE SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Cable Drop-Shadow */}
        <line 
          x1={`${pos.x}%`} 
          y1="0" 
          x2={`${pos.x}%`} 
          y2={`${pos.y}%`} 
          stroke="rgba(0,0,0,0.5)" 
          strokeWidth="3.5"
        />
        {/* Main Dark Cable */}
        <line 
          x1={`${pos.x}%`} 
          y1="0" 
          x2={`${pos.x}%`} 
          y2={`${pos.y}%`} 
          stroke="#141110" 
          strokeWidth="2"
        />
        {/* Inner Cable Specular Highlight */}
        <line 
          x1={`${pos.x}%`} 
          y1="0" 
          x2={`${pos.x}%`} 
          y2={`${pos.y}%`} 
          stroke="#ecdcaf" 
          strokeWidth="0.5" 
          opacity="0.3"
        />
      </svg>

      {/* 2. VINTAGE CHROME MICROPHONE ASSEMBLY */}
      <div 
        className="absolute w-12 h-28 -ml-6 origin-top pointer-events-none transition-transform"
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: `rotate(${pos.rot}deg)`,
          filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.65)) drop-shadow(0 0 18px rgba(209,164,55,0.35))'
        }}
      >
        <svg viewBox="0 0 100 240" className="w-full h-full overflow-visible">
          {/* Cable Connector Nut */}
          <rect x="42" y="0" width="16" height="12" rx="3" fill="#2a2d30" stroke="#141110" strokeWidth="1.5" />
          
          {/* Chrome Microphone Body */}
          <g transform="translate(50,12)">
            {/* Main Outer Shell */}
            <rect x="-18" y="0" width="36" height="88" rx="18" fill="#cfd2d4" stroke="#141110" strokeWidth="2.2" />
            
            {/* Left Metallic Specular Highlight */}
            <rect x="-18" y="0" width="14" height="88" rx="7" fill="#ffffff" opacity="0.45" />
            
            {/* Dark Side Shading */}
            <rect x="4" y="0" width="14" height="88" rx="7" fill="#888e92" opacity="0.5" />

            {/* Vintage Grille Rib Lines */}
            <g stroke="#141110" strokeWidth="1.8" opacity="0.85">
              <line x1="-13" y1="14" x2="13" y2="14" />
              <line x1="-14" y1="22" x2="14" y2="22" />
              <line x1="-14" y1="30" x2="14" y2="30" />
              <line x1="-14" y1="38" x2="14" y2="38" />
              <line x1="-14" y1="46" x2="14" y2="46" />
              <line x1="-13" y1="54" x2="13" y2="54" />
            </g>

            {/* Gold Vintage Band Accent */}
            <rect x="-19" y="62" width="38" height="6" fill="#d1a437" stroke="#141110" strokeWidth="1.5" />
            <rect x="-19" y="62" width="12" height="6" fill="#f4e8c3" opacity="0.6" />

            {/* Lower Base Ring */}
            <rect x="-20" y="86" width="40" height="14" rx="4" fill="#3a3d3f" stroke="#141110" strokeWidth="2.2" />
            <rect x="-8" y="100" width="16" height="28" fill="#2a2d30" stroke="#141110" strokeWidth="2" />
          </g>
        </svg>
      </div>

    </div>
  );
};
