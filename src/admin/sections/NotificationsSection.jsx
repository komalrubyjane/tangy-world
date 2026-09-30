import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Panel, Badge, EmptyState, ErrorState, Skeleton, Button, fmt, cx } from '../ui';

// Email delivery log. Notification emails are queued in email_outbox by
// notify() (respecting each user's preferences) and sent by the
// send-notification-emails Edge Function; application decision emails are
// tracked in application_notifications. Both are read-only here and gated by
// RLS (settings.manage / admin) — rows the viewer can't read simply don't load.

const TONE = { sent: 'good', failed: 'bad', queued: 'warn', sending: 'info', pending: 'warn', skipped: 'muted' };
const FILTERS = [['all', 'All'], ['failed', 'Failed'], ['queued', 'Queued'], ['sent', 'Sent']];

const useRows = (table, select, filter) => {
  const [state, setState] = useState({ rows: null, error: null });
  const load = useCallback(async () => {
    let q = supabase.from(table).select(select).order('created_at', { ascending: false }).limit(50);
    if (filter === 'queued') q = q.in('status', ['queued', 'sending', 'pending']);
    else if (filter !== 'all') q = q.eq('status', filter);
    const { data, error } = await q;
    setState({ rows: error ? null : data || [], error });
  }, [table, select, filter]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
};

const Log = ({ title, subtitle, rows, error, reload, render }) => (
  <Panel title={title} subtitle={subtitle} flush>
    {error ? <ErrorState error={error} onRetry={reload} /> : rows === null ? <Skeleton rows={4} /> : rows.length === 0 ? (
      <EmptyState icon="Mail" title="No emails" hint="Nothing matches this filter." />
    ) : <ul className="divide-y divide-[#E7D5A4]/[0.06] font-sans">{rows.map(render)}</ul>}
  </Panel>
);

export const NotificationsSection = () => {
  const [filter, setFilter] = useState('all');
  const outbox = useRows('email_outbox', 'id, to_email, notification_type, subject, status, attempts, last_error, created_at, sent_at', filter);
  const decisions = useRows('application_notifications', 'id, source_table, notification_type, status, error, created_at, sent_at', filter);
  return (
    <div className="flex flex-col gap-4 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Filter emails" className="flex gap-1.5">
          {FILTERS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
              className={cx('h-7 px-2.5 rounded-full border font-mono text-[10.5px] uppercase tracking-[0.08em]', filter === k ? 'border-[#C99A2E] bg-[#C99A2E] text-[#11100C]' : 'border-[#E7D5A4]/20 text-[#ecdcaf]/75')}>
              {label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="ghost" icon="RefreshCw" onClick={() => { outbox.reload(); decisions.reload(); }}>Refresh</Button>
      </div>
      <Log title="Notification emails" subtitle="Queued by in-app notifications; sent in batches by the email worker." {...outbox}
        render={(r) => (
          <li key={r.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] text-[#EFE2C0] truncate">{r.subject}</div>
              <div className="text-[12px] text-[#E7D5A4]/60 truncate">{r.to_email} · {r.notification_type} · {fmt.dateTime(r.created_at)}{r.attempts > 1 ? ` · ${r.attempts} attempts` : ''}</div>
              {r.last_error && <div className="text-[12px] text-[#ef6b5e] truncate">{r.last_error}</div>}
            </div>
            <Badge tone={TONE[r.status]}>{r.status}</Badge>
          </li>
        )} />
      <Log title="Application decision emails" subtitle="Approval and rejection emails to applicants." {...decisions}
        render={(r) => (
          <li key={r.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] text-[#EFE2C0]">{r.notification_type === 'approval' ? 'Approval' : 'Rejection'} · {r.source_table.replace('_', ' ')}</div>
              <div className="text-[12px] text-[#E7D5A4]/60">{fmt.dateTime(r.created_at)}{r.sent_at ? ` · sent ${fmt.dateTime(r.sent_at)}` : ''}</div>
              {r.error && <div className="text-[12px] text-[#ef6b5e] truncate">{r.error}</div>}
            </div>
            <Badge tone={TONE[r.status]}>{r.status}</Badge>
          </li>
        )} />
    </div>
  );
};
