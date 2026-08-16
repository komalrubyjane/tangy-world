import { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAudio } from '../../audio/AudioContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

const volunteerRoles = [
  "PHOTOGRAPHY", "VIDEOGRAPHY", "BACKSTAGE & ARTIST CARE",
  "PRODUCTION & SOUND", "TICKETING & RECEPTION", "SOCIAL MEDIA & DISPATCH"
];

export const CrewApplyPage = () => {
  const { playSFX } = useAudio();

  const [volName, setVolName] = useState('');
  const [volPhone, setVolPhone] = useState('');
  const [volEmail, setVolEmail] = useState('');
  const [volCollege, setVolCollege] = useState('');
  const [volRole, setVolRole] = useState(volunteerRoles[0]);
  const [volExperience, setVolExperience] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [crewSubmitting, setCrewSubmitting] = useState(false);
  const [crewError, setCrewError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!volName || !volPhone || !volEmail) return;
    playSFX('ticketClick');
    setCrewError('');
    if (!isSupabaseConfigured) {
      setSubmitted(true);
      return;
    }
    setCrewSubmitting(true);
    const { error } = await supabase.from('crew_applications').insert({
      name: volName,
      email: volEmail,
      phone: volPhone,
      role_interest: volRole,
      message: `College/Institution: ${volCollege || '—'}\n\n${volExperience}`,
    });
    setCrewSubmitting(false);
    if (error) {
      setCrewError('Something went wrong submitting your application — please try again.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#8a2320] text-[#ecdcaf] font-mono selection:bg-[#ecdcaf] selection:text-[#8a2320] overflow-x-hidden pt-16 pb-20">
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <Navbar />

      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <a href="/crew" className="font-mono text-[10px] text-[#ecdcaf]/70 tracking-widest uppercase hover:text-[#ecdcaf] transition-colors">← BACK TO CREW</a>

        <div className="mt-6 mb-8 text-left">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">CREW APPLICATION FORM</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf]">JOIN THE CREW</h1>
          <p className="font-mono text-xs text-[#ecdcaf]/80 mt-2 max-w-xl">
            Submit your application below and our crew desk will follow up within 48 hours.
          </p>
        </div>

        <div className="bg-[#191410] border-4 border-[#ecdcaf] p-6 sm:p-10 shadow-[10px_10px_0px_#191410] text-left">
          {submitted ? (
            <div className="bg-[#241a12] border-2 border-[#ecdcaf] p-8 text-center">
              <h3 className="font-poster text-3xl text-[#ecdcaf] mb-2">APPLICATION TRANSMITTED!</h3>
              <p className="font-mono text-xs text-[#ecdcaf]/80">Our crew desk will review your submission and contact you via phone/email within 48 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="YOUR FULL NAME *" value={volName} onChange={(e) => setVolName(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none focus:border-[#ecdcaf]" />
                <input required type="email" placeholder="YOUR EMAIL ADDRESS *" value={volEmail} onChange={(e) => setVolEmail(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none focus:border-[#ecdcaf]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="tel" placeholder="PHONE NUMBER *" value={volPhone} onChange={(e) => setVolPhone(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none focus:border-[#ecdcaf]" />
                <input type="text" placeholder="COLLEGE / INSTITUTION (OPTIONAL)" value={volCollege} onChange={(e) => setVolCollege(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none focus:border-[#ecdcaf]" />
              </div>
              <div>
                <label className="font-bold text-[#c2272a] block mb-2 uppercase text-[10px]">PREFERRED CREW ROLE *</label>
                <select value={volRole} onChange={(e) => setVolRole(e.target.value)} className="w-full p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none">
                  {volunteerRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <textarea rows={4} placeholder="RELEVANT EXPERIENCE OR WHY YOU WANT TO JOIN TANGY CREW..." value={volExperience} onChange={(e) => setVolExperience(e.target.value)} className="p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none resize-none" />
              {crewError && <div className="p-3 bg-[#c2272a] text-white font-bold border-2 border-[#ecdcaf]">{crewError}</div>}
              <button type="submit" disabled={crewSubmitting} className="py-4 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#ecdcaf] hover:text-[#191410] border-2 border-[#ecdcaf] transition-colors shadow-[4px_4px_0px_#191410] disabled:opacity-50">
                {crewSubmitting ? 'SUBMITTING...' : 'SUBMIT CREW APPLICATION →'}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
