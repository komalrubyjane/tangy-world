import { useState, useMemo, useEffect, useRef } from 'react';
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
import { CheckoutSteps } from '../components/booking/CheckoutSteps';

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

  // Checkout form (see components/booking/CheckoutSteps). One object so nothing
  // typed is lost moving between steps.
  const [form, setForm] = useState(() => ({
    fullName: '', phone: '', email: '', instagram: '', quantity: 1, tierId: 'gen', names: [''],
    answers: {}, collabInterests: [], collabNote: '', note: '',
  }));
  const [step, setStep] = useState(1);
  // idle | processing | failed | dismissed — payment itself is only ever
  // confirmed by the server (verify-payment / webhook).
  const [pay, setPay] = useState({ status: 'idle', message: '' });
  // The Razorpay order for the current details: retrying reopens it instead of
  // creating another pending booking.
  const orderRef = useRef(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [groupQr, setGroupQr] = useState('');
  const [confirmedTickets, setConfirmedTickets] = useState([]);
  const selectedTier = ticketTiers.find((t) => t.id === form.tierId) || ticketTiers[0];

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, fullName: f.fullName || user.full_name || '', email: f.email || user.email || '' }));
  }, [user]);
  // Start inside this event's per-booking range.
  useEffect(() => {
    if (session) setForm((f) => ({ ...f, quantity: Math.min(Math.max(f.quantity, session.bookingMin ?? 1), session.bookingMax ?? 10) }));
  }, [session]);

  const loadRazorpayScript = () => new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the payment gateway. Check your connection and try again.'));
    document.body.appendChild(script);
  });

  // ONE QR for the whole booking (0023), generated client-side from the
  // booking's opaque group token (never the registration_code, a database id
  // or a name). It only identifies the booking — staff see the attendee list
  // after scanning and check people in by name. Tickets (the named attendees)
  // only exist once the booking is genuinely confirmed server-side, so there
  // is no unverified-state QR.
  const finalizeConfirmedBooking = async (booking, tickets) => {
    setConfirmedBooking(booking);
    setIsSubmitted(true);
    setConfirmedTickets(tickets || []);
    setGroupQr(booking.group_token ? await generateQrDataUrl(`TANGY:BOOKING:${booking.group_token}`) : '');
    // Best-effort — the booking is already fully confirmed regardless of
    // whether this email send succeeds; see sendTicketEmail's own comment.
    bookingService.sendTicketEmail(booking.id);
  };

  const fail = (message) => setPay({ status: 'failed', message: message || 'The payment did not go through.' });

  const openCheckout = async (order) => {
    try {
      await loadRazorpayScript();
    } catch (err) {
      fail(err.message);
      return;
    }
    const { order_id, amount, currency, key_id, booking_id } = order;
    const rzp = new window.Razorpay({
      key: key_id,
      amount,
      currency,
      order_id,
      name: 'Tangy Sessions',
      description: `${selectedTier.name} × ${form.quantity} — ${session.title}`,
      prefill: { name: form.fullName, email: form.email, contact: form.phone },
      theme: { color: '#c2272a' },
      handler: async (response) => {
        // Razorpay's success callback is not proof of payment: the server
        // verifies the signature before confirming anything.
        const verifyRes = await bookingService.verifyPayment({
          bookingId: booking_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (!verifyRes.success) {
          fail(verifyRes.error || 'We could not verify the payment — please contact support before retrying.');
          return;
        }
        orderRef.current = null;
        setPay({ status: 'idle', message: '' });
        await finalizeConfirmedBooking(verifyRes.booking, verifyRes.tickets);
      },
      modal: {
        ondismiss: () => setPay((p) => (p.status === 'failed' ? p : { status: 'dismissed', message: '' })),
      },
    });
    rzp.on('payment.failed', (resp) => fail(resp.error?.description));
    rzp.open();
  };

  // Server computes the authoritative amount; nothing here is trusted for
  // pricing. The same details retried reuse the same order (no duplicate
  // pending bookings); changed details start a new one and the old unpaid
  // hold expires on its own (bookings.pending_timeout_minutes).
  const handlePay = async () => {
    if (!session || pay.status === 'processing') return;
    playSFX('ticketClick');
    const payload = {
      eventId: session.id,
      quantity: form.quantity,
      tierId: selectedTier.id,
      attendeeName: form.fullName.trim(),
      attendeeEmail: form.email.trim(),
      attendeePhone: form.phone.trim(),
      attendeeNames: form.names.map((n) => n.trim()),
      details: {
        answers: Object.fromEntries(Object.entries(form.answers).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0))),
        instagram: form.instagram.trim() || null,
        note: form.note.trim() || null,
        collabInterests: form.collabInterests,
        collabNote: form.collabNote.trim() || null,
      },
    };
    const fingerprint = JSON.stringify(payload);
    setPay({ status: 'processing', message: '' });
    if (orderRef.current?.fingerprint === fingerprint) {
      setPay({ status: 'idle', message: '' });
      openCheckout(orderRef.current.order);
      return;
    }
    const orderRes = await bookingService.createPaymentOrder(payload);
    if (!orderRes.success) {
      orderRef.current = null;
      fail(orderRes.error || 'We could not start the payment.');
      return;
    }
    orderRef.current = { fingerprint, order: orderRes.order };
    setPay({ status: 'idle', message: '' });
    openCheckout(orderRes.order);
  };

  if (eventsLoading) {
    return (
      <div className="w-full min-h-[100dvh] bg-[#4A171D] text-[#ecdcaf] flex items-center justify-center font-mono text-xs font-bold textileTexture">
        LOADING SESSION...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full min-h-[100dvh] bg-[#4A171D] textileTexture text-[#ecdcaf] flex flex-col items-center justify-center gap-4 font-mono text-xs font-bold p-8 text-center">
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

          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-widest border border-[#d1a437]/40 px-3 py-1 uppercase bg-[#181614]">
            CONCERT TICKET BOX OFFICE // 1974
          </span>
        </div>

        {/* PAGE TITLE BANNER */}
        <div className="w-full bg-[#181614] border-4 border-[#d1a437] p-5 mb-8 shadow-[8px_8px_0px_#4c1210] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="font-mono text-[9.5px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              OFFICIAL BOX OFFICE DESK · {session.city}
            </span>
            <h1 className="font-poster text-3xl sm:text-4xl text-[#ecdcaf] leading-tight my-0.5">
              {session.title}
            </h1>
            <p className="font-mono text-xs text-[#d1a437]">{session.artist} · {session.venue} · {session.date}</p>
          </div>

          <div className="flex items-center gap-2 bg-[#EFE2C0] text-[#191410] px-3.5 py-1.5 font-mono text-xs font-bold border border-[#191410] -rotate-1 shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#B5532A] animate-pulse" />
            <span>STATUS: {session.status} ({session.capacity} SEATS LEFT)</span>
          </div>
        </div>

        {/* 2-COLUMN DESKTOP / STACKED MOBILE BOOKING GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN (COL-7): POSTER, EVENT DETAILS, GALLERY, ARTISTS, MAP */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* 1. LARGE EVENT POSTER WITH VINTAGE TAPE */}
            <div className="w-full bg-[#EFE2C0] paperTexture text-[#241a12] p-4 border-4 border-[#191410] shadow-[10px_10px_0px_#191410] relative rotate-[-1deg]">
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
            <div className="w-full bg-[#181614] border-2 border-[#ecdcaf]/30 p-6 shadow-[6px_6px_0px_#191410] text-left flex flex-col gap-4">
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
                  <span key={idx} className="font-mono text-[9px] font-bold bg-[#C89D35]/20 text-[#d1a437] border border-[#d1a437]/40 px-2.5 py-0.5 uppercase">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 3. ABOUT THE EVENT / STORY */}
            <div className="w-full bg-[#EFE2C0] paperTexture text-[#191410] border-2 border-[#191410] p-6 shadow-[6px_6px_0px_#c2272a] text-left flex flex-col gap-3">
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
            <div className="w-full bg-[#181614] border-2 border-[#ecdcaf]/30 p-6 shadow-[6px_6px_0px_#191410] text-left flex flex-col gap-4">
              <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">03 // FEATURED ARTISTS</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {artists.slice(0, 2).map((art) => (
                  <div key={art.id} className="bg-[#EFE2C0] paperTexture text-[#191410] p-3 border border-[#191410] flex items-center gap-3 shadow-md">
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
            <div className="w-full bg-[#181614] border-2 border-[#ecdcaf]/30 p-6 shadow-[6px_6px_0px_#191410] text-left flex flex-col gap-4">
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
            <div className="w-full bg-[#4A171D] border-2 border-[#d1a437] p-6 shadow-[6px_6px_0px_#191410] text-left flex flex-col gap-3">
              <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">05 // SANCTUARY LOCATION</span>
              <h3 className="font-poster text-xl text-[#ecdcaf]">{session.venue}</h3>
              <p className="font-mono text-xs text-[#ecdcaf]/80">{session.city}, TELANGANA · 17TH CENTURY HERITAGE MONUMENT</p>
              <div className="p-3 bg-[#181614] border border-[#d1a437]/40 font-mono text-[10px] text-[#d1a437]">
                📍 DIRECTIONS: Follow stepwell lantern markers from Secunderabad Metro Station. Parking available at heritage sanctuary entrance.
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (COL-5): STICKY TICKET TIER SELECTION, FORM & PAYMENT */}
          <div className="lg:col-span-5 sticky top-20 flex flex-col gap-6">
            
            {/* TICKET STUB SELECTION CARD */}
            <div className="w-full bg-[#EFE2C0] paperTexture text-[#241a12] border-4 border-[#191410] p-6 shadow-[10px_10px_0px_#4c1210] text-left relative flex flex-col gap-5">
              
              {/* TICKET STUB HEAD */}
              <div className="flex justify-between items-center border-b-2 border-dashed border-[#191410]/40 pb-3">
                <div>
                  <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase tracking-widest">BOX OFFICE ADMIT</span>
                  <h3 className="font-poster text-2xl text-[#191410] leading-none">
                    {isSubmitted ? 'YOUR BOOKING' : 'BOOK YOUR PLACE'}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#B5532A] text-[#ecdcaf] flex items-center justify-center font-poster text-sm shadow-md">
                  1974
                </div>
              </div>

              {isSubmitted && confirmedBooking ? (
                <div className="flex flex-col items-center gap-4 text-center py-2" data-booking-confirmed>
                  <div className="w-full p-3 bg-[#2e6834] text-[#ecdcaf] font-mono text-xs font-bold border-2 border-[#191410]" role="status">
                    BOOKING CONFIRMED 🎉
                  </div>
                  <dl className="w-full grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left font-mono text-[11px] text-[#191410] m-0">
                    <dt className="font-bold">Booking ID</dt><dd className="m-0 tracking-widest">{confirmedBooking.registration_code}</dd>
                    <dt className="font-bold">Event</dt><dd className="m-0">{session.title}</dd>
                    <dt className="font-bold">Attendees</dt><dd className="m-0">{confirmedTickets.length || confirmedBooking.quantity}</dd>
                  </dl>
                  {confirmedTickets.length > 0 && (
                    <ol className="w-full text-left flex flex-col gap-1 border-t-2 border-dashed border-[#191410]/30 pt-3 m-0 pl-0 list-none" aria-label="Attendees" data-confirmed-attendees>
                      {confirmedTickets.map((t, i) => (
                        <li key={t.id} className="font-mono text-xs text-[#191410] flex gap-2"><span aria-hidden="true">✓</span>{t.attendee_name || `Guest ${i + 1}`}</li>
                      ))}
                    </ol>
                  )}
                  {groupQr ? (
                    <img src={groupQr} alt="Booking QR code" className="w-48 h-48 border-4 border-[#191410]" data-booking-qr />
                  ) : (
                    <p className="font-mono text-[10px] text-[#241a12]/70">Issuing your booking QR — refresh your Passport in a moment if it doesn't appear here.</p>
                  )}
                  <p className="font-mono text-[10px] text-[#241a12]/80 leading-relaxed m-0">
                    Your QR represents the entire booking. Each attendee can arrive separately — the same QR can be scanned again until everyone is checked in.
                    It's saved in your Passport, and we've emailed it to you.
                  </p>
                  <button
                    onClick={() => { playSFX('ticketClick'); navigate('/dashboard'); }}
                    className="w-full py-3 bg-[#191410] text-[#ecdcaf] hover:bg-[#c2272a] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410]"
                  >
                    VIEW MY BOOKINGS →
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
                <div className="p-4 bg-[#4A171D] text-[#ecdcaf] font-mono text-xs font-bold text-center border-2 border-[#191410]">
                  THIS SESSION IS SOLD OUT.
                </div>
              ) : isPast ? (
                <div className="p-4 bg-[#4A171D] text-[#ecdcaf] font-mono text-xs font-bold text-center border-2 border-[#191410]">
                  THIS SESSION HAS ALREADY TAKEN PLACE.
                </div>
              ) : (
                <CheckoutSteps event={session} tiers={ticketTiers} form={form} setForm={setForm} step={step} setStep={setStep}
                  pay={pay} onPay={handlePay} onRetry={handlePay} />
              )}

            </div>

          </div>

        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
