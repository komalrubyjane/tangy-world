import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const VendorApplyPage = () => {
  const [form, setForm] = useState({ businessName: '', email: '', phone: '', category: '', details: '' });
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
      type: 'vendor',
      business_name: form.businessName,
      contact_name: form.businessName,
      email: form.email,
      phone: form.phone,
      details: `Category: ${form.category}\n\n${form.details}`,
    });
    setSubmitting(false);
    if (err) {
      setError('Something went wrong submitting your application — please try again.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#315B66] text-[#E7D5A4] font-mono selection:bg-[#E7D5A4] selection:text-[#315B66]">
      <Navbar />

      <section className="relative pt-32 pb-16 px-6 max-w-5xl mx-auto text-center border-b-2 border-[#E7D5A4]/40">
        <span className="font-mono text-xs text-[#C69A32] tracking-[0.35em] uppercase font-bold mb-3 block">
          TANGY PARTNERSHIPS // VENDOR DESK
        </span>
        <h1 className="display text-6xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-6">
          VENDOR APPLICATIONS
        </h1>
        <p className="font-mono text-sm md:text-base text-[#E7D7AC]/90 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#E7D5A4]/30 py-4 uppercase">
          FOOD ARTISANS, CHAI STALLS, VINTAGE PRINT PRESSES, CRAFT MAKERS & LOCAL PRODUCERS.
        </p>
      </section>

      {/* ABOUT, BENEFITS & APPLICATION FORM */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <div className="bg-[#E7D7AC] text-[#17120D] p-8 md:p-14 border-4 border-[#17120D] shadow-[20px_20px_0px_#17120D]">

          <div className="flex justify-between items-center font-mono text-xs font-bold text-[#315B66] border-b-2 border-[#17120D] pb-3 mb-6 uppercase">
            <span>FILE NO. VENDOR-1974</span>
            <span>HYDERABAD SESSIONS</span>
          </div>

          <h2 className="display text-4xl md:text-5xl text-[#17120D] mb-4">BRING YOUR CRAFT TO THE SESSION</h2>
          <p className="font-mono text-xs md:text-sm text-[#17120D]/90 leading-relaxed mb-8 border-l-4 border-[#315B66] pl-4">
            We partner with local vendors who share our passion for handcrafted quality, vintage aesthetics, and cultural authenticity.
          </p>

          {/* REQUIREMENTS & BENEFITS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 font-mono text-xs text-[#17120D]">
            <div className="bg-[#F5E9C9] p-4 border border-[#17120D]">
              <h3 className="font-bold text-[#315B66] mb-2 uppercase">BENEFITS:</h3>
              <p>• Direct access to 300+ engaged live music enthusiasts.</p>
              <p>• Featured placement in printed session programmes.</p>
            </div>
            <div className="bg-[#F5E9C9] p-4 border border-[#17120D]">
              <h3 className="font-bold text-[#315B66] mb-2 uppercase">REQUIREMENTS:</h3>
              <p>• Self-contained setup with minimal artificial lighting.</p>
              <p>• Eco-friendly packaging and zero plastic waste.</p>
            </div>
          </div>

          {/* FORM */}
          {submitted ? (
            <div className="bg-[#315B66] text-[#E7D7AC] p-8 border-2 border-[#17120D] text-center">
              <h3 className="display text-4xl mb-2">APPLICATION RECEIVED!</h3>
              <p className="font-mono text-xs">Our curation team will reach out via email within 48 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" value={form.businessName} onChange={set('businessName')} placeholder="BRAND / BUSINESS NAME *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
                <input required type="email" value={form.email} onChange={set('email')} placeholder="EMAIL ADDRESS *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="tel" value={form.phone} onChange={set('phone')} placeholder="PHONE NUMBER *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
                <input required type="text" value={form.category} onChange={set('category')} placeholder="PRODUCT / CATEGORY (CHAI, CRAFT, FOOD) *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
              </div>
              <textarea required rows={4} value={form.details} onChange={set('details')} placeholder="TELL US ABOUT YOUR SETUP AND MENU/PRODUCTS *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
              {error && <div className="p-3 bg-[#c2272a] text-white font-bold border border-[#17120D]">{error}</div>}
              <button type="submit" disabled={submitting} className="btn-ticket w-full py-4 text-center !bg-[#315B66] !text-[#E7D7AC] font-bold uppercase tracking-widest text-sm disabled:opacity-50">
                {submitting ? 'SUBMITTING...' : 'SUBMIT VENDOR APPLICATION →'}
              </button>
            </form>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
};
