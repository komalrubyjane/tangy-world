import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { artists, gallery } from '../data/mockData';
import { useEvents } from '../hooks/useEvents';
import { useUserAuth } from '../context/UserAuthContext';
import { bookingService } from '../lib/bookingService';
import { generateQrDataUrl } from '../lib/qr';
import { useAudio } from '../audio/AudioContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const BookingPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const { events, loading: eventsLoading } = useEvents();
  const { user, isLoggedIn, openLoginModal } = useUserAuth();

  // Dynamically load event data based on sessionId parameter (slug or id)
  const session = useMemo(() => {
    return events.find(e => e.slug === sessionId || e.id === sessionId) || null;
  }, [events, sessionId]);

  const isSoldOut = session?.status === 'SOLD OUT';
  const isPast = session?.dbStatus === 'past';

  // Ticket Tiers
  const basePrice = session ? (parseInt(session.price.replace(/[^\d]/g, '')) || 799) : 799;
  const ticketTiers = [
    { id: 'gen', name: 'General Admission', price: basePrice, desc: 'Entry to stepwell acoustic sanctuary & main stage performance.' },
    { id: 'vip', name: 'VIP Heritage Pass', price: basePrice + 500, desc: 'Reserved front-tier seating, complimentary filter coffee & vintage poster print.' },
    { id: 'premium', name: 'Backstage Collective Pass', price: basePrice + 1200, desc: 'Access to post-midnight artist jam session, vinyl record & signed ticket stub.' }
  ];

  const [selectedTier, setSelectedTier] = useState(ticketTiers[0]);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    setSelectedTier(ticketTiers[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  useEffect(() => {
    if (user) {
      setFullName((n) => n || user.full_name || '');
      setEmail((e) => e || user.email || '');
    }
  }, [user]);

  // Price Calculations
  const subtotal = selectedTier.price * ticketQuantity;
  const taxes = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + taxes;

  const handleProceedPayment = async (e) => {
    e.preventDefault();
    if (!fullName || !phone || !email || !session) return;
    setBookingError('');
    playSFX('ticketClick');
    setIsSubmitting(true);

    const res = await bookingService.createBooking({
      userId: user.id,
      eventId: session.id,
      attendeeName: fullName,
      attendeeEmail: email,
      attendeePhone: phone,
      quantity: ticketQuantity,
      amount: totalAmount,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setBookingError(res.error || 'Something went wrong creating your booking.');
      return;
    }

    setConfirmedBooking(res.booking);
    setIsSubmitted(true);
    const qr = await generateQrDataUrl(res.booking.registration_code);
    setQrDataUrl(qr);
  };

  const handleQuantityChange = (delta) => {
    playSFX('ticketClick');
    setTicketQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleTierSelect = (tier) => {
    playSFX('ticketClick');
    setSelectedTier(tier);
  };

  if (eventsLoading) {
    return (
      <div className="w-full min-h-[100dvh] bg-[#3c0f0e] text-[#ecdcaf] flex items-center justify-center font-mono text-xs font-bold">
        LOADING SESSION...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full min-h-[100dvh] bg-[#3c0f0e] text-[#ecdcaf] flex flex-col items-center justify-center gap-4 font-mono text-xs font-bold p-8 text-center">
        <span>SESSION NOT FOUND.</span>
        <button
          onClick={() => navigate('/sessions')}
          className="px-4 py-2 bg-[#c2272a] text-[#ecdcaf] border-2 border-[#ecdcaf] uppercase"
        >
          ← BACK TO SESSIONS
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full min-h-[100dvh] bg-[#3c0f0e] text-[#ecdcaf] font-sans antialiased overflow-x-hidden selection:bg-[#c2272a] selection:text-[#ecdcaf] pt-16 pb-20"
    >
      {/* 1970S PRINT NOISE TEXTURE OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <div className="fixed inset-0 pointer-events-none z-[80] shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />

      {/* TOP NAVBAR */}
      <Navbar onOpenProgramme={() => navigate('/')} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* BACK TO SESSIONS NAVIGATION LINK */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => { playSFX('ticketClick'); navigate('/'); }}
            className="font-mono text-xs font-bold text-[#ecdcaf] hover:text-[#d1a437] flex items-center gap-2 border border-[#ecdcaf]/30 px-3 py-1.5 bg-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all"
          >
            ← BACK TO ALL SESSIONS
          </button>

          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-widest border border-[#d1a437]/40 px-3 py-1 uppercase bg-[#191410]">
            CONCERT TICKET BOX OFFICE // 1974
          </span>
        </div>

        {/* PAGE TITLE BANNER */}
        <div className="w-full bg-[#191410] border-4 border-[#d1a437] p-5 mb-8 shadow-[8px_8px_0px_#4c1210] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="font-mono text-[9.5px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              OFFICIAL BOX OFFICE DESK · {session.city}
            </span>
            <h1 className="font-poster text-3xl sm:text-4xl text-[#ecdcaf] leading-tight my-0.5">
              {session.title}
            </h1>
            <p className="font-mono text-xs text-[#d1a437]">{session.artist} · {session.venue} · {session.date}</p>
          </div>

          <div className="flex items-center gap-2 bg-[#ecdcaf] text-[#191410] px-3.5 py-1.5 font-mono text-xs font-bold border border-[#191410] -rotate-1 shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#c2272a] animate-pulse" />
            <span>STATUS: {session.status} ({session.capacity} SEATS LEFT)</span>
          </div>
        </div>

        {/* 2-COLUMN DESKTOP / STACKED MOBILE BOOKING GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN (COL-7): POSTER, EVENT DETAILS, GALLERY, ARTISTS, MAP */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* 1. LARGE EVENT POSTER WITH VINTAGE TAPE */}
            <div className="w-full bg-[#e9decb] text-[#241a12] p-4 border-4 border-[#191410] shadow-[10px_10px_0px_#191410] relative rotate-[-1deg]">
              <div className="absolute -top-3 left-[40%] -rotate-3 w-20 h-6 bg-[rgba(255,255,255,0.45)] border border-[rgba(255,255,255,0.5)] z-20 pointer-events-none" />
              <img 
                src={session.image} 
                alt={session.title} 
                className="w-full aspect-[16/10] object-cover border-2 border-[#191410] filter contrast-110" 
              />
              <div className="flex justify-between items-center mt-3 font-mono text-[10px] font-bold uppercase border-t border-[#191410]/20 pt-2">
                <span>HYDERABAD LIVE ARCHIVE</span>
                <span className="text-[#c2272a]">ISSUE 001 · STAGE A</span>
              </div>
            </div>

            {/* 2. EVENT INFORMATION & METRICS */}
            <div className="w-full bg-[#191410] border-2 border-[#ecdcaf]/30 p-6 shadow-[6px_6px_0px_#191410] text-left flex flex-col gap-4">
              <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">01 // EVENT DETAILS & METRICS</span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs border-y border-[#ecdcaf]/15 py-3">
                <div>
                  <span className="text-[#ecdcaf]/60 block text-[9px]">DATE</span>
                  <span className="font-bold text-[#ecdcaf]">{session.date}</span>
                </div>
                <div>
                  <span className="text-[#ecdcaf]/60 block text-[9px]">TIME</span>
                  <span className="font-bold text-[#ecdcaf]">{session.time}</span>
                </div>
                <div>
                  <span className="text-[#ecdcaf]/60 block text-[9px]">DURATION</span>
                  <span className="font-bold text-[#ecdcaf]">3.5 HOURS</span>
                </div>
                <div>
                  <span className="text-[#ecdcaf]/60 block text-[9px]">CAPACITY</span>
                  <span className="font-bold text-[#c2272a]">{session.capacity} SEATS</span>
                </div>
              </div>

              {/* GENRE TAGS */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-[#ecdcaf]/60">TAGS:</span>
                {session.tags.map((tag, idx) => (
                  <span key={idx} className="font-mono text-[9px] font-bold bg-[#d1a437]/20 text-[#d1a437] border border-[#d1a437]/40 px-2.5 py-0.5 uppercase">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 3. ABOUT THE EVENT / STORY */}
            <div className="w-full bg-[#ecdcaf] text-[#191410] border-2 border-[#191410] p-6 shadow-[6px_6px_0px_#c2272a] text-left flex flex-col gap-3">
              <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">02 // ABOUT THE SESSION</span>
              <h3 className="font-poster text-2xl text-[#191410]">AN UNFORGETTABLE ACOUSTIC RITUAL</h3>
              <p className="font-sans text-sm text-[#191410]/90 leading-relaxed font-normal">
                {session.description}
              </p>
              {session.story && (
                <blockquote className="p-3 bg-[#191410] text-[#ecdcaf] border-l-4 border-[#c2272a] font-serif italic text-xs mt-1">
                  "{session.story}"
                </blockquote>
              )}
            </div>

            {/* 4. PERFORMING ARTISTS */}
            <div className="w-full bg-[#191410] border-2 border-[#ecdcaf]/30 p-6 shadow-[6px_6px_0px_#191410] text-left flex flex-col gap-4">
              <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">03 // FEATURED ARTISTS</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {artists.slice(0, 2).map((art) => (
                  <div key={art.id} className="bg-[#ecdcaf] text-[#191410] p-3 border border-[#191410] flex items-center gap-3 shadow-md">
                    <img src={art.image} alt={art.name} className="w-14 h-14 object-cover border border-[#191410]" />
                    <div className="flex flex-col">
                      <span className="font-mono text-[8px] font-bold text-[#c2272a] uppercase">{art.role}</span>
                      <h4 className="font-poster text-lg text-[#191410] leading-none my-0.5">{art.name}</h4>
                      <span className="font-mono text-[9px] text-[#191410]/70">{art.genre}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. SESSION GALLERY & ATMOSPHERE */}
            <div className="w-full bg-[#191410] border-2 border-[#ecdcaf]/30 p-6 shadow-[6px_6px_0px_#191410] text-left flex flex-col gap-4">
              <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">04 // SESSION ATMOSPHERE GALLERY</span>
              <div className="grid grid-cols-3 gap-2">
                {gallery.slice(0, 3).map((item) => (
                  <img 
                    key={item.id} 
                    src={item.src} 
                    alt={item.label} 
                    className="w-full aspect-[4/3] object-cover border border-[#ecdcaf]/20 filter contrast-110 hover:scale-105 transition-transform duration-300" 
                  />
                ))}
              </div>
            </div>

            {/* 6. LOCATION MAP & SANCTUARY */}
            <div className="w-full bg-[#4c1210] border-2 border-[#d1a437] p-6 shadow-[6px_6px_0px_#191410] text-left flex flex-col gap-3">
              <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">05 // SANCTUARY LOCATION</span>
              <h3 className="font-poster text-xl text-[#ecdcaf]">{session.venue}</h3>
              <p className="font-mono text-xs text-[#ecdcaf]/80">{session.city}, TELANGANA · 17TH CENTURY HERITAGE MONUMENT</p>
              <div className="p-3 bg-[#191410] border border-[#d1a437]/40 font-mono text-[10px] text-[#d1a437]">
                📍 DIRECTIONS: Follow stepwell lantern markers from Secunderabad Metro Station. Parking available at heritage sanctuary entrance.
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (COL-5): STICKY TICKET TIER SELECTION, FORM & PAYMENT */}
          <div className="lg:col-span-5 sticky top-20 flex flex-col gap-6">
            
            {/* TICKET STUB SELECTION CARD */}
            <div className="w-full bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[10px_10px_0px_#4c1210] text-left relative flex flex-col gap-5">
              
              {/* TICKET STUB HEAD */}
              <div className="flex justify-between items-center border-b-2 border-dashed border-[#191410]/40 pb-3">
                <div>
                  <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase tracking-widest">BOX OFFICE ADMIT</span>
                  <h3 className="font-poster text-2xl text-[#191410] leading-none">
                    {isSubmitted ? 'YOUR TICKET' : 'SELECT TICKET TIER'}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#c2272a] text-[#ecdcaf] flex items-center justify-center font-poster text-sm shadow-md">
                  1974
                </div>
              </div>

              {isSubmitted && confirmedBooking ? (
                <div className="flex flex-col items-center gap-4 text-center py-2">
                  {qrDataUrl && (
                    <img src={qrDataUrl} alt="Ticket QR code" className="w-48 h-48 border-4 border-[#191410]" />
                  )}
                  <div className="font-mono text-lg font-bold tracking-widest text-[#191410]">
                    {confirmedBooking.registration_code}
                  </div>
                  <p className="font-mono text-[10px] text-[#241a12]/70 uppercase leading-relaxed">
                    Show this QR code at check-in. A copy is saved to your Passport.
                  </p>
                  <div className="w-full p-3 bg-[#2e6834] text-[#ecdcaf] font-mono text-[10px] font-bold border-2 border-[#191410]">
                    ✓ BOOKING CONFIRMED — {ticketQuantity}x {selectedTier.name}
                  </div>
                  <button
                    onClick={() => { playSFX('ticketClick'); navigate('/sessions'); }}
                    className="w-full py-3 bg-[#191410] text-[#ecdcaf] hover:bg-[#c2272a] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410]"
                  >
                    BACK TO SESSIONS →
                  </button>
                </div>
              ) : !isLoggedIn ? (
                <div className="flex flex-col items-center gap-4 text-center py-6">
                  <p className="font-mono text-xs text-[#241a12]/80 leading-relaxed">
                    Sign in to your Tangy Passport to book tickets for this session.
                  </p>
                  <button
                    onClick={() => { playSFX('ticketClick'); openLoginModal(); }}
                    className="w-full py-3 bg-[#c2272a] text-[#ecdcaf] hover:bg-[#191410] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410]"
                  >
                    SIGN IN TO BOOK →
                  </button>
                </div>
              ) : isSoldOut ? (
                <div className="p-4 bg-[#5A120D] text-[#ecdcaf] font-mono text-xs font-bold text-center border-2 border-[#191410]">
                  THIS SESSION IS SOLD OUT.
                </div>
              ) : isPast ? (
                <div className="p-4 bg-[#5A120D] text-[#ecdcaf] font-mono text-xs font-bold text-center border-2 border-[#191410]">
                  THIS SESSION HAS ALREADY TAKEN PLACE.
                </div>
              ) : (
                <>
              {/* TIER SELECTION BUTTONS */}
              <div className="flex flex-col gap-3">
                {ticketTiers.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => handleTierSelect(tier)}
                    className={`p-3.5 border-2 cursor-pointer transition-all ${selectedTier.id === tier.id ? 'bg-[#191410] text-[#ecdcaf] border-[#191410] shadow-md scale-[1.01]' : 'bg-[#ecdcaf] text-[#191410] border-[#191410]/30 hover:border-[#191410]'}`}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-poster text-base">{tier.name}</h4>
                      <span className="font-poster text-lg text-[#d1a437]">₹{tier.price}</span>
                    </div>
                    <p className={`font-mono text-[10px] mt-1 ${selectedTier.id === tier.id ? 'text-[#ecdcaf]/80' : 'text-[#191410]/80'}`}>
                      {tier.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* QUANTITY SELECTOR */}
              <div className="flex items-center justify-between bg-[#191410] text-[#ecdcaf] p-3 border border-[#191410]">
                <span className="font-mono text-xs font-bold">NUMBER OF TICKETS:</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleQuantityChange(-1)}
                    className="w-8 h-8 bg-[#c2272a] text-[#ecdcaf] font-bold text-lg flex items-center justify-center border border-[#ecdcaf] active:scale-95 transition-transform"
                  >
                    -
                  </button>
                  <span className="font-poster text-xl text-[#d1a437]">{ticketQuantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(1)}
                    className="w-8 h-8 bg-[#c2272a] text-[#ecdcaf] font-bold text-lg flex items-center justify-center border border-[#ecdcaf] active:scale-95 transition-transform"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* BOOKING FORM INPUTS */}
              <form onSubmit={handleProceedPayment} className="flex flex-col gap-3 border-t-2 border-dashed border-[#191410]/40 pt-4">
                <span className="font-mono text-[9.5px] font-bold text-[#c2272a] tracking-wider uppercase">ATTENDEE INFORMATION</span>
                
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="FULL NAME"
                  className="w-full p-2.5 bg-[#ecdcaf] text-[#191410] font-mono text-xs border border-[#191410] placeholder:text-[#191410]/60 outline-none"
                />

                <input 
                  type="tel" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="PHONE NUMBER (+91)"
                  className="w-full p-2.5 bg-[#ecdcaf] text-[#191410] font-mono text-xs border border-[#191410] placeholder:text-[#191410]/60 outline-none"
                />

                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="EMAIL ADDRESS"
                  className="w-full p-2.5 bg-[#ecdcaf] text-[#191410] font-mono text-xs border border-[#191410] placeholder:text-[#191410]/60 outline-none"
                />

                {/* PRICE BREAKDOWN SUMMARY */}
                <div className="bg-[#191410] text-[#ecdcaf] p-4 border border-[#191410] flex flex-col gap-1.5 font-mono text-xs my-1">
                  <div className="flex justify-between text-[#ecdcaf]/80">
                    <span>Subtotal ({ticketQuantity}x {selectedTier.name})</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#ecdcaf]/80">
                    <span>GST Taxes (18%)</span>
                    <span>₹{taxes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#d1a437] pt-2 border-t border-[#ecdcaf]/20 mt-1">
                    <span>TOTAL AMOUNT DUE</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="p-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-[10px] font-bold border-2 border-[#191410]">
                    ✕ {bookingError}
                  </div>
                )}

                <div className="p-2 bg-[#d1a437]/20 text-[#191410] font-mono text-[9px] border border-[#d1a437]/50">
                  ℹ️ TEST MODE — payment capture isn't wired up yet, so this confirms your booking directly. Live Razorpay checkout will replace this before launch.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-[#191410] text-[#ecdcaf] hover:bg-[#c2272a] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'CONFIRMING...' : `CONFIRM BOOKING (₹${totalAmount.toLocaleString()}) →`}
                </button>

              </form>
              </>
              )}

            </div>

          </div>

        </div>

      </main>

      {/* MOBILE STICKY BOTTOM PAYMENT BAR (<1024px) */}
      {!isSubmitted && !isSoldOut && !isPast && (
        <div className="fixed bottom-0 left-0 right-0 z-[150] bg-[#191410] border-t-2 border-[#d1a437] p-3 flex lg:hidden items-center justify-between gap-3 shadow-2xl">
          <div className="flex flex-col text-left">
            <span className="font-mono text-[9px] text-[#d1a437] font-bold">{ticketQuantity}x {selectedTier.name}</span>
            <span className="font-poster text-xl text-[#ecdcaf]">₹{totalAmount.toLocaleString()}</span>
          </div>

          <button
            onClick={(e) => { isLoggedIn ? handleProceedPayment(e) : openLoginModal(); }}
            disabled={isSubmitting}
            className="px-5 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase border border-[#ecdcaf] active:scale-95 transition-transform disabled:opacity-50"
          >
            {isLoggedIn ? (isSubmitting ? 'CONFIRMING...' : 'CONFIRM BOOKING →') : 'SIGN IN TO BOOK →'}
          </button>
        </div>
      )}

      <Footer />
    </motion.div>
  );
};
