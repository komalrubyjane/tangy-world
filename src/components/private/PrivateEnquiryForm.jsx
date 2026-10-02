import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { isMockAuth } from '../../config/auth';
import { enquiryService } from '../../services/enquiryService';
import { useUserAuth } from '../../context/UserAuthContext';
import { RequireAuthToApply } from '../apply/RequireAuthToApply';
import { applicationErrorMessage, useApplicantPrefill, FORMS_OFFLINE_MESSAGE } from '../../lib/enquiries';

// The one private-session enquiry form (private_enquiries). Used by each
// /private/<category> page (fixed type) and by the /private-sessions overview
// (type picker). Previously five copies of the same submission code.
const FIELD = 'p-3 bg-[#241a12] border border-[#ecdcaf]/40 text-[#ecdcaf] focus:outline-none';

export const PrivateEnquiryForm = ({
  type, types, guestOptions, defaultGuests, budgetOptions, venuePlaceholder, messagePlaceholder, cta,
  successTitle = 'REQUEST TRANSMITTED!',
  successText = 'Our private session coordinator will get back to you within 48 hours.',
}) => {
  const { playSFX } = useAudio();
  const { user } = useUserAuth();
  const [enquiryType, setEnquiryType] = useState(type || types?.[0]?.id);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [guests, setGuests] = useState(defaultGuests);
  const [budget, setBudget] = useState(budgetOptions?.[0] ?? null);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  useApplicantPrefill(user, { setName, setEmail, setPhone });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !venue || !name || !email) return;
    playSFX('ticketClick');
    setFormError('');
    const guestCount = parseInt(guests, 10) || null;
    const details = `Venue: ${venue}\nGuests: ${guests}${budget ? `\nBudget: ${budget}` : ''}\n\n${message}`;
    if (isMockAuth) {
      enquiryService.createPrivate({
        type: enquiryType, name, email, phone, preferredDate: date, guestCount, ...(budget ? { budget } : {}), message: details,
      });
      setSubmitted(true);
      return;
    }
    if (!isSupabaseConfigured) {
      setFormError(FORMS_OFFLINE_MESSAGE);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('private_enquiries').insert({
      user_id: user.id,
      type: enquiryType, name, email, phone, preferred_date: date, guest_count: guestCount, message: details,
    });
    setSubmitting(false);
    if (error) {
      setFormError(applicationErrorMessage(error, 'Something went wrong submitting your request — please try again.'));
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-[#211915] border-2 border-[#ecdcaf] p-8 text-center" role="status">
        <h3 className="font-poster text-3xl text-[#ecdcaf] mb-2">{successTitle}</h3>
        <p className="font-mono text-xs text-[#ecdcaf]/80">{successText}</p>
      </div>
    );
  }

  const guestSelect = (
    <select value={guests} onChange={(e) => setGuests(e.target.value)} aria-label="Guests" className={FIELD}>
      {guestOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
  );

  return (
    <RequireAuthToApply title="SIGN IN TO SEND YOUR REQUEST" intro="Verify your email with a one-time code. Your request is linked to your Tangy profile so you can follow it and our coordinator can reply." showJoinLink={false}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
        {types && (
          <div className="flex flex-wrap gap-1.5">
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEnquiryType(t.id)}
                aria-pressed={enquiryType === t.id}
                className={`px-2.5 py-1.5 text-[9px] font-bold uppercase border transition-colors ${enquiryType === t.id ? 'bg-[#ecdcaf] text-[#191410] border-[#ecdcaf]' : 'bg-[#241a12] text-[#ecdcaf]/70 border-[#ecdcaf]/30'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="text" placeholder="YOUR NAME *" value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
          <input required type="email" placeholder="YOUR EMAIL *" value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD} />
        </div>
        <input type="tel" placeholder="PHONE NUMBER (OPTIONAL)" value={phone} onChange={(e) => setPhone(e.target.value)} className={FIELD} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="date" aria-label="Preferred date" value={date} onChange={(e) => setDate(e.target.value)} className={FIELD} />
          <input required type="text" placeholder={venuePlaceholder} value={venue} onChange={(e) => setVenue(e.target.value)} className={FIELD} />
        </div>
        {budgetOptions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guestSelect}
            <select value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="Budget" className={FIELD}>
              {budgetOptions.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        ) : guestSelect}
        <textarea rows={4} placeholder={messagePlaceholder} value={message} onChange={(e) => setMessage(e.target.value)} className={`${FIELD} resize-none`} />
        {formError && <div role="alert" className="p-3 bg-[#B5532A] text-white font-bold border-2 border-[#ecdcaf]">{formError}</div>}
        <button type="submit" disabled={submitting} className="py-4 bg-[#EFE2C0] text-[#191410] font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#C89D35] border-2 border-[#191410] transition-colors shadow-[4px_4px_0px_#191410] disabled:opacity-50">
          {submitting ? 'SUBMITTING...' : cta}
        </button>
      </form>
    </RequireAuthToApply>
  );
};
