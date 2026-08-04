import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { useAudio } from '../../audio/AudioContext';
import { SoundWaveGraphic } from '../ui/BackgroundDecorations';

export const PrivateSessions = ({ onRequestPrivate }) => {
  const { playSFX } = useAudio();

  const sectionRef = useGSAPContext((ctx) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%'
      }
    });

    // 1. Header & Watermark Reveal
    tl.fromTo('.private-header',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
    )

    // 2. Central Invitation Rises
    .fromTo('.private-invitation',
      { y: 80, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, 0.2
    )

    // 3. Surrounding Archival Photos Enter
    .fromTo('.private-photo-1',
      { x: -60, opacity: 0, rotation: -8 },
      { x: 0, opacity: 1, rotation: -4, duration: 0.7, ease: 'back.out(1.2)' }, 0.4
    )
    .fromTo('.private-photo-2',
      { x: 60, opacity: 0, rotation: 8 },
      { x: 0, opacity: 1, rotation: 4, duration: 0.7, ease: 'back.out(1.2)' }, 0.5
    )

    // 4. Wax Seal Appears Last
    .fromTo('.wax-seal',
      { scale: 2, opacity: 0, rotation: -30 },
      { scale: 1, opacity: 1, rotation: -6, duration: 0.5, ease: 'bounce.out', onStart: () => playSFX('ticketClick') }, 0.8
    );

  }, []);

  const handleRequestClick = () => {
    playSFX('ticketClick');
    if (onRequestPrivate) {
      onRequestPrivate();
    } else {
      document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      ref={sectionRef} 
      id="private-sessions" 
      className="relative w-full py-28 md:py-36 bg-[#4A2638] text-[#E7D7AC] overflow-hidden border-t-8 border-[#E7D7AC]"
    >
      
      {/* SOFT NOISE & PAPER FIBER TEXTURE */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-overlay pointer-events-none z-0" />

      {/* ANALOG SOUND WAVE FREQUENCY GRAPHIC */}
      <SoundWaveGraphic color="#E7D7AC" opacity={0.15} className="absolute left-6 top-1/2 -translate-y-1/2 w-64 md:w-80 h-[80%] hidden md:block" />

      {/* CROP MARKS & ARCHIVE LABELS */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#C69A32] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // INVITATION NO. 08-P
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#E7D7AC]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        TANGY PRIVATE SESSIONS // HYDERABAD
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#E7D7AC]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: PERFECT PRINT ALIGNMENT
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#C69A32] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        BY INVITATION ONLY ✦ 33⅓ RPM
      </div>

      {/* OVERSIZED BACKGROUND SCREEN-PRINTED WATERMARK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.08]">
        <span className="display text-[25vw] leading-none text-[#351B29] uppercase">BY INVITATION</span>
      </div>

      {/* SECTION HEADER */}
      <div className="private-header max-w-4xl mx-auto text-center px-6 relative z-20 mb-16 md:mb-20">
        <span className="font-mono text-[10px] md:text-xs font-bold text-[#C69A32] tracking-[0.35em] uppercase mb-2 block">
          PRIVATE EXPERIENCES // BY TANGY
        </span>
        <h2 className="display text-6xl md:text-9xl text-[#E7D7AC] leading-none ink-bleed mb-4">
          PRIVATE<br/>SESSIONS
        </h2>
        <p className="font-mono text-xs md:text-sm text-[#E7D7AC]/90 tracking-[0.3em] uppercase border-y-2 border-[#17120D] py-2 inline-block px-6 bg-[#351B29]/80 backdrop-blur-xs">
          YOUR SPACE. OUR SOUND. ONE NIGHT THAT'S YOURS.
        </p>
      </div>

      {/* MAIN INVITATION CARD & SURROUNDING POLAROIDS */}
      <div className="max-w-[1100px] mx-auto px-6 relative z-20 flex flex-col items-center">
        
        {/* SURROUNDING ARCHIVAL PHOTO 1 */}
        <div className="private-photo-1 absolute -top-8 left-0 md:left-4 z-10 pointer-events-none hidden md:block">
          <div className="w-[180px] bg-[#E7D7AC] p-2.5 pb-9 border-2 border-[#17120D] shadow-[15px_15px_40px_rgba(0,0,0,0.8)] rotate-[-4deg]">
            <img src="/media/gallery/tangy9.jpg" alt="Your Place" className="w-full aspect-[4/3] object-cover filter grayscale sepia-[0.35]" />
            <p className="absolute bottom-2.5 left-3 font-mono text-[8px] text-[#17120D] font-bold">✎ YOUR SPACE</p>
          </div>
        </div>

        {/* SURROUNDING ARCHIVAL PHOTO 2 */}
        <div className="private-photo-2 absolute -bottom-8 right-0 md:right-4 z-10 pointer-events-none hidden md:block">
          <div className="w-[190px] bg-[#E7D7AC] p-2.5 pb-9 border-2 border-[#17120D] shadow-[15px_15px_40px_rgba(0,0,0,0.8)] rotate-[4deg]">
            <img src="/media/gallery/tangy3.jpg" alt="Our People" className="w-full aspect-[4/3] object-cover filter grayscale sepia-[0.35]" />
            <p className="absolute bottom-2.5 left-3 font-mono text-[8px] text-[#17120D] font-bold">✎ OUR PEOPLE</p>
          </div>
        </div>

        {/* CENTRAL VINTAGE INVITATION CARD WITH LETTERPRESS DOUBLE-LINE BORDER */}
        <div className="private-invitation w-full max-w-[800px] bg-[#E7D7AC] text-[#17120D] p-8 md:p-16 border-8 border-double border-[#17120D] shadow-[25px_25px_0px_#17120D] relative flex flex-col justify-between text-center">
          
          {/* VINTAGE GRAPHIC WAX SEAL */}
          <div className="wax-seal absolute -top-6 -right-6 w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#651D2D] border-4 border-[#17120D] shadow-xl flex items-center justify-center z-40 rotate-[-6deg]">
            <div className="w-[82%] h-[82%] rounded-full border-2 border-[#C69A32] flex items-center justify-center">
              <span className="font-display text-2xl md:text-3xl text-[#E7D7AC] font-bold leading-none">T</span>
            </div>
          </div>

          {/* Invitation Top Header */}
          <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#4A2638] border-b-2 border-[#17120D] pb-4 mb-8 uppercase">
            <span>TANGY PRIVATE SESSIONS</span>
            <span>HYDERABAD // BY INVITATION</span>
          </div>

          {/* Invitation Body */}
          <div className="my-auto">
            <h3 className="display text-5xl md:text-7xl text-[#17120D] leading-none mb-4 ink-bleed">
              MAKE THE NIGHT<br/>YOUR OWN.
            </h3>

            {/* GOLD FLOURISH RULE */}
            <div className="font-mono text-xs font-bold text-[#C69A32] my-4 tracking-widest uppercase">
              ─────── ✦ ───────
            </div>

            <p className="font-body text-base md:text-xl text-[#17120D]/90 leading-relaxed italic max-w-xl mx-auto mb-8 border-y-2 border-[#17120D]/20 py-4">
              "Some performances aren't announced. They're created exclusively for those who ask."
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-10 font-mono text-[9px] font-bold text-[#17120D] uppercase">
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1">PRIVATE GATHERINGS</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1">HOUSE SESSIONS</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1">BRAND EXPERIENCES</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1">SPECIAL VENUES</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="w-full">
            <a 
              href="/private-sessions" 
              className="btn-ticket w-full text-center block !bg-[#4A2638] !text-[#E7D7AC] hover:!bg-[#C69A32] hover:!text-[#17120D] font-mono text-xs font-bold uppercase tracking-widest py-3.5"
            >
              PRIVATE SESSIONS → VIEW MORE
            </a>
          </div>

        </div>

      </div>

    </section>
  );
};
