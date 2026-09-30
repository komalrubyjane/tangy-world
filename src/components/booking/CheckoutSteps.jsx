import { useState, useEffect, useRef } from 'react';
import { COLLAB_INTERESTS, validPhone, validEmail } from '../../lib/bookingForm';

// Tangy Sessions checkout — replaces the old Google Form (0023/0024).
//
//   1 Your details  →  2 Who's coming  →  3 Requirements  →  4 Review & pay  →  5 Confirmed
//
// Required: booker name, mobile/WhatsApp, email, number of people, a name for
// every attendee. Everything else is optional or asked only when this event
// configures it (events.booking_questions). Each step validates before moving
// on and nothing typed is lost going back. The same rules run again in the
// razorpay-create-order Edge Function and in create_pending_booking() — this
// is only so the customer sees what to fix.

const STEPS = ['Your details', 'Attendees', 'Requirements', 'Review & pay', 'Confirmed'];
const validInstagram = (v) => !String(v || '').trim() || /^@?[A-Za-z0-9._]{1,30}$/.test(String(v).trim());
const blank = (v) => v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

// Mirror of booking_answers_error() (0024) for instant feedback.
function answerError(q, value, quantity) {
  if (blank(value)) return q.required ? 'Please answer this question.' : null;
  switch (q.type) {
    case 'number': {
      const max = Math.min(q.max ?? quantity, quantity);
      const min = q.min ?? 0;
      return Number.isInteger(value) && value >= min && value <= max ? null : `Enter a whole number from ${min} to ${max}.`;
    }
    case 'date': return /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= new Date().toISOString().slice(0, 10) && value >= '1900-01-01' ? null : 'Enter a valid date.';
    case 'text': return value.length <= 300 ? null : 'Keep this under 300 characters.';
    case 'long_text': return value.length <= 2000 ? null : 'Keep this under 2000 characters.';
    default: return null;
  }
}

const inputCls = (bad) => `w-full min-h-[44px] p-2.5 bg-[#ecdcaf] text-[#191410] font-mono text-xs border outline-none focus:ring-2 focus:ring-[#c2272a] ${bad ? 'border-2 border-[#c2272a]' : 'border-[#191410]'}`;
const labelCls = 'font-mono text-[10px] font-bold uppercase tracking-wider text-[#191410]';
const btnPrimary = 'w-full h-14 bg-[#181614] text-[#ecdcaf] hover:bg-[#B5532A] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all disabled:opacity-50';
const btnGhost = 'w-full h-11 border-2 border-[#191410] font-mono text-[10.5px] font-bold uppercase tracking-widest text-[#191410] bg-transparent';
const Err = ({ id, children }) => (children ? <p id={id} role="alert" className="font-mono text-[10px] font-bold text-[#c2272a] m-0">✕ {children}</p> : null);

function Field({ id, label, required, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelCls}>{label}{required && <span aria-hidden="true"> *</span>}{!required && <span className="font-normal normal-case tracking-normal text-[#191410]/60"> (optional)</span>}</label>
      {hint && <p id={`${id}-hint`} className="font-mono text-[9.5px] text-[#191410]/65 m-0">{hint}</p>}
      {children}
      <Err id={`${id}-error`}>{error}</Err>
    </div>
  );
}

function QuestionInput({ q, value, onChange, error, quantity }) {
  const id = `q-${q.id}`;
  const described = [q.help && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const common = { id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': described, 'aria-required': q.required || undefined };
  if (q.type === 'single_select' || q.type === 'multi_select' || q.type === 'boolean') {
    const multi = q.type === 'multi_select';
    const opts = q.type === 'boolean' ? [[true, 'Yes'], [false, 'No']] : q.options.map((o) => [o, o]);
    return (
      <fieldset className="flex flex-col gap-1.5 m-0 p-0 border-0" aria-describedby={described} data-question={q.id}>
        <legend className={labelCls}>{q.label}{q.required ? <span aria-hidden="true"> *</span> : <span className="font-normal normal-case tracking-normal text-[#191410]/60"> (optional)</span>}</legend>
        {q.help && <p id={`${id}-hint`} className="font-mono text-[9.5px] text-[#191410]/65 m-0">{q.help}</p>}
        <div className="flex flex-wrap gap-2">
          {opts.map(([v, label]) => {
            const on = multi ? (value || []).includes(v) : value === v;
            return (
              <label key={String(v)} className={`min-h-[44px] px-3 inline-flex items-center gap-2 border-2 font-mono text-[11px] cursor-pointer ${on ? 'bg-[#191410] text-[#ecdcaf] border-[#191410]' : 'bg-[#ecdcaf] text-[#191410] border-[#191410]/40'}`}>
                <input type={multi ? 'checkbox' : 'radio'} name={id} checked={on} className="accent-[#c2272a] w-4 h-4"
                  onChange={() => onChange(multi ? (on ? value.filter((x) => x !== v) : [...(value || []), v]) : v)} />
                {label}
              </label>
            );
          })}
          {!multi && !q.required && value != null && value !== '' && (
            <button type="button" onClick={() => onChange(null)} className="min-h-[44px] px-3 font-mono text-[10px] underline text-[#191410]/70">Clear</button>
          )}
        </div>
        <Err id={`${id}-error`}>{error}</Err>
      </fieldset>
    );
  }
  return (
    <Field id={id} label={q.label} required={q.required} hint={q.help} error={error}>
      {q.type === 'long_text' ? (
        <textarea {...common} rows={3} maxLength={2000} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls(error)} />
      ) : q.type === 'number' ? (
        <input {...common} type="number" inputMode="numeric" min={q.min ?? 0} max={Math.min(q.max ?? quantity, quantity)} step={1}
          value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} className={inputCls(error)} />
      ) : q.type === 'date' ? (
        <input {...common} type="date" max={new Date().toISOString().slice(0, 10)} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} className={inputCls(error)} />
      ) : (
        <input {...common} type="text" maxLength={300} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls(error)} />
      )}
    </Field>
  );
}

export function CheckoutProgress({ step }) {
  return (
    <ol aria-label="Checkout progress" className="grid grid-cols-5 gap-1 m-0 p-0 list-none" data-checkout-progress>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < step ? 'done' : n === step ? 'current' : 'todo';
        return (
          <li key={label} aria-current={state === 'current' ? 'step' : undefined} className="flex flex-col items-center gap-1 text-center">
            <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-mono text-[11px] font-bold border-2 ${state === 'current' ? 'bg-[#c2272a] text-[#ecdcaf] border-[#c2272a]' : state === 'done' ? 'bg-[#191410] text-[#ecdcaf] border-[#191410]' : 'border-[#191410]/40 text-[#191410]/60'}`}>
              {state === 'done' ? <span aria-hidden="true">✓</span> : n}
            </span>
            <span className={`font-mono text-[8.5px] uppercase leading-tight ${state === 'current' ? 'font-bold text-[#191410]' : 'text-[#191410]/60'}`}>{label}<span className="sr-only">{state === 'done' ? ' (done)' : ''}</span></span>
          </li>
        );
      })}
    </ol>
  );
}

// form = { fullName, phone, email, instagram, quantity, tierId, names[], answers{}, collabInterests[], collabNote, note }
// `quote` is the server's booking_quote() for the current ticket type and
// quantity; totals shown come from it (the client figure is only a
// placeholder while it loads). Checkout charges the server amount regardless.
export function CheckoutSteps({ event, tiers, form, setForm, step, setStep, pay, onPay, onRetry, quote, maxAvailable }) {
  const [errors, setErrors] = useState({});
  const topRef = useRef(null);
  const tier = tiers.find((t) => t.id === form.tierId) || tiers[0];
  const questions = event.bookingQuestions || [];
  const min = event.bookingMin ?? 1;
  const max = Math.max(min, Math.min(event.bookingMax ?? 10, maxAvailable ?? Infinity, tier.remaining ?? Infinity));
  const quoted = quote && quote.ticket_type === tier.id && quote.quantity === form.quantity ? quote : null;
  const taxPercent = quote?.tax_percent ?? 18;
  const subtotal = quoted ? quoted.subtotal : tier.price * form.quantity;
  const taxes = quoted ? quoted.tax : Math.round((subtotal * taxPercent) / 100);
  const total = quoted ? quoted.total : subtotal + taxes;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // One name field per person; typed names survive quantity changes.
  useEffect(() => {
    setForm((f) => (f.names.length === f.quantity ? f : { ...f, names: Array.from({ length: f.quantity }, (_, i) => f.names[i] ?? '') }));
  }, [form.quantity, setForm]);

  const focusFirstError = (errs) => {
    requestAnimationFrame(() => {
      const first = Object.keys(errs)[0];
      const el = first && document.getElementById(first.startsWith('q-') || first.startsWith('person-') || first.startsWith('c-') ? first : `c-${first}`);
      (el || topRef.current)?.focus?.();
    });
  };
  const go = (next) => { setErrors({}); setStep(next); requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })); };

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.fullName.trim()) e['c-name'] = 'Enter your full name.';
      else if (form.fullName.trim().length > 120) e['c-name'] = 'Keep your name under 120 characters.';
      if (!validPhone(form.phone)) e['c-phone'] = 'Enter a valid 10-digit mobile / WhatsApp number.';
      if (!validEmail(form.email)) e['c-email'] = 'Enter a valid email address.';
      if (!validInstagram(form.instagram)) e['c-instagram'] = 'Instagram handles use letters, numbers, . and _ (up to 30).';
    }
    if (s === 2) {
      form.names.forEach((n, i) => { if (!n.trim()) e[`person-${i + 1}`] = 'Enter this person’s full name.'; else if (n.trim().length > 120) e[`person-${i + 1}`] = 'Keep names under 120 characters.'; });
    }
    if (s === 3) {
      for (const q of questions) { const msg = answerError(q, form.answers[q.id], form.quantity); if (msg) e[`q-${q.id}`] = msg; }
      if (form.collabNote.length > 1000) e['c-collab-note'] = 'Keep this under 1000 characters.';
      if (form.note.length > 1000) e['c-note'] = 'Keep this under 1000 characters.';
    }
    setErrors(e);
    if (Object.keys(e).length) focusFirstError(e);
    return Object.keys(e).length === 0;
  };
  const next = (s) => { if (validate(s)) go(s + 1); };

  const stepTitle = { 1: 'Your details', 2: 'Who’s coming?', 3: 'Event requirements', 4: 'Review & pay' }[step];
  return (
    <div className="flex flex-col gap-4" data-checkout-step={step}>
      <CheckoutProgress step={step} />
      <h4 ref={topRef} tabIndex={-1} className="font-poster text-xl text-[#191410] m-0 outline-none scroll-mt-24">{stepTitle}</h4>

      {step === 1 && (
        <form noValidate onSubmit={(e) => { e.preventDefault(); next(1); }} className="flex flex-col gap-3">
          <Field id="c-name" label="Full name" required error={errors['c-name']}>
            <input id="c-name" autoComplete="name" maxLength={120} value={form.fullName} onChange={(e) => set({ fullName: e.target.value })}
              aria-invalid={errors['c-name'] ? 'true' : undefined} aria-describedby={errors['c-name'] ? 'c-name-error' : undefined} className={inputCls(errors['c-name'])} />
          </Field>
          <Field id="c-phone" label="Mobile / WhatsApp number" required hint="10-digit Indian number — we'll message event updates here." error={errors['c-phone']}>
            <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={16} value={form.phone} onChange={(e) => set({ phone: e.target.value })}
              aria-invalid={errors['c-phone'] ? 'true' : undefined} aria-describedby={['c-phone-hint', errors['c-phone'] && 'c-phone-error'].filter(Boolean).join(' ')} className={inputCls(errors['c-phone'])} />
          </Field>
          <Field id="c-email" label="Email" required hint="Your booking confirmation and QR are sent here." error={errors['c-email']}>
            <input id="c-email" type="email" autoComplete="email" maxLength={200} value={form.email} onChange={(e) => set({ email: e.target.value })}
              aria-invalid={errors['c-email'] ? 'true' : undefined} aria-describedby={['c-email-hint', errors['c-email'] && 'c-email-error'].filter(Boolean).join(' ')} className={inputCls(errors['c-email'])} />
          </Field>
          <Field id="c-instagram" label="Instagram" hint="Only visible to the Tangy team." error={errors['c-instagram']}>
            <input id="c-instagram" autoComplete="off" maxLength={31} placeholder="@yourhandle" value={form.instagram} onChange={(e) => set({ instagram: e.target.value })}
              aria-invalid={errors['c-instagram'] ? 'true' : undefined} aria-describedby={['c-instagram-hint', errors['c-instagram'] && 'c-instagram-error'].filter(Boolean).join(' ')} className={inputCls(errors['c-instagram'])} />
          </Field>
          <button type="submit" className={btnPrimary} data-step-action>Continue →</button>
        </form>
      )}

      {step === 2 && (
        <form noValidate onSubmit={(e) => { e.preventDefault(); next(2); }} className="flex flex-col gap-3">
          {tiers.length > 1 && (
            <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
              <legend className={labelCls}>Ticket</legend>
              {tiers.map((t) => (
                <label key={t.id} className={`p-3 border-2 cursor-pointer flex gap-3 items-start ${form.tierId === t.id ? 'bg-[#191410] text-[#ecdcaf] border-[#191410]' : 'bg-[#ecdcaf] text-[#191410] border-[#191410]/30'}`}>
                  <input type="radio" name="tier" checked={form.tierId === t.id} disabled={t.remaining === 0} onChange={() => set({ tierId: t.id })} className="mt-1 accent-[#c2272a] w-4 h-4" />
                  <span className="flex-1">
                    <span className="flex justify-between gap-2"><span className="font-poster text-base">{t.name}</span><span className="font-poster text-lg text-[#d1a437]">₹{t.price.toLocaleString()}</span></span>
                    {t.desc && <span className="block font-mono text-[10px] mt-1 opacity-80">{t.desc}</span>}
                    {t.remaining != null && t.remaining <= 10 && <span className="block font-mono text-[10px] mt-1 font-bold">{t.remaining === 0 ? 'Sold out' : `${t.remaining} left`}</span>}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <div className="flex items-center justify-between gap-3 bg-[#181614] text-[#ecdcaf] p-3 border border-[#191410]">
            <span id="people-label" className="font-mono text-xs font-bold">Number of people</span>
            <div role="group" aria-labelledby="people-label" className="flex items-center gap-3">
              <button type="button" aria-label="Fewer people" disabled={form.quantity <= min} onClick={() => set({ quantity: Math.max(min, form.quantity - 1) })}
                className="w-[44px] h-[44px] bg-[#c2272a] text-[#ecdcaf] font-bold text-lg flex items-center justify-center border border-[#ecdcaf] disabled:opacity-40">−</button>
              <output aria-live="polite" data-ticket-quantity className="font-poster text-xl text-[#d1a437] min-w-[1.5rem] text-center">{form.quantity}</output>
              <button type="button" aria-label="More people" disabled={form.quantity >= max} onClick={() => set({ quantity: Math.min(max, form.quantity + 1) })}
                className="w-[44px] h-[44px] bg-[#c2272a] text-[#ecdcaf] font-bold text-lg flex items-center justify-center border border-[#ecdcaf] disabled:opacity-40">+</button>
            </div>
          </div>
          <p className="font-mono text-[10.5px] text-[#191410] m-0" data-price-line>
            ₹{tier.price.toLocaleString()} / person · Subtotal <strong>₹{subtotal.toLocaleString()}</strong>
            {max > min && <span className="text-[#191410]/60"> · {min}–{max} per booking</span>}
          </p>
          <fieldset className="flex flex-col gap-3 m-0 p-0 border-0" data-attendee-names>
            <legend className={labelCls}>Attendee details</legend>
            <p className="font-mono text-[9.5px] text-[#191410]/70 m-0">
              {form.quantity === 1 ? 'Who is attending?' : 'Enter the name of everyone attending this booking.'} Staff check each person in by name at the entrance, and one QR covers the whole booking.
            </p>
            {form.names.map((n, i) => (
              <Field key={i} id={`person-${i + 1}`} label={`Person ${i + 1} — full name`} required error={errors[`person-${i + 1}`]}>
                <input id={`person-${i + 1}`} autoComplete={i === 0 ? 'name' : 'off'} maxLength={120} value={n}
                  onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, names: f.names.map((x, j) => (j === i ? v : x)) })); }}
                  aria-invalid={errors[`person-${i + 1}`] ? 'true' : undefined} aria-describedby={errors[`person-${i + 1}`] ? `person-${i + 1}-error` : undefined}
                  className={inputCls(errors[`person-${i + 1}`])} />
              </Field>
            ))}
            {form.quantity > 1 && form.names[0] === '' && form.fullName && (
              <button type="button" className="self-start min-h-[44px] font-mono text-[10px] underline text-[#191410]/80" onClick={() => setForm((f) => ({ ...f, names: [f.fullName, ...f.names.slice(1)] }))}>
                I'm attending — use my name for Person 1
              </button>
            )}
          </fieldset>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={btnGhost} onClick={() => go(1)}>← Back</button>
            <button type="submit" className={`${btnPrimary} h-11`} data-step-action>Continue →</button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form noValidate onSubmit={(e) => { e.preventDefault(); next(3); }} className="flex flex-col gap-4">
          {questions.length === 0
            ? <p className="font-mono text-[10.5px] text-[#191410]/70 m-0" data-no-questions>This session has no extra questions.</p>
            : questions.map((q) => (
              <QuestionInput key={q.id} q={q} quantity={form.quantity} value={form.answers[q.id]} error={errors[`q-${q.id}`]}
                onChange={(v) => setForm((f) => ({ ...f, answers: { ...f.answers, [q.id]: v } }))} />
            ))}
          <details className="border-2 border-[#191410]/30 p-3" open={form.collabInterests.length > 0 || form.collabNote !== '' || undefined}>
            <summary className="font-mono text-[10.5px] font-bold uppercase tracking-wider cursor-pointer min-h-[32px] flex items-center">Interested in collaborating with Tangy? (optional)</summary>
            <fieldset className="flex flex-wrap gap-2 mt-3 m-0 p-0 border-0">
              <legend className="sr-only">Collaboration interests</legend>
              {COLLAB_INTERESTS.map(([v, label]) => {
                const on = form.collabInterests.includes(v);
                return (
                  <label key={v} className={`min-h-[44px] px-3 inline-flex items-center gap-2 border-2 font-mono text-[11px] cursor-pointer ${on ? 'bg-[#191410] text-[#ecdcaf] border-[#191410]' : 'bg-[#ecdcaf] text-[#191410] border-[#191410]/40'}`}>
                    <input type="checkbox" checked={on} className="accent-[#c2272a] w-4 h-4"
                      onChange={() => set({ collabInterests: on ? form.collabInterests.filter((x) => x !== v) : [...form.collabInterests, v] })} />
                    {label}
                  </label>
                );
              })}
            </fieldset>
            <div className="mt-3">
              <Field id="c-collab-note" label="Tell us more" error={errors['c-collab-note']}>
                <textarea id="c-collab-note" rows={2} maxLength={1000} value={form.collabNote} onChange={(e) => set({ collabNote: e.target.value })} className={inputCls(errors['c-collab-note'])} />
              </Field>
            </div>
            <p className="font-mono text-[9px] text-[#191410]/60 mt-2 mb-0">The Tangy team will reach out — this doesn't sign you up for anything.</p>
          </details>
          <Field id="c-note" label="Anything else you'd like to share?" error={errors['c-note']}>
            <textarea id="c-note" rows={2} maxLength={1000} value={form.note} onChange={(e) => set({ note: e.target.value })} className={inputCls(errors['c-note'])} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={btnGhost} onClick={() => go(2)}>← Back</button>
            <button type="submit" className={`${btnPrimary} h-11`} data-step-action>Review →</button>
          </div>
        </form>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-3" data-order-summary>
          <div className="bg-[#181614] text-[#ecdcaf] p-4 border border-[#191410] flex flex-col gap-2 font-mono text-xs">
            <div className="font-poster text-lg leading-tight">{event.title}</div>
            <div className="text-[#ecdcaf]/70 text-[10.5px]">{[event.date, event.time, event.venue].filter(Boolean).join(' · ')}</div>
            <div className="flex justify-between pt-2 border-t border-[#ecdcaf]/20"><span>{tier.name}</span><span>₹{tier.price.toLocaleString()} × {form.quantity}</span></div>
            <div>
              <div className="text-[#d1a437] text-[10px] uppercase tracking-wider mb-1">Attendees</div>
              <ol className="m-0 pl-5 flex flex-col gap-0.5" aria-label="Attendees">{form.names.map((n, i) => <li key={i}>{n.trim()}</li>)}</ol>
            </div>
            <div className="flex justify-between text-[#ecdcaf]/80 pt-2 border-t border-[#ecdcaf]/20"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-[#ecdcaf]/80"><span>GST ({taxPercent}%)</span><span>₹{taxes.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-sm text-[#d1a437] pt-2 border-t border-[#ecdcaf]/20" data-order-total><span>TOTAL</span><span>₹{total.toLocaleString()}</span></div>
          </div>
          <dl className="font-mono text-[10.5px] text-[#191410] m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="font-bold">Booked by</dt><dd className="m-0 break-words">{form.fullName} · {form.phone} · {form.email}{form.instagram.trim() ? ` · @${form.instagram.trim().replace(/^@/, '')}` : ''}</dd>
            {questions.filter((q) => !blank(form.answers[q.id])).map((q) => (
              <div key={q.id} className="contents"><dt className="font-bold">{q.label}</dt><dd className="m-0 break-words">{Array.isArray(form.answers[q.id]) ? form.answers[q.id].join(', ') : q.type === 'boolean' ? (form.answers[q.id] ? 'Yes' : 'No') : String(form.answers[q.id])}</dd></div>
            ))}
            {form.collabInterests.length > 0 && <><dt className="font-bold">Collaboration</dt><dd className="m-0">{form.collabInterests.map((v) => COLLAB_INTERESTS.find(([k]) => k === v)?.[1]).join(', ')}</dd></>}
          </dl>
          {pay.status === 'failed' && (
            <div role="alert" className="p-3 bg-[#B5532A] text-[#ecdcaf] font-mono text-[10.5px] border-2 border-[#191410] flex flex-col gap-2" data-payment-failed>
              <span className="font-bold text-xs">Payment unsuccessful</span>
              <span>{pay.message}{pay.review ? '' : ' No booking has been confirmed and no money has been taken for a failed attempt.'}</span>
              <button type="button" onClick={onRetry} className="h-11 bg-[#ecdcaf] text-[#191410] font-bold uppercase tracking-widest border-2 border-[#191410]">Try again</button>
            </div>
          )}
          {pay.status === 'dismissed' && <p role="status" className="font-mono text-[10.5px] text-[#191410] m-0">Payment window closed — nothing was charged. You can try again when you're ready.</p>}
          <div className="p-2 bg-[#C89D35]/20 text-[#191410] font-mono text-[9px] border border-[#d1a437]/50">
            🔒 Secure payment via Razorpay — your card/UPI details never touch Tangy's servers, and payment is verified before your booking is confirmed.
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <button type="button" className={btnGhost} onClick={() => go(3)} disabled={pay.status === 'processing'}>← Edit</button>
            <button type="button" className={`${btnPrimary} h-11`} onClick={onPay} disabled={pay.status === 'processing'} data-step-action>
              {pay.status === 'processing' ? 'Processing…' : `Proceed to payment · ₹${total.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
