import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { notificationService } from '../../services/notificationService';
import { useAdminSession, useSetting } from '../AdminSession';
import { adminApi, orIlike } from '../api';
import { useServerTable, useDebounced, useAsync } from '../hooks';
import { P } from '../rbac';
import {
  Page, Panel, Toolbar, SearchInput, FilterSelect, DataTable, Pagination, Badge, Drawer, KeyValue, Button,
  ConfirmDialog, Input, fmt, useToast,
} from '../ui';

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'artist', label: 'Artist' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'venue', label: 'Venue host' },
  { value: 'crew', label: 'Crew' },
  { value: 'volunteer', label: 'Volunteer' },
];
const STATUSES = [
  { value: '', label: 'Any status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));
const ROLE_ON_APPROVAL = { artist: 'Artist portal access', sponsor: 'Sponsor role', vendor: 'Vendor role', venue: 'Venue partner role', crew: 'Crew role', volunteer: 'Volunteer role' };
const DETAIL_LABELS = {
  genre: 'Genre', city: 'City', bio: 'Bio', experience_level: 'Experience', instagram: 'Instagram', soundcloud: 'SoundCloud', spotify: 'Spotify',
  business_name: 'Business', contact_name: 'Contact', details: 'Details', role_interest: 'Role interest', event_interest: 'Event interest', message: 'Message',
};

function useReviewerNames(rows) {
  const ids = [...new Set(rows.map((r) => r.reviewed_by).filter(Boolean))];
  return useAsync(async () => {
    if (ids.length === 0) return {};
    const { data } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
    return Object.fromEntries((data || []).map((p) => [p.id, p.full_name || p.email]));
  }, [ids.join(',')]).data || {};
}

const ApplicationDrawer = ({ app, reviewer, onClose, onChanged }) => {
  const { can } = useAdminSession();
  const toast = useToast();
  const sendEmails = useSetting('notifications.send_approval_emails', true);
  const [dialog, setDialog] = useState(null);
  const notification = useAsync(async () => {
    if (!app.user_id) return null;
    const { data } = await supabase.from('application_notifications').select('status, error, sent_at')
      .eq('source_table', app.source_table).eq('source_id', app.id).eq('notification_type', 'approval').maybeSingle();
    return data;
  }, [app.id, app.status]);

  const canReview = can(P.APPLICATIONS_REVIEW) && app.status === 'pending';
  const details = Object.entries(app.details || {}).filter(([, v]) => v);

  const approve = async ({ notes }) => {
    await adminApi.approveApplication(app.source_table, app.id, notes);
    toast(`${app.applicant_name} approved`);
    if (app.user_id && sendEmails) {
      const res = await notificationService.sendApprovalEmail(app.source_table, app.id);
      if (!res.success) toast(`Approved, but the email failed: ${res.error}`, 'bad');
    }
    onChanged();
  };
  const reject = async ({ reason }) => {
    await adminApi.rejectApplication(app.source_table, app.id, reason);
    toast(`${app.applicant_name} rejected`);
    onChanged();
  };
  const resend = async () => {
    const res = await notificationService.sendApprovalEmail(app.source_table, app.id, { force: true });
    toast(res.success ? 'Approval email sent' : res.error || 'Could not send email', res.success ? 'good' : 'bad');
    notification.reload();
  };

  return (
    <Drawer
      title={app.applicant_name}
      subtitle={`${TYPE_LABEL[app.type] || app.type} application · submitted ${fmt.dateTime(app.submitted_at)}`}
      onClose={onClose}
      footer={canReview ? (
        <>
          <Button variant="danger" icon="CircleX" onClick={() => setDialog('reject')}>Reject</Button>
          <Button variant="success" icon="CircleCheck" onClick={() => setDialog('approve')}>Approve</Button>
        </>
      ) : null}
    >
      <div className="flex items-center gap-2"><Badge status={app.status} />{!app.user_id && <Badge tone="muted">No linked account</Badge>}</div>
      <Panel title="Applicant">
        <KeyValue items={[
          ['Name', app.applicant_name],
          ['Email', app.applicant_email ? <a className="underline" href={`mailto:${app.applicant_email}`}>{app.applicant_email}</a> : null],
          app.phone && ['Phone', app.phone],
          ['Type', TYPE_LABEL[app.type] || app.type],
          ['On approval', app.user_id ? ROLE_ON_APPROVAL[app.type] : 'Status only — applicant has no account to activate'],
        ]} />
      </Panel>
      {details.length > 0 && (
        <Panel title="Application details">
          <KeyValue items={details.map(([k, v]) => [DETAIL_LABELS[k] || k, <span className="whitespace-pre-line">{String(v)}</span>])} />
        </Panel>
      )}
      <Panel title="Review">
        {app.status === 'pending' ? (
          <p className="text-[13px] text-[#E7D5A4]/60">{can(P.APPLICATIONS_REVIEW) ? 'Awaiting review.' : "You can view applications but your role can't approve or reject them."}</p>
        ) : (
          <KeyValue items={[
            ['Decision', <Badge status={app.status} />],
            ['Reviewer', reviewer || '—'],
            ['Reviewed', fmt.dateTime(app.reviewed_at)],
            app.review_notes && ['Notes', app.review_notes],
            app.decision_reason && ['Reason', app.decision_reason],
            app.status === 'approved' && app.user_id && ['Approval email', notification.data ? (
              <span className="inline-flex items-center gap-2"><Badge status={notification.data.status === 'sent' ? 'confirmed' : notification.data.status}>{notification.data.status}</Badge>
                {notification.data.status === 'failed' && can(P.APPLICATIONS_REVIEW) && <Button size="sm" onClick={resend}>Resend</Button>}
              </span>
            ) : '—'],
          ]} />
        )}
      </Panel>

      {dialog === 'approve' && (
        <ConfirmDialog
          title={`Approve ${app.applicant_name}?`}
          message={app.user_id ? `This activates: ${ROLE_ON_APPROVAL[app.type]}.${sendEmails ? ' An approval email is sent automatically.' : ''}` : 'The applicant has no linked account, so only the status changes.'}
          confirmLabel="Approve"
          tone="success"
          fields={[{ name: 'notes', label: 'Internal notes', multiline: true, placeholder: 'Optional — visible to admins only' }]}
          onConfirm={approve}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'reject' && (
        <ConfirmDialog
          title={`Reject ${app.applicant_name}?`}
          message="The application is closed and kept on record. This can't be undone from the console."
          confirmLabel="Reject"
          tone="danger"
          fields={[{ name: 'reason', label: 'Reason', required: true, multiline: true, autoFocus: true }]}
          onConfirm={reject}
          onClose={() => setDialog(null)}
        />
      )}
    </Drawer>
  );
};

export default function ApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || '';
  const status = params.get('status') ?? 'pending';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [selected, setSelected] = useState(null);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    // An empty status is meaningful ("any"), so it stays in the URL.
    if (value || key === 'status') next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const table = useServerTable({
    table: 'applications_overview',
    deps: [type, status, from, to, q],
    build: (query) => {
      // Pending = a review queue (oldest first); everything else newest first.
      let x = query.order('submitted_at', { ascending: status === 'pending' });
      if (type) x = x.eq('type', type);
      if (status) x = x.eq('status', status);
      if (from) x = x.gte('submitted_at', from);
      if (to) x = x.lt('submitted_at', new Date(new Date(to).getTime() + 86400000).toISOString());
      return orIlike(x, ['applicant_name', 'applicant_email', 'summary'], q);
    },
  });
  const reviewers = useReviewerNames(table.rows);

  const columns = [
    { key: 'applicant', header: 'Applicant', render: (r) => (<div className="min-w-0"><div className="text-[#EFE2C0]">{r.applicant_name}</div><div className="text-[12px] text-[#E7D5A4]/45 truncate max-w-[260px]">{r.applicant_email}</div></div>) },
    { key: 'type', header: 'Type', render: (r) => <Badge tone="gold">{TYPE_LABEL[r.type] || r.type}</Badge> },
    { key: 'summary', header: 'Summary', mobileHidden: true, render: (r) => <span className="text-[#E7D5A4]/60 truncate block max-w-[240px]">{r.summary || '—'}</span> },
    { key: 'submitted', header: 'Submitted', render: (r) => <span className="font-mono text-[12px]">{fmt.date(r.submitted_at)}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    { key: 'reviewer', header: 'Reviewer', mobileHidden: true, render: (r) => (r.reviewed_by ? <span className="text-[12.5px]">{reviewers[r.reviewed_by] || '—'}<span className="text-[#E7D5A4]/40"> · {fmt.date(r.reviewed_at)}</span></span> : <span className="text-[#E7D5A4]/30">—</span>) },
  ];

  return (
    <Page title="Applications" subtitle="Artist, partner, crew and volunteer applications. Approval activates the applicant's role; rejected applications stay on record.">
      <Panel flush>
        <div className="p-3 border-b border-[#C99A2E]/15">
          <Toolbar right={<span className="font-mono text-[11px] text-[#E7D5A4]/45">{fmt.num(table.count)} result{table.count === 1 ? '' : 's'}</span>}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, details…" />
            <FilterSelect label="Type" value={type} onChange={(v) => setParam('type', v)} options={TYPES} />
            <FilterSelect label="Status" value={status} onChange={(v) => setParam('status', v)} options={STATUSES} />
            <Input type="date" aria-label="Submitted from" value={from} onChange={(e) => setParam('from', e.target.value)} className="w-auto" />
            <Input type="date" aria-label="Submitted to" value={to} onChange={(e) => setParam('to', e.target.value)} className="w-auto" />
          </Toolbar>
        </div>
        <DataTable
          columns={columns}
          rows={table.rows}
          rowKey="id"
          loading={table.loading}
          error={table.error}
          onRetry={table.reload}
          onRowClick={setSelected}
          empty={{ title: status === 'pending' ? 'No pending applications' : 'No applications found', hint: 'Try a different filter.', icon: 'Inbox' }}
        />
        <Pagination {...table} />
      </Panel>
      {selected && (
        <ApplicationDrawer
          app={selected}
          reviewer={reviewers[selected.reviewed_by]}
          onClose={() => setSelected(null)}
          onChanged={() => { setSelected(null); table.reload(); }}
        />
      )}
    </Page>
  );
}

