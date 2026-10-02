import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SectionNav } from '../components/layout/SectionNav';
import { PrivateEnquiryForm } from '../components/private/PrivateEnquiryForm';
import { PRIVATE_OFFERINGS } from '../config/privateOfferings';
import { usePageMeta } from '../hooks/usePageMeta';

const ENQUIRY_TYPES = [
  { id: 'private_gathering', label: 'Private Gathering' },
  { id: 'corporate_event', label: 'Corporate Event' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'heritage_experience', label: 'Heritage Experience' },
];

export const PrivateSessionsPage = () => {
  usePageMeta({ title: 'Private sessions', description: 'Book a private Tangy music experience — gatherings, corporate events, weddings and heritage evenings.' });
  const navigate = useNavigate();
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
      className="w-full min-h-[100dvh] bg-[#181614] text-[#ecdcaf] font-sans antialiased overflow-x-hidden pt-16 pb-20 select-none printNoise"
    >
      <Navbar onOpenProgramme={() => navigate('/')} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* HERO BANNER */}
        <div id="gatherings" className="w-full bg-[#181614] border-2 border-[#ecdcaf] p-6 sm:p-8 shadow-[4px_4px_0px_#191410] mb-10 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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

          <div className="bg-[#EFE2C0] paperTexture text-[#191410] p-3 font-mono text-xs font-bold border border-[#191410] shadow-md rotate-2">
            RESERVATIONS OPEN FOR 2026
          </div>
        </div>

        <SectionNav section="Private" className="mb-10" />

        {/* OFFERINGS GRID */}
        <div className="mb-12">
          <div className="text-left mb-6">
            <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">01 // PRIVATE EVENT CATEGORIES</span>
            <h2 className="font-poster text-3xl text-[#ecdcaf]">BESPOKE MUSIC EXPERIENCES</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRIVATE_OFFERINGS.map((item) => (
              <Link
                key={item.slug}
                to={`/private/${item.slug}`}
                className="bg-[#181614] border-2 border-[#ecdcaf]/40 p-5 shadow-[4px_4px_0px_#191410] text-left flex flex-col justify-between hover:border-[#d1a437] focus-visible:border-[#d1a437] transition-all"
              >
                <div>
                  <span className="font-mono text-[9px] font-bold text-[#d1a437]">CATEGORY #{item.number}</span>
                  <h3 className="font-poster text-xl text-[#ecdcaf] my-1">{item.title}</h3>
                  <p className="font-mono text-xs text-[#ecdcaf]/80 leading-relaxed">{item.summary}</p>
                </div>
                <span className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-[#d1a437]">Explore &amp; enquire →</span>
              </Link>
            ))}
          </div>
        </div>

        {/* PACKAGES */}
        <div id="corporate" className="mb-12 text-left">
          <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">02 // CURATED PACKAGES</span>
          <h2 className="font-poster text-3xl text-[#ecdcaf] mb-6">EXPERIENCE TIERS</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, idx) => (
              <div key={idx} className="bg-[#EFE2C0] paperTexture text-[#191410] p-6 border-2 border-[#191410] shadow-[4px_4px_0px_#191410] flex flex-col justify-between">
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
        <div id="weddings" className="mb-12 bg-[#181614] border-2 border-[#ecdcaf] p-6 sm:p-8 shadow-[4px_4px_0px_#191410] text-left">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase block mb-1">
            03 // WEDDINGS &amp; HERITAGE EXPERIENCES
          </span>
          <h2 id="heritage" className="font-poster text-3xl text-[#ecdcaf] mb-4">AUSTERE &amp; ELEGANT SOUNDSCAPES</h2>
          <p className="font-mono text-xs text-[#ecdcaf]/80 leading-relaxed max-w-3xl">
            We specialize in acoustic music curation for intimate wedding gatherings, heritage palace dinners, and cultural celebrations — free from harsh digital noise and commercial playlists.
          </p>
        </div>

        {/* RESERVATION FORM */}
        <div className="bg-[#181614] border-2 border-[#ecdcaf] p-6 sm:p-10 shadow-[4px_4px_0px_#191410] text-left">
          <div className="mb-6">
            <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">04 // RESERVATION DESK</span>
            <h2 className="font-poster text-3xl text-[#ecdcaf]">REQUEST A PRIVATE SESSION</h2>
          </div>

          <PrivateEnquiryForm
            types={ENQUIRY_TYPES}
            guestOptions={[['20-50', '20 - 50 GUESTS'], ['50-100', '50 - 100 GUESTS'], ['100-200', '100 - 200 GUESTS'], ['200+', '200+ GUESTS']]}
            defaultGuests="50-100"
            budgetOptions={['₹50,000 - ₹100,000', '₹100,000 - ₹200,000', '₹200,000+']}
            venuePlaceholder="EVENT VENUE / LOCATION *"
            messagePlaceholder="DETAILS ABOUT YOUR EVENT & PREFERRED MUSIC TYPE..."
            cta="SUBMIT RESERVATION REQUEST →"
            successTitle="RESERVATION REQUEST TRANSMITTED!"
            successText="Our private session coordinator will review your request and get back to you within 48 hours."
          />
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
