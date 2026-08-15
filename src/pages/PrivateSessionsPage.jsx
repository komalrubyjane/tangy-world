import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useAudio } from '../audio/AudioContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const ENQUIRY_TYPES = [
  { id: 'private_gathering', label: 'Private Gathering' },
  { id: 'corporate_event', label: 'Corporate Event' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'heritage_experience', label: 'Heritage Experience' },
];

export const PrivateSessionsPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();

  const [enquiryType, setEnquiryType] = useState('private_gathering');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [guests, setGuests] = useState('50-100');
  const [budget, setBudget] = useState('₹50,000 - ₹100,000');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !venue || !name || !email) return;
    playSFX('ticketClick');
    setFormError('');
    if (!isSupabaseConfigured) {
      setSubmitted(true);
      return;
    }
    setSubmitting(true);
    const guestCount = parseInt(guests, 10) || null;
    const { error } = await supabase.from('private_enquiries').insert({
      type: enquiryType,
      name,
      email,
      phone,
      preferred_date: date,
      guest_count: guestCount,
      message: `Venue: ${venue}\nGuests: ${guests}\nBudget: ${budget}\n\n${message}`,
    });
    setSubmitting(false);
    if (error) {
      setFormError('Something went wrong submitting your request — please try again.');
      return;
    }
    setSubmitted(true);
  };

  const offerings = [
    { id: 'gatherings', title: "PRIVATE GATHERINGS", desc: "Intimate acoustic soundscapes hosted inside private courtyards, living rooms, and rooftops." },
    { id: 'corporate', title: "CORPORATE EVENTS", desc: "Unplugged music curation for brand launches, executive retreats, and private dinners." },
    { id: 'weddings', title: "WEDDINGS & RITUALS", desc: "Acoustic Sufi and Carnatic fusion for intimate wedding gatherings and ceremonies." },
    { id: 'heritage', title: "HERITAGE EXPERIENCES", desc: "Transform historic palaces, stepwells, and havelis into private music sanctuaries." }
  ];

  const packages = [
    { name: "ACOUSTIC TRIO", price: "₹45,000+", desc: "3 Artists · 2 Hours · Portable Vintage Sound Setup · Ideal for Living Rooms & Courtyards" },
    { name: "HERITAGE SANCTUARY SPECIAL", price: "₹95,000+", desc: "5 Artists · Full 1970s Analog Audio System · Stepwell Lighting & Chai Station" },
    { name: "CURATED HYBRID FUSION", price: "₹1,50,000+", desc: "Full Resident Collective · Sufi Vocals + Sub-Bass Fusion · Dedicated Sound Engineer" }
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
        <div id="gatherings" className="w-full bg-[#191410] border-4 border-[#ecdcaf] p-6 sm:p-8 shadow-[10px_10px_0px_#191410] mb-10 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">
              PRIVATE SESSIONS // BESPOKE CURATION
            </span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] leading-none my-1">
              MAKE THE NIGHT YOUR OWN
            </h1>
            <p className="font-mono text-xs text-[#ecdcaf]/80 max-w-2xl">
              Bring the Tangy music experience into your private sanctuary — house sessions, corporate gatherings, weddings, and heritage venues.
            </p>
          </div>

          <div className="bg-[#ecdcaf] text-[#191410] p-3 font-mono text-xs font-bold border border-[#191410] shadow-md rotate-2">
            RESERVATIONS OPEN FOR 2026
          </div>
        </div>

        {/* Quick Section Anchors */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { label: 'PRIVATE GATHERINGS', hash: '#gatherings' },
            { label: 'CORPORATE EVENTS', hash: '#corporate' },
            { label: 'WEDDINGS', hash: '#weddings' },
            { label: 'HERITAGE EXPERIENCES', hash: '#heritage' }
          ].map((link) => (
            <a
              key={link.hash}
              href={link.hash}
              className="px-3 py-1.5 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-[#ecdcaf]/40 bg-[#191410] text-[#ecdcaf] hover:bg-[#ecdcaf] hover:text-[#191410] transition-colors"
            >
              {link.label} ↓
            </a>
          ))}
        </div>

        {/* OFFERINGS GRID */}
        <div className="mb-12">
          <div className="text-left mb-6">
            <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">01 // PRIVATE EVENT CATEGORIES</span>
            <h2 className="font-poster text-3xl text-[#ecdcaf]">BESPOKE MUSIC EXPERIENCES</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {offerings.map((item, idx) => (
              <div 
                key={idx}
                id={item.id}
                className="bg-[#191410] border-2 border-[#ecdcaf]/40 p-5 shadow-[6px_6px_0px_#191410] text-left flex flex-col justify-between hover:border-[#d1a437] transition-all"
              >
                <div>
                  <span className="font-mono text-[9px] font-bold text-[#d1a437]">CATEGORY #0{idx+1}</span>
                  <h3 className="font-poster text-xl text-[#ecdcaf] my-1">{item.title}</h3>
                  <p className="font-mono text-xs text-[#ecdcaf]/80 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PACKAGES */}
        <div id="corporate" className="mb-12 text-left">
          <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">02 // CURATED PACKAGES</span>
          <h2 className="font-poster text-3xl text-[#ecdcaf] mb-6">EXPERIENCE TIERS</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, idx) => (
              <div key={idx} className="bg-[#ecdcaf] text-[#191410] p-6 border-4 border-[#191410] shadow-[8px_8px_0px_#191410] flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[9px] font-bold text-[#315D73]">TIER #0{idx+1}</span>
                  <h3 className="font-poster text-2xl text-[#191410] my-1">{pkg.name}</h3>
                  <div className="font-mono text-xl font-bold text-[#c2272a] mb-3">{pkg.price}</div>
                  <p className="font-mono text-xs text-[#191410]/80 leading-relaxed">{pkg.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HERITAGE & WEDDINGS SPECIFIC SECTION */}
        <div id="weddings" className="mb-12 bg-[#191410] border-4 border-[#ecdcaf] p-6 sm:p-8 shadow-[8px_8px_0px_#191410] text-left">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase block mb-1">
            03 // WEDDINGS &amp; HERITAGE EXPERIENCES
          </span>
          <h2 id="heritage" className="font-poster text-3xl text-[#ecdcaf] mb-4">AUSTERE &amp; ELEGANT SOUNDSCAPES</h2>
          <p className="font-mono text-xs text-[#ecdcaf]/80 leading-relaxed max-w-3xl">
            We specialize in acoustic music curation for intimate wedding gatherings, heritage palace dinners, and cultural celebrations — free from harsh digital noise and commercial playlists.
          </p>
        </div>

        {/* RESERVATION FORM */}
        <div className="bg-[#191410] border-4 border-[#ecdcaf] p-6 sm:p-10 shadow-[10px_10px_0px_#191410] text-left">
          <div className="mb-6">
            <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">04 // RESERVATION DESK</span>
            <h2 className="font-poster text-3xl text-[#ecdcaf]">REQUEST A PRIVATE SESSION</h2>
          </div>

          {submitted ? (
            <div className="bg-[#241a12] border-2 border-[#ecdcaf] p-8 text-center">
              <h3 className="font-poster text-3xl text-[#ecdcaf] mb-2">RESERVATION REQUEST TRANSMITTED!</h3>
              <p className="font-mono text-xs text-[#ecdcaf]/80">Our private session coordinator will review your request and get back to you within 48 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
              <div className="flex flex-wrap gap-1.5">
                {ENQUIRY_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setEnquiryType(t.id)}
                    className={`px-2.5 py-1.5 text-[9px] font-bold uppercase border transition-colors ${enquiryType === t.id ? 'bg-[#ecdcaf] text-[#191410] border-[#ecdcaf]' : 'bg-[#241a12] text-[#ecdcaf]/70 border-[#ecdcaf]/30'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="YOUR NAME *" value={name} onChange={(e) => setName(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none" />
                <input required type="email" placeholder="YOUR EMAIL *" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none" />
              </div>
              <input type="tel" placeholder="PHONE NUMBER (OPTIONAL)" value={phone} onChange={(e) => setPhone(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none" />
                <input required type="text" placeholder="EVENT VENUE / LOCATION *" value={venue} onChange={(e) => setVenue(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={guests} onChange={(e) => setGuests(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none">
                  <option value="20-50">20 - 50 GUESTS</option>
                  <option value="50-100">50 - 100 GUESTS</option>
                  <option value="100-200">100 - 200 GUESTS</option>
                  <option value="200+">200+ GUESTS</option>
                </select>
                <select value={budget} onChange={(e) => setBudget(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none">
                  <option value="₹50,000 - ₹100,000">₹50,000 - ₹100,000</option>
                  <option value="₹100,000 - ₹200,000">₹100,000 - ₹200,000</option>
                  <option value="₹200,000+">₹200,000+</option>
                </select>
              </div>
              <textarea rows={4} placeholder="DETAILS ABOUT YOUR EVENT & PREFERRED MUSIC TYPE..." value={message} onChange={(e) => setMessage(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none resize-none" />
              {formError && <div className="p-3 bg-[#c2272a] text-white font-bold border-2 border-[#ecdcaf]">{formError}</div>}
              <button type="submit" disabled={submitting} className="py-4 bg-[#ecdcaf] text-[#191410] font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#d1a437] border-2 border-[#191410] transition-colors shadow-[4px_4px_0px_#191410] disabled:opacity-50">
                {submitting ? 'SUBMITTING...' : 'SUBMIT RESERVATION REQUEST →'}
              </button>
            </form>
          )}
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
