import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useAudio } from '../audio/AudioContext';

export const PrivateSessionsPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();

  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [guests, setGuests] = useState('50-100');
  const [budget, setBudget] = useState('₹50,000 - ₹1,000,000');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !venue) return;
    playSFX('ticketClick');
    setSubmitted(true);
  };

  const offerings = [
    { title: "HOUSE SESSIONS", desc: "Intimate acoustic soundscapes hosted inside private courtyards, living rooms, and rooftops." },
    { title: "CORPORATE EXPERIENCES", desc: "Unplugged music curation for brand launches, executive retreats, and private dinners." },
    { title: "BRAND COLLABORATIONS", desc: "Bespoke music curation and immersive audio-visual installations." },
    { title: "WEDDING & HERITAGE RITUALS", desc: "Acoustic Sufi and Carnatic fusion for intimate wedding gatherings." },
    { title: "HERITAGE VENUE CURATION", desc: "Transform historic palaces, stepwells, and havelis into private music sanctuaries." }
  ];

  const packages = [
    { name: "ACOUSTIC TRIO", price: "₹45,000+", desc: "3 Artists · 2 Hours · Portable Vintage Sound Setup · Ideal for Living Rooms & Courtyards" },
    { name: "HERITAGE SANCTUARY SPECIAL", price: "₹95,000+", desc: "5 Artists · Full 1970s Analog Audio System · Stepwell Lighting & Chai Station" },
    { name: "CURATED HYBRID FUSION", price: "₹1,50,000+", desc: "Full Resident Collective · Sufi Vocals + Sub-Bass Fusion · Dedicated Sound Engineer" }
  ];

  const faqs = [
    { q: "What audio equipment does Tangy Sessions provide?", a: "We bring our custom-tuned 1970s analog sound reinforcement system, ribbon microphones, subwoofers, and acoustic baffling designed specifically for complex spaces." },
    { q: "Can we host a private session in our own residence?", a: "Yes! Living rooms, courtyards, rooftops, and gardens make incredible intimate sanctuaries for acoustic performances." },
    { q: "How far in advance should we request a private session?", a: "We recommend booking at least 3 to 4 weeks in advance to allow for artist scheduling and acoustic site visits." }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-[100dvh] bg-[#315D73] text-[#ecdcaf] font-sans antialiased overflow-x-hidden pt-16 pb-20 select-none"
    >
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <Navbar onOpenProgramme={() => navigate('/')} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* HERO BANNER */}
        <div className="w-full bg-[#191410] border-4 border-[#ecdcaf] p-6 sm:p-8 shadow-[10px_10px_0px_#191410] mb-10 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">
              11 PRIVATE SESSIONS // BESPOKE CURATION
            </span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] leading-none my-1">
              MAKE THE NIGHT YOUR OWN
            </h1>
            <p className="font-mono text-xs text-[#ecdcaf]/80 max-w-2xl">
              Bring the Tangy music experience into your private sanctuary — house sessions, corporate gatherings, and heritage venues.
            </p>
          </div>

          <div className="bg-[#ecdcaf] text-[#191410] p-3 font-mono text-xs font-bold border border-[#191410] shadow-md rotate-2">
            RESERVATIONS OPEN FOR 2026
          </div>
        </div>

        {/* OFFERINGS GRID */}
        <div className="mb-12">
          <div className="text-left mb-6">
            <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">01 // PRIVATE EVENT CATEGORIES</span>
            <h2 className="font-poster text-3xl text-[#ecdcaf]">BESPOKE MUSIC EXPERIENCES</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map((item, idx) => (
              <div 
                key={idx}
                className="bg-[#191410] border-2 border-[#ecdcaf]/40 p-5 shadow-[6px_6px_0px_#191410] text-left flex flex-col justify-between hover:border-[#d1a437] transition-all"
              >
                <div>
                  <span className="font-mono text-[9px] font-bold text-[#d1a437]">OFFERING #0{idx+1}</span>
                  <h3 className="font-poster text-xl text-[#ecdcaf] my-1">{item.title}</h3>
                  <p className="font-mono text-xs text-[#ecdcaf]/80 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CURATED PACKAGES */}
        <div className="mb-12">
          <div className="text-left mb-6">
            <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">02 // CURATED PACKAGES</span>
            <h2 className="font-poster text-3xl text-[#ecdcaf]">CHOOSE YOUR EXPERIENCE TIER</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, idx) => (
              <div 
                key={idx}
                className="bg-[#ecdcaf] text-[#191410] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410] text-left flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase">TIER 0{idx+1}</span>
                  <h3 className="font-poster text-2xl text-[#191410] mt-1">{pkg.name}</h3>
                  <span className="font-poster text-xl text-[#c2272a] block my-2">{pkg.price}</span>
                  <p className="font-mono text-xs text-[#191410]/80 leading-relaxed">{pkg.desc}</p>
                </div>

                <button 
                  onClick={() => { playSFX('ticketClick'); document.querySelector('#private-form')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="mt-6 w-full py-2.5 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase border border-[#191410] active:scale-95 transition-all"
                >
                  REQUEST THIS TIER →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQS & REQUEST FORM GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          
          {/* FAQS (COL-5) */}
          <div className="lg:col-span-5 bg-[#191410] border-2 border-[#ecdcaf]/40 p-6 shadow-[8px_8px_0px_#191410] text-left flex flex-col gap-4">
            <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">03 // FREQUENTLY ASKED QUESTIONS</span>
            <h3 className="font-poster text-2xl text-[#ecdcaf]">SANCTUARY LOGISTICS</h3>

            <div className="flex flex-col gap-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-[#ecdcaf]/20 pb-3">
                  <button 
                    onClick={() => { playSFX('ticketClick'); setActiveFaq(activeFaq === idx ? null : idx); }}
                    className="w-full text-left font-poster text-lg text-[#ecdcaf] hover:text-[#d1a437] flex justify-between items-center"
                  >
                    <span>{faq.q}</span>
                    <span>{activeFaq === idx ? '−' : '+'}</span>
                  </button>
                  {activeFaq === idx && (
                    <p className="font-mono text-xs text-[#ecdcaf]/80 mt-2 pl-2 border-l-2 border-[#d1a437]">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* REQUEST FORM (COL-7) */}
          <div id="private-form" className="lg:col-span-7 bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[12px_12px_0px_#191410] text-left flex flex-col gap-5">
            <div className="border-b-2 border-[#191410] pb-3">
              <span className="font-mono text-[10px] font-bold text-[#c2272a] uppercase tracking-widest">PRIVATE BOOKING DESK</span>
              <h2 className="font-poster text-3xl text-[#191410]">REQUEST A PRIVATE SESSION</h2>
            </div>

            {submitted ? (
              <div className="py-8 text-center flex flex-col items-center gap-3 animate-bounce">
                <div className="w-16 h-16 rounded-full bg-[#c2272a] text-[#ecdcaf] flex items-center justify-center font-poster text-2xl">✓</div>
                <h3 className="font-poster text-2xl text-[#191410]">REQUEST RECEIVED!</h3>
                <p className="font-mono text-xs text-[#241a12]/80">OUR CURATOR WILL CONTACT YOU WITHIN 24 HOURS WITH ARTIST AVAILABILITY.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs font-bold text-[#191410] block mb-1">PREFERRED DATE *</label>
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-xs font-bold text-[#191410] block mb-1">VENUE / LOCATION *</label>
                    <input 
                      type="text" 
                      required
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Jubilee Hills Courtyard"
                      className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs font-bold text-[#191410] block mb-1">ESTIMATED GUESTS</label>
                    <select 
                      value={guests} 
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                    >
                      <option value="20-50">20 - 50 Guests</option>
                      <option value="50-100">50 - 100 Guests</option>
                      <option value="100-250">100 - 250 Guests</option>
                      <option value="250+">250+ Guests</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-xs font-bold text-[#191410] block mb-1">BUDGET RANGE</label>
                    <select 
                      value={budget} 
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                    >
                      <option value="₹45,000 - ₹75,000">₹45,000 - ₹75,000</option>
                      <option value="₹75,000 - ₹1,50,000">₹75,000 - ₹1,50,000</option>
                      <option value="₹1,50,000+">₹1,50,000+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-mono text-xs font-bold text-[#191410] block mb-1">SESSION NOTES & PREFERENCES</label>
                  <textarea 
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about the vibe, specific artist preferences, or acoustic venue details..."
                    className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-[#191410] text-[#ecdcaf] hover:bg-[#c2272a] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all mt-2"
                >
                  REQUEST PRIVATE SESSION →
                </button>
              </form>
            )}

          </div>

        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
