import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Reuses the site's existing Hero performer illustrations so the announcement
// "characters" stay visually consistent with the Hero section instead of
// introducing new art.
const CHARACTER_IMAGES = {
  violinist: '/media/hero-performer-1-violinist.png',
  guitarist: '/media/hero-performer-2-guitarist.png',
  veena: '/media/hero-performer-3-veena.png',
  kathak: '/media/hero-performer-4-kathak.png',
  hiphop: '/media/hero-performer-5-hiphop.png',
};

const CATEGORY_CTA = {
  SESSION: 'VIEW SESSION',
  ARTIST: 'VIEW DETAILS',
  TICKET: 'GET TICKETS',
  ARCHIVE: 'EXPLORE ARCHIVE',
  CULTURE: 'LEARN MORE',
  GENERAL: 'VIEW MORE',
};

function getCtaText(announcement) {
  if (!announcement) return 'VIEW MORE';
  return announcement.cta || CATEGORY_CTA[announcement.category] || 'VIEW MORE';
}

const MIN_VISIBLE_MS = 1200;

/*
 * SITE-WIDE Z-INDEX SCALE (reference only — captured via:
 *   grep -rohn "z-\[[0-9]*\]\|z-[0-9]\+" src/ | grep -oE "z-\[[0-9]+\]|z-[0-9]+" | sort -t'[' -k2 -n -u
 * Do NOT renumber anything below; this is documentation so future work
 * doesn't have to re-derive it by grepping. Values actually in use:
 *
 *   z-20              base in-flow content lifted above section backgrounds
 *   z-[1] / z-[2]     misc local layering inside individual sections
 *   z-[18] / z-[19]   misc local layering inside individual sections
 *   z-[65]            local section layering
 *   z-[70]            local section layering
 *   z-[80]            App.jsx global vignette (fixed, above page, below grain)
 *   z-[85] / z-[86]   local section layering
 *   z-[90]            App.jsx global grain texture (fixed, very low opacity)
 *   z-[100]           local layering above the global grain/vignette
 *   z-[110]           App.jsx scroll-progress rail (desktop only)
 *   z-[120]           local layering
 *   z-[130] / [131]   TangyAssistantLauncher button + its open chat panel
 *   z-[140]           MuseumQuickDock (fixed, bottom-center secondary nav)
 *   z-[150]           local layering just above the dock
 *   z-[200]           full-screen modals (e.g. AudioEntryModal)
 *   z-[250]           local layering
 *   z-[300]           local layering
 *   z-[500]           AnnouncementCharacterOverlay (THIS component)
 *   z-[9999]          Navbar header (fixed, top)
 *   z-[10000..10002]  Navbar mobile drawer / dropdown / toggle button
 *   z-[10050]         UserLoginModal
 *   z-[99999]         top-most, reserved for critical system overlays
 *
 * This component sits at z-[500] — comfortably above ordinary page content
 * and the assistant launcher/dock band, but always below the Navbar
 * (z-[9999]+) and any modal (z-[200]+), so an open mobile menu, a dropdown,
 * or a modal always wins visually. Because z-index alone can't guarantee
 * "never overlaps the dock/launcher" (they're fixed, bottom-anchored
 * siblings with a HIGHER z-index of their own is irrelevant — this
 * overlay's z-[500] is already above them), the real fix is POSITION:
 * on mobile this overlay is anchored to the TOP of the viewport (below the
 * fixed header), fully outside the bottom-anchored band shared by
 * MuseumQuickDock (bottom-4, centered) and TangyAssistantLauncher
 * (bottom-24 / bottom-40, right). See the container className below.
 */

/**
 * A retro poster/ticket-style announcement popup: a hero performer character
 * slides in from a screen edge, a paper ticket "unfolds" beside them showing
 * the announcement, then both exit the same way after `duration` ms (or on
 * manual dismiss / CTA click).
 *
 * Props: { announcement, character, position, duration, isOpen, onClose, onView }
 */
export const AnnouncementCharacterOverlay = ({
  announcement,
  character,
  position = 'bottom-left',
  duration = 6000,
  isOpen,
  onClose,
  onView,
}) => {
  const [phase, setPhase] = useState('closed'); // closed | entering | open | exiting
  const charRef = useRef(null);
  const paperRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const ctaRef = useRef(null);
  const tlRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const isRight = position === 'bottom-right';
  const edgeSign = isRight ? 1 : -1;
  const interactive = phase === 'open';

  // Open when the parent asks us to.
  useEffect(() => {
    if (isOpen && phase === 'closed') setPhase('entering');
  }, [isOpen, phase]);

  // If the parent forcibly closes us mid-flight, exit gracefully instead of
  // snapping away.
  useEffect(() => {
    if (!isOpen && (phase === 'entering' || phase === 'open')) setPhase('exiting');
  }, [isOpen, phase]);

  // Entrance animation: (1) anticipation beat, (2) character steps into
  // frame, (3) paper unfolds, (4) settles with a spring bounce, (5) text
  // fades/slides in after the paper settles (staggered), (6) CTA becomes
  // interactive last.
  useEffect(() => {
    if (phase !== 'entering') return undefined;
    tlRef.current?.kill();

    const textEls = [titleRef.current, descRef.current].filter(Boolean);

    if (reducedMotion) {
      gsap.set(charRef.current, { opacity: 0, xPercent: 0 });
      gsap.set(paperRef.current, { opacity: 0, scaleY: 1, x: 0, clipPath: 'inset(0 0 0% 0)' });
      gsap.set([...textEls, ctaRef.current].filter(Boolean), { opacity: 0 });
      tlRef.current = gsap
        .timeline({ onComplete: () => setPhase('open') })
        .to(
          [charRef.current, paperRef.current, ...textEls, ctaRef.current].filter(Boolean),
          { opacity: 1, duration: 0.25, ease: 'power1.out' }
        );
    } else {
      gsap.set(charRef.current, { xPercent: edgeSign * 160, opacity: 0 });
      gsap.set(paperRef.current, { opacity: 0, scaleY: 0.35, x: edgeSign * 30, clipPath: 'inset(0 0 60% 0)' });
      gsap.set(textEls, { opacity: 0, y: 6 });
      gsap.set(ctaRef.current, { opacity: 0, y: 4 });

      tlRef.current = gsap
        .timeline({ onComplete: () => setPhase('open') })
        // (1) anticipation beat — a tiny wind-up before the character commits
        .to(charRef.current, { xPercent: edgeSign * 172, duration: 0.1, ease: 'power1.inOut' })
        // (2) character steps into frame
        .to(charRef.current, { xPercent: 0, opacity: 1, duration: 0.55, ease: 'power3.out' })
        // (3) paper unfolds + (4) settles with a physical spring bounce
        .to(
          paperRef.current,
          { opacity: 1, scaleY: 1, x: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.65, ease: 'elastic.out(1, 0.62)' },
          '-=0.2'
        )
        // (5) text fades/slides in slightly after the paper settles, staggered
        .to(textEls, { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power2.out' }, '-=0.25')
        // (6) CTA becomes interactive last
        .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '-=0.1');
    }

    dismissTimerRef.current = setTimeout(() => {
      setPhase((p) => (p === 'closed' ? p : 'exiting'));
    }, Math.max(duration, MIN_VISIBLE_MS));

    return () => clearTimeout(dismissTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Exit animation.
  useEffect(() => {
    if (phase !== 'exiting') return undefined;
    clearTimeout(dismissTimerRef.current);
    tlRef.current?.kill();

    const finish = () => {
      setPhase('closed');
      onClose?.();
    };

    if (reducedMotion) {
      tlRef.current = gsap
        .timeline({ onComplete: finish })
        .to([paperRef.current, charRef.current], { opacity: 0, duration: 0.2, ease: 'power1.in' });
    } else {
      const textEls = [titleRef.current, descRef.current, ctaRef.current].filter(Boolean);
      tlRef.current = gsap
        .timeline({ onComplete: finish })
        .to(textEls, { opacity: 0, duration: 0.15, ease: 'power1.in' })
        .to(
          paperRef.current,
          { opacity: 0, scaleY: 0.3, clipPath: 'inset(0 0 60% 0)', duration: 0.3, ease: 'power2.in' },
          '-=0.05'
        )
        .to(charRef.current, { xPercent: edgeSign * 160, opacity: 0, duration: 0.4, ease: 'power3.in' }, '-=0.1');
    }

    return () => tlRef.current?.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(
    () => () => {
      clearTimeout(dismissTimerRef.current);
      tlRef.current?.kill();
    },
    []
  );

  const handleManualClose = () => {
    if (phase === 'entering' || phase === 'open') setPhase('exiting');
  };

  const handleView = () => {
    if (!interactive) return;
    onView?.(announcement);
    if (announcement?.destination) navigate(announcement.destination);
    handleManualClose();
  };

  if (phase === 'closed' || !announcement) return null;

  const imgSrc = CHARACTER_IMAGES[character] || CHARACTER_IMAGES.violinist;
  const ctaText = getCtaText(announcement);
  const showIdleSway = phase === 'open' && !reducedMotion;

  // Mobile: anchored to the TOP of the viewport (clear of the fixed header,
  // ~49px tall) so this can never share a vertical band with the
  // bottom-anchored MuseumQuickDock or TangyAssistantLauncher. Desktop
  // (md+): keeps the original bottom-anchored feel, with the bottom-right
  // variant pushed high enough to clear TangyAssistantLauncher's resting
  // button (fixed bottom-24, ~44px tall). Both edges respect the device
  // safe area via env().
  const bottomOffsetClass = isRight
    ? 'md:bottom-[calc(11rem+env(safe-area-inset-bottom))]'
    : 'md:bottom-[calc(2rem+env(safe-area-inset-bottom))]';

  return (
    <div
      className={`fixed z-[500] top-[calc(4.5rem+env(safe-area-inset-top))] md:top-auto ${bottomOffsetClass} ${
        isRight ? 'right-3 md:right-8' : 'left-3 md:left-8'
      } flex ${isRight ? 'flex-row-reverse' : 'flex-row'} items-start md:items-end gap-2 md:gap-4 pointer-events-none max-w-[min(26rem,calc(100vw-1.5rem))]`}
    >
      <div className={showIdleSway ? 'animate-[announceIdleSway_3.4s_ease-in-out_infinite]' : ''}>
        <img
          ref={charRef}
          src={imgSrc}
          alt=""
          className="h-[clamp(5rem,20vw,11rem)] w-auto drop-shadow-[6px_6px_0_rgba(0,0,0,0.5)] pointer-events-none select-none"
        />
      </div>
      <div
        ref={paperRef}
        style={{ transformOrigin: isRight ? 'bottom right' : 'bottom left' }}
        className="pointer-events-auto relative w-[clamp(210px,58vw,300px)] bg-[#F3E7C9] text-[#191410] border-2 border-[#191410] shadow-[6px_6px_0_#11100C] p-4 -rotate-1"
      >
        <button
          onClick={handleManualClose}
          aria-label="Dismiss announcement"
          className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-[#C2272A] text-white text-xs font-bold border-2 border-[#191410] rounded-full"
        >
          ✕
        </button>
        <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#B94717] mb-1 border-b border-dashed border-[#191410]/30 pb-1">
          Tangy Sessions · {announcement.category || 'Announcement'}
        </div>
        <h4 ref={titleRef} className="font-display text-lg md:text-xl font-bold leading-tight mb-1">
          {announcement.title}
        </h4>
        <p ref={descRef} className="text-xs md:text-sm font-serif leading-snug mb-3 opacity-90">
          {announcement.description}
        </p>
        <button
          ref={ctaRef}
          onClick={handleView}
          disabled={!interactive}
          aria-disabled={!interactive}
          className={`w-full py-2 bg-[#C99A2E] text-[#11100C] text-[10px] font-bold uppercase tracking-wider border-2 border-[#191410] transition-colors ${
            interactive ? 'hover:bg-[#191410] hover:text-[#C99A2E] cursor-pointer' : 'cursor-default opacity-80'
          }`}
        >
          [ {ctaText} ]
        </button>
      </div>
    </div>
  );
};
