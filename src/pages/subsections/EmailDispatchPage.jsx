import { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { isMockAuth } from '../../config/auth';
import { enquiryService } from '../../services/enquiryService';

const INQUIRY_TYPES = ['GENERAL', 'PRESS', 'COLLABORATION', 'VENUE', 'PRIVATE EVENT'];

export const EmailDispatchPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inquiry, setInquiry] = useState('GENERAL');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isMockAuth) {
      enquiryService.createContact({ name, email, subject, message, category: inquiry });
      setSubmitted(true);
      return;
    }
    if (!isSupabaseConfigured) {
      setSubmitted(true);
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.from('contact_enquiries').insert({
      name, email, subject, message, inquiry_type: inquiry,
    });
    setSubmitting(false);
    if (err) {
      setError('Something went wrong sending your message — please try again.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/contact" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO CONTACT</a>
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            DISPATCH DESK // HYDERABAD
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-8xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            EMAIL<br/>DISPATCH
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            WRITE TO US DIRECTLY. WE REPLY TO EVERY DISPATCH WITHIN 48 HOURS.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-20 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-[#E7D5A4] text-[#11100C] p-5 sm:p-10 md:p-14 border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C] sm:shadow-[20px_20px_0px_#11100C]">
          {submitted ? (
            <div className="text-center py-10 sm:py-16">
              <div className="display text-5xl sm:text-7xl text-[#11100C] mb-4">✦</div>
              <h3 className="display text-3xl sm:text-5xl text-[#11100C] mb-3">DISPATCH TRANSMITTED</h3>
              <p className="font-mono text-xs text-[#11100C]/70 max-w-md mx-auto uppercase tracking-wider leading-relaxed">
                Thank you for writing to Tangy Sessions. We will reply to your message within 48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
              <div>
                <label className="font-bold text-[#B94717] block mb-2 uppercase text-[10px]">INQUIRY TYPE</label>
                <div className="flex gap-1.5 flex-wrap">
                  {INQUIRY_TYPES.map((type) => (
                    <button key={type} type="button" onClick={() => setInquiry(type)}
                      className={`px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider border transition-colors ${
                        inquiry === type ? 'bg-[#11100C] text-[#E7D5A4] border-[#11100C]' : 'bg-[#F5E9C9] text-[#11100C] border-[#11100C]/40 hover:border-[#11100C]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#B94717] block mb-1 uppercase text-[10px]">NAME *</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="YOUR NAME" className="w-full p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none focus:border-[#B94717]" />
                </div>
                <div>
                  <label className="font-bold text-[#B94717] block mb-1 uppercase text-[10px]">EMAIL *</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="YOUR EMAIL" className="w-full p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none focus:border-[#B94717]" />
                </div>
              </div>
              <div>
                <label className="font-bold text-[#B94717] block mb-1 uppercase text-[10px]">SUBJECT *</label>
                <input required type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="SUBJECT OF INQUIRY" className="w-full p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none focus:border-[#B94717]" />
              </div>
              <div>
                <label className="font-bold text-[#B94717] block mb-1 uppercase text-[10px]">MESSAGE *</label>
                <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="YOUR MESSAGE..." className="w-full p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none focus:border-[#B94717] resize-none" />
              </div>
              {error && <div className="p-3 bg-[#c2272a] text-white font-bold border-2 border-[#11100C]">{error}</div>}
              <button type="submit" disabled={submitting} className="py-3 sm:py-4 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] border-2 border-[#11100C] hover:border-[#B94717] font-bold uppercase tracking-[0.2em] transition-colors shadow-[4px_4px_0px_#11100C] disabled:opacity-50">
                {submitting ? 'SENDING...' : 'SEND DISPATCH →'}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};
