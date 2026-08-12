import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';

const VENUES = [
  {
    id: 'bansilalpet',
    name: 'BANSILALPET STEPWELL',
    type: '17TH CENTURY STEPWELL',
    year: '1670 AD',
    location: 'SECUNDERABAD, HYDERABAD',
    image: '/media/gallery/tngy7.jpg',
    sessions: '14 SESSIONS',
    reverb: '2.4 SEC NATURAL REVERB',
    desc: 'A forgotten 17th-century stepwell excavated from rubble. Its tiered granite steps create a natural acoustic amphitheatre. Sub-bass frequencies reflect off 350-year-old limestone walls without any amplification.'
  },
  {
    id: 'taramati',
    name: 'TARAMATI BARADARI',
    type: 'HISTORIC ACOUSTIC PAVILION',
    year: '1680 AD',
    location: 'IBRAHIM BAGH, HYDERABAD',
    image: '/media/gallery/tangy2.jpg',
    sessions: '9 SESSIONS',
    reverb: 'OPEN-AIR HILLTOP RESONANCE',
    desc: 'Built so that courtesan Taramati\'s singing could be heard at Golconda Fort 2 miles away. Twelve arched openings project sound across the valley — we never plug in an amplifier here.'
  },
  {
    id: 'haveli',
    name: 'OLD CITY HAVELI COURTYARD',
    type: 'PRIVATE NIZAM-ERA COURTYARD',
    year: '1890 AD',
    location: 'CHARMINAR LANE, HYDERABAD',
    image: '/media/gallery/tangy3.jpg',
    sessions: '11 SESSIONS',
    reverb: 'WARM INTIMATE STONE TONE',
    desc: 'A private 130-year-old Nizam-era courtyard sheltered by carved teakwood pillars and Belgian glass lanterns. The neem trees muffle the city and leave only music in the air.'
  }
];

export const Spaces = () => {
  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (isMobile) {
      // Simple fade-in on mobile, no pinning
      gsap.from('.venue-mobile-card', {
        opacity: 0,
        y: 50,
        stagger: 0.15,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 78%',
          toggleActions: 'play none none none'
        }
      });
      return;
    }

    // Desktop: cinematic hero + pinned card reveal
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=300%',
        scrub: 0.5,
        pin: true,
        anticipatePin: 1
      }
    });

    tl.to('.heritage-title', {
      scale: 1.5,
      opacity: 0,
      ease: 'power2.inOut',
      duration: 1
    }, 0)
    .fromTo('.heritage-bg',
      { scale: 1, filter: 'contrast(110%) brightness(75%)' },
      { scale: 1.25, filter: 'contrast(125%) brightness(95%)', ease: 'none', duration: 2.5 }, 0
    )
    .fromTo('.heritage-card',
      { opacity: 0, y: 80, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 1 }, 1.2
    );

  }, []);

  return (
    <>
      {/* DESKTOP: Cinematic Pinned Hero Section */}
      <section ref={sectionRef} id="spaces" className="relative w-full h-screen overflow-hidden bg-[#59613A] hidden lg:block">
        <img
          src="/media/gallery/tngy7.jpg"
          alt="Bansilalpet Stepwell"
          loading="eager"
          decoding="async"
          className="heritage-bg absolute inset-0 w-full h-full object-cover origin-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#11100C]/80 via-[#59613A]/40 to-[#11100C]/90 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-multiply pointer-events-none" />

        {/* Typography */}
        <div className="heritage-title absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-4 text-center">
          <p className="font-mono text-tangy-mustard text-xs tracking-[0.4em] uppercase mb-4 font-bold">
            ARCHITECTURAL RESONANCE // 1970s ARCHIVE
          </p>
          <h2 className="display text-[9vw] leading-[0.85] tracking-tighter text-[#E3D4AC] drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] ink-bleed">
            WHERE<br/>
            <span className="italic text-tangy-mustard font-normal">HERITAGE</span><br/>
            MEETS MUSIC.
          </h2>
        </div>

        {/* Heritage Card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none px-4">
          <div className="heritage-card bg-[#E3D4AC] p-14 border-4 border-[#11100C] text-center max-w-2xl pointer-events-auto opacity-0 shadow-[20px_20px_0px_#11100C] text-[#11100C]">
            <p className="font-mono text-[11px] tracking-[0.3em] text-tangy-orange mb-4 font-bold uppercase">17TH CENTURY MONUMENT</p>
            <h3 className="display text-6xl text-[#11100C] mb-6 ink-bleed">BANSILALPET<br/>STEPWELL</h3>
            <p className="font-body text-[#11100C]/90 text-lg leading-relaxed mb-8 border-l-2 border-tangy-orange pl-4">
              Resurrected through acoustic sub-frequencies and community gathering. We don't build stages; we collaborate with ancient stone.
            </p>
            <div className="font-mono text-[10px] tracking-widest text-[#11100C] border-t-2 border-[#11100C] pt-4 font-bold uppercase flex justify-between">
              <span>HYDERABAD · INDIA</span>
              <span>SESSION 014</span>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE: Static Venue Cards Stack */}
      <section id="spaces-mobile" className="relative w-full bg-[#11100C] text-[#E7D5A4] py-16 px-4 border-t-8 border-[#5A120D] lg:hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />

        <div className="relative z-10 text-center mb-10">
          <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.35em] font-bold uppercase block mb-2">
            ARCHITECTURAL RESONANCE
          </span>
          <h2 className="display text-4xl text-[#E7D5A4] leading-tight ink-bleed">
            WHERE<br/>
            <span className="italic text-[#C99A2E] font-normal">HERITAGE</span><br/>
            MEETS MUSIC.
          </h2>
        </div>

        <div className="flex flex-col gap-6 relative z-10">
          {VENUES.map((venue, idx) => (
            <div key={venue.id} className="venue-mobile-card bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C] overflow-hidden">
              <div className="w-full h-44 overflow-hidden relative">
                <img
                  src={venue.image}
                  alt={venue.name}
                  className="w-full h-full object-cover filter grayscale sepia-[0.3] contrast-125"
                />
                <div className="absolute top-2 left-2 bg-[#B94717] text-[#E7D5A4] font-mono text-[8px] px-2 py-0.5 font-bold uppercase">
                  {venue.type}
                </div>
                <div className="absolute bottom-2 right-2 bg-[#11100C] text-[#E7D5A4] font-mono text-[8px] px-2 py-0.5 font-bold">
                  {venue.sessions}
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#B94717] border-b border-[#11100C]/20 pb-2 mb-3 uppercase">
                  <span>{venue.year}</span>
                  <span>{venue.location}</span>
                </div>
                <h3 className="display text-2xl text-[#11100C] mb-2 leading-tight">{venue.name}</h3>
                <p className="font-mono text-[10px] text-[#B94717] font-bold uppercase mb-2">{venue.reverb}</p>
                <p className="font-body text-xs text-[#11100C]/85 leading-relaxed">{venue.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
