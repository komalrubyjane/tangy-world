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
  const tlRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const isRight = position === 'bottom-right';
  const edgeSign = isRight ? 1 : -1;

  // Open when the parent asks us to.
  useEffect(() => {
    if (isOpen && phase === 'closed') setPhase('entering');
  }, [isOpen, phase]);

  // If the parent forcibly closes us mid-flight, exit gracefully instead of
  // snapping away.
  useEffect(() => {
    if (!isOpen && (phase === 'entering' || phase === 'open')) setPhase('exiting');
  }, [isOpen, phase]);

  // Entrance animation.
  useEffect(() => {
    if (phase !== 'entering') return undefined;
    tlRef.current?.kill();

    if (reducedMotion) {
      gsap.set(charRef.current, { opacity: 0, xPercent: 0 });
      gsap.set(paperRef.current, { opacity: 0, scaleY: 1, x: 0, clipPath: 'inset(0 0 0% 0)' });
      tlRef.current = gsap
        .timeline({ onComplete: () => setPhase('open') })
        .to([charRef.current, paperRef.current], { opacity: 1, duration: 0.25, ease: 'power1.out' });
    } else {
      gsap.set(charRef.current, { xPercent: edgeSign * 160, opacity: 0 });
      gsap.set(paperRef.current, { opacity: 0, scaleY: 0.35, x: edgeSign * 30, clipPath: 'inset(0 0 60% 0)' });
      tlRef.current = gsap
        .timeline({ onComplete: () => setPhase('open') })
        .to(charRef.current, { xPercent: 0, opacity: 1, duration: 0.55, ease: 'power3.out' })
        .to(
          paperRef.current,
          { opacity: 1, scaleY: 1, x: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.5, ease: 'back.out(1.4)' },
          '-=0.15'
        );
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
      tlRef.current = gsap
        .timeline({ onComplete: finish })
        .to(paperRef.current, { opacity: 0, scaleY: 0.3, clipPath: 'inset(0 0 60% 0)', duration: 0.3, ease: 'power2.in' })
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
    onView?.(announcement);
    if (announcement?.destination) navigate(announcement.destination);
    handleManualClose();
  };

  if (phase === 'closed' || !announcement) return null;

  const imgSrc = CHARACTER_IMAGES[character] || CHARACTER_IMAGES.violinist;
  const ctaText = getCtaText(announcement);

  return (
    <div
      className={`fixed z-[500] bottom-4 md:bottom-8 ${isRight ? 'right-3 md:right-8' : 'left-3 md:left-8'} flex ${
        isRight ? 'flex-row-reverse' : 'flex-row'
      } items-end gap-2 md:gap-4 pointer-events-none max-w-[calc(100vw-1.5rem)]`}
    >
      <img
        ref={charRef}
        src={imgSrc}
        alt=""
        className="h-28 md:h-44 w-auto drop-shadow-[6px_6px_0_rgba(0,0,0,0.5)] pointer-events-none select-none"
      />
      <div
        ref={paperRef}
        style={{ transformOrigin: isRight ? 'bottom right' : 'bottom left' }}
        className="pointer-events-auto relative w-[240px] md:w-[300px] bg-[#F3E7C9] text-[#191410] border-2 border-[#191410] shadow-[6px_6px_0_#11100C] p-4 -rotate-1"
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
        <h4 className="font-display text-lg md:text-xl font-bold leading-tight mb-1">{announcement.title}</h4>
        <p className="text-xs md:text-sm font-serif leading-snug mb-3 opacity-90">{announcement.description}</p>
        <button
          onClick={handleView}
          className="w-full py-2 bg-[#C99A2E] text-[#11100C] text-[10px] font-bold uppercase tracking-wider border-2 border-[#191410] hover:bg-[#191410] hover:text-[#C99A2E] transition-colors"
        >
          [ {ctaText} ]
        </button>
      </div>
    </div>
  );
};
