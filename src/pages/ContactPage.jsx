import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C]">
      <Navbar />

      <section className="relative pt-32 pb-16 px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <span className="font-mono text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 block">
          DISPATCH & CORRESPONDENCE // TANGY SESSIONS
        </span>
        <h1 className="display text-6xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-6">
          CONTACT US
        </h1>
        <p className="font-mono text-sm md:text-base text-[#E7D5A4]/90 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-4 uppercase">
          REACH OUT FOR INQUIRIES, HERITAGE VENUE COLLABORATIONS, PRESS DISPATCHES, AND GENERAL CORRESPONDENCE.
        </p>
      </section>

      <section className="py-20 max-w-4xl mx-auto px-6">
        <div className="bg-[#E7D5A4] text-[#11100C] p-8 md:p-14 border-4 border-[#11100C] shadow-[20px_20px_0px_#11100C]">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs mb-10 pb-8 border-b-2 border-[#11100C]/30">
            <div>
              <span className="font-bold text-[#B94717] block mb-1 uppercase">EMAIL DISPATCH</span>
              <span>hello@tangysessions.com</span>
            </div>
            <div>
              <span className="font-bold text-[#B94717] block mb-1 uppercase">LOCATION</span>
              <span>Hyderabad · Telangana · India</span>
            </div>
            <div>
              <span className="font-bold text-[#B94717] block mb-1 uppercase">INSTAGRAM</span>
              <span>@tangysessions</span>
            </div>
          </div>

          {submitted ? (
            <div className="bg-[#11100C] text-[#E7D5A4] p-8 border-2 border-[#11100C] text-center">
              <h3 className="display text-4xl mb-2">DISPATCH TRANSMITTED ✦</h3>
              <p className="font-mono text-xs">Thank you for writing to Tangy Sessions. We will reply shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="YOUR NAME *" className="p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none" />
                <input required type="email" placeholder="YOUR EMAIL *" className="p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none" />
              </div>
              <input required type="text" placeholder="SUBJECT *" className="p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none" />
              <textarea required rows={5} placeholder="MESSAGE *" className="p-3 bg-[#F5E9C9] border border-[#11100C] focus:outline-none" />
              <button type="submit" className="btn-ticket w-full py-4 text-center !bg-[#11100C] !text-[#E7D5A4] hover:!bg-[#B94717] font-bold uppercase tracking-widest text-sm">
                SEND MESSAGE →
              </button>
            </form>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
};
