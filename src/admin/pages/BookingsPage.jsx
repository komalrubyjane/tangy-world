import { useSearchParams, useParams, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from '../AdminSession';
import { friendlyError } from '../api';
import { useAsync } from '../hooks';
import { P } from '../rbac';
import { Page, Panel, Tabs, Badge, AsyncBlock, EmptyState, Button, Skeleton, fmt } from '../ui';
import { BookingsTable, BookingDrawer } from '../components/Bookings';

const WebhookEvents = () => {
  const q = useAsync(async () => {
    const { data, error } = await supabase.from('payment_webhook_events').select('id, event_id, event_type, processed, created_at')
      .order('created_at', { ascending: false }).limit(50);
    if (error) throw friendlyError(error);
    return data;
  }, []);
  return (
    <Panel title="Razorpay webhook deliveries" subtitle="Latest 50 · processed idempotently by the razorpay-webhook function" flush>
      <AsyncBlock loading={q.loading} error={q.error} onRetry={q.reload} empty={(q.data || []).length === 0} emptyProps={{ title: 'No webhook events received yet', icon: 'Activity' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(q.data || []).map((e) => (
            <li key={e.id} className="px-4 py-2.5 flex items-center gap-3 text-[12.5px]">
              <span className="font-mono text-[#C99A2E] w-44 shrink-0 truncate">{e.event_type}</span>
              <span className="font-mono text-[11px] text-[#E7D5A4]/60 flex-1 truncate">{e.event_id}</span>
              <span className="font-mono text-[11px] text-[#E7D5A4]/60">{fmt.dateTime(e.created_at)}</span>
              <Badge tone={e.processed ? 'good' : 'bad'}>{e.processed ? 'Processed' : 'Not processed'}</Badge>
            </li>
          ))}
        </ul>
      </AsyncBlock>
    </Panel>
  );
};

// /admin-portal/bookings — list; legacy ?booking= / ?tab= links redirect to
// their own URLs.
export default function BookingsPage() {
  const { can } = useAdminSession();
  const [params, setParams] = useSearchParams();
  if (params.get('booking')) return <Navigate to={`/admin-portal/bookings/${params.get('booking')}`} replace />;
  if (params.get('tab') === 'payments') return <Navigate to={`/admin-portal/payments${params.get('email') ? `?email=${params.get('email')}` : ''}`} replace />;
  if (params.get('tab') === 'webhooks') return <Navigate to="/admin-portal/payments/webhooks" replace />;
  const clearComp = () => { const next = new URLSearchParams(params); next.delete('comp'); setParams(next, { replace: true }); };
  return (
    <Page title="Bookings" subtitle="Every booking and its named attendees. Payment status comes only from verified Razorpay payments.">
      <BookingsTable
        key="bookings"
        initialStatus={params.get('status') || ''}
        initialSearch={params.get('q') || ''}
        compOpen={params.get('comp') === '1' && can(P.BOOKINGS_MANAGE)}
        onCompClose={clearComp}
      />
    </Page>
  );
}

// /admin-portal/bookings/:bookingId — one booking as its own page.
export function BookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const valid = /^[0-9a-f-]{36}$/i.test(bookingId || '');
  const q = useAsync(async () => {
    if (!valid) return null;
    const { data } = await supabase.from('bookings').select('registration_code').eq('id', bookingId).maybeSingle();
    return data;
  }, [bookingId]);
  const code = q.data?.registration_code || (q.loading ? 'Booking' : 'Booking not found');
  return (
    <Page title={code} back={{ to: '/admin-portal/bookings', label: 'Bookings' }} crumbs={[{ label: code }]}>
      {q.loading ? <Skeleton rows={6} /> : !q.data ? (
        <Panel><EmptyState icon="Ticket" title="Booking not found" hint="It may not exist, or you may not have access to it." action={<Button to="/admin-portal/bookings" icon="ChevronLeft">Back to bookings</Button>} /></Panel>
      ) : <BookingDrawer inline bookingId={bookingId} onClose={() => navigate('/admin-portal/bookings')} />}
    </Page>
  );
}

// /admin-portal/payments and /admin-portal/payments/webhooks.
export function PaymentsPage({ section = 'ledger' }) {
  const [params] = useSearchParams();
  return (
    <Page title="Payments" subtitle="Confirmed online payments, payments waiting for finance review, and Razorpay webhook deliveries. Complimentary bookings are never revenue.">
      <Tabs tabs={[{ id: 'ledger', label: 'Payments ledger', to: '/admin-portal/payments' }, { id: 'webhooks', label: 'Webhooks', to: '/admin-portal/payments/webhooks' }]} value={section} />
      {section === 'ledger' ? <BookingsTable key="payments" initialStatus="confirmed" initialEmail={params.get('email') || ''} /> : <WebhookEvents />}
    </Page>
  );
}
