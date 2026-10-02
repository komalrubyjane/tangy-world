import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSessionDetail, useBookingQuote } from '../hooks/useSessionDetail';
import { usePageMeta } from '../hooks/usePageMeta';
import { useUserAuth } from '../context/UserAuthContext';
import { bookingService } from '../lib/bookingService';
import { generateQrDataUrl } from '../lib/qr';
import { useAudio } from '../audio/AudioContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { CheckoutSteps } from '../components/booking/CheckoutSteps';
import { useSessionBackground } from '../lib/sessionBackground';
import { WaitlistPanel, WaitlistOfferBanner } from '../components/booking/WaitlistPanel';

// The public session page (/sessions/:slug; /book/:id is kept as an alias).
// Ticket types, prices and seats come from the server (event_ticket_types /
// event_availability, migrations 0026–0027) — nothing here is hard-coded.
export const BookingPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const { user, isLoggedIn, openLoginModal } = useUserAuth();
  const { session, availability, availabilityAt, live, lineup, waitlist, loading: eventsLoading, error: loadError, refresh } = useSessionDetail(sessionId, user?.id);

  const isPast = session?.dbStatus === 'past' || (session?.rawDate && session.rawDate < new Date().toISOString().slice(0, 10));
  const isCancelled = session?.dbStatus === 'cancelled';
  const offer = waitlist?.status === 'offered' && new Date(waitlist.offer_expires_at) > new Date() ? waitlist : null;
  const remaining = availability?.remaining ?? null;
  // A live waitlist offer means seats are held for this person even though
  // the session shows as sold out to everyone else.
  const isSoldOut = !offer && (session?.status === 'SOLD OUT' || !!availability?.sold_out);

  const ticketTiers = useMemo(() => (availability?.ticket_types || []).map((t) => ({
    id: t.code, name: t.name, price: Number(t.price), desc: t.description || '', remaining: t.remaining,
  })), [availability]);

  usePageMeta({
    title: session ? session.title : eventsLoading ? 'Session' : 'Session not found',
    description: session ? `${session.title} — ${[session.date, session.time, session.venue].filter(Boolean).join(' · ')}. ${session.description || ''}` : undefined,
    image: session?.image,
    noindex: !eventsLoading && !session,
  });

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
  const selectedTier = ticketTiers.find((t) => t.id === form.tierId) || ticketTiers[0] || null;
  const quote = useBookingQuote(session?.id, selectedTier?.id, form.quantity);

  // Default to the first ticket type that is actually on sale.
  useEffect(() => {
    if (ticketTiers.length && !ticketTiers.some((t) => t.id === form.tierId && t.remaining !== 0)) {
      const first = ticketTiers.find((t) => t.remaining !== 0) || ticketTiers[0];
      setForm((f) => ({ ...f, tierId: first.id }));
    }
  }, [ticketTiers, form.tierId]);

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

  const fail = (message, review = false) => setPay({ status: 'failed', review, message: message || 'The payment did not go through.' });

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
          fail(verifyRes.error || 'We could not verify the payment — please contact support before retrying.', verifyRes.review);
          if (verifyRes.review) { orderRef.current = null; refresh(); }
          return;
        }
        orderRef.current = null;
        setPay({ status: 'idle', message: '' });
        await finalizeConfirmedBooking(verifyRes.booking, verifyRes.tickets);
        refresh();
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
    if (!session || !selectedTier || pay.status === 'processing') return;
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
      refresh();   // seats or prices may have changed
      return;
    }
    orderRef.current = { fingerprint, order: orderRes.order };
    setPay({ status: 'idle', message: '' });
    openCheckout(orderRes.order);
  };

  // This session's own background (set in the event editor), on its page and its checkout.
  const pageBackground = useSessionBackground(session?.background, session?.image);
  if (eventsLoading) {
    return (
      <div className="theme-sessions w-full min-h-[100dvh] text-[#ecdcaf] flex items-center justify-center font-mono text-xs font-bold">
        LOADING SESSION...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="theme-sessions w-full min-h-[100dvh] text-[#ecdcaf] flex flex-col items-center justify-center gap-4 font-mono text-xs font-bold p-8 text-center">
        <h1 className="font-poster text-3xl">{loadError ? 'We couldn’t load this session' : 'Session not found'}</h1>
        <p className="font-normal max-w-sm">{loadError ? 'Check your connection and try again.' : 'It may have been moved or is no longer listed.'}</p>
        {loadError && <button onClick={refresh} className="px-4 py-2 bg-[#ecdcaf] text-[#191410] border-2 border-[#ecdcaf] uppercase">Try again</button>}
        <button
          onClick={() => navigate('/sessions')}
          className="px-4 py-2 bg-[#c2272a] text-[#ecdcaf] border-2 border-[#ecdcaf] uppercase"
        >
          ← BACK TO SESSIONS
        </button>
      </div>
    );
  }

  // A session that has happened lives in the archive (/sessions/archive/:slug).
  if (isPast) return <Navigate to={`/sessions/archive/${session.slug || sessionId}`} replace />;

  const fromPrice = ticketTiers.length ? Math.min(...ticketTiers.map((t) => t.price)) : null;
  const statusText = isCancelled ? 'CANCELLED' : isPast ? 'PAST SESSION' : isSoldOut ? 'SOLD OUT' : remaining != null ? `${remaining} ${remaining === 1 ? 'SEAT' : 'SEATS'} LEFT` : 'ON SALE';
  const day = session.rawDate ? new Date(`${session.rawDate}T00:00:00`) : null;
  // The site's two materials: ink panels and cream paper documents, both with hard ink shadows.
  const ink = 'w-full bg-[#181614] text-[#EFE2C0] border-2 border-[#EFE2C0]/20 shadow-[4px_4px_0px_#0b0907] p-6 sm:p-7 text-left';
  const paper = 'w-full bg-[#EFE2C0] paperTexture text-[#181614] border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] p-6 sm:p-7 text-left';
  const label = 'font-mono text-[10px] font-bold tracking-[0.3em] uppercase m-0';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="theme-sessions relative isolate w-full min-h-[100dvh] font-sans antialiased overflow-x-clip selection:bg-[#c2272a] selection:text-[#ecdcaf] pt-16 pb-20"
      data-page-background={session.background || 'default'}
    >
      {/* The site's textured background (theme-sessions); a session can add its own backdrop
          (cover photo, colour or image, chosen in the event editor) under the same grain. */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none" style={pageBackground} data-session-backdrop />
      <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none opacity-60" style={{ backgroundImage: "url('/textures/grain-soft.webp'), url('/textures/fibers-light.webp')", backgroundSize: '160px, 720px' }} />

      <Navbar onOpenProgramme={() => navigate('/')} />

      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <button
            onClick={() => { playSFX('ticketClick'); navigate('/sessions'); }}
            className="t-btn t-btn-light min-h-[44px]"
          >
            ← BACK TO ALL SESSIONS
          </button>
          <span className="t-label sec-accent">03 — Box office // {session.city}</span>
        </div>

        {/* HERO — poster on the left, the ticket's facts on the right; same height, top-aligned */}
        <header className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch mb-10" data-session-hero>
          <figure className="lg:col-span-7 m-0 relative bg-[#EFE2C0] paperTexture border-2 border-[#11100C] shadow-[6px_6px_0px_#11100C] p-3 sm:p-4 flex flex-col">
            <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-[#181614] pb-3">
              <span>VOL. TK-1974 · SESSION</span>
              <span className="border-2 border-[#181614] px-2 py-0.5 -rotate-2">{isCancelled ? 'Cancelled' : isSoldOut ? 'Sold out' : 'Available'}</span>
            </div>
            <div className="relative flex-1 min-h-[240px] sm:min-h-[340px] border-2 border-[#11100C] overflow-hidden">
              <img src={session.image} alt={`${session.title} — poster`} className="absolute inset-0 w-full h-full object-cover contrast-110" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              {day && (
                <span aria-hidden="true" className="absolute left-4 bottom-3 font-display uppercase leading-[0.85] text-[#EFE2C0] drop-shadow-[3px_3px_0_#11100C]">
                  <span className="block text-5xl sm:text-6xl">{day.toLocaleDateString('en-IN', { month: 'short' })} {day.getDate()}</span>
                  <span className="block text-4xl sm:text-5xl">{day.getFullYear()}</span>
                </span>
              )}
            </div>
            <figcaption className="flex justify-between items-center pt-3 font-mono text-[10px] font-bold uppercase text-[#181614]">
              <span>Hyderabad live archive</span>
              <span className="text-[#B5532A]">Admit one · Stage A</span>
            </figcaption>
          </figure>

          <div className="lg:col-span-5 bg-[#181614] border-2 border-[#EFE2C0]/25 shadow-[6px_6px_0px_#0b0907] p-6 sm:p-8 flex flex-col">
            <span className={`${label} text-[#C89D35]`}>Tangy Sessions · Live</span>
            <h1 className="display uppercase text-[#EFE2C0] text-4xl sm:text-5xl lg:text-[3.4rem] leading-[0.95] mt-3 mb-5 ink-bleed">{session.title}</h1>
            <dl className="m-0 grid grid-cols-1 gap-0 border-t border-[#EFE2C0]/20">
              {[['Date', session.date], ['Doors', session.time || 'To be announced'], ['Venue', session.venue || 'To be announced']].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 py-3 border-b border-[#EFE2C0]/20">
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#C89D35]">{k}</dt>
                  <dd className="m-0 font-mono text-sm text-[#EFE2C0] text-right">{v}</dd>
                </div>
              ))}
            </dl>
            {session.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {session.tags.map((tag) => <span key={tag} className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#C89D35]/15 text-[#E4C77A] border border-[#C89D35]/50">{tag}</span>)}
              </div>
            )}
            <div className="mt-auto pt-6">
              <span className={`inline-flex items-center gap-2 px-3.5 py-2 font-mono text-xs font-bold border-2 border-[#11100C] -rotate-1 shadow-[3px_3px_0_#11100C] ${isCancelled || isSoldOut ? 'bg-[#B5532A] text-[#EFE2C0]' : 'bg-[#EFE2C0] text-[#181614]'}`}>
                <span aria-hidden="true" className={`w-2 h-2 rounded-full ${isCancelled || isSoldOut ? 'bg-[#EFE2C0]' : 'bg-[#2e8a5b] animate-pulse'}`} />
                <span data-seats-left data-live={live ? 'true' : 'false'} title={live ? 'Seat count updates live' : availabilityAt ? `Updated ${availabilityAt.toLocaleTimeString()}` : undefined}>{statusText}</span>
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT — the session, in the site's numbered sections */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <section className={ink} aria-label="At a glance">
              <span className={`${label} text-[#C89D35]`}>01 // At a glance</span>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 mb-0 border-t border-[#EFE2C0]/15 pt-4">
                {[['Date', session.date], ['Time', session.time || 'TBA'], ['From', fromPrice != null ? `₹${fromPrice.toLocaleString('en-IN')}` : '—'], ['Capacity', `${session.capacity} seats`]].map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#EFE2C0]/55">{k}</dt>
                    <dd className="m-0 mt-1 font-condensed uppercase text-xl text-[#EFE2C0] leading-tight">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className={paper} aria-labelledby="about-title">
              <h2 id="about-title" className={`${label} text-[#B5532A]`}>02 // About the session</h2>
              <p className="mt-3 mb-0 font-body text-[15px] text-[#181614]/90 leading-relaxed whitespace-pre-line">
                {session.description || 'Details for this session will be announced soon.'}
              </p>
              {session.story && (
                <blockquote className="mt-4 mb-0 p-3 bg-[#181614] text-[#EFE2C0] border-l-4 border-[#B5532A] font-serif italic text-sm">
                  “{session.story}”
                </blockquote>
              )}
            </section>

            {lineup.length > 0 && (
              <section className={ink} aria-labelledby="lineup-title" data-lineup>
                <h2 id="lineup-title" className={`${label} text-[#C89D35]`}>03 // Line-up</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none mt-4 mb-0 p-0">
                  {lineup.map((art) => (
                    <li key={art.id}>
                      <Link to={art.slug ? `/artists/${art.slug}` : '/artist'} className="flex items-center gap-3 bg-[#EFE2C0] paperTexture text-[#181614] p-3 border-2 border-[#11100C] shadow-[3px_3px_0_#0b0907] hover:-translate-y-0.5 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C89D35]">
                        {art.avatar_url
                          ? <img src={art.avatar_url} alt="" className="w-12 h-12 object-cover border-2 border-[#11100C]" loading="lazy" />
                          : <span aria-hidden="true" className="w-12 h-12 flex items-center justify-center border-2 border-[#11100C] font-display text-xl">{(art.stage_name || art.name).slice(0, 1)}</span>}
                        <span className="flex flex-col min-w-0">
                          <span className="font-condensed uppercase text-lg leading-tight truncate">{art.stage_name || art.name}</span>
                          <span className="font-mono text-[10px] text-[#181614]/70 truncate">{[art.genre, art.city].filter(Boolean).join(' · ')}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* TICKETS — types and prices from the server (event_ticket_types, 0026). */}
            {ticketTiers.length > 0 && (
              <section className={paper} aria-labelledby="tickets-title" data-ticket-types-public>
                <h2 id="tickets-title" className={`${label} text-[#B5532A]`}>04 // Tickets</h2>
                <ul className="list-none mt-4 mb-0 p-0 flex flex-col divide-y-2 divide-dashed divide-[#181614]/25">
                  {ticketTiers.map((t) => (
                    <li key={t.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <span className="min-w-0">
                        <span className="font-condensed uppercase text-xl block leading-tight">{t.name}</span>
                        {t.desc && <span className="block mt-0.5 font-body text-[13px] text-[#181614]/75">{t.desc}</span>}
                      </span>
                      <span className="text-right font-mono text-xs shrink-0">
                        <span className="block text-base font-bold text-[#B5532A]">₹{t.price.toLocaleString('en-IN')}</span>
                        {t.remaining != null && <span className="block text-[#181614]/60">{t.remaining === 0 ? 'Sold out' : `${t.remaining} left`}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="font-mono text-[10px] text-[#181614]/60 mt-4 mb-0">Prices per person, before GST. The total is calculated at checkout.</p>
              </section>
            )}

            <section className={ink} aria-labelledby="venue-title">
              <h2 id="venue-title" className={`${label} text-[#C89D35]`}>05 // Venue</h2>
              <p className="font-condensed uppercase text-2xl text-[#EFE2C0] mt-3 mb-0 leading-tight">{session.venue || 'Venue to be announced'}</p>
              <p className="font-mono text-xs text-[#EFE2C0]/70 mt-1 mb-0">{session.city}</p>
              {session.venue && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${session.venue}, ${session.city}`)}`} target="_blank" rel="noopener noreferrer"
                  className="t-btn t-btn-light mt-4 min-h-[44px] inline-flex">
                  Open in Google Maps ↗
                </a>
              )}
            </section>
          </div>

          {/* RIGHT — the box office, sticky beside the details */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col gap-6" aria-label="Booking">
            <div className="w-full bg-[#EFE2C0] paperTexture text-[#241a12] border-2 border-[#11100C] shadow-[6px_6px_0px_#11100C] p-6 sm:p-7 text-left relative flex flex-col gap-5">
              <div className="flex justify-between items-center border-b-2 border-dashed border-[#191410]/40 pb-4">
                <div>
                  <span className="font-mono text-[9.5px] font-bold text-[#B5532A] uppercase tracking-[0.25em]">Box office admit</span>
                  <h2 className="display uppercase text-3xl text-[#191410] leading-none mt-1 mb-0">
                    {isSubmitted ? 'YOUR BOOKING' : 'BOOK YOUR PLACE'}
                  </h2>
                </div>
                {fromPrice != null && !isSubmitted ? (
                  <span className="text-right font-mono text-[10px] uppercase tracking-wider text-[#241a12]/70">From<span className="block font-condensed text-2xl text-[#191410] normal-case tracking-normal">₹{fromPrice.toLocaleString('en-IN')}</span></span>
                ) : (
                  <span aria-hidden="true" className="w-11 h-11 rounded-full bg-[#B5532A] text-[#EFE2C0] flex items-center justify-center font-display text-sm shadow-md">1974</span>
                )}
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
                    <img src={groupQr} alt="Booking QR code" className="w-48 h-48 border-2 border-[#191410]" data-booking-qr />
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
              ) : isCancelled ? (
                <div className="p-4 bg-[#4A171D] text-[#ecdcaf] font-mono text-xs font-bold text-center border-2 border-[#191410]">
                  THIS SESSION HAS BEEN CANCELLED.
                </div>
              ) : isPast ? (
                <div className="p-4 bg-[#4A171D] text-[#ecdcaf] font-mono text-xs font-bold text-center border-2 border-[#191410]">
                  THIS SESSION HAS ALREADY TAKEN PLACE.
                </div>
              ) : isSoldOut ? (
                <WaitlistPanel session={session} entry={waitlist} isLoggedIn={isLoggedIn} onChange={refresh}
                  onSignIn={() => { playSFX('ticketClick'); openLoginModal('TO JOIN THE WAITLIST'); }} />
              ) : !isLoggedIn ? (
                <div className="flex flex-col items-center gap-4 text-center py-6">
                  <p className="font-mono text-xs text-[#241a12]/80 leading-relaxed">
                    Sign in to your Tangy Passport to book tickets for this session.
                  </p>
                  <button
                    onClick={() => { playSFX('ticketClick'); openLoginModal('TO BOOK THIS SESSION'); }}
                    className="w-full py-3 bg-[#c2272a] text-[#ecdcaf] hover:bg-[#191410] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410]"
                  >
                    SIGN IN TO BOOK →
                  </button>
                </div>
              ) : !selectedTier ? (
                <p className="p-4 font-mono text-xs text-[#191410] text-center border-2 border-dashed border-[#191410]/40 m-0">
                  Tickets for this session aren't on sale yet.
                </p>
              ) : (
                <>
                  {offer && <WaitlistOfferBanner entry={offer} />}
                  <CheckoutSteps event={session} tiers={ticketTiers} form={form} setForm={setForm} step={step} setStep={setStep}
                    pay={pay} onPay={handlePay} onRetry={handlePay} quote={quote}
                    maxAvailable={offer ? offer.quantity + (remaining ?? 0) : remaining ?? undefined} />
                </>
              )}

            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};
