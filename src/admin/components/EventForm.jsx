import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { insert, update } from '../api';
import { useAsync } from '../hooks';
import { useSetting } from '../AdminSession';
import { EVENT_STATUSES, EVENT_STATUS_LABELS } from '../rbac';
import { Field, Input, Textarea, Select, Button } from '../ui';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const EDITABLE = ['name', 'slug', 'description', 'story', 'event_date', 'event_time', 'end_time', 'timezone', 'doors_at', 'venue', 'venue_id', 'venue_partner_id', 'image_url', 'capacity', 'price', 'status', 'featured', 'tags'];
// IANA zones offered in the form (the database validates any IANA name).
const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York'];
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function useVenueOptions() {
  return useAsync(async () => {
    const [{ data: venues }, { data: partners }] = await Promise.all([
      supabase.from('venues').select('id, name, capacity').eq('is_active', true).order('name'),
      supabase.from('venue_profiles').select('id, property_name, profiles(full_name, email)'),
    ]);
    return {
      venues: venues || [],
      partners: (partners || []).map((p) => ({ id: p.id, name: p.property_name || p.profiles?.full_name || p.profiles?.email })),
    };
  }, []).data || { venues: [], partners: [] };
}

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Required';
  if (!f.event_date) e.event_date = 'Required';
  if (f.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) e.slug = 'Lowercase letters, numbers and dashes only';
  if (!(Number(f.capacity) >= 0) || !Number.isInteger(Number(f.capacity))) e.capacity = 'Whole number ≥ 0';
  if (!(Number(f.price) >= 0) || !Number.isInteger(Number(f.price))) e.price = 'Whole rupees ≥ 0';
  if (f.status === 'on-sale' && Number(f.capacity) === 0) e.capacity = 'An on-sale event needs capacity';
  return e;
}

// Create/edit an event. `fields` narrows the form (the Content tab edits only
// the public-facing copy). All writes go through RLS (events.manage).
export const EventForm = ({ initial, onSaved, onCancel, fields = EDITABLE, submitLabel }) => {
  const defaultCapacity = useSetting('events.default_capacity', 200);
  const defaultPrice = useSetting('events.default_price', 799);
  const { venues, partners } = useVenueOptions();
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() => ({
    name: '', slug: '', description: '', story: '', event_date: '', event_time: '', end_time: '',
    venue: '', venue_id: '', venue_partner_id: '', image_url: '', capacity: defaultCapacity, price: defaultPrice,
    status: 'draft', featured: false, timezone: 'Asia/Kolkata',
    ...(initial || {}),
    doors_at: toLocalInput(initial?.doors_at),
    tags: (initial?.tags || []).join(', '),
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const show = (k) => fields.includes(k);
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'venue_id') {
        const venue = venues.find((x) => x.id === v);
        next.venue = venue ? venue.name : f.venue;
      }
      return next;
    });
  };

  const save = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setError('');
    const payload = {};
    fields.forEach((k) => { payload[k] = form[k]; });
    if (show('slug')) payload.slug = form.slug || slugify(form.name);
    if (show('capacity')) payload.capacity = Number(form.capacity);
    if (show('price')) payload.price = Number(form.price);
    if (show('tags')) payload.tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (show('doors_at')) payload.doors_at = form.doors_at ? new Date(form.doors_at).toISOString() : null;
    ['venue_id', 'venue_partner_id', 'end_time', 'event_time', 'image_url'].forEach((k) => { if (k in payload && !payload[k]) payload[k] = null; });
    try {
      const saved = isEdit ? await update('events', initial.id, payload) : await insert('events', payload);
      onSaved(saved);
    } catch (err) {
      setError(err.code === '23505' ? 'That slug is already used by another event.' : err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4" noValidate>
      {show('name') && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Event name *" error={errors.name} className="sm:col-span-2"><Input value={form.name} onChange={set('name')} autoFocus={!isEdit} /></Field>
          <Field label="URL slug" error={errors.slug} hint={!form.slug && form.name ? slugify(form.name) : undefined}><Input value={form.slug} onChange={set('slug')} placeholder="auto" /></Field>
        </div>
      )}
      {show('event_date') && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Date *" error={errors.event_date}><Input type="date" value={form.event_date} onChange={set('event_date')} /></Field>
          <Field label="Start time"><Input value={form.event_time || ''} onChange={set('event_time')} placeholder="7:00 PM" /></Field>
          <Field label="End time"><Input value={form.end_time || ''} onChange={set('end_time')} placeholder="10:30 PM" /></Field>
          <Field label="Timezone" hint="Event times are shown in this zone">
            <Select value={form.timezone || 'Asia/Kolkata'} onChange={set('timezone')}>
              {[...new Set([form.timezone || 'Asia/Kolkata', ...TIMEZONES])].map((z) => <option key={z} value={z}>{z}</option>)}
            </Select>
          </Field>
          <Field label="Doors open"><Input type="datetime-local" value={form.doors_at || ''} onChange={set('doors_at')} /></Field>
        </div>
      )}
      {show('venue_id') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Venue" hint={venues.length === 0 ? 'Add venues under Artists & Partners → Venues' : undefined}>
            <Select value={form.venue_id || ''} onChange={set('venue_id')}>
              <option value="">{form.venue && !form.venue_id ? `${form.venue} (not in directory)` : 'Select a venue…'}</option>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}{v.capacity ? ` · cap ${v.capacity}` : ''}</option>)}
            </Select>
          </Field>
          <Field label="Venue partner account">
            <Select value={form.venue_partner_id || ''} onChange={set('venue_partner_id')}>
              <option value="">None</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
        </div>
      )}
      {show('capacity') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Capacity *" error={errors.capacity}><Input type="number" min="0" value={form.capacity} onChange={set('capacity')} /></Field>
          <Field label="Base price (₹) *" error={errors.price} hint="Tier markups + 18% tax added at checkout"><Input type="number" min="0" value={form.price} onChange={set('price')} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              {EVENT_STATUSES.map((s) => <option key={s} value={s}>{EVENT_STATUS_LABELS[s]}</option>)}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-[13px] pt-6">
            <input type="checkbox" checked={!!form.featured} onChange={set('featured')} className="accent-[#C99A2E] w-4 h-4" /> Featured on site
          </label>
        </div>
      )}
      {show('description') && <Field label="Short description"><Textarea rows={2} value={form.description || ''} onChange={set('description')} /></Field>}
      {show('story') && <Field label="Story (long-form)"><Textarea rows={4} value={form.story || ''} onChange={set('story')} /></Field>}
      {show('image_url') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Cover image URL" hint="e.g. /media/gallery/tangy1.jpg"><Input value={form.image_url || ''} onChange={set('image_url')} /></Field>
          {show('tags') && <Field label="Tags" hint="Comma separated"><Input value={form.tags} onChange={set('tags')} placeholder="Sufi, Acoustic" /></Field>}
        </div>
      )}
      {error && <div role="alert" className="text-[12.5px] text-[#ef6b5e] bg-[#a8322a]/10 border border-[#a8322a]/40 rounded px-3 py-2">{error}</div>}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>}
        <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : submitLabel || (isEdit ? 'Save changes' : 'Create event')}</Button>
      </div>
    </form>
  );
};
