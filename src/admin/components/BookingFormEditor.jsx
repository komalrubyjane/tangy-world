import { useState, useEffect } from 'react';
import { update } from '../api';
import { Panel, Button, Field, Input, Select, Badge, Icon, useToast } from '../ui';
import { QUESTION_PRESETS, QUESTION_TYPES } from '../../lib/bookingForm';

// Per-event booking form (0024): tickets per booking and the optional
// questions this event asks at checkout. Required checkout (booker name,
// mobile, email, attendee names) is fixed and not configured here.
// events.booking_questions is validated by the database
// (valid_booking_questions) — this editor only builds a sensible list.

const TYPE_LABEL = Object.fromEntries(QUESTION_TYPES);
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^(\d)/, 'q_$1').slice(0, 40) || 'question';

export const BookingFormEditor = ({ evt, onSaved }) => {
  const toast = useToast();
  const [min, setMin] = useState(evt.booking_min_quantity ?? 1);
  const [max, setMax] = useState(evt.booking_max_quantity ?? 10);
  const [questions, setQuestions] = useState(evt.booking_questions || []);
  const [custom, setCustom] = useState({ label: '', type: 'text', options: '', required: false });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setMin(evt.booking_min_quantity ?? 1); setMax(evt.booking_max_quantity ?? 10); setQuestions(evt.booking_questions || []);
  }, [evt.id, evt.booking_min_quantity, evt.booking_max_quantity, evt.booking_questions]);

  const ids = new Set(questions.map((q) => q.id));
  const patch = (i, p) => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...p } : q)));
  const move = (i, d) => setQuestions((qs) => { const n = [...qs]; const [q] = n.splice(i, 1); n.splice(i + d, 0, q); return n; });
  const addCustom = () => {
    let id = slug(custom.label);
    for (let k = 2; ids.has(id); k++) id = `${slug(custom.label).slice(0, 36)}_${k}`;
    const q = { id, type: custom.type, label: custom.label.trim(), required: custom.required };
    if (['single_select', 'multi_select'].includes(custom.type)) q.options = custom.options.split(',').map((o) => o.trim()).filter(Boolean);
    setQuestions((qs) => [...qs, q]);
    setCustom({ label: '', type: 'text', options: '', required: false });
  };
  const save = async () => {
    setBusy(true);
    try {
      await update('events', evt.id, { booking_min_quantity: Number(min), booking_max_quantity: Number(max), booking_questions: questions });
      toast('Booking form saved');
      onSaved?.();
    } catch (err) { toast(err.message, 'bad'); }
    setBusy(false);
  };
  const customValid = custom.label.trim() && (!['single_select', 'multi_select'].includes(custom.type) || custom.options.split(',').some((o) => o.trim()));

  return (
    <Panel title="Booking form" subtitle="Checkout always asks for the booker's name, mobile, email and every attendee's name. Add questions only when this event needs them." data-booking-form-editor>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <Field label="Min tickets per booking"><Input type="number" min={1} max={50} value={min} onChange={(e) => setMin(e.target.value)} /></Field>
          <Field label="Max tickets per booking"><Input type="number" min={1} max={50} value={max} onChange={(e) => setMax(e.target.value)} /></Field>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#C99A2E]">Questions ({questions.length})</div>
          {questions.length === 0 && <p className="text-[12.5px] text-[#E7D5A4]/55">No extra questions — checkout is just details, attendees and payment.</p>}
          <ul className="flex flex-col gap-2">
            {questions.map((q, i) => (
              <li key={q.id} className="rounded border border-[#C99A2E]/20 p-3 flex flex-col gap-2" data-question-row={q.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">{TYPE_LABEL[q.type] || q.type}</Badge>
                  <span className="font-mono text-[11px] text-[#E7D5A4]/45">{q.id}</span>
                  <label className="ml-auto flex items-center gap-1.5 text-[12.5px]">
                    <input type="checkbox" checked={!!q.required} onChange={(e) => patch(i, { required: e.target.checked })} className="accent-[#C99A2E]" aria-label={`Required: ${q.label}`} />Required
                  </label>
                  <Button size="sm" variant="ghost" icon="ArrowUp" aria-label={`Move up: ${q.label}`} disabled={i === 0} onClick={() => move(i, -1)} />
                  <Button size="sm" variant="ghost" icon="ArrowDown" aria-label={`Move down: ${q.label}`} disabled={i === questions.length - 1} onClick={() => move(i, 1)} />
                  <Button size="sm" variant="ghost" icon="Trash2" aria-label={`Remove: ${q.label}`} onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))} />
                </div>
                <Input aria-label={`Question text for ${q.id}`} maxLength={200} value={q.label} onChange={(e) => patch(i, { label: e.target.value })} />
                {q.options && <Input aria-label={`Options for ${q.id} (comma separated)`} value={q.options.join(', ')} onChange={(e) => patch(i, { options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean) })} />}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#C99A2E]">Add</div>
          <div className="flex flex-wrap gap-2">
            {QUESTION_PRESETS.map((p) => (
              <Button key={p.key} size="sm" icon="Plus" disabled={ids.has(p.question.id)} onClick={() => setQuestions((qs) => [...qs, { ...p.question }])}>{p.label}</Button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto_auto] gap-2 items-end">
            <Field label="Custom question"><Input maxLength={200} value={custom.label} onChange={(e) => setCustom({ ...custom, label: e.target.value })} placeholder="e.g. What should we play at the jam session?" /></Field>
            <Field label="Type"><Select aria-label="Custom question type" value={custom.type} onChange={(e) => setCustom({ ...custom, type: e.target.value })}>{QUESTION_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
            <label className="flex items-center gap-1.5 text-[12.5px] h-9"><input type="checkbox" checked={custom.required} onChange={(e) => setCustom({ ...custom, required: e.target.checked })} className="accent-[#C99A2E]" />Required</label>
            <Button icon="Plus" disabled={!customValid} onClick={addCustom}>Add question</Button>
          </div>
          {['single_select', 'multi_select'].includes(custom.type) && (
            <Field label="Options (comma separated)"><Input value={custom.options} onChange={(e) => setCustom({ ...custom, options: e.target.value })} /></Field>
          )}
          <p className="text-[11.5px] text-[#E7D5A4]/45 flex items-center gap-1.5"><Icon name="ShieldCheck" size={13} />Ask for date of birth or gender only when this event really needs it — answers are visible to the Tangy team only.</p>
        </div>

        <div><Button variant="primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save booking form'}</Button></div>
      </div>
    </Panel>
  );
};
