import { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAudio } from '../../audio/AudioContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { isMockAuth } from '../../config/auth';
import { enquiryService } from '../../services/enquiryService';

const ENQUIRY_TYPE = 'corporate_event';

export const CorporateEventsPage = () => {
  const { playSFX } = useAudio();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [guests, setGuests] = useState('50-100');
  const [budget, setBudget] = useState('₹100,000 - ₹200,000');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !venue || !name || !email) return;
    playSFX('ticketClick');
    setFormError('');
    const guestCount = parseInt(guests, 10) || null;
    if (isMockAuth) {
      enquiryService.createPrivate({
        type: ENQUIRY_TYPE, name, email, phone, preferredDate: date, guestCount, budget,
        message: `Venue: ${venue}\nGuests: ${guests}\nBudget: ${budget}\n\n${message}`,
      });
      setSubmitted(true);
      return;
    }
    if (!isSupabaseConfigured) {
      setSubmitted(true);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('private_enquiries').insert({
      type: ENQUIRY_TYPE, name, email, phone, preferred_date: date, guest_count: guestCount,
      message: `Venue: ${venue}\nGuests: ${guests}\nBudget: ${budget}\n\n${message}`,
    });
    setSubmitting(false);
    if (error) {
      setFormError('Something went wrong submitting your request — please try again.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#315D73] text-[#ecdcaf] font-mono selection:bg-[#ecdcaf] selection:text-[#315D73] overflow-x-hidden pt-16 pb-20">
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <Navbar />

      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <a href="/private-sessions" className="font-mono text-[10px] text-[#ecdcaf]/70 tracking-widest uppercase hover:text-[#ecdcaf] transition-colors">← BACK TO PRIVATE SESSIONS</a>

        <div className="mt-6 mb-8 text-left">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">PRIVATE SESSIONS // CATEGORY 02</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf]">CORPORATE EVENTS</h1>
          <p className="font-mono text-xs text-[#ecdcaf]/80 mt-2 max-w-xl">
            Unplugged music curation for brand launches, executive retreats, and private dinners — a full
            resident collective with a dedicated sound engineer for larger corporate footprints.
          </p>
        </div>

        <div className="bg-[#191410] border-4 border-[#ecdcaf] p-6 sm:p-10 shadow-[10px_10px_0px_#191410] text-left">
          {submitted ? (
            <div className="bg-[#241a12] border-2 border-[#ecdcaf] p-8 text-center">
              <h3 className="font-poster text-3xl text-[#ecdcaf] mb-2">REQUEST TRANSMITTED!</h3>
              <p className="font-mono text-xs text-[#ecdcaf]/80">Our private session coordinator will get back to you within 48 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="YOUR NAME *" value={name} onChange={(e) => setName(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none" />
                <input required type="email" placeholder="YOUR EMAIL *" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none" />
              </div>
              <input type="tel" placeholder="PHONE NUMBER (OPTIONAL)" value={phone} onChange={(e) => setPhone(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none" />
                <input required type="text" placeholder="COMPANY / VENUE / LOCATION *" value={venue} onChange={(e) => setVenue(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={guests} onChange={(e) => setGuests(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none">
                  <option value="50-100">50 - 100 GUESTS</option>
                  <option value="100-200">100 - 200 GUESTS</option>
                  <option value="200+">200+ GUESTS</option>
                </select>
                <select value={budget} onChange={(e) => setBudget(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none">
                  <option value="₹100,000 - ₹200,000">₹100,000 - ₹200,000</option>
                  <option value="₹200,000 - ₹400,000">₹200,000 - ₹400,000</option>
                  <option value="₹400,000+">₹400,000+</option>
                </select>
              </div>
              <textarea rows={4} placeholder="DETAILS ABOUT YOUR CORPORATE EVENT..." value={message} onChange={(e) => setMessage(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none resize-none" />
              {formError && <div className="p-3 bg-[#c2272a] text-white font-bold border-2 border-[#ecdcaf]">{formError}</div>}
              <button type="submit" disabled={submitting} className="py-4 bg-[#ecdcaf] text-[#191410] font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#d1a437] border-2 border-[#191410] transition-colors shadow-[4px_4px_0px_#191410] disabled:opacity-50">
                {submitting ? 'SUBMITTING...' : 'REQUEST A CORPORATE SESSION →'}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
