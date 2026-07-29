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

    const isMobile = window.innerWidth < 768;

    // 2. Setup Canvas with devicePixelRatio for crisp rendering on mobile screens
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

    const setupCanvas = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      canvas.width = vw * dpr;
      canvas.height = vh * dpr;
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      ctx.scale(dpr, dpr);
      return { w: vw, h: vh };
    };

    let { w: width, h: height } = setupCanvas();

    const handleResize = () => {
      const dims = setupCanvas();
      width = dims.w;
      height = dims.h;
    };
    window.addEventListener('resize', handleResize);

    // 3. Reduced particle count on mobile for smooth 60fps
    const PARTICLE_COUNT = isMobile ? 150 : 350;
    const particles = [];
    const colors = ['#E7D5A4', '#C99A2E', '#B94717', '#5A120D', '#F5E9C9'];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * (isMobile ? 1.4 : 2) + 0.8
      });
    }

    // Motion parameters controlled by GSAP timeline
    const warpParams = {
      speed: isMobile ? 1.2 : 1.5,
      streakLength: 1,
      glowRadius: 0,
      glowOpacity: 0
    };

    // 4. Optimised Render Loop with background clear on mobile
    const render = () => {
      ctx.fillStyle = '#11100C';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Central glow
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

      // Star streaks
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        p.z -= warpParams.speed;

        if (p.z <= 0) {
          p.z = width;
          p.x = (Math.random() - 0.5) * width * 2;
          p.y = (Math.random() - 0.5) * height * 2;
        }

        const k = (isMobile ? 200 : 250) / p.z;
        const px = p.x * k + cx;
        const py = p.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const prevK = (isMobile ? 200 : 250) / (p.z + warpParams.speed * warpParams.streakLength);
          const ppx = p.x * prevK + cx;
          const ppy = p.y * prevK + cy;

          ctx.globalAlpha = Math.min(1, 0.6 + (1 - p.z / width) * 0.4);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * (1 - p.z / width) * 1.5;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(ppx, ppy);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // 5. Smoother timeline tuned for mobile — slightly slower to avoid jank
    const speedMult = isMobile ? 1.15 : 1;
    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('tangyIntroPlayed', 'true');
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        onComplete();
      }
    });

    // Phase 1: Title reveal — eased in longer on mobile
    tl.to('.intro-text-1', { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0.3 * speedMult)
      .to('.intro-text-1', { opacity: 0, duration: 0.35, ease: 'power1.in' }, 1.0 * speedMult)

    // Phase 2: Gradual acceleration — power1.in for smoother feel on mobile
      .to(warpParams, {
        speed: isMobile ? 18 : 25,
        streakLength: isMobile ? 3 : 4,
        duration: 1.4 * speedMult,
        ease: 'power1.in'
      }, 1.0 * speedMult)

    // Phase 3: Warp speed — softer ease on mobile
      .to(warpParams, {
        speed: isMobile ? 45 : 60,
        streakLength: isMobile ? 9 : 12,
        glowRadius: isMobile ? 220 : 280,
        glowOpacity: 0.75,
        duration: 0.9 * speedMult,
        ease: 'power2.in'
      }, 2.4 * speedMult)

    // Phase 4: Tangy World portal zooms in
      .fromTo('.intro-tangy-portal',
        { scale: 0.06, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.75, ease: 'power2.out' },
        3.3 * speedMult
      )

    // Phase 5: Break through portal — slightly less violent scale on mobile
      .to('.intro-tangy-portal', {
        scale: isMobile ? 14 : 18,
        duration: 0.55,
        ease: 'power3.in',
        onStart: () => { try { playSFX('ticketClick'); } catch (_) {} }
      }, 4.05 * speedMult)
      .to('.intro-flash-overlay', { opacity: 1, duration: 0.25, ease: 'power1.in' }, 4.35 * speedMult)

    // Phase 6: Fade out container
      .to(containerRef.current, {
        opacity: 0,
        duration: isMobile ? 0.6 : 0.5,
        ease: 'power2.out'
      }, 4.5 * speedMult);

  }, [onComplete, playSFX]);

  const handleSkip = () => {
    sessionStorage.setItem('tangyIntroPlayed', 'true');
    setIsSkipped(true);
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.45,
      ease: 'power2.out',
      onComplete: () => onComplete()
    });
  };

  if (isSkipped) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[500] bg-[#11100C] overflow-hidden flex items-center justify-center pointer-events-auto"
      style={{ willChange: 'opacity' }}
    >
      {/* Starfield Canvas — hardware composited */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ willChange: 'contents' }}
      />

      {/* Film Grain Texture */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.14] mix-blend-overlay pointer-events-none" />

      {/* Phase 1 Text */}
      <div className="intro-text-1 absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 pointer-events-none z-20 px-6">
        <span className="font-mono text-[9px] sm:text-[10px] md:text-xs text-[#C99A2E] font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-2 sm:mb-3">
          TANGY SESSIONS // HYDERABAD
        </span>
        <h2 className="display text-3xl sm:text-4xl md:text-6xl text-[#E7D5A4] tracking-tight">
          PRESENTS
        </h2>
      </div>

      {/* Phase 4 & 5: Portal Title — clamp for small screens */}
      <div className="intro-tangy-portal absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 pointer-events-none z-30 px-4">
        <h1
          className="display text-[clamp(3.2rem,18vw,9rem)] text-[#F5E9C9] leading-[0.82] tracking-tighter"
          style={{ willChange: 'transform, opacity' }}
        >
          TANGY
        </h1>
        <h1
          className="display text-[clamp(2.6rem,14vw,7rem)] italic text-[#C99A2E] font-normal leading-[0.85] tracking-tight mt-1 sm:mt-2"
          style={{ willChange: 'transform, opacity' }}
        >
          W<span className="inline-block portal-letter-o text-[#B94717]">O</span>RLD
        </h1>
      </div>

      {/* Exposure Flash Overlay */}
      <div className="intro-flash-overlay absolute inset-0 bg-[linear-gradient(135deg,#B94717_0%,#E7D5A4_50%,#11100C_100%)] opacity-0 pointer-events-none z-40" />

      {/* Skip Intro Button — larger tap target on mobile */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-5 sm:right-8 z-50 font-mono text-[10px] sm:text-[11px] text-[#E7D5A4]/80 hover:text-[#C99A2E] active:text-[#C99A2E] tracking-[0.2em] sm:tracking-[0.25em] border border-[#E7D5A4]/30 px-4 sm:px-3 py-2.5 sm:py-1.5 bg-black/60 backdrop-blur-sm transition-colors uppercase min-h-[44px] flex items-center justify-center"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        SKIP INTRO →
      </button>
    </div>
  );
};
