import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { isMockAuth } from '../../config/auth';
import { userService } from '../../services/userService';
import { useUserAuth } from '../../context/UserAuthContext';
import { RequireAuthToApply } from '../apply/RequireAuthToApply';
import { applicationErrorMessage, useApplicantPrefill, FORMS_OFFLINE_MESSAGE } from '../../lib/enquiries';

// The one crew application form (crew_applications, category crew), used on
// /crew and /crew/apply. Previously two diverging copies — the /crew/apply one
// reported success when the backend was unavailable; this one says so instead.
const CREW_ROLES = ['PHOTOGRAPHY', 'VIDEOGRAPHY', 'BACKSTAGE & ARTIST CARE', 'PRODUCTION & SOUND', 'TICKETING & RECEPTION', 'SOCIAL MEDIA & DISPATCH'];
const FIELD = 'p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none focus:border-[#ecdcaf]';

export const CrewApplicationForm = ({ renderSuccess }) => {
  const { playSFX } = useAudio();
  const { user } = useUserAuth();
  const [volName, setVolName] = useState('');
  const [volPhone, setVolPhone] = useState('');
  const [volEmail, setVolEmail] = useState('');
  const [volCollege, setVolCollege] = useState('');
  const [volRole, setVolRole] = useState(CREW_ROLES[0]);
  const [volExperience, setVolExperience] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [crewSubmitting, setCrewSubmitting] = useState(false);
  const [crewError, setCrewError] = useState('');
  useApplicantPrefill(user, { setName: setVolName, setEmail: setVolEmail, setPhone: setVolPhone });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!volName || !volPhone || !volEmail) return;
    playSFX('ticketClick');
    setCrewError('');
    const message = `College/Institution: ${volCollege || '—'}\n\n${volExperience}`;
    if (isMockAuth) {
      userService.applyForRole('volunteer', { name: volName, email: volEmail, phone: volPhone, interest: volRole, notes: message });
      setSubmitted(true);
      return;
    }
    if (!isSupabaseConfigured) {
      setCrewError(FORMS_OFFLINE_MESSAGE);
      return;
    }
    setCrewSubmitting(true);
    const { error } = await supabase.from('crew_applications').insert({
      user_id: user.id, name: volName, email: volEmail, phone: volPhone, role_interest: volRole, category: 'crew', message,
    });
    setCrewSubmitting(false);
    if (error) {
      setCrewError(applicationErrorMessage(error, 'Something went wrong submitting your application — please try again.'));
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return renderSuccess ? renderSuccess() : (
      <div className="bg-[#211915] border-2 border-[#ecdcaf] p-8 text-center" role="status">
        <h3 className="font-poster text-3xl text-[#ecdcaf] mb-2">APPLICATION TRANSMITTED!</h3>
        <p className="font-mono text-xs text-[#ecdcaf]/80">Our crew desk will review your submission and contact you via phone/email within 48 hours.</p>
      </div>
    );
  }

  return (
    <RequireAuthToApply roleLabel="Crew">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="text" placeholder="YOUR FULL NAME *" value={volName} onChange={(e) => setVolName(e.target.value)} className={FIELD} />
          <input required type="email" placeholder="YOUR EMAIL ADDRESS *" value={volEmail} onChange={(e) => setVolEmail(e.target.value)} className={FIELD} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="tel" placeholder="PHONE NUMBER *" value={volPhone} onChange={(e) => setVolPhone(e.target.value)} className={FIELD} />
          <input type="text" placeholder="COLLEGE / INSTITUTION (OPTIONAL)" value={volCollege} onChange={(e) => setVolCollege(e.target.value)} className={FIELD} />
        </div>
        <div>
          <label htmlFor="crew-role" className="font-bold text-[#c2272a] block mb-2 uppercase text-[10px]">PREFERRED CREW ROLE *</label>
          <select id="crew-role" value={volRole} onChange={(e) => setVolRole(e.target.value)} className="w-full p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none">
            {CREW_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <textarea rows={4} placeholder="RELEVANT EXPERIENCE OR WHY YOU WANT TO JOIN TANGY CREW..." value={volExperience} onChange={(e) => setVolExperience(e.target.value)} className={`${FIELD} resize-none`} />
        {crewError && <div role="alert" className="p-3 bg-[#B5532A] text-white font-bold border-2 border-[#ecdcaf]">{crewError}</div>}
        <button type="submit" disabled={crewSubmitting} className="py-4 bg-[#B5532A] text-[#ecdcaf] font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#EFE2C0] hover:text-[#191410] border-2 border-[#ecdcaf] transition-colors shadow-[4px_4px_0px_#191410] disabled:opacity-50">
          {crewSubmitting ? 'SUBMITTING...' : 'SUBMIT CREW APPLICATION →'}
        </button>
      </form>
    </RequireAuthToApply>
  );
};
