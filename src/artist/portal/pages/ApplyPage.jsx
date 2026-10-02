import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useUserAuth } from '../../../context/UserAuthContext';
import { usePageMeta } from '../../../hooks/usePageMeta';
import { uploadWithProgress, safeFileName, formatBytes } from '../../../lib/storage';
import { EmailOtpAuth } from '../../../components/auth/EmailOtpAuth';
import { artistApi } from '../api';
import { Card, Btn, Field, Input, Textarea, Select, Chips, Loading, ErrorNote, PIcon } from '../kit';
import { cx } from '../util';

// /artist/apply — the artist application, one step at a time (?step=1…8).
// Answers autosave to the applicant's draft (artist_applications, 0033); the
// server validates and creates the artist record on submit.
const STEPS = ['About you', 'Your artistry', 'Experience', 'Online presence', 'Performance media', 'Technical & hospitality', 'Availability', 'Review'];
const ARTIST_TYPES = ['Solo Artist', 'Band', 'Duo', 'Trio', 'Ensemble', 'DJ', 'Instrumentalist', 'Vocalist', 'Performance Artist', 'Other'];
const GENRES = ['Hindustani', 'Carnatic', 'Folk', 'Qawwali', 'Sufi', 'Ghazal', 'Indie', 'Jazz', 'Fusion', 'Ambient', 'Electronic', 'Poetry', 'Dance', 'Percussion', 'Other'];
const INSTRUMENTS = ['Vocals', 'Guitar', 'Sitar', 'Sarod', 'Violin', 'Veena', 'Bansuri', 'Tabla', 'Harmonium', 'Keys', 'Bass', 'Drums', 'Percussion', 'Electronics', 'Other'];
const LANGUAGES = ['Hindi', 'Urdu', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'English', 'Instrumental'];
const LEVELS = ['Emerging', 'Established', 'Professional'];
const SET = ['30 min', '45 min', '60 min', '90 min', 'Other'];
const TECH = ['Inputs', 'Microphones', 'DI', 'Monitors', 'Backline', 'Lighting', 'Other'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const VIDEO_RE = /^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/|vimeo\.com\/|player\.vimeo\.com\/video\/)[A-Za-z0-9_\-?=&/]+$/;
const URL_OK = (v) => !v || /^https:\/\/\S+$/.test(v) || /^@?[A-Za-z0-9_.]+$/.test(v);
const MAX_VIDEO = 50 * 1024 * 1024;

const blank = (profile) => ({
  about: { full_name: profile?.full_name || '', stage_name: '', email: profile?.email || '', phone: profile?.phone || '', whatsapp: '', city: '', country: 'India', website: '' },
  artistry: { artist_type: '', primary_genre: '', genres: [], sub_genres: '', instruments: [], other_instruments: '', languages: [], style: '', short_bio: '', long_bio: '', years_active: '', experience_level: '' },
  experience: { years_performing: '', performance_count: '', venues: '', festivals: '', cultural_events: '', collaborations: '', played_tangy: '', tangy_event: '', highlights: [] },
  online: { instagram: '', spotify: '', youtube: '', soundcloud: '', website: '', other: '', instagram_followers: '', spotify_monthly_listeners: '', youtube_subscribers: '' },
  media: { title: '', recorded_at: '', recorded_on: '', performance_type: '', description: '', second_video_url: '', photo_paths: [], epk_path: '' },
  technical: { format: '', set_duration: '', requirements: [], own_equipment: '', rider: '', rider_path: '' },
  hospitality: { travel_origin: '', members: '', accommodation: '', travel_assistance: '', requirements: '', food: '' },
  availability: { typical: '', preferred_days: [], unavailable_dates: '', notice: '', last_minute: '', travel_radius: '', preferred_cities: '' },
});
const merge = (base, saved) => Object.fromEntries(Object.entries(base).map(([k, v]) => [k, { ...v, ...(saved?.[k] || {}) }]));

function validate(step, d, app) {
  const e = {};
  if (step === 1) {
    if (!d.about.full_name.trim()) e.full_name = 'Your full name is required.';
    if (!d.about.stage_name.trim()) e.stage_name = 'Your stage / artist name is required.';
    if (!d.about.city.trim()) e.city = 'Your city is required.';
    if (d.about.phone && !/^[+\d][\d\s-]{6,}$/.test(d.about.phone)) e.phone = 'Enter a valid phone number.';
  }
  if (step === 2) {
    if (!d.artistry.artist_type) e.artist_type = 'Choose what type of artist you are.';
    if (!d.artistry.primary_genre) e.primary_genre = 'Choose your primary genre.';
    if (d.artistry.short_bio.trim().length < 40) e.short_bio = 'Write at least 40 characters.';
  }
  if (step === 4) {
    for (const k of ['instagram', 'spotify', 'youtube', 'soundcloud', 'website', 'other']) if (!URL_OK(d.online[k].trim())) e[k] = 'Use an https:// link (or an @handle for Instagram).';
  }
  if (step === 5) {
    if (!app.video_url && !app.video_storage_path) e.video = 'Add your performance video — upload it or paste a YouTube / Vimeo link.';
    if (app.video_url && !VIDEO_RE.test(app.video_url)) e.video = 'Only YouTube or Vimeo links are accepted.';
    if (d.media.second_video_url && !VIDEO_RE.test(d.media.second_video_url)) e.second_video_url = 'Only YouTube or Vimeo links are accepted.';
    if (!app.media_consent) e.consent = 'Please confirm you have the right to submit this media.';
  }
  return e;
}

export const ApplyPage = () => {
  usePageMeta({ title: 'Apply as an artist', description: 'Apply to perform at Tangy Sessions.' });
  const { user, isLoggedIn, loading: authLoading } = useUserAuth();
  const [params, setParams] = useSearchParams();
  const step = Math.min(8, Math.max(1, parseInt(params.get('step') || '1', 10) || 1));
  const [app, setApp] = useState(null);
  const [data, setData] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveState, setSaveState] = useState('');
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const dirty = useRef(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const row = (await artistApi.myApplication()) || (await artistApi.startApplication());
        setApp(row);
        setData(merge(blank(user), row.data));
        if (!params.get('step') && row.current_step > 1 && row.status === 'draft') setParams({ step: String(row.current_step) }, { replace: true });
      } catch (err) { setLoadError(err); }
    })();
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const editable = app && ['draft', 'needs_information'].includes(app.status);
  const save = async (extra = {}) => {
    if (!app || !editable) return;
    clearTimeout(timer.current);
    setSaveState('Saving…');
    try {
      const cols = { video_url: app.video_url || null, video_storage_path: app.video_storage_path || null, media_consent: app.media_consent, accuracy_confirmed: app.accuracy_confirmed };
      const row = await artistApi.saveApplication(app.id, { data, current_step: step, ...cols, ...extra });
      setApp(row); dirty.current = false;
      setSaveState(`Saved ${new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`);
    } catch (err) { setSaveState(`Not saved: ${err.message}`); }
  };
  // Autosave a moment after the last change.
  useEffect(() => {
    if (!dirty.current) return undefined;
    timer.current = setTimeout(() => save(), 1500);
    return () => clearTimeout(timer.current);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const warn = (e) => { if (dirty.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  if (authLoading) return <Wrap><Loading /></Wrap>;
  if (!isLoggedIn) {
    return (
      <Wrap>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C99A2E] m-0">Artist application</p>
        <h1 className="font-condensed text-3xl sm:text-4xl uppercase text-[#F3E7C9] m-0 mt-1">Apply to play at Tangy</h1>
        <p className="text-sm text-[#E7D5A4]/80 mt-3">Eight short steps — about you, your music, your experience, a performance video, and how you like to work. Your answers save as you go, so you can finish later.</p>
        <Card className="mt-6">
          <p className="text-sm text-[#E7D5A4]/85 mt-0">Verify your email with a one-time code to start. Applying never changes your account by itself — the Tangy team reviews every application.</p>
          <EmailOtpAuth copy={{ emailIntro: "Enter your email — we'll send a one-time code to start your artist application." }} />
        </Card>
        <p className="text-xs text-[#E7D5A4]/60 mt-4">Already an approved artist? <Link to="/artist/login" className="underline">Sign in to your portal</Link>.</p>
      </Wrap>
    );
  }
  if (loadError) return <Wrap><ErrorNote error={loadError} /></Wrap>;
  if (!app || !data) return <Wrap><Loading label="Opening your application…" /></Wrap>;
  if (!editable) return <Navigate to="/artist/application" replace />;

  const set = (section, patch) => { dirty.current = true; setData((d) => ({ ...d, [section]: { ...d[section], ...patch } })); };
  // Application columns (video, consents): kept locally, saved with the next autosave.
  const setCol = (patch) => { dirty.current = true; setApp((a) => ({ ...a, ...patch })); setData((d) => ({ ...d })); };
  const go = async (n) => {
    if (n > step) {
      const e = validate(step, data, app);
      setErrors(e);
      if (Object.keys(e).length) { document.getElementById('apply-errors')?.focus(); return; }
    }
    await save();
    setErrors({});
    setParams({ step: String(n) });
    window.scrollTo({ top: 0 });
  };
  const submit = async () => {
    setSubmitError('');
    for (let s = 1; s <= 7; s += 1) {
      const e = validate(s, data, app);
      if (Object.keys(e).length) { setSubmitError(`Step ${s} (${STEPS[s - 1]}) needs attention.`); return; }
    }
    if (!app.accuracy_confirmed) { setSubmitError('Please confirm that the information is accurate.'); return; }
    setSubmitting(true);
    try {
      await save();
      await artistApi.submitApplication();
      navigate('/artist/application');
    } catch (err) { setSubmitError(err.message); setSubmitting(false); }
  };

  const F = (section, key) => ({ id: `${section}-${key}`, value: data[section][key] ?? '', onChange: (e) => set(section, { [key]: e.target.value }) });
  const err = (k) => errors[k];

  return (
    <Wrap>
      <div className="flex flex-col gap-1 mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C99A2E] m-0">Artist application{app.status === 'needs_information' ? ' · information requested' : ''}</p>
        <h1 className="font-condensed text-3xl sm:text-4xl uppercase text-[#F3E7C9] m-0">{STEPS[step - 1]}</h1>
      </div>
      <ol className="flex gap-1 mb-2 list-none p-0" aria-label="Application progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1" aria-current={i + 1 === step ? 'step' : undefined}>
            <span className={cx('block h-1.5 rounded-full', i + 1 < step ? 'bg-[#C99A2E]' : i + 1 === step ? 'bg-[#F3E7C9]' : 'bg-[#E7D5A4]/15')} />
            <span className="sr-only">Step {i + 1}: {label}{i + 1 < step ? ' (done)' : ''}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-[#E7D5A4]/70 mb-5 flex flex-wrap justify-between gap-2"><span>Step {step} of 8</span><span aria-live="polite" data-save-state>{saveState}</span></p>

      {app.status === 'needs_information' && app.info_request && (
        <div className="mb-5 rounded-md border border-[#C99A2E]/50 bg-[#C99A2E]/10 p-4 text-sm" data-info-request>
          <p className="font-medium text-[#F3E7C9] m-0">The Tangy team asked for:</p>
          {(app.info_request.items || []).length > 0 && <ul className="mt-2 mb-0 pl-5">{app.info_request.items.map((i) => <li key={i}>{i}</li>)}</ul>}
          {app.info_request.message && <p className="mt-2 mb-0">“{app.info_request.message}”</p>}
        </div>
      )}
      {Object.keys(errors).length > 0 && (
        <div id="apply-errors" tabIndex={-1} role="alert" className="mb-4 rounded-md border border-[#B5532A]/50 bg-[#B5532A]/10 p-3 text-sm text-[#F08A6A]">
          Please fix: {Object.values(errors).join(' ')}
        </div>
      )}

      <Card>
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name *" id="about-full_name" error={err('full_name')}><Input {...F('about', 'full_name')} maxLength={120} autoComplete="name" /></Field>
            <Field label="Stage / artist name *" id="about-stage_name" error={err('stage_name')}><Input {...F('about', 'stage_name')} maxLength={120} /></Field>
            <Field label="Email" id="about-email" hint="Your sign-in email"><Input {...F('about', 'email')} disabled /></Field>
            <Field label="Phone" id="about-phone" error={err('phone')}><Input {...F('about', 'phone')} type="tel" maxLength={30} autoComplete="tel" /></Field>
            <Field label="WhatsApp number" id="about-whatsapp"><Input {...F('about', 'whatsapp')} type="tel" maxLength={30} /></Field>
            <Field label="City *" id="about-city" error={err('city')}><Input {...F('about', 'city')} maxLength={120} /></Field>
            <Field label="Country" id="about-country"><Input {...F('about', 'country')} maxLength={80} /></Field>
            <Field label="Website (optional)" id="about-website"><Input {...F('about', 'website')} placeholder="https://…" /></Field>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <Chips label="What type of artist are you? *" name="artist_type" multiple={false} options={ARTIST_TYPES} value={data.artistry.artist_type} onChange={(v) => set('artistry', { artist_type: v })} />
              {err('artist_type') && <p role="alert" className="text-xs text-[#F08A6A] mt-1 mb-0">{err('artist_type')}</p>}
            </div>
            <div>
              <Chips label="Primary genre *" name="primary_genre" multiple={false} options={GENRES} value={data.artistry.primary_genre} onChange={(v) => set('artistry', { primary_genre: v })} />
              {err('primary_genre') && <p role="alert" className="text-xs text-[#F08A6A] mt-1 mb-0">{err('primary_genre')}</p>}
            </div>
            <Chips label="Other genres" name="genres" options={GENRES} value={data.artistry.genres} onChange={(v) => set('artistry', { genres: v })} />
            <Field label="Sub-genres" id="artistry-sub_genres"><Input {...F('artistry', 'sub_genres')} placeholder="e.g. Khayal, Dakhni folk" /></Field>
            <Chips label="Primary instrument(s)" name="instruments" options={INSTRUMENTS} value={data.artistry.instruments} onChange={(v) => set('artistry', { instruments: v })} />
            <Field label="Other instruments" id="artistry-other_instruments"><Input {...F('artistry', 'other_instruments')} /></Field>
            <Chips label="Languages / musical traditions" name="languages" options={LANGUAGES} value={data.artistry.languages} onChange={(v) => set('artistry', { languages: v })} />
            <Field label="Describe your sound / style" id="artistry-style"><Textarea {...F('artistry', 'style')} rows={3} maxLength={1000} /></Field>
            <Field label="Short bio *" id="artistry-short_bio" hint="2–3 sentences, at least 40 characters" error={err('short_bio')}><Textarea {...F('artistry', 'short_bio')} rows={3} maxLength={600} /></Field>
            <Field label="Long bio" id="artistry-long_bio"><Textarea {...F('artistry', 'long_bio')} rows={6} maxLength={6000} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Years active" id="artistry-years_active"><Input {...F('artistry', 'years_active')} type="number" min={0} max={80} /></Field>
              <Field label="Experience level" id="artistry-experience_level"><Select {...F('artistry', 'experience_level')}><option value="">Choose…</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select></Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="How many years have you been performing?" id="experience-years_performing"><Input {...F('experience', 'years_performing')} type="number" min={0} max={80} /></Field>
              <Field label="Approximate number of live performances" id="experience-performance_count"><Input {...F('experience', 'performance_count')} type="number" min={0} /></Field>
            </div>
            <Field label="Previous venues" id="experience-venues"><Textarea {...F('experience', 'venues')} rows={2} /></Field>
            <Field label="Festivals" id="experience-festivals"><Textarea {...F('experience', 'festivals')} rows={2} /></Field>
            <Field label="Cultural events" id="experience-cultural_events"><Textarea {...F('experience', 'cultural_events')} rows={2} /></Field>
            <Field label="Notable collaborations" id="experience-collaborations"><Textarea {...F('experience', 'collaborations')} rows={2} /></Field>
            <Chips label="Have you performed with Tangy before?" name="played_tangy" multiple={false} options={['Yes', 'No']} value={data.experience.played_tangy} onChange={(v) => set('experience', { played_tangy: v })} />
            {data.experience.played_tangy === 'Yes' && <Field label="Which session or event?" id="experience-tangy_event"><Input {...F('experience', 'tangy_event')} /></Field>}
            <fieldset className="border-0 p-0 m-0">
              <legend className="text-xs font-medium text-[#E7D5A4]/85 mb-2">Performance highlights</legend>
              <div className="flex flex-col gap-3" data-highlights>
                {data.experience.highlights.map((h, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_90px_1fr_auto] gap-2 items-end bg-[#14110D] border border-[#E7D5A4]/12 rounded-md p-3">
                    {[['venue', 'Venue'], ['event', 'Event'], ['year', 'Year'], ['type', 'Performance type']].map(([k, l]) => (
                      <Field key={k} label={l} id={`hl-${i}-${k}`}><Input id={`hl-${i}-${k}`} value={h[k] || ''} inputMode={k === 'year' ? 'numeric' : undefined}
                        onChange={(e) => set('experience', { highlights: data.experience.highlights.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)) })} /></Field>
                    ))}
                    <Btn size="sm" variant="ghost" icon="Trash2" aria-label={`Remove highlight ${i + 1}`} onClick={() => set('experience', { highlights: data.experience.highlights.filter((_, j) => j !== i) })} />
                  </div>
                ))}
                {data.experience.highlights.length < 10 && <Btn size="sm" icon="Plus" onClick={() => set('experience', { highlights: [...data.experience.highlights, { venue: '', event: '', year: '', type: '' }] })}>Add a highlight</Btn>}
              </div>
            </fieldset>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['instagram', 'Instagram', '@handle or https://instagram.com/…'], ['spotify', 'Spotify', 'https://open.spotify.com/artist/…'], ['youtube', 'YouTube', 'https://youtube.com/@…'],
                ['soundcloud', 'SoundCloud', 'https://soundcloud.com/…'], ['website', 'Website', 'https://…'], ['other', 'Other', 'https://…']].map(([k, l, ph]) => (
                <Field key={k} label={l} id={`online-${k}`} error={err(k)}><Input {...F('online', k)} placeholder={ph} /></Field>
              ))}
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 list-none m-0 p-0" aria-label="Your links">
              {[['instagram', 'Instagram'], ['spotify', 'Spotify'], ['youtube', 'YouTube']].filter(([k]) => data.online[k]).map(([k, l]) => (
                <li key={k} className="rounded-md border border-[#E7D5A4]/15 bg-[#14110D] p-3 text-sm"><span className="block text-xs text-[#E7D5A4]/60">{l}</span><span className="block truncate text-[#F3E7C9]">{data.online[k]}</span></li>
              ))}
            </ul>
            <fieldset className="border-0 p-0 m-0">
              <legend className="text-xs font-medium text-[#E7D5A4]/85 mb-1">Audience numbers (optional)</legend>
              <p className="text-xs text-[#E7D5A4]/60 mt-0 mb-2">Shown to the team as artist-provided figures — we don't treat them as verified.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Instagram followers" id="online-instagram_followers"><Input {...F('online', 'instagram_followers')} type="number" min={0} /></Field>
                <Field label="Spotify monthly listeners" id="online-spotify_monthly_listeners"><Input {...F('online', 'spotify_monthly_listeners')} type="number" min={0} /></Field>
                <Field label="YouTube subscribers" id="online-youtube_subscribers"><Input {...F('online', 'youtube_subscribers')} type="number" min={0} /></Field>
              </div>
            </fieldset>
          </div>
        )}

        {step === 5 && <MediaStep app={app} setCol={setCol} userId={user.id} errors={errors} F={F} />}

        {step === 6 && (
          <div className="flex flex-col gap-5">
            <Chips label="Performance format" name="format" multiple={false} options={['Solo', 'Duo', 'Band', 'DJ', 'Ensemble', 'Other']} value={data.technical.format} onChange={(v) => set('technical', { format: v })} />
            <Chips label="Typical set duration" name="set_duration" multiple={false} options={SET} value={data.technical.set_duration} onChange={(v) => set('technical', { set_duration: v })} />
            <Chips label="Technical requirements" name="requirements" options={TECH} value={data.technical.requirements} onChange={(v) => set('technical', { requirements: v })} />
            <Chips label="Do you have your own sound / backline equipment?" name="own_equipment" multiple={false} options={['Yes', 'No', 'Partially']} value={data.technical.own_equipment} onChange={(v) => set('technical', { own_equipment: v })} />
            <Field label="Technical notes / rider" id="technical-rider" hint="You can also upload a rider in Documents once you're approved"><Textarea {...F('technical', 'rider')} rows={4} maxLength={4000} /></Field>
            <h2 className="font-condensed text-lg uppercase text-[#F3E7C9] m-0 mt-2">Hospitality & travel</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Travelling from" id="hospitality-travel_origin"><Input {...F('hospitality', 'travel_origin')} /></Field>
              <Field label="Number of travelling members" id="hospitality-members"><Input {...F('hospitality', 'members')} type="number" min={0} max={50} /></Field>
            </div>
            <Chips label="Accommodation required?" name="accommodation" multiple={false} options={['Yes', 'No']} value={data.hospitality.accommodation} onChange={(v) => set('hospitality', { accommodation: v })} />
            <Chips label="Travel assistance required?" name="travel_assistance" multiple={false} options={['Yes', 'No']} value={data.hospitality.travel_assistance} onChange={(v) => set('hospitality', { travel_assistance: v })} />
            <Field label="Food preferences" id="hospitality-food"><Input {...F('hospitality', 'food')} /></Field>
            <Field label="Other requirements" id="hospitality-requirements" hint="Keep it to what the team needs to plan your night"><Textarea {...F('hospitality', 'requirements')} rows={3} maxLength={2000} /></Field>
          </div>
        )}

        {step === 7 && (
          <div className="flex flex-col gap-5">
            <Field label="Typical availability" id="availability-typical"><Input {...F('availability', 'typical')} placeholder="e.g. Weekends, evenings" /></Field>
            <Chips label="Preferred performance days" name="preferred_days" options={DAYS} value={data.availability.preferred_days} onChange={(v) => set('availability', { preferred_days: v })} />
            <Field label="Dates you can't perform" id="availability-unavailable_dates" hint="Once approved you can mark these in your availability calendar"><Textarea {...F('availability', 'unavailable_dates')} rows={2} /></Field>
            <Field label="Preferred booking notice" id="availability-notice"><Select {...F('availability', 'notice')}><option value="">Choose…</option>{['1 week', '2 weeks', '1 month', '2+ months'].map((o) => <option key={o}>{o}</option>)}</Select></Field>
            <Chips label="Open to last-minute bookings?" name="last_minute" multiple={false} options={['Yes', 'No']} value={data.availability.last_minute} onChange={(v) => set('availability', { last_minute: v })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Travel radius" id="availability-travel_radius"><Input {...F('availability', 'travel_radius')} placeholder="e.g. Within India" /></Field>
              <Field label="Preferred cities" id="availability-preferred_cities"><Input {...F('availability', 'preferred_cities')} /></Field>
            </div>
          </div>
        )}

        {step === 8 && <Review data={data} app={app} onEdit={(n) => setParams({ step: String(n) })} />}
      </Card>

      {step === 8 && (
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 w-4 h-4 accent-[#C99A2E]" checked={app.accuracy_confirmed} onChange={(e) => setCol({ accuracy_confirmed: e.target.checked })} data-accuracy />
            I confirm that the information provided is accurate.
          </label>
          {submitError && <p role="alert" className="text-sm text-[#F08A6A] m-0">{submitError}</p>}
        </div>
      )}

      <div className="sticky bottom-0 mt-6 -mx-4 px-4 py-3 bg-[#14110D]/95 border-t border-[#E7D5A4]/10 flex flex-wrap items-center gap-2">
        {step > 1 && <Btn onClick={() => go(step - 1)}>Back</Btn>}
        <Btn variant="ghost" onClick={() => save()} data-save-draft>Save draft</Btn>
        <span className="flex-1" />
        {step < 8 ? <Btn variant="primary" onClick={() => go(step + 1)}>Continue</Btn>
          : <Btn variant="primary" disabled={submitting} onClick={submit}>{submitting ? 'Submitting…' : app.status === 'needs_information' ? 'Resubmit application' : 'Submit application'}</Btn>}
      </div>
    </Wrap>
  );
};

function MediaStep({ app, setCol, userId, errors, F }) {
  const input = useRef(null);
  const [progress, setProgress] = useState(null);
  const [msg, setMsg] = useState('');
  const [mode, setMode] = useState(app.video_storage_path ? 'upload' : 'link');
  const upload = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) { setMsg('Choose a video file (MP4, MOV or WebM).'); return; }
    if (file.size > MAX_VIDEO) { setMsg(`That file is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_VIDEO)}. Paste a YouTube or Vimeo link instead.`); return; }
    const path = `applications/${userId}/${Date.now()}-${safeFileName(file.name)}`;
    setProgress(0); setMsg('');
    try {
      await uploadWithProgress('artist-media', path, file, { onProgress: setProgress, maxBytes: MAX_VIDEO });
      setCol({ video_storage_path: path, video_url: null });
      setMsg(`Uploaded ${file.name}.`);
    } catch (err) { setMsg(err.message); }
    setProgress(null);
  };
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[#E7D5A4]/80 m-0">Show us your performance. A live video tells us more than anything else — it's required.</p>
      <div role="group" aria-label="How will you share your video?" className="flex gap-2">
        {[['link', 'Paste a link'], ['upload', 'Upload a video']].map(([k, l]) => (
          <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)}
            className={cx('min-h-[40px] px-4 rounded-full border text-sm', mode === k ? 'bg-[#C99A2E] border-[#C99A2E] text-[#14110D]' : 'border-[#E7D5A4]/25')}>{l}</button>
        ))}
      </div>
      {mode === 'link' ? (
        <Field label="Primary performance video *" id="video-url" hint="YouTube or Vimeo only" error={errors.video}>
          <Input id="video-url" value={app.video_url || ''} placeholder="https://www.youtube.com/watch?v=…" data-video-url
            onChange={(e) => setCol({ video_url: e.target.value.trim() || null, video_storage_path: null })} />
        </Field>
      ) : (
        <div className="flex flex-col gap-2">
          <input ref={input} type="file" accept="video/*" className="sr-only" onChange={upload} aria-label="Choose a performance video" />
          <Btn icon="Upload" onClick={() => input.current?.click()} disabled={progress != null}>{progress != null ? `Uploading ${progress}%` : app.video_storage_path ? 'Replace video' : 'Upload video (up to 50 MB)'}</Btn>
          {app.video_storage_path && <p className="text-xs text-[#7FD3A0] m-0 flex items-center gap-1.5"><PIcon name="CheckCircle2" size={14} />Video uploaded privately — only you and the Tangy team can see it.</p>}
          {errors.video && <p role="alert" className="text-xs text-[#F08A6A] m-0">{errors.video}</p>}
        </div>
      )}
      {msg && <p role="status" className="text-sm m-0">{msg}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Performance title" id="media-title"><Input {...F('media', 'title')} placeholder="Live acoustic set" /></Field>
        <Field label="Where it was recorded" id="media-recorded_at"><Input {...F('media', 'recorded_at')} /></Field>
        <Field label="Approximate date" id="media-recorded_on"><Input {...F('media', 'recorded_on')} type="month" /></Field>
        <Field label="Performance type" id="media-performance_type"><Input {...F('media', 'performance_type')} /></Field>
      </div>
      <Field label="Short description" id="media-description"><Textarea {...F('media', 'description')} rows={2} maxLength={600} /></Field>
      <Field label="Second performance video (optional)" id="media-second_video_url" hint="YouTube or Vimeo" error={errors.second_video_url}><Input {...F('media', 'second_video_url')} placeholder="https://vimeo.com/…" /></Field>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 w-4 h-4 accent-[#C99A2E]" checked={app.media_consent} onChange={(e) => setCol({ media_consent: e.target.checked })} data-media-consent />
        <span>I confirm that I have the right to submit these photos and videos for Tangy to consider. <span className="text-xs text-[#E7D5A4]/60">(Wording subject to final legal review.)</span></span>
      </label>
      {errors.consent && <p role="alert" className="text-xs text-[#F08A6A] m-0">{errors.consent}</p>}
      <p className="text-xs text-[#E7D5A4]/60 m-0">Photos and a press kit can be added from your portal once you're approved.</p>
    </div>
  );
}

const show = (v) => (Array.isArray(v) ? v.join(', ') : v) || '—';
function Review({ data, app, onEdit }) {
  const sections = [
    [1, 'About you', [['Name', data.about.full_name], ['Stage name', data.about.stage_name], ['Email', data.about.email], ['Phone', data.about.phone], ['City', `${data.about.city}${data.about.country ? `, ${data.about.country}` : ''}`]]],
    [2, 'Artistry', [['Type', data.artistry.artist_type], ['Primary genre', data.artistry.primary_genre], ['Genres', data.artistry.genres], ['Instruments', data.artistry.instruments], ['Languages', data.artistry.languages], ['Short bio', data.artistry.short_bio]]],
    [3, 'Experience', [['Years performing', data.experience.years_performing], ['Performances', data.experience.performance_count], ['Venues', data.experience.venues], ['Highlights', data.experience.highlights.map((h) => [h.event, h.venue, h.year].filter(Boolean).join(', '))]]],
    [4, 'Online', [['Instagram', data.online.instagram], ['Spotify', data.online.spotify], ['YouTube', data.online.youtube], ['Website', data.online.website]]],
    [5, 'Performance media', [['Video', app.video_url || (app.video_storage_path ? 'Uploaded file' : '')], ['Title', data.media.title], ['Recorded at', data.media.recorded_at], ['Consent', app.media_consent ? 'Confirmed' : 'Not confirmed']]],
    [6, 'Technical & hospitality', [['Format', data.technical.format], ['Set', data.technical.set_duration], ['Requirements', data.technical.requirements], ['Own equipment', data.technical.own_equipment], ['Travelling from', data.hospitality.travel_origin], ['Accommodation', data.hospitality.accommodation]]],
    [7, 'Availability', [['Typical', data.availability.typical], ['Preferred days', data.availability.preferred_days], ['Notice', data.availability.notice], ['Last-minute', data.availability.last_minute]]],
  ];
  return (
    <div className="flex flex-col gap-4" data-review>
      {sections.map(([n, title, rows]) => (
        <section key={n} className="border-b border-[#E7D5A4]/10 pb-4" aria-labelledby={`review-${n}`}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 id={`review-${n}`} className="font-condensed text-lg uppercase text-[#F3E7C9] m-0">{title}</h2>
            <Btn size="sm" variant="ghost" onClick={() => onEdit(n)} aria-label={`Edit ${title}`}>Edit</Btn>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-x-4 gap-y-1 text-sm m-0">
            {rows.map(([k, v]) => <Fragment key={k}><dt className="text-[#E7D5A4]/60">{k}</dt><dd className="m-0 text-[#F3E7C9] break-words">{show(v)}</dd></Fragment>)}
          </dl>
        </section>
      ))}
    </div>
  );
}

const Wrap = ({ children }) => (
  <div className="min-h-[100dvh] ui-texture text-[#E7D5A4] font-body">
    <header className="border-b border-[#E7D5A4]/10 px-4 h-14 flex items-center justify-between max-w-3xl mx-auto">
      <Link to="/" className="font-display text-lg uppercase text-[#F3E7C9]">Tangy</Link>
      <Link to="/artist/application" className="text-sm text-[#E7D5A4]/80 hover:text-[#F3E7C9]">Application status</Link>
    </header>
    <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
  </div>
);
