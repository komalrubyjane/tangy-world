import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

const MEMBERSHIP_TIERS = [
  {
    id: 'vinyl',
    name: 'VINYL LISTENER',
    price: 'FREE',
    tag: 'STANDARD MEMBER',
    color: '#E7D5A4',
    accent: '#11100C',
    perks: [
      'Monthly Tangy editorial newsletter',
      'Priority notification on new shows',
      'Digital archive access',
      'Exclusive field recording dispatches'
    ]
  },
  {
    id: 'passport',
    name: 'PASSPORT HOLDER',
    price: '₹499 / YEAR',
    tag: 'PREMIUM MEMBER',
    color: '#C99A2E',
    accent: '#11100C',
    perks: [
      'All Vinyl Listener perks',
      '48-hour early ticket reservation',
      'Digital passport stamp collection',
      'Behind-the-scenes video dispatches',
      'Birthday heritage experience invite'
    ]
  },
  {
    id: 'stone',
    name: 'STONE CIRCLE',
    price: '₹1,499 / YEAR',
    tag: 'FOUNDING MEMBER',
    color: '#B94717',
    accent: '#E7D5A4',
    perks: [
      'All Passport Holder perks',
      'Named in session programmes',
      'Physical printed ticket included',
      '1 guest invite per session',
      'Exclusive post-midnight jam access',
      'Annual limited vinyl pressing'
    ]
  }
];

export const InnerCirclePage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedTier, setSelectedTier] = useState('vinyl');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#1C0A04] text-[#E3D4AC] font-mono selection:bg-[#E3D4AC] selection:text-[#1C0A04]">
      <Navbar />

      {/* PAGE HERO */}
      <section className="relative pt-28 pb-10 px-4 sm:px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-overlay pointer-events-none" />

        {/* Big watermark text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.04] select-none">
          <span className="font-display text-[18vw] leading-none text-[#E3D4AC] uppercase font-bold">CIRCLE</span>
        </div>

        <div className="relative z-10">
          <span className="font-mono text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 block">
            PRIVATE MAILING LIST & PASSPORT MEMBERSHIP
          </span>
          <h1 className="display text-5xl sm:text-8xl md:text-9xl text-[#E3D4AC] leading-none ink-bleed uppercase mb-4">
            THE INNER<br/>CIRCLE
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E3D4AC]/80 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            PRIVATE SESSION ANNOUNCEMENTS · EARLY ACCESS TICKETING · DIGITAL MEMBER STAMP PASSPORT · EXCLUSIVE VINYL PRESSINGS.
          </p>
        </div>
      </section>

      {/* WHY JOIN — Stats Banner */}
      <section className="bg-[#B94717] border-y-4 border-[#11100C] py-6 sm:py-8 px-4 overflow-x-auto">
        <div className="flex gap-6 sm:gap-0 sm:grid sm:grid-cols-4 max-w-5xl mx-auto text-center min-w-max sm:min-w-0">
          {[
            { num: '2,400+', label: 'INNER CIRCLE MEMBERS' },
            { num: '6', label: 'SESSIONS PER YEAR' },
            { num: '48H', label: 'EARLY TICKET ACCESS' },
            { num: '100%', label: 'SOLD OUT RATE' }
          ].map((stat, i) => (
            <div key={i} className="text-center px-4 sm:border-r last:border-0 border-[#11100C]/40">
              <div className="display text-3xl sm:text-5xl text-[#E3D4AC] leading-none">{stat.num}</div>
              <div className="font-mono text-[9px] sm:text-[10px] text-[#E3D4AC]/80 tracking-[0.25em] uppercase mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MEMBERSHIP TIERS */}
      <section className="py-14 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mb-2">
            CHOOSE YOUR MEMBERSHIP TIER
          </span>
          <h2 className="display text-4xl sm:text-7xl text-[#E3D4AC] leading-tight ink-bleed">THREE CIRCLES,<br/>ONE COMMUNITY</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {MEMBERSHIP_TIERS.map((tier, idx) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className="relative cursor-pointer group transition-all duration-200"
              style={{
                transform: selectedTier === tier.id ? 'translateY(-6px)' : 'none'
              }}
            >
              {/* FOLDER TAB */}
              {idx === 1 && (
                <div className="absolute -top-6 left-4 bg-[#C99A2E] text-[#11100C] px-3 py-1 font-mono text-[8px] font-bold uppercase tracking-widest border-t border-x border-[#11100C] z-10">
                  MOST POPULAR
                </div>
              )}

              <div
                className="border-4 border-[#11100C] p-5 sm:p-6 h-full flex flex-col"
                style={{
                  backgroundColor: tier.color,
                  color: tier.accent,
                  boxShadow: selectedTier === tier.id ? '8px 8px 0px #11100C' : '4px 4px 0px #11100C'
                }}
              >
                <div className="font-mono text-[9px] font-bold tracking-[0.3em] uppercase border-b-2 pb-2 mb-4"
                  style={{ borderColor: tier.accent + '40', opacity: 0.7 }}>
                  {tier.tag}
                </div>
                <h3 className="display text-2xl sm:text-3xl mb-2 leading-tight" style={{ color: tier.accent }}>
                  {tier.name}
                </h3>
                <div className="font-mono text-xl sm:text-2xl font-bold mb-5" style={{ color: tier.accent }}>
                  {tier.price}
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {tier.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2 font-mono text-[10px] sm:text-xs leading-relaxed" style={{ color: tier.accent }}>
                      <span className="mt-0.5 shrink-0">✓</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                {/* Selection indicator */}
                {selectedTier === tier.id && (
                  <div className="mt-4 pt-3 border-t-2 font-mono text-[9px] font-bold uppercase tracking-widest text-center"
                    style={{ borderColor: tier.accent + '50', color: tier.accent }}>
                    ✦ SELECTED
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* SIGNUP FORM */}
        <div id="join" className="bg-[#11100C] p-6 sm:p-12 border-4 border-[#C99A2E] max-w-2xl mx-auto">
          {/* Masking tape decoration */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-[rgba(201,154,46,0.6)] rotate-[-1deg] border border-[#C99A2E]/40 pointer-events-none hidden sm:block" />

          <div className="text-center mb-6 sm:mb-8">
            <span className="font-mono text-[9px] text-[#C99A2E] tracking-[0.3em] uppercase block mb-2">
              MEMBERSHIP APPLICATION
            </span>
            <h2 className="display text-3xl sm:text-5xl text-[#E3D4AC]">JOIN THE CIRCLE</h2>
            <p className="font-mono text-[10px] text-[#E3D4AC]/60 mt-2">
              SELECTED TIER: <span className="text-[#C99A2E] font-bold">
                {MEMBERSHIP_TIERS.find(t => t.id === selectedTier)?.name}
              </span>
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-8 border-2 border-[#C99A2E]/40">
              <div className="display text-5xl text-[#C99A2E] mb-3">✦</div>
              <h3 className="display text-3xl text-[#E3D4AC] mb-2">WELCOME TO THE CIRCLE</h3>
              <p className="font-mono text-xs text-[#E3D4AC]/70 uppercase tracking-wider">
                CHECK YOUR INBOX FOR YOUR MEMBERSHIP CONFIRMATION.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                required
                placeholder="YOUR FULL NAME *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="p-3 sm:p-4 bg-[#191410] border border-[#C99A2E]/40 text-[#E3D4AC] font-mono text-xs focus:outline-none focus:border-[#C99A2E]"
              />
              <input
                type="email"
                required
                placeholder="YOUR EMAIL ADDRESS *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-3 sm:p-4 bg-[#191410] border border-[#C99A2E]/40 text-[#E3D4AC] font-mono text-xs focus:outline-none focus:border-[#C99A2E]"
              />

              {/* Tier selector on form */}
              <div className="flex gap-2 flex-wrap">
                {MEMBERSHIP_TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTier(tier.id)}
                    className={`px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider border transition-colors flex-1 ${
                      selectedTier === tier.id
                        ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]'
                        : 'bg-transparent text-[#E3D4AC] border-[#C99A2E]/40 hover:border-[#C99A2E]'
                    }`}
                  >
                    {tier.name}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="py-3 sm:py-4 bg-[#C99A2E] text-[#11100C] font-mono text-xs font-bold uppercase tracking-[0.25em] hover:bg-[#E7D5A4] border-2 border-[#C99A2E] transition-colors"
              >
                JOIN INNER CIRCLE →
              </button>
              <p className="font-mono text-[9px] text-[#E3D4AC]/40 text-center uppercase tracking-wider">
                NO SPAM. ONLY GENUINE TANGY DISPATCHES. UNSUBSCRIBE ANYTIME.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#11100C] border-t-4 border-[#C99A2E]/30 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="display text-3xl sm:text-5xl text-[#E3D4AC] text-center mb-8 sm:mb-12">WHAT MEMBERS SAY</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {[
              { quote: 'Got my tickets 48 hours before anyone else. The show was sold out in 3 minutes.', member: 'PASSPORT MEMBER · 2024', name: 'Riya K.' },
              { quote: 'The physical ticket alone is worth it. I have all six framed on my wall.', member: 'STONE CIRCLE · 2022', name: 'Aakash N.' },
              { quote: 'The field tape recordings they send are unlike anything you will find publicly.', member: 'VINYL LISTENER · 2023', name: 'Meera S.' }
            ].map((t, i) => (
              <div key={i} className="bg-[#F5E9C9] text-[#11100C] border-4 border-[#11100C] p-4 sm:p-6 shadow-[6px_6px_0px_#11100C]">
                <p className="font-body text-sm italic leading-relaxed mb-4 border-l-4 border-[#C99A2E] pl-3">
                  "{t.quote}"
                </p>
                <div className="font-mono text-[9px] font-bold uppercase">
                  <div className="text-[#B94717]">{t.name}</div>
                  <div className="text-[#11100C]/60">{t.member}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
