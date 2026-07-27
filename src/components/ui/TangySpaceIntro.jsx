import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useAudio } from '../../audio/AudioContext';

export const TangySpaceIntro = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { playSFX } = useAudio();
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    // 1. Session Storage & Reduced Motion Checks
    const alreadyPlayed = sessionStorage.getItem('tangyIntroPlayed');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (alreadyPlayed || prefersReducedMotion) {
      onComplete();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // 2. Setup Canvas Dimensions
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3. Create 1970s Psychedelic Starfield Particles
    const PARTICLE_COUNT = 350;
    const particles = [];
    const colors = ['#E7D5A4', '#C99A2E', '#B94717', '#5A120D', '#F5E9C9'];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 2 + 1
      });
    }

    // Motion parameters controlled by GSAP timeline
    const warpParams = {
      speed: 1.5,
      streakLength: 1,
      glowRadius: 0,
      glowOpacity: 0
    };

    // 4. Render Loop
    const render = () => {
      ctx.fillStyle = '#11100C';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw Center Faded Orange Glow Motif
      if (warpParams.glowOpacity > 0) {
        const rad = Math.max(10, warpParams.glowRadius);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grad.addColorStop(0, `rgba(185, 71, 23, ${warpParams.glowOpacity})`);
        grad.addColorStop(0.5, `rgba(201, 154, 46, ${warpParams.glowOpacity * 0.5})`);
        grad.addColorStop(1, 'rgba(17, 16, 12, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw 1970s Star Streaks
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        p.z -= warpParams.speed;

        if (p.z <= 0) {
          p.z = width;
          p.x = (Math.random() - 0.5) * width * 2;
          p.y = (Math.random() - 0.5) * height * 2;
        }

        const k = 250 / p.z;
        const px = p.x * k + cx;
        const py = p.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const prevK = 250 / (p.z + warpParams.speed * warpParams.streakLength);
          const ppx = p.x * prevK + cx;
          const ppy = p.y * prevK + cy;

          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * (1 - p.z / width) * 1.5;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(ppx, ppy);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // 5. Master GSAP Cinematic Timeline (0.0s -> 4.7s)
    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('tangyIntroPlayed', 'true');
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        onComplete();
      }
    });

    // Phase 1: Deep Space & Title Reveal (0.0s -> 0.8s)
    tl.to('.intro-text-1', { opacity: 1, duration: 0.4 }, 0.2)
      .to('.intro-text-1', { opacity: 0, duration: 0.3 }, 0.8)

    // Phase 2: Acceleration (0.8s -> 2.0s)
      .to(warpParams, { speed: 25, streakLength: 4, duration: 1.2, ease: 'power2.in' }, 0.8)

    // Phase 3: Warp Speed & Orange Light Appears (2.0s -> 2.8s)
      .to(warpParams, { 
        speed: 60, 
        streakLength: 12, 
        glowRadius: 280, 
        glowOpacity: 0.8, 
        duration: 0.8, 
        ease: 'power3.in' 
      }, 2.0)

    // Phase 4: Tangy World Appears & Scales (2.8s -> 3.5s)
      .fromTo('.intro-tangy-portal', 
        { scale: 0.05, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: 'power2.out' }, 2.8
      )

    // Phase 5: Break Through the "O" Portal (3.5s -> 4.0s)
      .to('.intro-tangy-portal', { 
        scale: 18, 
        duration: 0.5, 
        ease: 'power3.in',
        onStart: () => playSFX('ticketClick')
      }, 3.5)
      .to('.intro-flash-overlay', { opacity: 1, duration: 0.2 }, 3.8)

    // Phase 6: Exposure Flash & Clean Transition to Concert (4.0s -> 4.7s)
      .to(containerRef.current, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 4.0);

  }, [onComplete, playSFX]);

  const handleSkip = () => {
    sessionStorage.setItem('tangyIntroPlayed', 'true');
    setIsSkipped(true);
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.4,
      onComplete: () => onComplete()
    });
  };

  if (isSkipped) return null;

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-[500] bg-[#11100C] overflow-hidden flex items-center justify-center pointer-events-auto"
    >
      {/* Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Film Grain Texture */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />

      {/* Phase 1 Text */}
      <div className="intro-text-1 absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 pointer-events-none z-20">
        <span className="font-mono text-[10px] md:text-xs text-[#C99A2E] font-bold tracking-[0.4em] uppercase mb-2">
          TANGY SESSIONS // HYDERABAD
        </span>
        <h2 className="display text-4xl md:text-6xl text-[#E7D5A4] tracking-tight">
          PRESENTS
        </h2>
      </div>

      {/* Phase 4 & 5: Tangy World Portal Title */}
      <div className="intro-tangy-portal absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 pointer-events-none z-30 transform-style-3d">
        <h1 className="display text-7xl md:text-[14vw] text-[#F5E9C9] leading-[0.8] tracking-tighter ink-bleed">
          TANGY
        </h1>
        <h1 className="display text-6xl md:text-[11vw] italic text-[#C99A2E] font-normal leading-[0.85] tracking-tight ink-bleed mt-2">
          W<span className="inline-block portal-letter-o text-[#B94717]">O</span>RLD
        </h1>
      </div>

      {/* Exposure Flash Overlay */}
      <div className="intro-flash-overlay absolute inset-0 bg-[linear-gradient(135deg,#B94717_0%,#E7D5A4_50%,#11100C_100%)] opacity-0 pointer-events-none z-40" />

      {/* Skip Intro Button */}
      <button 
        onClick={handleSkip}
        className="absolute bottom-8 right-8 z-50 font-mono text-[10px] text-[#E7D5A4]/70 hover:text-[#C99A2E] tracking-[0.25em] border border-[#E7D5A4]/30 px-3 py-1.5 bg-black/60 backdrop-blur-xs transition-colors uppercase"
      >
        SKIP INTRO →
      </button>

    </div>
  );
};
