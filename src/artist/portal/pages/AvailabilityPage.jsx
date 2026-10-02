import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePageMeta } from '../../../hooks/usePageMeta';
import { artistApi } from '../api';
import { PageHeader, Card, StatusPill, Btn, ErrorNote, Field, Input, Select } from '../kit';
import { cx, iso, monthGrid, WEEKDAYS } from '../util';
import { AvailabilityFreshness } from '../AvailabilityStatus';

const TONE = { available: 'bg-[#3E8E5E]/25 border-[#3E8E5E]/60', tentative: 'bg-[#C99A2E]/20 border-[#C99A2E]/60', unavailable: 'bg-[#B5532A]/25 border-[#B5532A]/60' };

// /artist/availability — tap a day (or two, for a range), then set it.
export const AvailabilityPage = () => {
  usePageMeta({ title: 'Availability', noindex: true });
  const { user } = useAuth();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [days, setDays] = useState({});
  const [sessions, setSessions] = useState([]);
  const [sel, setSel] = useState({ from: null, to: null });
  const [form, setForm] = useState({ status: 'unavailable', note: '', start: '', end: '' });
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState('');
  const [summary, setSummary] = useState(null);
  const grid = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const load = async () => {
    try {
      const rows = await artistApi.availability(user.id, iso(grid[0]), iso(grid[41]));
      setDays(Object.fromEntries(rows.map((r) => [r.date, r])));
      setSessions(await artistApi.sessions());
      setSummary(await artistApi.availabilitySummary());
      setError(null);
    } catch (err) { setError(err); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (user?.id) load(); }, [user?.id, cursor]);

  const booked = new Set(sessions.filter((s) => s.event_status !== 'cancelled').map((s) => s.event_date));
  const pick = (d) => {
    const k = iso(d);
    if (!sel.from || sel.to) setSel({ from: k, to: null });
    else setSel(k < sel.from ? { from: k, to: sel.from } : { from: sel.from, to: k });
    setMsg('');
  };
  const range = sel.from ? { from: sel.from, to: sel.to || sel.from } : null;
  const inRange = (k) => range && k >= range.from && k <= range.to;
  const save = async (status) => {
    try {
      const n = await artistApi.setAvailability({ ...range, status, note: form.note, start: form.start || null, end: form.end || null });
      const total = Math.round((new Date(range.to) - new Date(range.from)) / 864e5) + 1;
      const kept = status ? total - n : 0;
      setMsg(`${status ? `Saved ${n} day${n === 1 ? '' : 's'} as ${status}.` : `Cleared ${n} day${n === 1 ? '' : 's'}.`}${kept > 0 ? ` ${kept} booked day${kept === 1 ? '' : 's'} kept — you have a confirmed performance then.` : ''}`);
      setSel({ from: null, to: null });
      await load();
    } catch (err) { setMsg(err.message); }
  };
  const title = new Date(cursor.y, cursor.m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const shift = (n) => setCursor(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  return (
    <div>
      <PageHeader title="Availability" description="Tell the team when you can play. Only you and the Tangy team see this — it is what the team sees when they choose artists for a session." />
      <div className="mb-4"><AvailabilityFreshness summary={summary} cta={false} /></div>
      {error && <ErrorNote error={error} onRetry={load} />}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <Btn size="sm" variant="ghost" onClick={() => shift(-1)} aria-label="Previous month">‹</Btn>
            <h2 className="font-condensed text-xl uppercase text-[#F3E7C9] m-0" aria-live="polite">{title}</h2>
            <Btn size="sm" variant="ghost" onClick={() => shift(1)} aria-label="Next month">›</Btn>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#E7D5A4]/60 mb-1" aria-hidden="true">{WEEKDAYS.map((w) => <div key={w}>{w}</div>)}</div>
          <div className="grid grid-cols-7 gap-1" role="group" aria-label={`Availability for ${title}`} data-availability-grid>
            {grid.map((d) => {
              const k = iso(d);
              const a = days[k];
              const out = d.getMonth() !== cursor.m;
              return (
                <button key={k} type="button" onClick={() => pick(d)} data-day={k} data-status={a?.status || ''}
                  aria-label={`${d.toDateString()}${a ? `, ${a.status}${a.note ? ` (${a.note})` : ''}` : ''}${booked.has(k) ? ', booked' : ''}`}
                  aria-pressed={!!inRange(k)}
                  className={cx('relative aspect-square min-h-[40px] rounded-md border text-sm flex flex-col items-center justify-center',
                    a ? TONE[a.status] : 'border-[#E7D5A4]/10', out && 'opacity-40', inRange(k) && 'ring-2 ring-[#C99A2E]',
                    k === iso(now) && 'font-bold text-[#C99A2E]')}>
                  {d.getDate()}
                  {booked.has(k) && <span className={cx('absolute bottom-1 w-1.5 h-1.5 rounded-full', a?.status === 'unavailable' ? 'bg-[#F08A6A]' : 'bg-[#F3E7C9]')} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <StatusPill status="available" /><StatusPill status="tentative" /><StatusPill status="unavailable" />
            <span className="inline-flex items-center gap-1.5 text-[#E7D5A4]/75"><span className="w-1.5 h-1.5 rounded-full bg-[#F3E7C9]" />Booked session</span>
          </div>
        </Card>
        <Card title={range ? (range.from === range.to ? range.from : `${range.from} → ${range.to}`) : 'Choose dates'}>
          {!range ? <p className="text-sm text-[#E7D5A4]/75 m-0">Tap a day, or two days for a range.</p> : (
            <div className="flex flex-col gap-3">
              <Field label="Status" id="av-status">
                <Select id="av-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="available">Available</option><option value="tentative">Tentative</option><option value="unavailable">Unavailable</option>
                </Select>
              </Field>
              <Field label="Note (optional)" id="av-note"><Input id="av-note" value={form.note} maxLength={300} placeholder="e.g. Travelling from Bengaluru" onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="From (optional)" id="av-start"><Input id="av-start" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></Field>
                <Field label="Until" id="av-end"><Input id="av-end" type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></Field>
              </div>
              <Btn variant="primary" onClick={() => save(form.status)}>Save</Btn>
              <Btn variant="ghost" onClick={() => save(null)}>Clear these dates</Btn>
            </div>
          )}
          {msg && <p role="status" className="text-sm text-[#E7D5A4] mt-3 mb-0">{msg}</p>}
          <p className="text-xs text-[#E7D5A4]/60 mt-4 mb-0">Booked sessions: see your <Link className="underline" to="/artist/calendar">calendar</Link>.</p>
        </Card>
      </div>
    </div>
  );
};
