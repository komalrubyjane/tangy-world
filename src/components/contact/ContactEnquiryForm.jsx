import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { isMockAuth } from '../../config/auth';
import { enquiryService } from '../../services/enquiryService';
import { useUserAuth } from '../../context/UserAuthContext';
import { RequireAuthToApply } from '../apply/RequireAuthToApply';
import { applicationErrorMessage, useApplicantPrefill, FORMS_OFFLINE_MESSAGE } from '../../lib/enquiries';

// The one contact form (contact_enquiries), used by /contact and
// /contact/email. Previously two copies of the same submission code.
const INQUIRY_TYPES = ['GENERAL', 'PRESS', 'COLLABORATION', 'VENUE', 'PRIVATE EVENT'];

export const ContactEnquiryForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inquiry, setInquiry] = useState('GENERAL');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { user } = useUserAuth();
  useApplicantPrefill(user, { setName, setEmail });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isMockAuth) {
      enquiryService.createContact({ name, email, subject, message, category: inquiry });
      setSubmitted(true);
      return;
    }
    if (!isSupabaseConfigured) {
      setError(FORMS_OFFLINE_MESSAGE);
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.from('contact_enquiries').insert({
      user_id: user.id,
      name, email, subject, message, inquiry_type: inquiry,
    });
    setSubmitting(false);
    if (err) {
      setError(applicationErrorMessage(err, 'Something went wrong sending your message — please try again.'));
      return;
    }
    setSubmitted(true);
  };

  return (submitted ? (
      <div className="text-center py-10 sm:py-16">
        <div className="display text-5xl sm:text-7xl text-[#11100C] mb-4">✦</div>
        <h3 className="display text-3xl sm:text-5xl text-[#11100C] mb-3">DISPATCH TRANSMITTED</h3>
        <p className="font-mono text-xs text-[#11100C]/70 max-w-md mx-auto uppercase tracking-wider leading-relaxed">
          Thank you for writing to Tangy Sessions. We will reply to your message within 48 hours.
        </p>
      </div>
    ) : (
      <RequireAuthToApply title="SIGN IN TO SEND A MESSAGE" intro="Verify your email with a one-time code so we can reply to you and you can follow the conversation from your Tangy profile." showJoinLink={false}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
        <div>
          <label className="font-bold text-[#B94717] block mb-2 uppercase text-[10px]">INQUIRY TYPE</label>
          <div className="flex gap-1.5 flex-wrap">
            {INQUIRY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setInquiry(type)}
                className={`px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider border transition-colors ${
                  inquiry === type
                    ? 'bg-[#11100C] text-[#E7D5A4] border-[#11100C]'
                    : 'bg-[#F5E9C9] text-[#11100C] border-[#11100C]/40 hover:border-[#11100C]'
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

        {error && <div className="p-3 bg-[#B5532A] text-white font-bold border-2 border-[#11100C]">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="py-3 sm:py-4 bg-[#181614] text-[#E7D5A4] hover:bg-[#B5532A] border-2 border-[#11100C] hover:border-[#B94717] font-bold uppercase tracking-[0.2em] transition-colors shadow-[4px_4px_0px_#11100C] disabled:opacity-50"
        >
          {submitting ? 'SENDING...' : 'SEND DISPATCH →'}
        </button>
      </form>
      </RequireAuthToApply>
    ));
};
