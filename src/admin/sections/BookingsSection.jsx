import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { isMockAuth } from '../../config/auth';
import { bookingService } from '../../services/bookingService';
import { eventService } from '../../services/eventService';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, NotConfiguredState, ActionButton, DataTable } from '../AdminUI';

const PAGE_SIZE = 25;

const MockBookings = () => {
  const [bookings, setBookings] = useState(() => bookingService.getAll());
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [checkinFilter, setCheckinFilter] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [detail, setDetail] = useState(null);

  const events = eventService.getAll();
  const refresh = () => setBookings([...bookingService.getAll()]);

  const filtered = useMemo(() => {
    let list = bookings;
    if (eventFilter) list = list.filter((b) => b.eventId === eventFilter);
    if (paymentFilter) list = list.filter((b) => b.paymentStatus === paymentFilter);
    if (checkinFilter) list = list.filter((b) => (checkinFilter === 'checked-in' ? b.checkedIn : !b.checkedIn));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) => b.registrationCode.toLowerCase().includes(q) || b.attendeeName.toLowerCase().includes(q) || b.attendeeEmail.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [bookings, eventFilter, paymentFilter, checkinFilter, search]);

  const rows = filtered.slice(0, visible).map((b) => ({ ...b, event: events.find((e) => e.id === b.eventId) }));

  const updateStatus = (id, status) => { bookingService.updateStatus(id, status); refresh(); };
  const doCheckIn = (id) => { bookingService.checkIn(id); refresh(); };
  const doUndoCheckIn = (id) => { bookingService.undoCheckIn(id); refresh(); };

  const columns = [
    { key: 'code', header: 'CODE', render: (b) => <span className="font-bold text-[#C99A2E]">{b.registrationCode}</span> },
    { key: 'attendee', header: 'ATTENDEE', render: (b) => <>{b.attendeeName}<br /><span className="opacity-60">{b.attendeeEmail}</span></> },
    { key: 'event', header: 'EVENT', render: (b) => b.event?.name || '—' },
    { key: 'type', header: 'TICKET', render: (b) => b.ticketType },
    { key: 'amount', header: 'AMOUNT', render: (b) => <span className="font-bold">₹{b.amount}</span> },
    { key: 'payment', header: 'PAYMENT', render: (b) => <StatusBadge status={b.paymentStatus} /> },
    { key: 'status', header: 'STATUS', render: (b) => <StatusBadge status={b.status} /> },
    { key: 'checkin', header: 'CHECK-IN', render: (b) => <StatusBadge status={b.checkedIn ? 'checked-in' : 'pending'} /> },
    {
      key: 'actions', header: 'ACTIONS', render: (b) => (
        <div className="flex gap-1.5 flex-wrap">
          <ActionButton onClick={() => setDetail(b)}>VIEW</ActionButton>
          {!b.checkedIn ? <ActionButton tone="success" onClick={() => doCheckIn(b.id)}>CHECK-IN</ActionButton> : <ActionButton onClick={() => doUndoCheckIn(b.id)}>UNDO CHECK-IN</ActionButton>}
          {b.status !== 'cancelled' && <ActionButton onClick={() => updateStatus(b.id, 'cancelled')}>CANCEL</ActionButton>}
          {b.paymentStatus !== 'refunded' && <ActionButton tone="danger" onClick={() => updateStatus(b.id, 'refunded')}>REFUND</ActionButton>}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-4 sm:p-6 rounded-sm">
      <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">BOOKINGS &amp; TICKETS</h3>
      <SearchBar value={search} onChange={(v) => { setSearch(v); setVisible(PAGE_SIZE); }} placeholder="Search code, name, email..." count={filtered.length} />
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="bg-[#11100C] border border-[#C99A2E]/60 px-2 py-2 text-[10px] text-[#E7D5A4]">
          <option value="">ALL EVENTS</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="bg-[#11100C] border border-[#C99A2E]/60 px-2 py-2 text-[10px] text-[#E7D5A4]">
          <option value="">ALL PAYMENT STATUS</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={checkinFilter} onChange={(e) => setCheckinFilter(e.target.value)} className="bg-[#11100C] border border-[#C99A2E]/60 px-2 py-2 text-[10px] text-[#E7D5A4]">
          <option value="">ALL CHECK-IN STATUS</option>
          <option value="checked-in">Checked In</option>
          <option value="not-checked-in">Not Checked In</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState>NO BOOKINGS MATCH THIS FILTER.</EmptyState>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          renderCard={(b) => (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-[#C99A2E] text-sm">{b.registrationCode}</div>
                  <div className="text-xs mt-0.5">{b.attendeeName}</div>
                  <div className="text-[10px] opacity-60">{b.attendeeEmail}</div>
                </div>
                <span className="font-bold text-sm">₹{b.amount}</span>
              </div>
              <div className="text-[10px] opacity-70">{b.event?.name || '—'} · {b.ticketType}</div>
              <div className="flex gap-1.5 flex-wrap">
                <StatusBadge status={b.paymentStatus} />
                <StatusBadge status={b.status} />
                <StatusBadge status={b.checkedIn ? 'checked-in' : 'pending'} />
              </div>
              <div className="flex gap-1.5 flex-wrap pt-1">
                <ActionButton onClick={() => setDetail(b)}>VIEW</ActionButton>
                {!b.checkedIn ? <ActionButton tone="success" onClick={() => doCheckIn(b.id)}>CHECK-IN</ActionButton> : <ActionButton onClick={() => doUndoCheckIn(b.id)}>UNDO</ActionButton>}
                {b.paymentStatus !== 'refunded' && <ActionButton tone="danger" onClick={() => updateStatus(b.id, 'refunded')}>REFUND</ActionButton>}
              </div>
            </div>
          )}
        />
      )}
      <LoadMoreButton hasMore={filtered.length > visible} onClick={() => setVisible((v) => v + PAGE_SIZE)} />

      {detail && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80" onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-[#191410] border-2 border-[#C99A2E] p-6 flex flex-col gap-3 text-[#E7D5A4] rounded-t-lg sm:rounded-sm">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-[#C99A2E]">{detail.registrationCode}</h3>
              <button onClick={() => setDetail(null)} className="text-xl leading-none opacity-70 hover:opacity-100">✕</button>
            </div>
            <div className="text-xs flex flex-col gap-1.5">
              <div><span className="opacity-60">Attendee:</span> {detail.attendeeName} ({detail.attendeeEmail})</div>
              <div><span className="opacity-60">Event:</span> {detail.event?.name}</div>
              <div><span className="opacity-60">Ticket type:</span> {detail.ticketType} × {detail.quantity}</div>
              <div><span className="opacity-60">Amount:</span> ₹{detail.amount}</div>
              <div><span className="opacity-60">Created:</span> {new Date(detail.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex gap-2 flex-wrap pt-2">
              <StatusBadge status={detail.paymentStatus} />
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.checkedIn ? 'checked-in' : 'pending'} />
            </div>
            <button
              onClick={() => alert('Mock ticket download — no real PDF/file is generated in development mode.')}
              className="mt-2 py-2.5 border border-[#C99A2E]/40 text-[#C99A2E] text-[10px] font-bold uppercase hover:bg-[#C99A2E]/10"
            >
              DOWNLOAD TICKET (MOCK)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const BookingsSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('bookings', {
    select: '*, events(name)',
    searchFields: ['registration_code', 'attendee_name', 'attendee_email'],
  });

  const updateStatus = async (id, status) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    reload();
  };

  if (isMockAuth) return <MockBookings />;
  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">BOOKINGS &amp; TICKETS</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search code, name, email..." count={total} />
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : rows.length === 0 ? (
        <EmptyState>NO BOOKINGS YET.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                <th className="py-2">CODE</th>
                <th className="py-2">ATTENDEE</th>
                <th className="py-2">EVENT</th>
                <th className="py-2">QTY</th>
                <th className="py-2">AMOUNT</th>
                <th className="py-2">STATUS</th>
                <th className="py-2">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-[#E7D5A4]/10">
                  <td className="py-3 font-bold text-[#C99A2E]">{b.registration_code}</td>
                  <td className="py-3">{b.attendee_name}<br /><span className="opacity-60">{b.attendee_email}</span></td>
                  <td className="py-3">{b.events?.name || '—'}</td>
                  <td className="py-3">{b.quantity}</td>
                  <td className="py-3 font-bold">₹{b.amount}</td>
                  <td className="py-3"><StatusBadge status={b.status} /></td>
                  <td className="py-3 flex gap-1.5 flex-wrap">
                    {b.status !== 'confirmed' && <ActionButton tone="success" onClick={() => updateStatus(b.id, 'confirmed')}>CONFIRM</ActionButton>}
                    {b.status !== 'refunded' && <ActionButton tone="danger" onClick={() => updateStatus(b.id, 'refunded')}>REFUND</ActionButton>}
                    {b.status !== 'cancelled' && <ActionButton onClick={() => updateStatus(b.id, 'cancelled')}>CANCEL</ActionButton>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <LoadMoreButton hasMore={hasMore} onClick={loadMore} />
    </div>
  );
};
