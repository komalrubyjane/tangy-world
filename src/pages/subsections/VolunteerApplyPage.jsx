import { useEffect, useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAudio } from '../../audio/AudioContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useUserAuth } from '../../context/UserAuthContext';
import { RequireAuthToApply } from '../../components/apply/RequireAuthToApply';
import { ApplicationReceivedNotice } from '../../components/apply/ApplicationReceivedNotice';
import { PageCrumbs, SectionNav } from '../../components/layout/SectionNav';
import { usePageMeta } from '../../hooks/usePageMeta';

// Deliberately distinct from CrewApplyPage — Volunteer is general community
// help (availability + interest areas), not a skilled production role.
// Same real intake table (crew_applications), distinguished by category —
// see 0011_role_portals.sql. An application may name one session (0030):
// approval then puts the applicant on that session's volunteer team. Staff
// must name the session; volunteering never changes a staff role.
const INTERESTS = ['Front of House', 'Setup & Teardown', 'Hospitality & Chai', 'Community Outreach', 'Archive & Documentation'];
const AVAILABILITY = ['Weekends only', 'Weekday evenings', 'Flexible / on-call'];
const CONSOLE_ROLES = ['staff', 'admin', 'super_admin'];
const todayIso = () => new Date().toISOString().slice(0, 10);

export const VolunteerApplyPage = () => {
  usePageMeta({ title: 'Volunteer Application', description: 'Apply to volunteer at Tangy Sessions — no experience needed.' });
  const { playSFX } = useAudio();
  const { user } = useUserAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [availability, setAvailability] = useState(AVAILABILITY[0]);
  const [interests, setInterests] = useState([]);
  const [notes, setNotes] = useState('');
  const [sessions, setSessions] = useState([]);
  const [eventId, setEventId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isStaff = CONSOLE_ROLES.includes(user?.role);

  // Sessions open for volunteers: published and not yet past (the database
  // re-checks this on submit).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.from('events').select('id, name, event_date').in('status', ['on-sale', 'sold-out'])
      .gte('event_date', todayIso()).order('event_date').limit(30)
      .then(({ data }) => setSessions(data || []));
  }, []);

  const toggleInterest = (interest) => {
    setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || (isStaff && !eventId)) return;
    playSFX('ticketClick');
    setError('');
    if (!isSupabaseConfigured) {
      setSubmitted(true);
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.from('crew_applications').insert({
      name,
      email,
      phone,
      role_interest: interests.join(', ') || 'General volunteering',
      category: 'volunteer',
      message: `Availability: ${availability}\n\n${notes}`,
      user_id: user?.id ?? null,
      event_id: eventId || null,
    });
    setSubmitting(false);
    if (err) {
      const known = /DUPLICATE_APPLICATION: |not open for volunteers|Choose the session/.exec(err.message || '');
      setError(known ? err.message.replace('DUPLICATE_APPLICATION: ', '') : 'Something went wrong submitting your application — please try again.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#465667] text-[#E7D5A4] font-mono selection:bg-[#EFE2C0] selection:text-[#315B66] overflow-x-hidden pt-16 pb-20 printNoise">
      <Navbar />

      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <PageCrumbs className="[&_ol]:justify-start" label="Volunteer Application" />

        <div className="mt-6 mb-8 text-left">
          <span className="font-mono text-[10px] font-bold text-[#C69A32] tracking-[0.3em] uppercase">VOLUNTEER APPLICATION</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#E7D5A4]">HELP OUT AT TANGY</h1>
          <p className="font-mono text-xs text-[#E7D5A4]/80 mt-2 max-w-xl">
            No prior experience needed — tell us when you're free and what you'd enjoy helping with.
          </p>
        </div>

        <div className="bg-[#181614] border-2 border-[#E7D5A4] p-6 sm:p-10 shadow-[4px_4px_0px_#17120D] text-left">
          {submitted ? (
            <ApplicationReceivedNotice roleLabel="Volunteer" statusRoute="/volunteer/dashboard" />
          ) : (
            <RequireAuthToApply roleLabel="Volunteer">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required type="text" placeholder="YOUR FULL NAME *" value={name} onChange={(e) => setName(e.target.value)} className="p-3 bg-[#241a12] border border-[#E7D5A4]/40 text-[#E7D5A4] focus:outline-none focus:border-[#E7D5A4]" />
                  <input required type="email" placeholder="YOUR EMAIL ADDRESS *" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 bg-[#241a12] border border-[#E7D5A4]/40 text-[#E7D5A4] focus:outline-none focus:border-[#E7D5A4]" />
                </div>
                <input required type="tel" placeholder="PHONE NUMBER *" value={phone} onChange={(e) => setPhone(e.target.value)} className="p-3 bg-[#241a12] border border-[#E7D5A4]/40 text-[#E7D5A4] focus:outline-none focus:border-[#E7D5A4]" />

                <div>
                  <label htmlFor="volunteer-session" className="font-bold text-[#C69A32] block mb-2 uppercase text-[10px]">SESSION{isStaff ? ' *' : ''}</label>
                  <select id="volunteer-session" required={isStaff} value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-full p-3 bg-[#241a12] border border-[#E7D5A4]/40 text-[#E7D5A4] focus:outline-none">
                    <option value="">{isStaff ? 'Choose a session…' : 'Any upcoming session'}</option>
                    {sessions.map((s) => <option key={s.id} value={s.id}>{s.name} · {new Date(`${s.event_date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</option>)}
                  </select>
                  <p className="text-[10px] text-[#E7D5A4]/70 mt-1 mb-0">
                    {isStaff
                      ? 'Staff volunteer for one session at a time. Approval adds you to that session\'s volunteer team; your staff access doesn\'t change.'
                      : 'Pick a session to volunteer at it, or leave it open and the team will match you.'}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-[#C69A32] block mb-2 uppercase text-[10px]">AVAILABILITY *</label>
                  <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full p-3 bg-[#241a12] border border-[#E7D5A4]/40 text-[#E7D5A4] focus:outline-none">
                    {AVAILABILITY.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#C69A32] block mb-2 uppercase text-[10px]">WHAT WOULD YOU LIKE TO HELP WITH?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {INTERESTS.map((i) => (
                      <label key={i} className="flex items-center gap-2 p-2.5 bg-[#211915] border border-[#E7D5A4]/30 cursor-pointer">
                        <input type="checkbox" checked={interests.includes(i)} onChange={() => toggleInterest(i)} />
                        {i}
                      </label>
                    ))}
                  </div>
                </div>

                <textarea rows={3} placeholder="ANYTHING ELSE WE SHOULD KNOW? (OPTIONAL)" value={notes} onChange={(e) => setNotes(e.target.value)} className="p-3 bg-[#241a12] border border-[#E7D5A4]/40 text-[#E7D5A4] focus:outline-none resize-none" />
                {error && <div className="p-3 bg-[#B5532A] text-white font-bold border-2 border-[#E7D5A4]">{error}</div>}
                <button type="submit" disabled={submitting} className="py-4 bg-[#C89D35] text-[#17120D] font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#EFE2C0] transition-colors shadow-[4px_4px_0px_#17120D] disabled:opacity-50">
                  {submitting ? 'SUBMITTING...' : 'SUBMIT VOLUNTEER APPLICATION →'}
                </button>
              </form>
            </RequireAuthToApply>
          )}
        </div>
      </main>

      <SectionNav className="py-10 px-4" />

      <Footer />
    </div>
  );
};
