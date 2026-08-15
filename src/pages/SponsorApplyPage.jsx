import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const SponsorApplyPage = () => {
  const [form, setForm] = useState({ orgName: '', email: '', proposal: '' });
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
      type: 'sponsor',
      business_name: form.orgName,
      contact_name: form.orgName,
      email: form.email,
      details: form.proposal,
    });
    setSubmitting(false);
    if (err) {
      setError('Something went wrong submitting your inquiry — please try again.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#4A2638] text-[#E7D7AC] font-mono selection:bg-[#E7D7AC] selection:text-[#4A2638]">
      <Navbar />

      <section className="relative pt-32 pb-16 px-6 max-w-5xl mx-auto text-center border-b-2 border-[#E7D7AC]/40">
        <span className="font-mono text-xs text-[#C69A32] tracking-[0.35em] uppercase font-bold mb-3 block">
          CULTURAL PRESERVATION // SPONSORSHIPS
        </span>
        <h1 className="display text-6xl md:text-9xl text-[#E7D7AC] leading-none ink-bleed uppercase mb-6">
          SPONSORS & GRANTS
        </h1>
        <p className="font-mono text-sm md:text-base text-[#E7D7AC]/90 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#E7D7AC]/30 py-4 uppercase">
          POWER HERITAGE MUSIC PRESERVATION, ANALOG TAPE RECORDING & ARCHITECTURAL CONSERVATION.
        </p>
      </section>

      <section className="py-20 max-w-4xl mx-auto px-6">
        <div className="bg-[#E7D7AC] text-[#17120D] p-8 md:p-14 border-4 border-[#17120D] shadow-[20px_20px_0px_#17120D]">

          <div className="flex justify-between items-center font-mono text-xs font-bold text-[#4A2638] border-b-2 border-[#17120D] pb-3 mb-6 uppercase">
            <span>FILE NO. SPONSOR-1974</span>
            <span>CULTURAL FOUNDATION</span>
          </div>

          <h2 className="display text-4xl md:text-5xl text-[#17120D] mb-4">SUPPORT INDEPENDENT SOUND</h2>
          <p className="font-mono text-xs md:text-sm text-[#17120D]/90 leading-relaxed mb-8 border-l-4 border-[#4A2638] pl-4">
            Partner with Tangy Sessions to sponsor venue restoration, audio gear grants for artists, and live vinyl pressings.
          </p>

          {submitted ? (
            <div className="bg-[#4A2638] text-[#E7D7AC] p-8 border-2 border-[#17120D] text-center">
              <h3 className="display text-4xl mb-2">PARTNERSHIP INQUIRY RECEIVED</h3>
              <p className="font-mono text-xs">Our executive director will contact you directly within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" value={form.orgName} onChange={set('orgName')} placeholder="ORGANIZATION / BRAND NAME *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
                <input required type="email" value={form.email} onChange={set('email')} placeholder="CONTACT EMAIL *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
              </div>
              <textarea required rows={4} value={form.proposal} onChange={set('proposal')} placeholder="DESIRED PARTNERSHIP LEVEL / PROPOSAL *" className="p-3 bg-[#F5E9C9] border border-[#17120D] focus:outline-none" />
              {error && <div className="p-3 bg-[#c2272a] text-white font-bold border border-[#17120D]">{error}</div>}
              <button type="submit" disabled={submitting} className="btn-ticket w-full py-4 text-center !bg-[#4A2638] !text-[#E7D7AC] font-bold uppercase tracking-widest text-sm disabled:opacity-50">
                {submitting ? 'SUBMITTING...' : 'SUBMIT SPONSORSHIP INQUIRY →'}
              </button>
            </form>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
};
