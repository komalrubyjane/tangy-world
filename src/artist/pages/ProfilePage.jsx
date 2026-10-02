import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { workspaceApi } from '../services/workspaceApi';
import { ProfileCompletionCard } from '../components/ProfileCompletionCard';
import { Panel, Button, Input, Textarea, Select, Field, Skeleton, ErrorState, Icon } from '../../admin/ui';
import { safeFileName } from '../../lib/storage';

// Artist profile editor. Public fields live on `artists` (shown on the public
// roster through the public_artists view); logistics live in
// artist_private_profiles, readable only by the artist and Tangy managers.
// Admin-only fields (fees, contract status, internal notes — artist_admin_notes)
// are never read here; RLS denies them to artists regardless.

const PUBLIC = ['name', 'stage_name', 'bio', 'long_bio', 'genre', 'subgenre', 'city', 'country', 'instagram', 'spotify', 'soundcloud', 'youtube', 'website',
  'performance_type', 'years_active', 'performance_count', 'highlights'];
// Array columns, edited as comma-separated text.
const LISTS = ['genres', 'instruments', 'languages', 'notable_venues'];
const PRIVATE = ['phone', 'set_duration_minutes', 'technical_rider', 'equipment', 'inputs', 'microphones', 'backline',
  'food_preferences', 'dietary_restrictions', 'green_room', 'accommodation', 'travel_preferences',
  'legal_name', 'whatsapp', 'manager_name', 'manager_contact', 'booking_email', 'travel_origin', 'travelling_members', 'hospitality_notes', 'payment_details_status'];
const METRICS = [['instagram_followers', 'Instagram followers'], ['spotify_monthly_listeners', 'Spotify monthly listeners'], ['youtube_subscribers', 'YouTube subscribers']];
const PERFORMANCE_TYPES = [['', 'Not set'], ['dj', 'DJ set'], ['live', 'Live act'], ['band', 'Band'], ['hybrid', 'Hybrid / live-electronic'], ['vocalist', 'Vocalist'], ['other', 'Other']];
const MAX_AVATAR = 5 * 1024 * 1024;

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj?.[k] ?? '']));
const nullify = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v]));

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [slug, setSlug] = useState(null);
  const [pub, setPub] = useState(null);
  const [priv, setPriv] = useState(null);
  const [initial, setInitial] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [completionKey, setCompletionKey] = useState(0);
  const avatarRef = useRef(null);

  const load = async () => {
    if (!user?.id) return;
    try {
      const [{ data: row, error: e1 }, privateRow] = await Promise.all([
        supabase.from('artists').select([...PUBLIC, ...LISTS, 'audience_metrics', 'slug'].join(',')).eq('id', user.id).single(),
        workspaceApi.privateProfile(user.id),
      ]);
      if (e1) throw e1;
      const p = { ...pick(row, PUBLIC), ...Object.fromEntries(LISTS.map((k) => [k, (row[k] || []).join(', ')])),
        ...Object.fromEntries(METRICS.map(([k]) => [k, row.audience_metrics?.[k] ?? ''])), metrics_updated: row.audience_metrics?.updated_at || null };
      setSlug(row.slug);
      const q = pick(privateRow, PRIVATE);
      setPub(p); setPriv(q); setInitial(JSON.stringify([p, q])); setError(null);
    } catch (err) { setError(err); }
  };
  useEffect(() => { load(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = pub && initial !== JSON.stringify([pub, priv]);

  const save = async (e) => {
    e.preventDefault();
    if (!pub.name.trim()) { setStatus('Artist name is required.'); return; }
    setSaving(true); setStatus('');
    try {
      const minutes = priv.set_duration_minutes === '' ? null : Number(priv.set_duration_minutes);
      const lists = Object.fromEntries(LISTS.map((k) => [k, [...new Set(pub[k].split(',').map((x) => x.trim()).filter(Boolean))]]));
      const metricValues = Object.fromEntries(METRICS.filter(([k]) => pub[k] !== '' && pub[k] != null).map(([k]) => [k, Number(pub[k])]));
      const num = (v) => (v === '' || v == null ? null : Number(v));
      const publicRow = Object.fromEntries(PUBLIC.map((k) => [k, pub[k]]));
      await workspaceApi.savePublicProfile(user.id, {
        ...nullify({ ...publicRow, name: pub.name.trim() }), ...lists,
        years_active: num(pub.years_active), performance_count: num(pub.performance_count),
        // Self-reported; shown to the team as "artist provided", never verified.
        audience_metrics: Object.keys(metricValues).length ? { ...metricValues, updated_at: new Date().toISOString() } : null,
      });
      await workspaceApi.savePrivateProfile(user.id, nullify({ ...priv, set_duration_minutes: minutes, travelling_members: priv.travelling_members === '' ? null : Number(priv.travelling_members) }));
      // Keep the header/navbar in sync without another DB write.
      updateUser({ name: pub.name.trim(), genre: pub.genre, city: pub.city, bio: pub.bio, instagram: pub.instagram, soundcloud: pub.soundcloud, spotify: pub.spotify });
      setInitial(JSON.stringify([pub, priv]));
      setStatus('Profile saved.');
      setCompletionKey((k) => k + 1);
    } catch (err) { setStatus(err.message || 'Could not save your profile.'); }
    finally { setSaving(false); }
  };

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setStatus('Profile photo must be an image.'); return; }
    if (file.size > MAX_AVATAR) { setStatus('Profile photo must be 5 MB or smaller.'); return; }
    setAvatarBusy(true); setStatus('');
    // Profile photos are public by design (artist-avatars bucket, 0013).
    const path = `${user.id}/avatar-${Date.now()}-${safeFileName(file.name)}`;
    const { error: upErr } = await supabase.storage.from('artist-avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setAvatarBusy(false); setStatus(upErr.message); return; }
    const { data } = supabase.storage.from('artist-avatars').getPublicUrl(path);
    await updateUser({ avatar: data.publicUrl });
    setAvatarBusy(false);
    setStatus('Profile photo updated.');
    setCompletionKey((k) => k + 1);
  };

  const P = (k) => ({ value: pub[k], onChange: (e) => setPub({ ...pub, [k]: e.target.value }) });
  const Q = (k) => ({ value: priv[k], onChange: (e) => setPriv({ ...priv, [k]: e.target.value }) });

  return (
    <div className="w-full flex flex-col gap-4 text-left font-body text-[#E7D5A4]">
      <header className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button type="button" onClick={() => avatarRef.current?.click()} aria-label="Change profile photo"
          className="relative w-20 h-20 rounded-full overflow-hidden border border-[#C99A2E]/50 bg-[#1b1812] shrink-0 group">
          {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <span className="font-poster text-3xl text-[#e4bd5c]">{(user?.name || 'A')[0]}</span>}
          <span className="absolute inset-0 bg-black/60 flex items-center justify-center font-mono text-[10px] uppercase opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">{avatarBusy ? 'Uploading…' : 'Change'}</span>
        </button>
        <input ref={avatarRef} type="file" className="hidden" accept="image/*" onChange={onAvatar} />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#d1a437]">Artist workspace</p>
          <h1 className="font-poster text-3xl sm:text-4xl text-[#ecdcaf] m-0 leading-none truncate">{pub?.stage_name || user?.name || 'Your profile'}</h1>
          <p className="text-[13px] text-[#ecdcaf]/65 mt-1">{[pub?.genre, pub?.city].filter(Boolean).join(' · ') || 'Add your genre and city so Tangy can book you'}</p>
        </div>
        {slug && <Button variant="ghost" icon="ExternalLink" to={`/artists/${slug}`}>Preview public profile</Button>}
      </header>

      <ProfileCompletionCard key={completionKey} />

      {error ? <Panel><ErrorState error={error} onRetry={load} /></Panel> : !pub ? <Panel><Skeleton rows={6} /></Panel> : (
        <form onSubmit={save} className="flex flex-col gap-4">

          {(
            <Panel title="Identity" subtitle="Shown on your public Tangy profile.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Artist name *"><Input required maxLength={120} {...P('name')} /></Field>
                <Field label="Stage name" hint="If you perform under a different name"><Input maxLength={120} {...P('stage_name')} /></Field>
                <Field label="City"><Input maxLength={120} {...P('city')} /></Field>
                <Field label="Email" hint="Your sign-in email — change it from account support"><Input type="email" disabled value={user?.email || ''} /></Field>
                <Field label="Phone" hint="Private — only visible to Tangy" className="sm:col-span-2"><Input type="tel" maxLength={30} {...Q('phone')} /></Field>
                <Field label="Country"><Input maxLength={80} {...P('country')} /></Field>
                <Field label="Languages" hint="Comma separated"><Input {...P('languages')} /></Field>
                <Field label="Short bio" hint="At least 40 characters counts towards profile completion" className="sm:col-span-2"><Textarea rows={3} maxLength={3000} {...P('bio')} /></Field>
                <Field label="Long bio" className="sm:col-span-2"><Textarea rows={6} maxLength={6000} {...P('long_bio')} /></Field>
              </div>
            </Panel>
          )}

          {(
            <Panel title="Music & links" subtitle="Public — helps curators and audiences find your work.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Primary genre"><Input maxLength={120} {...P('genre')} /></Field>
                <Field label="Sub-genre"><Input maxLength={120} {...P('subgenre')} /></Field>
                <Field label="Other genres" hint="Comma separated"><Input {...P('genres')} /></Field>
                <Field label="Instruments" hint="Comma separated"><Input {...P('instruments')} /></Field>
                <Field label="Website"><Input maxLength={300} placeholder="https://…" {...P('website')} /></Field>
                <Field label="Instagram"><Input maxLength={300} placeholder="https://instagram.com/…" {...P('instagram')} /></Field>
                <Field label="Spotify"><Input maxLength={300} placeholder="https://open.spotify.com/artist/…" {...P('spotify')} /></Field>
                <Field label="SoundCloud"><Input maxLength={300} placeholder="https://soundcloud.com/…" {...P('soundcloud')} /></Field>
                <Field label="YouTube"><Input maxLength={300} placeholder="https://youtube.com/@…" {...P('youtube')} /></Field>
              </div>
              <p className="text-[12.5px] text-[#E7D5A4]/60 mt-3">Demos, photos and videos are managed in <Link to="/artist/media" className="text-[#e4bd5c] underline underline-offset-2">Media</Link>.</p>
            </Panel>
          )}

          <Panel title="Experience" subtitle="Public highlights of your career so far.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Years active"><Input type="number" min={0} max={80} {...P('years_active')} /></Field>
              <Field label="Approximate number of performances"><Input type="number" min={0} {...P('performance_count')} /></Field>
              <Field label="Notable venues & festivals" hint="Comma separated" className="sm:col-span-2"><Input {...P('notable_venues')} /></Field>
              <Field label="Highlights & collaborations" className="sm:col-span-2"><Textarea rows={4} maxLength={4000} {...P('highlights')} /></Field>
            </div>
          </Panel>

          <Panel title="Audience (artist provided)" subtitle="Optional. Shown to the Tangy team as numbers you provided — they are not verified.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {METRICS.map(([k, label]) => <Field key={k} label={label}><Input type="number" min={0} {...P(k)} /></Field>)}
            </div>
            {pub.metrics_updated && <p className="text-[12px] text-[#E7D5A4]/60 mt-2">Last updated {new Date(pub.metrics_updated).toLocaleDateString('en-IN')}</p>}
          </Panel>

          <Panel title="Contact" subtitle="Private — only visible to Tangy.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Legal name" hint="For contracts and payments"><Input maxLength={160} {...Q('legal_name')} /></Field>
              <Field label="WhatsApp"><Input type="tel" maxLength={30} {...Q('whatsapp')} /></Field>
              <Field label="Booking email"><Input type="email" maxLength={200} {...Q('booking_email')} /></Field>
              <Field label="Manager / contact person"><Input maxLength={160} {...Q('manager_name')} /></Field>
              <Field label="Manager's phone or email" className="sm:col-span-2"><Input maxLength={200} {...Q('manager_contact')} /></Field>
            </div>
          </Panel>

          {(
            <Panel title="Performance" subtitle="Private — shared with the Tangy production team for your bookings.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Performance type">
                  <Select {...P('performance_type')}>{PERFORMANCE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
                </Field>
                <Field label="Typical set length (minutes)"><Input type="number" min={5} max={600} {...Q('set_duration_minutes')} /></Field>
                <Field label="Technical rider" className="sm:col-span-2"><Textarea rows={5} maxLength={6000} {...Q('technical_rider')} /></Field>
                <Field label="Equipment you bring"><Textarea rows={3} maxLength={2000} {...Q('equipment')} /></Field>
                <Field label="Inputs / channels"><Textarea rows={3} maxLength={2000} {...Q('inputs')} /></Field>
                <Field label="Microphones"><Textarea rows={3} maxLength={2000} {...Q('microphones')} /></Field>
                <Field label="Backline needed"><Textarea rows={3} maxLength={2000} {...Q('backline')} /></Field>
              </div>
            </Panel>
          )}

          {(
            <Panel title="Hospitality & travel" subtitle="Private — used by Tangy to plan your stay and green room.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Food preferences"><Textarea rows={3} maxLength={1000} {...Q('food_preferences')} /></Field>
                <Field label="Dietary restrictions / allergies"><Textarea rows={3} maxLength={1000} {...Q('dietary_restrictions')} /></Field>
                <Field label="Green room"><Textarea rows={3} maxLength={1000} {...Q('green_room')} /></Field>
                <Field label="Accommodation"><Textarea rows={3} maxLength={1000} {...Q('accommodation')} /></Field>
                <Field label="Travel preferences" className="sm:col-span-2"><Textarea rows={3} maxLength={1000} {...Q('travel_preferences')} /></Field>
                <Field label="Usually travelling from"><Input maxLength={120} {...Q('travel_origin')} /></Field>
                <Field label="Travelling members"><Input type="number" min={0} max={50} {...Q('travelling_members')} /></Field>
                <Field label="Other hospitality notes" className="sm:col-span-2"><Textarea rows={3} maxLength={2000} {...Q('hospitality_notes')} /></Field>
              </div>
            </Panel>
          )}

          <Panel title="Payment" subtitle="We never show bank details here. Upload tax and payment documents in Documents.">
            <p className="text-[13px] m-0">Payment details: <strong>{({ submitted: 'Submitted — the team will verify them', verified: 'Verified', not_started: 'Not started' })[priv.payment_details_status] || 'Not started'}</strong></p>
            <p className="text-[12.5px] text-[#E7D5A4]/60 mt-2 mb-0">Fees for each session are shown on the session page. <Link to="/artist/documents" className="text-[#e4bd5c] underline underline-offset-2">Documents</Link></p>
          </Panel>

          <div className="sticky bottom-0 z-10 -mx-3 sm:mx-0 px-3 sm:px-4 py-3 bg-[#11100C]/95 backdrop-blur border-t border-[#E7D5A4]/10 flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save profile'}</Button>
            {dirty && !saving && <span className="text-[12px] text-[#E7D5A4]/55">Unsaved changes</span>}
            {status && <span role="status" className="text-[12.5px] text-[#f5b544] inline-flex items-center gap-1"><Icon name="Info" size={13} />{status}</span>}
          </div>
        </form>
      )}
    </div>
  );
};
