import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from '../AdminSession';
import { friendlyError } from '../api';
import { useAsync } from '../hooks';
import { P } from '../rbac';
import { Page, Panel, Tabs, Badge, AsyncBlock, fmt } from '../ui';
import { BookingsTable } from '../components/Bookings';

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
              <span className="font-mono text-[11px] text-[#E7D5A4]/40 flex-1 truncate">{e.event_id}</span>
              <span className="font-mono text-[11px] text-[#E7D5A4]/50">{fmt.dateTime(e.created_at)}</span>
              <Badge tone={e.processed ? 'good' : 'bad'}>{e.processed ? 'Processed' : 'Not processed'}</Badge>
            </li>
          ))}
        </ul>
      </AsyncBlock>
    </Panel>
  );
};

export default function BookingsPage() {
  const { can } = useAdminSession();
  const [params, setParams] = useSearchParams();
  const tabs = [
    { id: 'bookings', label: 'Bookings' },
    ...(can(P.PAYMENTS) ? [{ id: 'payments', label: 'Payments ledger' }, { id: 'webhooks', label: 'Webhooks' }] : []),
  ];
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'bookings';
  const clearComp = () => { const next = new URLSearchParams(params); next.delete('comp'); setParams(next, { replace: true }); };

  return (
    <Page title="Bookings & payments" subtitle="Payment status comes only from verified Razorpay payments. Complimentary bookings are marked and never counted as revenue.">
      <Tabs tabs={tabs} value={tab} onChange={(t) => setParams({ tab: t }, { replace: true })} />
      {tab === 'bookings' && (
        <BookingsTable
          key="bookings"
          initialStatus={params.get('status') || ''}
          openBookingId={params.get('booking')}
          compOpen={params.get('comp') === '1' && can(P.BOOKINGS_MANAGE)}
          onCompClose={clearComp}
        />
      )}
      {tab === 'payments' && <BookingsTable key="payments" initialStatus="confirmed" initialEmail={params.get('email') || ''} />}
      {tab === 'webhooks' && <WebhookEvents />}
    </Page>
  );
}
