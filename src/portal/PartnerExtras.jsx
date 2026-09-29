import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { friendlyError } from '../admin/api';
import { Panel, Badge, Button, Input, Select, Field, Modal, EmptyState, ErrorState, Skeleton, Icon, fmt, cx } from '../admin/ui';
import { uploadWithProgress, openPrivateFile, removeFile, safeFileName, formatBytes } from '../lib/storage';

// Partner-only sections that aren't shared by every role: invoices/payments
// (partner_invoices — own, non-draft rows only), sponsor deliverables, and
// sponsor brand assets (private sponsor-assets bucket, reviewed by Tangy).
// All access is enforced by RLS in 0020; these components only render it.

const must = ({ data, error }) => { if (error) throw friendlyError(error); return data; };
const useRows = (fn, deps = []) => {
  const [state, setState] = useState({ rows: null, error: null });
  const load = useCallback(async () => {
    try { setState({ rows: await fn(), error: null }); } catch (error) { setState({ rows: null, error }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
};

// ---------------------------------------------------------------------------
// Invoices & payments
// ---------------------------------------------------------------------------

const INVOICE = { issued: ['Issued', 'info'], overdue: ['Overdue', 'bad'], paid: ['Paid', 'good'], void: ['Void', 'muted'] };
const invoiceState = (i) => (i.status === 'issued' && i.due_date && i.due_date < new Date().toISOString().slice(0, 10) ? 'overdue' : i.status);
const money = (i) => `${i.currency} ${fmt.num(i.amount)}`;

export const InvoicesPanel = () => {
  const { rows, error, reload } = useRows(async () => must(await supabase.from('partner_invoices')
    .select('id, invoice_number, amount, currency, direction, issued_date, due_date, status, paid_date, notes, events(name, event_date)')
    .order('created_at', { ascending: false })) || []);
  const open = (rows || []).filter((i) => ['issued', 'overdue'].includes(invoiceState(i)));
  return (
    <Panel title="Payments & invoices" subtitle={rows ? `${open.length} outstanding` : undefined}>
      {error ? <ErrorState error={error} onRetry={reload} /> : rows === null ? <Skeleton rows={3} /> : rows.length === 0 ? (
        <EmptyState icon="Receipt" title="No invoices yet" hint="Invoices Tangy issues to you — or records from you — appear here with their payment status." />
      ) : (
        <ul className="divide-y divide-[#E7D5A4]/[0.06] font-sans" data-invoices>
          {rows.map((i) => {
            const [label, tone] = INVOICE[invoiceState(i)] || [i.status, 'muted'];
            return (
              <li key={i.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] text-[#EFE2C0]">Invoice {i.invoice_number} · {money(i)}</div>
                  <div className="text-[12px] text-[#E7D5A4]/50">
                    {[i.direction === 'receivable' ? 'Payable by you' : 'Payable to you', i.events?.name,
                      i.issued_date && `issued ${fmt.date(i.issued_date)}`, i.due_date && `due ${fmt.date(i.due_date)}`, i.paid_date && `paid ${fmt.date(i.paid_date)}`].filter(Boolean).join(' · ')}
                  </div>
                  {i.notes && <p className="text-[12.5px] text-[#E7D5A4]/60 mt-0.5">{i.notes}</p>}
                </div>
                <Badge tone={tone}>{label}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// Sponsor deliverables
// ---------------------------------------------------------------------------

const DELIVERABLE_KIND = {
  logo_placement: 'Logo placement', social_mention: 'Social mention', event_branding: 'Event branding',
  stage_mention: 'Stage mention', sampling: 'Sampling', other: 'Deliverable',
};

export const SponsorDeliverablesPanel = ({ sponsorId }) => {
  const { rows, error, reload } = useRows(async () => must(await supabase.from('sponsor_deliverables')
    .select('id, title, description, kind, status, due_date, completed_at, proof_url, events(name, event_date)')
    .eq('sponsor_profile_id', sponsorId).order('due_date', { ascending: true, nullsFirst: false })) || [], [sponsorId]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Panel title="Deliverables" subtitle="What your sponsorship includes, and what Tangy has delivered.">
      {error ? <ErrorState error={error} onRetry={reload} /> : rows === null ? <Skeleton rows={3} /> : rows.length === 0 ? (
        <EmptyState icon="ClipboardList" title="No deliverables yet" hint="Once your package is confirmed, each deliverable is tracked here." />
      ) : (
        <ul className="divide-y divide-[#E7D5A4]/[0.06] font-sans">
          {rows.map((d) => {
            const late = d.status !== 'delivered' && d.due_date && d.due_date < today;
            return (
              <li key={d.id} className="py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] text-[#EFE2C0]">{d.title}</div>
                  <div className={cx('text-[12px]', late ? 'text-[#f5b544]' : 'text-[#E7D5A4]/50')}>
                    {[DELIVERABLE_KIND[d.kind], d.events?.name, d.due_date && `${late ? 'was due' : 'due'} ${fmt.date(d.due_date)}`, d.completed_at && `delivered ${fmt.date(d.completed_at)}`].filter(Boolean).join(' · ')}
                  </div>
                  {d.description && <p className="text-[12.5px] text-[#E7D5A4]/60 mt-0.5">{d.description}</p>}
                  {d.proof_url && <a href={d.proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12.5px] text-[#e4bd5c] underline underline-offset-2 mt-1">View proof <Icon name="ArrowUpRight" size={12} /></a>}
                </div>
                <Badge tone={d.status === 'delivered' ? 'good' : late ? 'warn' : 'muted'}>{d.status === 'delivered' ? 'Delivered' : 'Pending'}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// Sponsor brand assets
// ---------------------------------------------------------------------------

const ASSET_KIND = [['logo', 'Logo'], ['guidelines', 'Brand guidelines'], ['campaign', 'Campaign creative'], ['other', 'Other']];
const ASSET_STATUS = { submitted: ['Submitted', 'info'], approved: ['Approved', 'good'], changes_requested: ['Changes requested', 'bad'], archived: ['Archived', 'muted'] };

export const SponsorAssetsPanel = ({ sponsorId, events = [] }) => {
  const inputRef = useRef(null);
  const { rows, error, reload } = useRows(async () => must(await supabase.from('sponsor_assets')
    .select('id, kind, title, storage_path, file_name, file_size_bytes, status, review_note, created_at, events(name)')
    .eq('sponsor_id', sponsorId).order('created_at', { ascending: false })) || [], [sponsorId]);
  const [pending, setPending] = useState(null);
  const [progress, setProgress] = useState(null);
  const [msg, setMsg] = useState('');
  const uniqueEvents = [...new Map(events.map((e) => [e.event_id, e])).values()];

  const upload = async () => {
    const { file, title, kind, eventId } = pending;
    const path = `${sponsorId}/${Date.now()}-${safeFileName(file.name)}`;
    setProgress(0); setMsg('');
    try {
      await uploadWithProgress('sponsor-assets', path, file, { onProgress: setProgress });
      const { error: err } = await supabase.from('sponsor_assets').insert({
        sponsor_id: sponsorId, event_id: eventId || null, kind, title: title.trim() || file.name, storage_path: path,
        file_name: file.name, file_size_bytes: file.size, mime_type: file.type || null,
      });
      if (err) { await removeFile('sponsor-assets', path).catch(() => {}); throw friendlyError(err); }
      setPending(null); setMsg('Uploaded — Tangy will review it.'); reload();
    } catch (err) { setMsg(err.message); }
    finally { setProgress(null); }
  };
  const remove = async (a) => {
    setMsg('');
    const { error: err } = await supabase.from('sponsor_assets').delete().eq('id', a.id);
    if (err) { setMsg(friendlyError(err).message); return; }
    await removeFile('sponsor-assets', a.storage_path).catch(() => {});
    reload();
  };

  return (
    <Panel title="Brand assets" subtitle="Logos, guidelines and creative for your activations. Private to you and Tangy."
      actions={<Button size="sm" variant="primary" icon="Upload" onClick={() => inputRef.current?.click()}>Upload</Button>}>
      <input ref={inputRef} type="file" className="hidden" accept="image/*,application/pdf,.ai,.eps,.svg,.zip"
        onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) setPending({ file, title: file.name.replace(/\.[^.]+$/, ''), kind: 'logo', eventId: '' }); }} />
      {msg && <p role="status" className="text-[12.5px] text-[#f5b544] mb-2">{msg}</p>}
      {error ? <ErrorState error={error} onRetry={reload} /> : rows === null ? <Skeleton rows={3} /> : rows.length === 0 ? (
        <EmptyState icon="Image" title="No assets yet" hint="Upload your logo and brand guidelines so Tangy can prepare your placements." />
      ) : (
        <ul className="divide-y divide-[#E7D5A4]/[0.06] font-sans" data-sponsor-assets>
          {rows.map((a) => {
            const [label, tone] = ASSET_STATUS[a.status] || [a.status, 'muted'];
            return (
              <li key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <button type="button" className="text-[14px] text-[#EFE2C0] hover:underline text-left" onClick={() => openPrivateFile('sponsor-assets', a.storage_path).catch((err) => setMsg(err.message))}>{a.title}</button>
                  <div className="text-[12px] text-[#E7D5A4]/50">{[Object.fromEntries(ASSET_KIND)[a.kind], a.events?.name, formatBytes(a.file_size_bytes), fmt.date(a.created_at)].filter(Boolean).join(' · ')}</div>
                  {a.review_note && <p className="text-[12.5px] text-[#f5b544] mt-0.5">Tangy: {a.review_note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={tone}>{label}</Badge>
                  {['submitted', 'changes_requested'].includes(a.status) && <Button size="sm" variant="ghost" icon="Trash2" aria-label={`Delete ${a.title}`} onClick={() => remove(a)} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {pending && (
        <Modal title="Upload brand asset" onClose={() => progress === null && setPending(null)}
          footer={<><Button variant="ghost" disabled={progress !== null} onClick={() => setPending(null)}>Cancel</Button>
            <Button variant="primary" disabled={progress !== null} onClick={upload}>{progress !== null ? `Uploading ${progress}%` : 'Upload'}</Button></>}>
          <p className="text-[13px] text-[#E7D5A4]/70 mb-3">{pending.file.name} · {formatBytes(pending.file.size)}</p>
          <div className="flex flex-col gap-3">
            <Field label="Title"><Input maxLength={200} value={pending.title} onChange={(e) => setPending({ ...pending, title: e.target.value })} /></Field>
            <Field label="Type"><Select value={pending.kind} onChange={(e) => setPending({ ...pending, kind: e.target.value })}>{ASSET_KIND.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
            <Field label="For event">
              <Select value={pending.eventId} onChange={(e) => setPending({ ...pending, eventId: e.target.value })}>
                <option value="">All my sponsored events</option>
                {uniqueEvents.map((e) => <option key={e.event_id} value={e.event_id}>{e.name} · {fmt.date(e.event_date)}</option>)}
              </Select>
            </Field>
          </div>
        </Modal>
      )}
    </Panel>
  );
};

// ---------------------------------------------------------------------------
// My tasks (volunteers) — tasks on the caller's own event assignments.
// ---------------------------------------------------------------------------

const TASK_STATUS = [['pending', 'To do'], ['in_progress', 'In progress'], ['blocked', 'Blocked'], ['done', 'Done']];
const TASK_PRIORITY_TONE = { urgent: 'bad', high: 'warn' };

export const MyTasksPanel = ({ userId }) => {
  const { rows, error, reload } = useRows(async () => must(await supabase.from('event_tasks')
    .select('id, title, description, status, priority, due_at, team, events(name, event_date), event_assignments!inner(assignee_id)')
    .eq('event_assignments.assignee_id', userId)
    .order('status').order('due_at', { ascending: true, nullsFirst: false })) || [], [userId]);
  const [msg, setMsg] = useState('');
  const setStatus = async (t, status) => {
    setMsg('');
    const { error: err } = await supabase.from('event_tasks').update({ status }).eq('id', t.id);
    if (err) setMsg(friendlyError(err).message); else reload();
  };
  const now = Date.now();
  return (
    <Panel title="My tasks" subtitle={rows ? `${rows.filter((t) => t.status !== 'done').length} open` : undefined}>
      {msg && <p role="alert" className="text-[12.5px] text-[#ef6b5e] mb-2">{msg}</p>}
      {error ? <ErrorState error={error} onRetry={reload} /> : rows === null ? <Skeleton rows={3} /> : rows.length === 0 ? (
        <EmptyState icon="ListChecks" title="No tasks" hint="Tasks the Tangy team assigns you for an event appear here." />
      ) : (
        <ul className="divide-y divide-[#E7D5A4]/[0.06] font-sans" data-my-tasks>
          {rows.map((t) => {
            const overdue = t.status !== 'done' && t.due_at && new Date(t.due_at).getTime() < now;
            return (
              <li key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className={cx('text-[14px] text-[#EFE2C0]', t.status === 'done' && 'line-through opacity-50')}>{t.title}</div>
                  <div className={cx('text-[12px]', overdue ? 'text-[#ef6b5e]' : 'text-[#E7D5A4]/50')}>
                    {[t.events?.name, t.team && `${t.team} team`, t.due_at && `${overdue ? 'overdue since' : 'due'} ${fmt.dateTime(t.due_at)}`].filter(Boolean).join(' · ')}
                  </div>
                  {t.description && <p className="text-[12.5px] text-[#E7D5A4]/60 mt-0.5">{t.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {TASK_PRIORITY_TONE[t.priority] && <Badge tone={TASK_PRIORITY_TONE[t.priority]}>{t.priority}</Badge>}
                  <select aria-label={`Status of ${t.title}`} value={t.status} onChange={(e) => setStatus(t, e.target.value)}
                    className="bg-[#11100C] border border-[#C99A2E]/25 rounded text-[12px] h-8 px-2 text-[#E7D5A4]">
                    {TASK_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
};
