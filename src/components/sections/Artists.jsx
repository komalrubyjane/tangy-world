import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { artists } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { MusicManuscriptPattern, SoundWaveGraphic } from '../ui/BackgroundDecorations';

export const Artists = ({ onArtistSubmit }) => {
  const { playSFX } = useAudio();

  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: isMobile ? 'top 80%' : 'top top',
        end: isMobile ? '+=50%' : '+=400%',
        scrub: 0.5,
        pin: !isMobile,
        anticipatePin: isMobile ? 0 : 1
      }
    });

    const artistBlocks = gsap.utils.toArray('.artist-record-block');

    artistBlocks.forEach((block, i) => {
      tl.fromTo(block,
        { opacity: 0, xPercent: 100, scale: 0.8 },
        { opacity: 1, xPercent: 0, scale: 1, duration: 1, ease: 'power2.out' }
      );

      if (i < artistBlocks.length - 1) {
        tl.to(block, { opacity: 0, xPercent: -100, scale: 0.8, duration: 1, ease: 'power2.in' }, '+=0.5');
      }
    });

  }, []);

  return (
    <section ref={sectionRef} id="artists" className="relative w-full h-screen bg-[#5A120D] text-[#E7D5A4] overflow-hidden flex items-center justify-center border-t-8 border-[#11100C]">
      
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-multiply pointer-events-none z-0" />

      {/* 5-LINE MUSIC MANUSCRIPT STAFF PATTERN */}
      <MusicManuscriptPattern opacity={0.06} color="#E7D5A4" />

      {/* ANALOG SOUND WAVE FREQUENCY GRAPHIC */}
      <SoundWaveGraphic color="#E7D5A4" opacity={0.20} className="absolute right-6 top-1/2 -translate-y-1/2 w-64 md:w-80 h-[80%] hidden md:block" />

      {/* Header */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20 pointer-events-none">
        <p className="font-mono text-tangy-mustard text-[10px] tracking-[0.3em] font-bold uppercase">COLLECTIBLE VINYL ROSTER</p>
        <h2 className="display text-5xl md:text-7xl text-[#E7D5A4]">TANGY RECORDS</h2>
      </div>

      {artists.map((artist, i) => (
        <div key={artist.id} className="artist-record-block absolute inset-0 flex items-center justify-center opacity-0 px-6 md:px-20 pointer-events-none z-10">
          <div className="max-w-[1100px] w-full flex flex-col md:flex-row items-center gap-10 md:gap-16 pointer-events-auto bg-[#E7D5A4] p-8 md:p-12 border-4 border-[#11100C] shadow-[20px_20px_0px_#11100C] relative text-[#11100C]">
            
            {/* Record Sleeve & Sliding Vinyl Record on Hover */}
            <div className="w-full md:w-1/2 relative group cursor-pointer" data-cursor="LISTEN">
              
              {/* Vinyl Record sliding out behind sleeve on hover */}
              <div className="absolute top-0 right-0 w-[85%] aspect-square rounded-full bg-[#11100C] border-4 border-[#222] shadow-2xl flex items-center justify-center group-hover:translate-x-12 transition-transform duration-500 z-0">
                <div className="w-[40%] h-[40%] rounded-full bg-[#B94717] border-2 border-tangy-mustard flex items-center justify-center font-mono text-[7px] text-[#E7D5A4] font-bold">
                  SIDE A
                </div>
              </div>

              {/* Record Sleeve Front */}
              <div className="relative z-10 w-full aspect-square bg-[#11100C] p-3 border-2 border-[#11100C] shadow-xl overflow-hidden">
                <img src={artist.image} alt={artist.name} className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute top-4 left-4 bg-[#C99A2E] text-[#11100C] px-2 py-0.5 font-mono text-[8px] font-bold tracking-widest">
                  TR-00{artist.id}
                </div>
                <div className="absolute bottom-4 right-4 bg-[#11100C] text-[#E7D5A4] px-3 py-1 font-mono text-[9px] font-bold tracking-widest border border-[#E7D5A4]">
                  33⅓ RPM
                </div>
              </div>
            </div>

            {/* Sleeve Editorial Copy */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div className="flex justify-between items-baseline border-b-2 border-[#11100C] pb-2 mb-4">
                <span className="font-mono text-xs font-bold tracking-widest text-[#B94717] uppercase">{artist.genre}</span>
                <span className="font-mono text-[10px] opacity-70 uppercase">{artist.location}</span>
              </div>

              <h3 className="display text-5xl md:text-7xl text-[#11100C] leading-none mb-4 ink-bleed">
                {artist.name.toUpperCase()}
              </h3>

              <p className="font-body text-base md:text-lg text-[#11100C]/90 leading-relaxed mb-6 italic border-l-2 border-[#B94717] pl-4">
                "{artist.bio}"
              </p>

              <div className="font-mono text-[10px] tracking-widest text-[#11100C] border-t-2 border-[#11100C] pt-4 flex justify-between items-center">
                <span>PERFORMANCES: {artist.performances}</span>
                <button 
                  onClick={onArtistSubmit}
                  className="btn-ticket"
                >
                  SUBMIT YOUR SOUND →
                </button>
              </div>
            </div>

          </div>
        </div>
      ))}

    </section>
  );
};
