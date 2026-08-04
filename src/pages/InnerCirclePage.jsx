import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const InnerCirclePage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#694323] text-[#E3D4AC] font-mono selection:bg-[#E3D4AC] selection:text-[#694323]">
      <Navbar />

      <section className="relative pt-32 pb-16 px-6 max-w-5xl mx-auto text-center border-b-2 border-[#E3D4AC]/40">
        <span className="font-mono text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 block">
          PRIVATE MAILING LIST & PASSPORT MEMBERSHIP
        </span>
        <h1 className="display text-6xl md:text-9xl text-[#E3D4AC] leading-none ink-bleed uppercase mb-6">
          THE INNER CIRCLE
        </h1>
        <p className="font-mono text-sm md:text-base text-[#E3D4AC]/90 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#E3D4AC]/30 py-4 uppercase">
          PRIVATE SESSION ANNOUNCEMENTS, EARLY ACCESS TICKETING, DIGITAL MEMBER STAMP PASSPORT & EXCLUSIVE VINYL PRESSINGS.
        </p>
      </section>

      {/* MEMBERSHIP BENEFITS */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-[#E3D4AC] text-[#11100C] p-6 border-4 border-[#11100C] shadow-[10px_10px_0px_#11100C]">
            <span className="font-mono text-xs font-bold text-[#694323] block mb-2">BENEFIT 01</span>
            <h3 className="display text-2xl mb-2">EARLY ACCESS</h3>
            <p className="font-mono text-xs text-[#11100C]/80">Receive private ticket reservation links 48 hours before public announcements.</p>
          </div>

          <div className="bg-[#E3D4AC] text-[#11100C] p-6 border-4 border-[#11100C] shadow-[10px_10px_0px_#11100C]">
            <span className="font-mono text-xs font-bold text-[#694323] block mb-2">BENEFIT 02</span>
            <h3 className="display text-2xl mb-2">MEMBER PASSPORT</h3>
            <p className="font-mono text-xs text-[#11100C]/80">Collect physical and digital stamps at every heritage session attended.</p>
          </div>

          <div className="bg-[#E3D4AC] text-[#11100C] p-6 border-4 border-[#11100C] shadow-[10px_10px_0px_#11100C]">
            <span className="font-mono text-xs font-bold text-[#694323] block mb-2">BENEFIT 03</span>
            <h3 className="display text-2xl mb-2">PRIVATE RELEASES</h3>
            <p className="font-mono text-xs text-[#11100C]/80">Access unreleased 35mm field tape recordings and limited vinyl pressings.</p>
          </div>
        </div>

        {/* SIGNUP FORM */}
        <div className="bg-[#11100C] p-8 md:p-12 border-4 border-[#E3D4AC] max-w-xl mx-auto text-center">
          <h2 className="display text-4xl text-[#E3D4AC] mb-4">JOIN THE CIRCLE TODAY</h2>
          {submitted ? (
            <div className="text-[#C99A2E] font-bold text-lg">WELCOME TO THE INNER CIRCLE ✦ CHECK YOUR INBOX!</div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                required
                placeholder="ENTER YOUR EMAIL *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-4 bg-[#191410] border border-[#E3D4AC]/40 text-[#E3D4AC] font-mono text-xs focus:outline-none focus:border-[#C99A2E] text-center"
              />
              <button type="submit" className="btn-ticket w-full py-4 text-center !bg-[#C99A2E] !text-[#11100C] font-bold uppercase tracking-widest text-sm">
                JOIN INNER CIRCLE →
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};
