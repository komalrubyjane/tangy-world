import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gallery } from '../data/mockData';
import { useAudio } from '../audio/AudioContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const VolunteerPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [submitted, setSubmitted] = useState(false);

  const roles = [
    { title: "PHOTOGRAPHY & 35MM FILM", desc: "Document the nights on analog film and vintage cameras." },
    { title: "VIDEOGRAPHY & 16MM REELS", desc: "Capture live performance video reels and backstage archives." },
    { title: "BACKSTAGE & PRODUCTION", desc: "Manage soundchecks, cabling, stage lighting, and ribbon mics." },
    { title: "ARTIST HOSPITALITY", desc: "Welcome resident musicians and host backstage chai tea rituals." },
    { title: "TICKETING & BOX OFFICE", desc: "Hand out perforated concert ticket stubs and collect passport stamps." },
    { title: "SOCIAL MEDIA & DISPATCH", desc: "Broadcast secret pop-up session invites to the community." }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    playSFX('ticketClick');
    setSubmitted(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-[#3c0f0e] text-[#ecdcaf] pt-16 pb-20 select-none text-left"
    >
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <div className="fixed inset-0 pointer-events-none z-[80] shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />

      <Navbar onOpenProgramme={() => navigate('/programme')} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* HERO */}
        <div className="w-full bg-[#191410] border-4 border-[#d1a437] p-8 shadow-[12px_12px_0px_#4c1210] mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              CREW RECRUITMENT DESK // VOLUNTEER CORPS
            </span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] leading-none my-1">
              JOIN THE TANGY CREW
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#d1a437] max-w-2xl">
              HELP BUILD THE NIGHTS, THE STORIES, AND EVERYTHING THAT HAPPENS BETWEEN THEM.
            </p>
          </div>

          <a 
            href="#volunteer-form"
            onClick={() => playSFX('ticketClick')}
            className="px-6 py-3.5 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all text-nowrap"
          >
            APPLY TO JOIN CREW ↓
          </a>
        </div>

        {/* VOLUNTEER ROLES */}
        <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase block mb-4">
            AVAILABLE CREW ROLES
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role, idx) => (
              <div key={idx} className="p-4 bg-[#ecdcaf] border-2 border-[#191410] flex flex-col gap-1">
                <span className="font-mono text-[9px] font-bold text-[#c2272a]">ROLE 0{idx+1}</span>
                <h3 className="font-poster text-xl text-[#191410]">{role.title}</h3>
                <p className="font-sans text-xs text-[#241a12]/80">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* VOLUNTEER STORIES & GALLERY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-[#191410] border-2 border-[#ecdcaf]/30 p-6 shadow-[6px_6px_0px_#191410] flex flex-col gap-4">
            <span className="font-mono text-[10px] font-bold text-[#d1a437] uppercase">VOLUNTEER STORIES</span>
            <blockquote className="p-4 bg-[#0d0a07] border-l-4 border-[#c2272a] font-serif italic text-xs text-[#ecdcaf]/90">
              "Being part of the Tangy crew at Bansilalpet Stepwell was magical. Standing backstage at 2 AM while sufi melodies echoed off stone steps changed how I hear live music."
              <span className="font-mono text-[9px] block text-[#d1a437] font-bold not-italic mt-2">— Rohit, Backstage Crew 2024</span>
            </blockquote>
          </div>

          <div className="bg-[#191410] border-2 border-[#ecdcaf]/30 p-6 shadow-[6px_6px_0px_#191410] flex flex-col gap-3">
            <span className="font-mono text-[10px] font-bold text-[#d1a437] uppercase">CREW ATMOSPHERE</span>
            <div className="grid grid-cols-3 gap-2">
              {gallery.slice(4, 7).map(img => (
                <img key={img.id} src={img.src} alt={img.label} className="w-full aspect-[4/3] object-cover border border-[#ecdcaf]/20" />
              ))}
            </div>
          </div>
        </div>

        {/* REGISTRATION FORM */}
        <div id="volunteer-form" className="w-full bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-8 shadow-[12px_12px_0px_#4c1210] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
            CREW REGISTRATION CARD // FILE 2026
          </span>
          <h2 className="font-poster text-3xl sm:text-4xl text-[#191410] my-1">APPLY FOR VOLUNTEER CREW</h2>

          {submitted ? (
            <div className="p-6 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold text-center border-2 border-[#191410] my-6">
              ✓ CREW APPLICATION FILED // WELCOME TO THE TANGY MOVEMENT!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <input type="text" required placeholder="FULL NAME" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="email" required placeholder="EMAIL ADDRESS" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="tel" required placeholder="PHONE (+91)" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="text" placeholder="COLLEGE / INSTITUTION" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="text" required placeholder="PREFERRED ROLE (Photography / Sound / Ticketing)" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] md:col-span-2 outline-none" />
              <textarea rows={4} required placeholder="RELEVANT EXPERIENCE & SKILLS" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] md:col-span-2 outline-none resize-none" />

              <button
                type="submit"
                className="md:col-span-2 py-4 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all"
              >
                SUBMIT VOLUNTEER REGISTRATION →
              </button>
            </form>
          )}
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
