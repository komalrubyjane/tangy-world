import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useAudio } from '../audio/AudioContext';

export const CrewPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();

  const [volName, setVolName] = useState('');
  const [volPhone, setVolPhone] = useState('');
  const [volEmail, setVolEmail] = useState('');
  const [volCollege, setVolCollege] = useState('');
  const [volRole, setVolRole] = useState('Photography');
  const [volExperience, setVolExperience] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!volName || !volPhone || !volEmail) return;
    playSFX('ticketClick');
    setSubmitted(true);
  };

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
      className="w-full min-h-[100dvh] bg-[#8a2320] text-[#ecdcaf] font-sans antialiased overflow-x-hidden pt-16 pb-20 select-none"
    >
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <Navbar onOpenProgramme={() => navigate('/')} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* HERO BANNER */}
        <div className="w-full bg-[#191410] border-4 border-[#ecdcaf] p-6 sm:p-8 shadow-[10px_10px_0px_#191410] mb-10 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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

          <div className="bg-[#c2272a] text-[#ecdcaf] p-3 font-mono text-xs font-bold border border-[#ecdcaf] shadow-md -rotate-2">
            SEASON 2026 RECRUITMENT OPEN
          </div>
        </div>

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
                className="bg-[#ecdcaf] text-[#191410] p-5 border-2 border-[#191410] shadow-[6px_6px_0px_#191410] flex flex-col text-left justify-between group hover:-translate-y-1 transition-transform"
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

        {/* VOLUNTEER BENEFITS & GALLERY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 items-stretch">
          
          {/* BENEFITS CARD */}
          <div className="bg-[#191410] border-2 border-[#ecdcaf]/40 p-6 shadow-[8px_8px_0px_#191410] text-left flex flex-col gap-4">
            <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">02 // CREW PERKS & BENEFITS</span>
            <h3 className="font-poster text-2xl text-[#ecdcaf]">WHY JOIN THE MOVEMENT</h3>
            
            <ul className="flex flex-col gap-3 font-mono text-xs text-[#ecdcaf]/90">
              <li className="flex items-start gap-2">
                <span className="text-[#c2272a]">✓</span>
                <span>Access to post-midnight artist jam sessions and private acoustic soundchecks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c2272a]">✓</span>
                <span>Official Tangy Crew screenprinted vintage apparel and limited edition badges.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c2272a]">✓</span>
                <span>Exclusive member passport stamps and priority tickets for future pop-ups.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#c2272a]">✓</span>
                <span>Hands-on production training with industry audio engineers and stage managers.</span>
              </li>
            </ul>
          </div>

          {/* APPLICATION TIMELINE */}
          <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410] text-left flex flex-col gap-4">
            <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">03 // RECRUITMENT TIMELINE</span>
            <h3 className="font-poster text-2xl text-[#191410]">HOW TO JOIN</h3>

            <div className="flex flex-col gap-3 font-mono text-xs">
              <div className="p-2.5 bg-[#ecdcaf] border border-[#191410]">
                <strong>STEP 1: SUBMIT APPLICATION</strong> — Fill out the crew application form below.
              </div>
              <div className="p-2.5 bg-[#ecdcaf] border border-[#191410]">
                <strong>STEP 2: CREW ORIENTATION</strong> — Attend a 30-minute orientation session at the stepwell.
              </div>
              <div className="p-2.5 bg-[#ecdcaf] border border-[#191410]">
                <strong>STEP 3: TAKE THE STAGE</strong> — Join the crew on session night!
              </div>
            </div>
          </div>

        </div>

        {/* APPLICATION FORM SECTION */}
        <div className="w-full max-w-3xl mx-auto bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-10 shadow-[12px_12px_0px_#191410] text-left flex flex-col gap-6">
          <div className="border-b-2 border-[#191410] pb-3">
            <span className="font-mono text-[10px] font-bold text-[#c2272a] uppercase tracking-widest">OFFICIAL APPLICATION FORM</span>
            <h2 className="font-poster text-3xl text-[#191410]">CREW RECRUITMENT APPLICATION</h2>
          </div>

          {submitted ? (
            <div className="py-8 text-center flex flex-col items-center gap-3 animate-bounce">
              <div className="w-16 h-16 rounded-full bg-[#c2272a] text-[#ecdcaf] flex items-center justify-center font-poster text-2xl">✓</div>
              <h3 className="font-poster text-2xl text-[#191410]">APPLICATION SUBMITTED!</h3>
              <p className="font-mono text-xs text-[#241a12]/80">OUR CREW COORDINATOR WILL REACH OUT TO YOU VIA EMAIL WITHIN 48 HOURS.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs font-bold text-[#191410] block mb-1">FULL NAME *</label>
                  <input 
                    type="text" 
                    required
                    value={volName}
                    onChange={(e) => setVolName(e.target.value)}
                    placeholder="YOUR NAME"
                    className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-[#191410] block mb-1">PHONE NUMBER *</label>
                  <input 
                    type="tel" 
                    required
                    value={volPhone}
                    onChange={(e) => setVolPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs font-bold text-[#191410] block mb-1">EMAIL ADDRESS *</label>
                  <input 
                    type="email" 
                    required
                    value={volEmail}
                    onChange={(e) => setVolEmail(e.target.value)}
                    placeholder="YOUR EMAIL"
                    className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold text-[#191410] block mb-1">COLLEGE / ORGANIZATION</label>
                  <input 
                    type="text" 
                    value={volCollege}
                    onChange={(e) => setVolCollege(e.target.value)}
                    placeholder="COLLEGE / WORKPLACE"
                    className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-xs font-bold text-[#191410] block mb-1">PREFERRED CREW ROLE *</label>
                <select 
                  value={volRole} 
                  onChange={(e) => setVolRole(e.target.value)}
                  className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                >
                  {volunteerRoles.map((r, i) => (
                    <option key={i} value={r.title}>{r.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-xs font-bold text-[#191410] block mb-1">PAST EXPERIENCE / SKILLS</label>
                <textarea 
                  rows={3}
                  value={volExperience}
                  onChange={(e) => setVolExperience(e.target.value)}
                  placeholder="Tell us briefly about past events, photography, audio, or volunteering..."
                  className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-[#191410] text-[#ecdcaf] hover:bg-[#c2272a] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all mt-2"
              >
                SUBMIT CREW APPLICATION →
              </button>
            </form>
          )}

        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
