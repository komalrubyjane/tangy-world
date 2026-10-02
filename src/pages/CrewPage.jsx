import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SectionNav } from '../components/layout/SectionNav';
import { CrewApplicationForm } from '../components/crew/CrewApplicationForm';

export const CrewPage = () => {
  const navigate = useNavigate();

  const volunteerRoles = [
    { title: "PHOTOGRAPHY", icon: "📷", desc: "Capture 16mm film atmosphere, stage action, and intimate audience moments." },
    { title: "VIDEOGRAPHY", icon: "🎥", desc: "Document live performances and behind-the-scenes interviews." },
    { title: "BACKSTAGE & ARTIST CARE", icon: "🎙️", desc: "Manage artist greenrooms, acoustic instruments, and stage timelines." },
    { title: "PRODUCTION & SOUND", icon: "🎛️", desc: "Assist audio engineers with microphone placement and subwoofer rigs." },
    { title: "TICKETING & RECEPTION", icon: "🎟️", desc: "Welcome guests, hand out vintage screenprinted tickets, and stamp passports." },
    { title: "SOCIAL MEDIA & DISPATCH", icon: "📱", desc: "Broadcast live pop-up clues and real-time session dispatches." }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-[100dvh] bg-[#4A171D] text-[#ecdcaf] font-sans antialiased overflow-x-hidden pt-16 pb-20 select-none textileTexture"
    >
      <Navbar onOpenProgramme={() => navigate('/')} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* HERO BANNER */}
        <div id="volunteer" className="w-full bg-[#181614] border-2 border-[#ecdcaf] p-6 sm:p-8 shadow-[4px_4px_0px_#191410] mb-10 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              JOIN THE TANGY CREW // RECRUITMENT DESK
            </span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] leading-none my-1">
              BEHIND THE SCENES
            </h1>
            <p className="font-mono text-xs text-[#ecdcaf]/80 max-w-2xl">
              Help build the nights, the stories, and everything that happens between them inside Hyderabad's heritage sanctuaries.
            </p>
          </div>

          <div className="bg-[#B5532A] text-[#ecdcaf] p-3 font-mono text-xs font-bold border border-[#ecdcaf] shadow-md -rotate-2">
            SEASON 2026 RECRUITMENT OPEN
          </div>
        </div>

        <SectionNav section="Crew" className="mb-10" />

        {/* VOLUNTEER ROLES GRID */}
        <div className="mb-12">
          <div className="text-left mb-6">
            <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">01 // CREW PATHWAYS & ROLES</span>
            <h2 className="font-poster text-3xl text-[#ecdcaf]">SELECT YOUR SPECIALIZATION</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {volunteerRoles.map((role, idx) => (
              <div 
                key={idx}
                className="bg-[#EFE2C0] paperTexture text-[#191410] p-5 border-2 border-[#191410] shadow-[4px_4px_0px_#191410] flex flex-col text-left justify-between group hover:-translate-y-1 transition-transform"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl">{role.icon}</span>
                    <span className="font-mono text-[9px] font-bold text-[#c2272a]">ROLE #{idx+1}</span>
                  </div>
                  <h3 className="font-poster text-xl text-[#191410] my-1">{role.title}</h3>
                  <p className="font-mono text-xs text-[#191410]/80 leading-relaxed">{role.desc}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-[#191410]/20 font-mono text-[9px] font-bold text-[#c2272a]">
                  ✦ RECRUITING NOW
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRODUCTION TEAM SECTION */}
        <div id="production" className="mb-12 bg-[#181614] border-2 border-[#ecdcaf] p-6 sm:p-8 shadow-[4px_4px_0px_#191410] text-left">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase block mb-1">
            02 // PRODUCTION TEAM
          </span>
          <h2 className="font-poster text-3xl text-[#ecdcaf] mb-4">ANALOG AUDIO &amp; LIGHTING CREW</h2>
          <p className="font-mono text-xs text-[#ecdcaf]/80 leading-relaxed mb-4 max-w-3xl">
            Our production team handles vintage ribbon microphones, custom subwoofer rigs, acoustic baffling, and warm tungsten lighting setups tailored for ancient stone monuments.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-[#211915] p-3 border border-[#ecdcaf]/30">
              <span className="text-[#c2272a] font-bold block mb-1">AUDIO ENGINEERING</span>
              <span className="text-[#ecdcaf]/70">Sub-bass calibration &amp; room acoustic resonance mapping.</span>
            </div>
            <div className="bg-[#211915] p-3 border border-[#ecdcaf]/30">
              <span className="text-[#c2272a] font-bold block mb-1">LIGHTING DIRECTION</span>
              <span className="text-[#ecdcaf]/70">Warm vintage candlelight and low-voltage architectural spots.</span>
            </div>
            <div className="bg-[#211915] p-3 border border-[#ecdcaf]/30">
              <span className="text-[#c2272a] font-bold block mb-1">TAPE RECORDING</span>
              <span className="text-[#ecdcaf]/70">Live 2-track analogue magnetic tape capture.</span>
            </div>
          </div>
        </div>

        {/* STAGE OPERATIONS SECTION */}
        <div id="stage" className="mb-12 bg-[#EFE2C0] paperTexture text-[#191410] border-2 border-[#191410] p-6 sm:p-8 shadow-[4px_4px_0px_#191410] text-left">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase block mb-1">
            03 // STAGE OPERATIONS
          </span>
          <h2 className="font-poster text-3xl text-[#191410] mb-4">HERITAGE STAGE LOGISTICS</h2>
          <p className="font-mono text-xs text-[#191410]/80 leading-relaxed mb-4 max-w-3xl">
            Operating inside 350-year-old stepwells requires zero structural impact. Our stage crew ensures instrument safety, artist hospitality, and seamless show flow.
          </p>
        </div>

        {/* APPLY NOW FORM */}
        <div id="apply" className="bg-[#181614] border-2 border-[#ecdcaf] p-6 sm:p-10 shadow-[4px_4px_0px_#191410] text-left">
          <div className="mb-6">
            <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">04 // CREW APPLICATION FORM</span>
            <h2 className="font-poster text-3xl text-[#ecdcaf]">SUBMIT YOUR APPLICATION</h2>
          </div>

          <CrewApplicationForm />
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
