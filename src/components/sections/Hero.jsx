import { useEffect, useRef, useState } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useAudio } from '../../audio/AudioContext';
import { useLenis } from '../layout/LenisProvider';

// The rotating cast. hero-performer-6-main MUST stay at index 0 — it is the
// first frame every visitor sees. WebP variants live in /media/opt; the PNGs
// are the fallback.
const PERFORMERS = [
  { key: '6-main', alt: 'Illustrated performer striding forward in wide flared trousers' },
  { key: '1-violinist', alt: 'Illustrated violinist in a white dress' },
  { key: '2-guitarist', alt: 'Illustrated guitarist playing a red electric guitar' },
  { key: '3-veena', alt: 'Illustrated veena player seated in a white sari' },
  { key: '4-kathak', alt: 'Illustrated Kathak dancer mid-turn' },
  { key: '5-hiphop', alt: 'Illustrated hip-hop dancer in a blue hoodie' },
  { key: '7-women', alt: 'Illustrated performer with hennaed hands raised' },
];
const FRAME_MS = 4500;
const pad2 = (n) => String(n).padStart(2, '0');

// Left side of the cover: one performer at a time, replaced like a print in
// an archive drawer (old fades out; new fades in, rises 10px, settles).
// - One interval, cleaned up on unmount; paused while the hero is off-screen
//   or the tab is hidden.
// - Never advances to a frame whose image hasn't loaded, so there is no
//   blank frame on slow connections — it simply waits a tick.
// - Only frame 01 loads eagerly; the rest mount after it (they preload at
//   opacity 0 in the same stack, so switching never re-decodes).
// - prefers-reduced-motion: frames still change, but as a short plain fade
//   with no movement or scale (handled in animations.css).
function HeroPerformerStage({ className = '' }) {
  const [active, setActive] = useState(0);
  const [mountRest, setMountRest] = useState(false);
  const imgRefs = useRef([]);
  const stageRef = useRef(null);

  // Mount frames 02–07 once frame 01 is in (with a fallback in case its
  // load event fired before React attached the handler).
  useEffect(() => {
    const t = setTimeout(() => setMountRest(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mountRest) return undefined;
    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; });
    if (stageRef.current) io.observe(stageRef.current);

    const id = setInterval(() => {
      if (!onScreen || document.hidden) return;
      setActive((i) => {
        const next = (i + 1) % PERFORMERS.length;
        const img = imgRefs.current[next];
        return img && img.complete && img.naturalWidth > 0 ? next : i;
      });
    }, FRAME_MS);

    return () => {
      clearInterval(id);
      io.disconnect();
    };
  }, [mountRest]);

  return (
    <figure ref={stageRef} className={`hero-stage relative m-0 flex flex-col ${className}`}>
      <div className="relative flex-1 min-h-0 w-full">
        {PERFORMERS.map((p, i) => {
          if (i > 0 && !mountRest) return null;
          const isActive = i === active;
          return (
            <picture key={p.key} className={`performer-frame ${isActive ? 'is-active' : ''}`} aria-hidden={!isActive}>
              <source srcSet={`/media/opt/performer-${p.key}.webp`} type="image/webp" />
              <img
                ref={(el) => { imgRefs.current[i] = el; }}
                src={`/media/hero-performer-${p.key}.png`}
                alt={isActive ? p.alt : ''}
                fetchPriority={i === 0 ? 'high' : 'low'}
                decoding="async"
                onLoad={i === 0 ? () => setMountRest(true) : undefined}
                className="block w-full h-full object-contain object-bottom lg:object-[72%_100%] select-none"
                draggable="false"
              />
            </picture>
          );
        })}
      </div>
      <figcaption className="archiveMetadata !text-[10px] lg:!text-[0.6875rem] text-[#EFE2C0]/55 mt-1.5 lg:mt-3 flex items-center gap-2 justify-center lg:justify-start" aria-hidden="true">
        <span className="w-6 h-px bg-[#EFE2C0]/30" />
        <span>Archive frame <span className="text-[#C89D35] tabular-nums">{pad2(active + 1)}</span> / {pad2(PERFORMERS.length)}</span>
      </figcaption>
    </figure>
  );
}

// 01 — COVER. An editorial split cover: the people and the music on the
// left (a rotating cast of performers), the archive and the brand on the
// right (masthead, standfirst, calls to action). Only the performer changes;
// type and metadata stay still. Scrolling drives the audio low-pass sweep.
export const Hero = () => {
  const { setFilterCutoff, playSFX } = useAudio();
  const lenis = useLenis();

  const sectionRef = useGSAPContext(() => {
    let impactTriggered = false;
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        setFilterCutoff(400 + self.progress * 12000);
        if (self.progress > 0.35 && self.progress < 0.45 && !impactTriggered) {
          playSFX('ticketClick');
          impactTriggered = true;
        } else if (self.progress < 0.25) {
          impactTriggered = false;
        }
      },
    });
  }, []);

  const scrollToSessions = (e) => {
    e.preventDefault();
    const el = document.getElementById('sessions');
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.1 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="hero theme-hero relative w-full overflow-hidden isolate min-h-[100svh] lg:h-[100svh] lg:min-h-[640px] flex flex-col lg:block pt-[58px] lg:pt-0 pb-[calc(var(--dock-space)+60px)] lg:pb-0"
    >
      {/* Printed-sheet chrome: an inset trim rule and four registration
          marks, as on a press proof of the cover. */}
      <div className="absolute inset-[10px] md:inset-[14px] top-[58px] md:top-[62px] border border-[#EFE2C0]/15 pointer-events-none" aria-hidden="true" />
      <span className="regMark left-[4px] top-[52px] md:left-[7px] md:top-[55px] text-[#EFE2C0]" aria-hidden="true"><i /></span>
      <span className="regMark right-[4px] top-[52px] md:right-[7px] md:top-[55px] text-[#EFE2C0]" aria-hidden="true"><i /></span>
      <span className="regMark left-[4px] bottom-[4px] md:left-[7px] md:bottom-[7px] text-[#EFE2C0]" aria-hidden="true"><i /></span>
      <span className="regMark right-[4px] bottom-[4px] md:right-[7px] md:bottom-[7px] text-[#EFE2C0]" aria-hidden="true"><i /></span>

      {/* MASTHEAD METADATA — top edge of the cover */}
      <div className="relative lg:absolute lg:inset-x-0 lg:top-[72px] z-20 pt-2 lg:pt-0">
        <div className="t-container">
          <div className="grid grid-cols-2 md:grid-cols-3 items-start gap-4 archiveMetadata text-[#EFE2C0]/85">
            <div>
              <div>Hyderabad, India</div>
              <div className="max-lg:[@media(max-height:720px)]:hidden">Est. 2016</div>
            </div>
            <div className="hidden md:block text-center tracking-[0.24em]">Live Music · Heritage · Culture</div>
            <div className="text-right">
              <div>Live Archive</div>
              <div className="max-lg:[@media(max-height:720px)]:hidden">Issue 001 · Side A</div>
            </div>
          </div>
          <hr className="archivalRule mt-3 text-[#EFE2C0]" />
          <div className="hidden lg:flex justify-between mt-2 archiveMetadata text-[#EFE2C0]/55">
            <span>Vol. 01</span>
            <span>33⅓ RPM · Stereo</span>
          </div>
        </div>
      </div>

      {/* THE SPLIT — performer left, archive/brand right. Below lg the right
          column becomes `contents` so its pieces and the performer stack in
          one intentional order: title → standfirst → performer → CTA. */}
      <div className="relative lg:absolute lg:inset-x-0 lg:top-[150px] lg:bottom-0 z-10 flex-1 flex flex-col">
        <div className="t-container flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:gap-x-6 lg:h-full">

          <HeroPerformerStage
            className="hero-in hero-in-late order-3 lg:order-none lg:col-span-6 lg:h-full lg:pt-[9svh] lg:pb-[calc(var(--dock-space)-8px)] mt-4 lg:mt-0 h-[clamp(200px,31svh,440px)] max-lg:[@media(max-height:720px)]:h-[clamp(165px,26svh,240px)]"
          />

          <div className="contents lg:flex lg:flex-col lg:justify-center lg:col-span-6 lg:col-start-7 lg:pb-[var(--dock-space)]">
            {/* MASTHEAD — the one typographic statement, with a single
                static vermilion misregistration layer. */}
            <h1
              className="hero-in order-1 lg:order-none m-0 mt-3 lg:mt-0 text-center lg:text-left font-display font-normal uppercase text-[#EFE2C0] leading-[0.82] select-none text-[clamp(3.5rem,22vw,8.5rem)] max-lg:[@media(max-height:720px)]:text-[min(22vw,11.5svh)] lg:text-[clamp(5rem,11.6vw,11.5rem)]"
            >
              <span className="relative block">
                <span className="absolute inset-0 text-[#C0392B]/50 translate-x-[0.02em] -translate-y-[0.016em] -z-10" aria-hidden="true">Tangy</span>
                Tangy
              </span>
              <span className="relative block">
                <span className="absolute inset-0 text-[#C0392B]/50 translate-x-[0.02em] -translate-y-[0.016em] -z-10" aria-hidden="true">Sessions</span>
                Sessions
              </span>
            </h1>

            {/* Standfirst — two lines, magazine-introduction voice */}
            <p className="hero-in order-2 lg:order-none mt-3 lg:mt-6 mb-0 mx-auto lg:mx-0 max-w-[30ch] text-center lg:text-left font-serif italic font-medium text-[#EFE2C0]/90 leading-[1.25] text-[clamp(1.15rem,4.6vw,1.45rem)] lg:text-[clamp(1.3rem,1.8vw,1.75rem)]">
              Live music, heritage spaces,<br />
              and stories worth remembering.
            </p>

            {/* Calls to action */}
            <div className="order-4 lg:order-none mt-4 lg:mt-7 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-x-6 gap-y-1">
              <a href="#sessions" onClick={scrollToSessions} className="t-btn t-btn-light">
                Upcoming sessions <span aria-hidden="true">↓</span>
              </a>
              <a href="/about" className="t-link py-2 text-[#EFE2C0]/85 hover:text-[#C89D35]">Our story</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
