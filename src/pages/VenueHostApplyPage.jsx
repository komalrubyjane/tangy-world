import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const VenueHostApplyPage = () => {
  const [form, setForm] = useState({ propertyName: '', contactName: '', email: '', phone: '', details: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isSupabaseConfigured) {
      setSubmitted(true);
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.from('collaborations').insert({
      type: 'venue_host',
      business_name: form.propertyName,
      contact_name: form.contactName,
      email: form.email,
      phone: form.phone,
      details: form.details,
    });
    setSubmitting(false);
    if (err) {
      setError('Something went wrong submitting your venue — please try again.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#1C0E08] text-[#E7D5A4] font-mono selection:bg-[#C69A32] selection:text-[#11100C]">
      <Navbar />

      <section className="relative pt-32 pb-16 px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C69A32]/40">
        <span className="font-mono text-xs text-[#C69A32] tracking-[0.35em] uppercase font-bold mb-3 block">
          HERITAGE VENUE APPLICATION // HYDERABAD
        </span>
        <h1 className="display text-6xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-6">
          HOST A SESSION
        </h1>
        <p className="font-mono text-sm md:text-base text-[#E7D5A4]/90 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#C69A32]/30 py-4 uppercase">
          HAVE A 300-YEAR-OLD STEPWELL, NIZAM-ERA COURTYARD, HAVELI OR ACOUSTIC SANCTUARY?
        </p>
      </section>

      <section className="py-20 max-w-4xl mx-auto px-6">
        <div className="bg-[#E7D7AC] text-[#17120D] p-8 md:p-14 border-4 border-[#17120D] shadow-[20px_20px_0px_#17120D]">

          <div className="flex justify-between items-center font-mono text-xs font-bold text-[#C69A32] border-b-2 border-[#17120D] pb-3 mb-6 uppercase">
            <span>FILE NO. VENUE-1974</span>
            <span>HERITAGE SANCTUARY</span>
          </div>

          <h2 className="display text-4xl md:text-5xl text-[#17120D] mb-4">OPEN YOUR DOORS TO MUSIC</h2>
          <p className="font-mono text-xs md:text-sm text-[#17120D]/90 leading-relaxed mb-8 border-l-4 border-[#C69A32] pl-4">
            Tangy Sessions works with private heritage property owners and trusts to host intimate, respectful acoustic sessions that honor historical architecture.
          </p>

          {submitted ? (
            <div className="bg-[#1C0E08] text-[#E7D5A4] p-8 border-2 border-[#17120D] text-center">
              <h3 className="display text-4xl mb-2">VENUE FILE SUBMITTED!</h3>
              <p className="font-mono text-xs">Our architectural acoustic team will conduct an initial site assessment.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" value={form.propertyName} onChange={set('propertyName')} placeholder="PROPERTY NAME / LOCATION *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
                <input required type="text" value={form.contactName} onChange={set('contactName')} placeholder="OWNER / CONTACT NAME *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="email" value={form.email} onChange={set('email')} placeholder="EMAIL ADDRESS *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
                <input required type="tel" value={form.phone} onChange={set('phone')} placeholder="PHONE NUMBER *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
              </div>
              <textarea required rows={4} value={form.details} onChange={set('details')} placeholder="DESCRIBE THE PROPERTY, ESTIMATED CAPACITY & ACOUSTIC FEATURES *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
              {error && <div className="p-3 bg-[#c2272a] text-white font-bold border border-[#17120D]">{error}</div>}
              <button type="submit" disabled={submitting} className="btn-ticket w-full py-4 text-center !bg-[#1C0E08] !text-[#E7D5A4] hover:!bg-[#C69A32] hover:!text-[#17120D] font-bold uppercase tracking-widest text-sm disabled:opacity-50">
                {submitting ? 'SUBMITTING...' : 'SUBMIT VENUE FOR EVALUATION →'}
              </button>
            </form>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
};
