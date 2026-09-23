import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { bookingService } from '../../lib/bookingService';
import { SearchBar, StatusBadge, ActionButton, LoadMoreButton, EmptyState, NotConfiguredState, EmailStatusBadge } from '../AdminUI';

// Read-only payments ledger, sourced entirely from `bookings` (the
// razorpay-* Edge Functions remain the only writers of payment state — see
// supabase/functions/razorpay-*). Never confirms or mutates a payment here —
// the one write this section can trigger is resending the ticket email,
// which touches only bookings.ticket_email_status, never payment/ticket state.
export const PaymentsSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('bookings', {
    select: '*, events(name)',
    searchFields: ['registration_code', 'attendee_name', 'attendee_email', 'razorpay_order_id', 'razorpay_payment_id'],
  });
  const [webhookEvents, setWebhookEvents] = useState([]);
  const [resendingId, setResendingId] = useState(null);

  const resendTicketEmail = async (id) => {
    setResendingId(id);
    const res = await bookingService.sendTicketEmail(id, { force: true });
    if (!res.success) alert(res.error || 'Could not send email.');
    setResendingId(null);
    reload();
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from('payment_webhook_events')
      .select('id, event_type, processed, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setWebhookEvents(data || []));
  }, []);

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
        <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">PAYMENTS LEDGER</h3>
        <SearchBar value={search} onChange={setSearch} placeholder="Search code, name, Razorpay order/payment ID..." count={total} />
        {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : rows.length === 0 ? (
          <EmptyState>NO PAYMENT RECORDS YET.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                  <th className="py-2">CODE</th>
                  <th className="py-2">ATTENDEE</th>
                  <th className="py-2">EVENT</th>
                  <th className="py-2">AMOUNT</th>
                  <th className="py-2">RAZORPAY ORDER</th>
                  <th className="py-2">SIGNATURE VERIFIED</th>
                  <th className="py-2">STATUS</th>
                  <th className="py-2">TICKET EMAIL</th>
                  <th className="py-2">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-b border-[#E7D5A4]/10">
                    <td className="py-3 font-bold text-[#C99A2E]">{b.registration_code}</td>
                    <td className="py-3">{b.attendee_name}</td>
                    <td className="py-3">{b.events?.name || '—'}</td>
                    <td className="py-3 font-bold">₹{b.amount}</td>
                    <td className="py-3 opacity-70">{b.razorpay_order_id || '—'}</td>
                    <td className="py-3">
                      {b.razorpay_signature_verified ? (
                        <span className="text-[10px] font-bold text-[#10b981] uppercase">✓ Verified</span>
                      ) : (
                        <span className="text-[10px] text-[#E7D5A4]/40 uppercase">Unverified</span>
                      )}
                    </td>
                    <td className="py-3"><StatusBadge status={b.status} /></td>
                    <td className="py-3">{b.status === 'confirmed' && <EmailStatusBadge notification={{ status: b.ticket_email_status }} />}</td>
                    <td className="py-3">
                      {b.status === 'confirmed' && b.ticket_email_status === 'failed' && (
                        <ActionButton onClick={() => resendTicketEmail(b.id)} disabled={resendingId === b.id}>
                          {resendingId === b.id ? 'SENDING...' : 'RESEND'}
                        </ActionButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <LoadMoreButton hasMore={hasMore} onClick={loadMore} />
      </div>

      <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
        <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">RECENT WEBHOOK EVENTS</h3>
        {webhookEvents.length === 0 ? (
          <EmptyState>NO WEBHOOK EVENTS RECORDED YET.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {webhookEvents.map((e) => (
              <li key={e.id} className="flex justify-between items-center text-xs border-b border-[#E7D5A4]/10 pb-2 last:border-0">
                <span className="text-[#E7D5A4]/85">{e.event_type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#E7D5A4]/40">{new Date(e.created_at).toLocaleString()}</span>
                  <StatusBadge status={e.processed ? 'confirmed' : 'pending'} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
