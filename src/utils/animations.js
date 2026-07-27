import gsap from 'gsap';

export const EASES = {
  cinematic: 'power2.inOut',
  slowReveal: 'power3.out',
  micDrop: 'back.out(2.2)',
  micSwing: 'sine.inOut'
};

export const sequenceReveal = (sectionRef, itemsRef, opts = {}) => {
  if (!itemsRef.current.length) return null;
  
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: sectionRef.current,
      start: 'top top',
      end: opts.end || '+=200%',
      scrub: 1,
      pin: true,
      anticipatePin: 1
    }
  });

  const seg = 1 / itemsRef.current.length;
  
  itemsRef.current.forEach((el, idx) => {
    const start = idx * seg;
    const y = opts.y !== undefined ? opts.y : 30;
    const scaleFrom = opts.scaleFrom !== undefined ? opts.scaleFrom : 0.9;
    const scaleTo = opts.scaleTo !== undefined ? opts.scaleTo : 1.08;
    const inFrac = opts.inFrac || 0.32;
    const outFrac = opts.outFrac || 0.28;
    const holdTo = opts.holdTo !== undefined ? opts.holdTo : 0.62;

    tl.fromTo(el,
      { opacity: 0, y, scale: scaleFrom },
      { opacity: 1, y: 0, scale: 1, duration: seg * inFrac, ease: EASES.slowReveal },
      start
    ).to(el,
      { opacity: 0, y: -y, scale: scaleTo, duration: seg * outFrac, ease: 'power2.in' },
      start + seg * holdTo
    );
  });

  return tl;
};
