import { useState, useEffect } from 'react';
import { list, insert, update, orIlike } from '../api';
import { useServerTable, useDebounced } from '../hooks';
import {
  Page, Panel, Toolbar, SearchInput, FilterSelect, DataTable, Pagination, Badge, Button, Modal, Field, Input, Select, Textarea, fmt, useToast,
} from '../ui';
import { EventFilter, useEventOptions } from '../components/Bookings';

// Partner invoices (artists, sponsors, vendors, venue hosts). Drafts are
// internal; partners see issued/paid/void in their portal. OVERDUE is derived
// from the due date (invoice_state in 0020) — never stored. Access:
// payments.view + bookings.manage, enforced by RLS.

const STATE = { draft: ['Draft', 'muted'], issued: ['Issued', 'info'], overdue: ['Overdue', 'bad'], paid: ['Paid', 'good'], void: ['Void', 'muted'] };
const today = () => new Date().toISOString().slice(0, 10);
const stateOf = (i) => (i.status === 'issued' && i.due_date && i.due_date < today() ? 'overdue' : i.status);
const PARTNER_ROLES = ['artist', 'sponsor', 'vendor', 'venue'];

export default function InvoicesPage() {
  const toast = useToast();
  const events = useEventOptions();
  const [event, setEvent] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const q = useDebounced(search);
  const table = useServerTable({
    table: 'partner_invoices',
    select: 'id, invoice_number, amount, currency, direction, issued_date, due_date, status, paid_date, notes, event_id, partner_id, events(name, event_date), profiles:partner_id(full_name, email, role)',
    deps: [event, status, q],
    build: (x) => {
      let y = x.order('created_at', { ascending: false });
      if (event) y = y.eq('event_id', event);
      if (status === 'overdue') y = y.eq('status', 'issued').lt('due_date', today());
      else if (status) y = y.eq('status', status);
      return orIlike(y, ['invoice_number'], q);
    },
  });

  const setState = async (i, next) => {
    try {
      await update('partner_invoices', i.id, next === 'paid' ? { status: 'paid', paid_date: today() } : { status: next, paid_date: null, issued_date: i.issued_date || (next === 'issued' ? today() : null) });
      table.reload();
    } catch (err) { toast(err.message, 'bad'); }
  };

  const columns = [
    { key: 'no', header: 'Invoice', render: (i) => <div><div className="text-[#EFE2C0]">{i.invoice_number}</div><div className="text-[11.5px] text-[#E7D5A4]/45">{i.direction === 'payable' ? 'Tangy pays partner' : 'Partner pays Tangy'}</div></div> },
    { key: 'partner', header: 'Partner', render: (i) => <span className="text-[12.5px]">{i.profiles?.full_name || i.profiles?.email} <span className="text-[#E7D5A4]/40">· {i.profiles?.role}</span></span> },
    { key: 'event', header: 'Event', mobileHidden: true, render: (i) => <span className="text-[12.5px]">{i.events?.name || '—'}</span> },
    { key: 'amount', header: 'Amount', render: (i) => <span className="font-mono text-[12.5px]">{i.currency} {fmt.num(i.amount)}</span> },
    { key: 'due', header: 'Due', mobileHidden: true, render: (i) => <span className="font-mono text-[12px]">{i.due_date ? fmt.date(i.due_date) : '—'}</span> },
    { key: 'state', header: 'Status', render: (i) => { const [l, t] = STATE[stateOf(i)] || [i.status, 'muted']; return <Badge tone={t}>{l}</Badge>; } },
    { key: 'actions', header: '', render: (i) => (
      <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
        {i.status === 'draft' && <Button size="sm" onClick={() => setState(i, 'issued')}>Issue</Button>}
        {i.status === 'issued' && <Button size="sm" variant="success" onClick={() => setState(i, 'paid')}>Mark paid</Button>}
        {['draft', 'issued'].includes(i.status) && <Button size="sm" variant="ghost" onClick={() => setState(i, 'void')}>Void</Button>}
      </div>
    ) },
  ];

  return (
    <Page title="Partner invoices" subtitle="Fees owed to artists and vendors, and sponsorship invoices. Payment itself happens outside the portal — record it here."
      actions={<Button variant="primary" icon="Plus" onClick={() => setEditing({})}>New invoice</Button>}>
      <Panel flush>
        <div className="p-3 border-b border-[#C99A2E]/15">
          <Toolbar right={<span className="font-mono text-[11px] text-[#E7D5A4]/45">{fmt.num(table.count)} invoice{table.count === 1 ? '' : 's'}</span>}>
            <SearchInput value={search} onChange={setSearch} placeholder="Invoice number…" />
            <EventFilter value={event} onChange={setEvent} events={events} />
            <FilterSelect label="Status" value={status} onChange={setStatus}
              options={[{ value: '', label: 'Any status' }, ...Object.entries(STATE).map(([value, [label]]) => ({ value, label }))]} />
          </Toolbar>
        </div>
        <DataTable columns={columns} rows={table.rows} loading={table.loading} error={table.error} onRetry={table.reload} onRowClick={(i) => setEditing(i)}
          empty={{ title: 'No invoices', hint: 'Create an invoice for a partner fee or a sponsorship.', icon: 'Receipt' }} />
        <Pagination {...table} />
      </Panel>
      {editing && <InvoiceForm invoice={editing} events={events} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); table.reload(); toast('Invoice saved', 'good'); }} />}
    </Page>
  );
}

const InvoiceForm = ({ invoice, events, onClose, onSaved }) => {
  const isNew = !invoice.id;
  const [f, setF] = useState({
    partner_id: invoice.partner_id || '', event_id: invoice.event_id || '', direction: invoice.direction || 'payable',
    invoice_number: invoice.invoice_number || '', amount: invoice.amount ?? '', currency: invoice.currency || 'INR',
    issued_date: invoice.issued_date || '', due_date: invoice.due_date || '', notes: invoice.notes || '',
  });
  const [partners, setPartners] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    list('profiles', { select: 'id, full_name, email, role', to: 499, build: (x) => x.in('role', PARTNER_ROLES).eq('is_active', true).order('full_name') })
      .then((r) => setPartners(r.rows), () => setPartners([]));
  }, []);
  const save = async () => {
    setBusy(true); setError('');
    const values = { ...f, amount: Number(f.amount), event_id: f.event_id || null, issued_date: f.issued_date || null, due_date: f.due_date || null, notes: f.notes.trim() || null, invoice_number: f.invoice_number.trim() };
    try {
      if (isNew) await insert('partner_invoices', values); else await update('partner_invoices', invoice.id, values);
      onSaved();
    } catch (err) { setError(err.message); setBusy(false); }
  };
  const valid = f.partner_id && f.invoice_number.trim() && f.amount !== '' && Number(f.amount) >= 0;
  return (
    <Modal title={isNew ? 'New invoice' : `Invoice ${invoice.invoice_number}`} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={busy || !valid} onClick={save}>{busy ? 'Saving…' : 'Save'}</Button></>}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Partner *" className="sm:col-span-2">
          <Select value={f.partner_id} onChange={(e) => setF({ ...f, partner_id: e.target.value })} disabled={!isNew}>
            <option value="">Choose a partner…</option>
            {partners.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email} · {p.role}</option>)}
          </Select>
        </Field>
        <Field label="Event">
          <Select value={f.event_id} onChange={(e) => setF({ ...f, event_id: e.target.value })}>
            <option value="">No specific event</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name} · {fmt.date(e.event_date)}</option>)}
          </Select>
        </Field>
        <Field label="Direction">
          <Select value={f.direction} onChange={(e) => setF({ ...f, direction: e.target.value })}>
            <option value="payable">Tangy pays partner (fee)</option>
            <option value="receivable">Partner pays Tangy (sponsorship)</option>
          </Select>
        </Field>
        <Field label="Invoice number *"><Input maxLength={60} value={f.invoice_number} onChange={(e) => setF({ ...f, invoice_number: e.target.value })} /></Field>
        <Field label="Amount *">
          <div className="flex gap-2">
            <Input className="w-20!" maxLength={3} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase() })} aria-label="Currency" />
            <Input type="number" min={0} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} aria-label="Amount" />
          </div>
        </Field>
        <Field label="Issued"><Input type="date" value={f.issued_date} onChange={(e) => setF({ ...f, issued_date: e.target.value })} /></Field>
        <Field label="Due"><Input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} /></Field>
        <Field label="Notes (visible to the partner)" className="sm:col-span-2"><Textarea rows={2} maxLength={2000} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
      {error && <p role="alert" className="text-[12.5px] text-[#ef6b5e] mt-2">{error}</p>}
      {isNew && <p className="text-[11.5px] text-[#E7D5A4]/45 mt-2">New invoices start as drafts — partners see them once issued.</p>}
    </Modal>
  );
};
