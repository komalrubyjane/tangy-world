import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { artists, gallery } from '../data/mockData';
import { useAudio } from '../audio/AudioContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const ArtistPortalPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', instagram: '', spotify: '', youtube: '', genre: '', bio: '', portfolio: '', picture: ''
  });
  const [submitted, setSubmitted] = useState(false);

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
        
        {/* 1. LARGE HERO */}
        <div className="w-full bg-[#191410] border-4 border-[#d1a437] p-8 shadow-[12px_12px_0px_#4c1210] mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              ARTIST LINEAGE // AUDITION DESK
            </span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] leading-none my-1">
              BECOME A TANGY ARTIST
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#d1a437] max-w-2xl">
              BRING YOUR SOUND, YOUR STORY, AND YOUR RAW EMOTION TO ANCIENT STEPWELLS AND HERITAGE PAVILIONS.
            </p>
          </div>

          <a 
            href="#apply-artist-form"
            onClick={() => playSFX('ticketClick')}
            className="px-6 py-3.5 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all text-nowrap"
          >
            APPLY FOR AUDITIONS ↓
          </a>
        </div>

        {/* 2. ARTIST BENEFITS & INTRODUCTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { title: "HERITAGE ACOUSTICS", desc: "Perform inside 300-year-old stepwells & palaces with natural stone reverb." },
            { title: "2-TRACK MASTER VINYL", desc: "Live performances recorded directly to analog tape & pressed to limited 33⅓ vinyl." },
            { title: "INTIMATE AUDIENCE", desc: "No smartphones in the air. 200+ deeply attentive listeners who respect music." }
          ].map((benefit, idx) => (
            <div key={idx} className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[6px_6px_0px_#191410]">
              <span className="font-mono text-[9px] font-bold text-[#c2272a]">BENEFIT 0{idx+1}</span>
              <h3 className="font-poster text-2xl text-[#191410] my-1">{benefit.title}</h3>
              <p className="font-sans text-xs text-[#241a12]/90">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* 3. FEATURED RESIDENT ARTISTS */}
        <div className="bg-[#191410] border-2 border-[#ecdcaf]/30 p-6 shadow-[8px_8px_0px_#191410] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase block mb-4">
            FEATURED TANGY RESIDENTS
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {artists.map((artist) => (
              <div key={artist.id} className="bg-[#e9decb] text-[#241a12] p-4 border border-[#191410] flex flex-col gap-2">
                <img src={artist.image} alt={artist.name} className="w-full aspect-[4/3] object-cover border border-[#191410]" />
                <span className="font-mono text-[8px] font-bold text-[#c2272a] uppercase">{artist.role}</span>
                <h4 className="font-poster text-xl text-[#191410]">{artist.name}</h4>
                <p className="font-mono text-[9px] text-[#241a12]/80">{artist.genre} · {artist.location}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. AUDITION TIMELINE & FAQ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-[#ecdcaf] text-[#191410] border-2 border-[#191410] p-6 shadow-[6px_6px_0px_#c2272a]">
            <span className="font-mono text-[10px] font-bold text-[#c2272a] uppercase">AUDITION SELECTION TIMELINE</span>
            <div className="flex flex-col gap-3 mt-3 font-mono text-xs">
              <div className="border-b border-[#191410]/20 pb-2">1. PORTFOLIO SUBMISSION — Open Round</div>
              <div className="border-b border-[#191410]/20 pb-2">2. ACOUSTIC SOUNDCHECK — Intimate Private Jam</div>
              <div className="border-b border-[#191410]/20 pb-2">3. HERITAGE NIGHT BOOKING — Official Session Invitation</div>
            </div>
          </div>

          <div className="bg-[#191410] text-[#ecdcaf] border-2 border-[#d1a437] p-6 shadow-[6px_6px_0px_#191410]">
            <span className="font-mono text-[10px] font-bold text-[#d1a437] uppercase">FREQUENTLY ASKED QUESTIONS</span>
            <div className="flex flex-col gap-2 mt-3 font-mono text-xs text-[#ecdcaf]/80">
              <p><strong>Q: What genres can apply?</strong><br/>A: Sufi, Carnatic fusion, acoustic folk, ambient, live modular, and vocal experimenters.</p>
              <p><strong>Q: Are travel accommodations provided?</strong><br/>A: Yes, we provide full artist hospitality and lodging in Hyderabad.</p>
            </div>
          </div>
        </div>

        {/* 5. APPLICATION FORM */}
        <div id="apply-artist-form" className="w-full bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-8 shadow-[12px_12px_0px_#4c1210] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
            AUDITION APPLICATION FORM // 2026
          </span>
          <h2 className="font-poster text-3xl sm:text-4xl text-[#191410] my-1">SUBMIT YOUR SOUND</h2>

          {submitted ? (
            <div className="p-6 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold text-center border-2 border-[#191410] my-6">
              ✓ AUDITION APPLICATION RECEIVED // OUR CURATION TEAM WILL CONTACT YOU WITHIN 48 HOURS!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <input type="text" required placeholder="FULL NAME / STAGE NAME" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="email" required placeholder="EMAIL ADDRESS" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="tel" required placeholder="PHONE (+91)" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="text" placeholder="INSTAGRAM HANDLE (@username)" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="url" placeholder="SPOTIFY / SOUNDCLOUD LINK" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="url" placeholder="YOUTUBE LIVE PERFORMANCE VIDEO LINK" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="text" required placeholder="PRIMARY GENRE & INSTRUMENTS" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] md:col-span-2 outline-none" />
              <textarea rows={4} required placeholder="SHORT ARTIST BIOGRAPHY & SONIC PHILOSOPHY" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] md:col-span-2 outline-none resize-none" />

              <button
                type="submit"
                className="md:col-span-2 py-4 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all"
              >
                SUBMIT ARTIST AUDITION APPLICATION →
              </button>
            </form>
          )}
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
