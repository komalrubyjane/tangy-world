import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAudio } from '../../audio/AudioContext';

const COLLABORATION_TRACKS = [
  {
    id: 'vendors',
    title: 'VENDOR COLLABORATION',
    category: 'FOOD, CRAFT & PRINT ARTISANS',
    path: '/apply/vendors',
    bg: '#E7D7AC',
    text: '#17120D',
    image: '/media/gallery/tangy2.jpg',
    desc: 'Bring your handcrafted food, clay chai, vintage printmaking, or artisanal products to our heritage sessions.',
    perks: ['Direct access to 300+ cultural enthusiasts', 'Featured in printed session programmes', 'Dedicated vintage stall space']
  },
  {
    id: 'sponsors',
    title: 'SPONSOR PARTNERSHIPS',
    category: 'BRAND & CULTURAL PATRONS',
    path: '/apply/sponsors',
    bg: '#191410',
    text: '#E7D5A4',
    image: '/media/gallery/tangy1.jpg',
    desc: 'Align your brand with independent music preservation, authentic storytelling, and ancient monument revival.',
    perks: ['Title & stage naming rights', 'Custom audio-visual brand integration', 'VIP inner circle hospitality']
  },
  {
    id: 'venue-host',
    title: 'VENUE & HERITAGE HOSTING',
    category: 'STEPWELLS, PALACES & HAVELIS',
    path: '/apply/venue-host',
    bg: '#315B66',
    text: '#E7D5A4',
    image: '/media/gallery/tangy9.jpg',
    desc: 'Transform your historic property, courtyard, or monument into a pulsating sanctuary of unamplified sound.',
    perks: ['Full acoustic structural assessment', 'Zero structural impact guarantee', 'National media & documentary spotlight']
  }
];

export const CollaborateOpportunitiesPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/collaborate" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO COLLABORATE</a>
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            TANGY PARTNERSHIPS // COLLABORATION DESK
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-9xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            EXPLORE<br/>OPPORTUNITIES
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            WE COLLABORATE WITH CRAFT VENDORS, CULTURAL SPONSORS, HERITAGE VENUES, AND INDEPENDENT CREATIVES TO BUILD IMMERSIVE MUSIC EXPERIENCES.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-10 sm:gap-14">
        {COLLABORATION_TRACKS.map((track, idx) => (
          <div key={track.id} className="border-4 border-[#11100C] p-6 sm:p-10 shadow-[8px_8px_0px_#11100C] sm:shadow-[16px_16px_0px_#11100C] relative overflow-hidden" style={{ backgroundColor: track.bg, color: track.text }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-current pb-3 mb-6 font-mono text-[10px] sm:text-xs font-bold uppercase gap-1">
              <span>PATHWAY NO. 0{idx + 1} // {track.category}</span>
              <span>HYDERABAD ARCHIVE</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center">
              <div className="md:col-span-1 w-full aspect-[4/3] overflow-hidden border-2 border-current">
                <img src={track.image} alt={track.title} className="w-full h-full object-cover filter grayscale contrast-125 hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="md:col-span-2 flex flex-col justify-between h-full">
                <div>
                  <h2 className="display text-3xl sm:text-5xl mb-3 leading-tight">{track.title}</h2>
                  <p className="font-mono text-xs sm:text-sm leading-relaxed opacity-90 mb-6 border-l-4 border-current pl-4">{track.desc}</p>
                  <div className="mb-6">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider block mb-2 opacity-75">KEY BENEFITS:</span>
                    <ul className="flex flex-col gap-1.5 font-mono text-xs">
                      {track.perks.map((perk, i) => (
                        <li key={i} className="flex items-center gap-2"><span>✦</span><span>{perk}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => { playSFX('ticketClick'); navigate(track.path); }}
                  className="self-start px-6 py-3 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] font-mono text-xs font-bold uppercase tracking-widest border-2 border-[#11100C] transition-colors shadow-[4px_4px_0px_#11100C] active:scale-95"
                >
                  APPLY NOW →
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
};
