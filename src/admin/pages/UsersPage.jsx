import { useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from '../AdminSession';
import { adminApi, orIlike } from '../api';
import { useServerTable, useDebounced, useAsync } from '../hooks';
import { ROLE_LABELS, P } from '../rbac';
import { auditLabel, auditSummary } from '../auditLabels';
import { CustomNotificationForm } from '../components/CustomNotification';
import {
  Page, Panel, Toolbar, SearchInput, FilterSelect, DataTable, Pagination, Badge, Button, Drawer, KeyValue, ConfirmDialog, Modal, Field, Input, Select, fmt, useToast, Skeleton, ErrorState, EmptyState,
} from '../ui';

const ROLES = ['super_admin', 'admin', 'staff', 'user', 'artist', 'vendor', 'sponsor', 'venue', 'crew', 'volunteer'];

const UserDrawer = ({ profile, onClose, onChanged, inline = false }) => {
  const { user } = useAdminSession();
  const toast = useToast();
  const [role, setRole] = useState(profile.role);
  const [dialog, setDialog] = useState(null);
  const self = profile.id === user?.id;
  const history = useAsync(async () => {
    const { data } = await supabase.from('audit_logs').select('id, created_at, actor_email, action, metadata, resource_id')
      .or(`resource_id.eq.${profile.id},actor_id.eq.${profile.id}`).order('created_at', { ascending: false }).limit(15);
    return data || [];
  }, [profile.id]);

  return (
    <Drawer inline={inline} title={profile.full_name || profile.email} subtitle={profile.email} onClose={onClose}>
      <div className="flex gap-2"><Badge status={profile.role}>{ROLE_LABELS[profile.role]}</Badge><Badge status={profile.is_active ? 'active' : 'deactivated'} /></div>
      <Panel title="Account">
        <KeyValue items={[
          ['Name', profile.full_name], ['Email', profile.email], ['Phone', profile.phone], ['Passport ID', profile.passport_id],
          ['Member since', fmt.date(profile.member_since)],
          !profile.is_active && ['Deactivated', fmt.dateTime(profile.deactivated_at)],
        ]} />
      </Panel>
      <Panel title="Role">
        {self ? <p className="text-[13px] text-[#E7D5A4]/55">You can't change your own role or deactivate your own account.</p> : (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <Field label="Role" className="flex-1">
              <Select value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</Select>
            </Field>
            <Button variant="primary" disabled={role === profile.role} onClick={() => setDialog('role')}>Change role</Button>
          </div>
        )}
        {!self && (
          <div className="mt-4 pt-4 border-t border-[#C99A2E]/15">
            {profile.is_active
              ? <Button variant="danger" icon="Ban" onClick={() => setDialog('deactivate')}>Deactivate account</Button>
              : <Button variant="success" icon="CircleCheck" onClick={() => setDialog('reactivate')}>Reactivate account</Button>}
            <p className="text-[12px] text-[#E7D5A4]/60 mt-2">Deactivation revokes every permission immediately. History is kept.</p>
          </div>
        )}
      </Panel>
      <Panel title="Activity" flush>
        {(history.data || []).length === 0 ? <div className="p-4 text-[12.5px] text-[#E7D5A4]/60">{history.loading ? 'Loading…' : 'No recorded activity.'}</div> : (
          <ul className="divide-y divide-[#E7D5A4]/[0.06]">
            {history.data.map((h) => (
              <li key={h.id} className="px-4 py-2 text-[12px]">
                <span className="text-[#EFE2C0]">{auditLabel(h.action)}</span>
                <span className="text-[#E7D5A4]/60"> · {h.actor_email || 'System'} · {fmt.dateTime(h.created_at)}</span>
                {auditSummary(h) && <div className="text-[#E7D5A4]/60">{auditSummary(h)}</div>}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {dialog === 'role' && (
        <ConfirmDialog title="Change role?" confirmLabel="Change role" tone={role === 'super_admin' ? 'danger' : 'primary'}
          message={`${profile.full_name || profile.email}: ${ROLE_LABELS[profile.role]} → ${ROLE_LABELS[role]}.${role === 'super_admin' ? ' Super Admins have full system control.' : ''}`}
          fields={[{ name: 'reason', label: 'Reason', required: true, autoFocus: true }]}
          onConfirm={async ({ reason }) => { await adminApi.setUserRole(profile.id, role, reason); toast('Role updated'); onChanged(); }}
          onClose={() => setDialog(null)} />
      )}
      {(dialog === 'deactivate' || dialog === 'reactivate') && (
        <ConfirmDialog title={dialog === 'deactivate' ? 'Deactivate account?' : 'Reactivate account?'} confirmLabel={dialog === 'deactivate' ? 'Deactivate' : 'Reactivate'}
          tone={dialog === 'deactivate' ? 'danger' : 'success'}
          message={dialog === 'deactivate' ? 'They keep their sign-in but lose every role permission immediately.' : 'Their existing role permissions are restored.'}
          fields={[{ name: 'reason', label: 'Reason', required: dialog === 'deactivate', autoFocus: true }]}
          onConfirm={async ({ reason }) => { await adminApi.setUserActive(profile.id, dialog === 'reactivate', reason); toast('Account updated'); onChanged(); }}
          onClose={() => setDialog(null)} />
      )}
    </Drawer>
  );
};

// The role is fixed by the invitation and applied only when the recipient
// accepts; the database re-checks who may invite which role (0030).
const useInviteRoles = () => {
  const { can } = useAdminSession();
  return [
    ...(can(P.STAFF_INVITE) || can(P.USERS_MANAGE) ? ['staff'] : []),
    ...(can(P.ROLES) ? ['admin', 'super_admin'] : []),
  ];
};

const InviteModal = ({ onClose, onDone }) => {
  const toast = useToast();
  const roles = useInviteRoles();
  const [f, setF] = useState({ email: '', fullName: '', role: roles[0] || 'staff' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [manual, setManual] = useState(null); // invitation created, email not sent
  const valid = /\S+@\S+\.\S+/.test(f.email) && f.fullName.trim();
  const submit = async (e) => {
    e?.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError('');
    try {
      const res = await adminApi.inviteUser(f);
      if (res.email_status === 'sent') {
        toast(`Invitation sent to ${f.email} — ${ROLE_LABELS[f.role]} access starts when they accept`);
        onDone();
        return;
      }
      setManual(res);
      setBusy(false);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  if (manual) {
    return (
      <Modal title="Invitation created — email not sent" onClose={onDone}
        footer={<Button variant="primary" onClick={onDone}>Done</Button>}>
        <p className="text-[13px] m-0" role="status">
          The invitation for <strong>{f.email}</strong> ({ROLE_LABELS[f.role]}) exists, but the email was not sent: {manual.email_error || 'email is not configured'}.
          Send them this link another way. It works once, only for that email address, and expires {fmt.dateTime(manual.expires_at)}.
        </p>
        <Field label="Invitation link"><Input readOnly value={manual.invite_url} onFocus={(e) => e.target.select()} data-invite-url /></Field>
        <Button variant="ghost" icon="Copy" onClick={() => navigator.clipboard?.writeText(manual.invite_url).then(() => toast('Link copied'), () => toast('Copy failed — select the link instead', 'bad'))}>Copy link</Button>
      </Modal>
    );
  }
  return (
    <Modal title="Invite team member" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!valid || busy} onClick={submit}>{busy ? 'Inviting…' : 'Send invite'}</Button></>}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Full name *"><Input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} autoFocus /></Field>
        <Field label="Email *"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Role" hint="Fixed by this invitation. They accept by signing in with this email; the link works once and expires in 72 hours.">
          <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</Select>
        </Field>
      </form>
      {error && <div role="alert" className="text-[12.5px] text-[#ef6b5e] bg-[#a8322a]/10 border border-[#a8322a]/40 rounded px-3 py-2">{error}</div>}
    </Modal>
  );
};

const EMAIL_STATUS = { sent: 'Emailed', failed: 'Email failed', not_configured: 'Not emailed', pending: 'Sending…' };

const InvitationsPanel = ({ reloadKey }) => {
  const toast = useToast();
  const [revoking, setRevoking] = useState(null);
  const list = useAsync(() => adminApi.listInvitations(), [reloadKey]);
  const rows = list.data || [];
  if (!list.loading && !list.error && rows.length === 0) return null;
  return (
    <Panel title="Invitations" subtitle="Roles are granted only when the invited person accepts. Links are single-use and expire after 72 hours." flush>
      {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : (
        <ul className="divide-y divide-[#E7D5A4]/[0.06]" data-invitations>
          {list.loading && rows.length === 0 && <li className="px-4 py-3 text-[12.5px] text-[#E7D5A4]/60">Loading…</li>}
          {rows.map((i) => (
            <li key={i.id} className="px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]" data-invitation={i.email}>
              <div className="min-w-0 flex-1">
                <div className="text-[#EFE2C0] truncate">{i.full_name || i.email}</div>
                <div className="text-[12px] text-[#E7D5A4]/60 truncate">{i.email} · invited by {i.invited_by_name || '—'} · {fmt.dateTime(i.created_at)}</div>
              </div>
              <Badge status={i.role}>{ROLE_LABELS[i.role]}</Badge>
              <Badge status={i.state} />
              {i.state === 'pending' && <span className="font-mono text-[11px] text-[#E7D5A4]/60">{EMAIL_STATUS[i.email_status]} · expires {fmt.dateTime(i.expires_at)}</span>}
              {i.state === 'pending' && i.can_manage && <Button size="sm" variant="ghost" icon="X" onClick={() => setRevoking(i)}>Revoke</Button>}
            </li>
          ))}
        </ul>
      )}
      {revoking && (
        <ConfirmDialog title="Revoke invitation?" confirmLabel="Revoke" tone="danger"
          message={`The link sent to ${revoking.email} will stop working. You can send a new invitation later.`}
          onConfirm={async () => { await adminApi.revokeInvitation(revoking.id); toast('Invitation revoked'); list.reload(); }}
          onClose={() => setRevoking(null)} />
      )}
    </Panel>
  );
};

export default function UsersPage() {
  const [params, setParams] = useSearchParams();
  const role = params.get('role') || '';
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const navigate = useNavigate();
  const { can } = useAdminSession();
  const inviteRoles = useInviteRoles();
  const inviting = params.get('invite') === '1' && inviteRoles.length > 0;
  const [invitesKey, setInvitesKey] = useState(0);
  const setParam = (k, v) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: true }); };

  const table = useServerTable({
    table: 'profiles',
    select: 'id, full_name, email, phone, role, is_active, deactivated_at, member_since, passport_id',
    deps: [role, status, q],
    build: (query) => {
      let x = query.order('member_since', { ascending: false });
      if (role) x = x.eq('role', role);
      if (status) x = x.eq('is_active', status === 'active');
      return orIlike(x, ['full_name', 'email', 'passport_id'], q);
    },
  });

  const columns = [
    { key: 'name', header: 'User', render: (u) => (<div className="min-w-0"><div className="text-[#EFE2C0]">{u.full_name || '—'}</div><div className="text-[12px] text-[#E7D5A4]/60 truncate max-w-[240px]">{u.email}</div></div>) },
    { key: 'role', header: 'Role', render: (u) => <Badge status={u.role}>{ROLE_LABELS[u.role] || u.role}</Badge> },
    { key: 'status', header: 'Status', render: (u) => <Badge status={u.is_active ? 'active' : 'deactivated'} /> },
    { key: 'passport', header: 'Passport', mobileHidden: true, render: (u) => <span className="font-mono text-[11.5px] text-[#E7D5A4]/60">{u.passport_id}</span> },
    { key: 'since', header: 'Joined', mobileHidden: true, render: (u) => <span className="font-mono text-[11.5px] text-[#E7D5A4]/60">{fmt.date(u.member_since)}</span> },
  ];

  return (
    <Page title="Users & roles" subtitle="Every account on Tangy. Console accounts join by invitation only; only Super Admins can change roles or deactivate accounts. Every change is audited."
      actions={inviteRoles.length > 0 && <Button variant="primary" icon="UserPlus" onClick={() => setParam('invite', '1')}>Invite team member</Button>}>
      <Panel flush>
        <div className="p-3 border-b border-[#C99A2E]/15">
          <Toolbar right={<span className="font-mono text-[11px] text-[#E7D5A4]/60">{fmt.num(table.count)} account{table.count === 1 ? '' : 's'}</span>}>
            <SearchInput value={search} onChange={setSearch} placeholder="Name, email, passport ID…" />
            <FilterSelect label="Role" value={role} onChange={(v) => setParam('role', v)} options={[{ value: '', label: 'Any role' }, ...ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))]} />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'Any status' }, { value: 'active', label: 'Active' }, { value: 'deactivated', label: 'Deactivated' }]} />
          </Toolbar>
        </div>
        <DataTable columns={columns} rows={table.rows} loading={table.loading} error={table.error} onRetry={table.reload} onRowClick={can(P.USERS_MANAGE) ? (u) => navigate(`/admin-portal/users/${u.id}`) : undefined}
          empty={{ title: 'No users found', icon: 'Users' }} />
        <Pagination {...table} />
      </Panel>
      <InvitationsPanel reloadKey={invitesKey} />
      {inviting && <InviteModal onClose={() => setParam('invite', '')} onDone={() => { setParam('invite', ''); setInvitesKey((k) => k + 1); table.reload(); }} />}
    </Page>
  );
}


// /admin-portal/users/:id — one account as its own page.
export function UserDetailPage() {
  const { id } = useParams();
  const { user } = useAdminSession();
  const navigate = useNavigate();
  const q = useAsync(async () => {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data, error } = await supabase.from('profiles').select('id, full_name, email, phone, role, is_active, deactivated_at, member_since, passport_id').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }, [id]);
  const name = q.data ? q.data.full_name || q.data.email : q.loading ? 'User' : 'User not found';
  return (
    <Page title={name} back={{ to: '/admin-portal/users', label: 'Users & roles' }} crumbs={[{ label: name }]}>
      {q.loading ? <Skeleton rows={6} /> : q.error ? <ErrorState error={q.error} onRetry={q.reload} /> : !q.data ? (
        <Panel><EmptyState icon="Users" title="User not found" action={<Button to="/admin-portal/users" icon="ChevronLeft">Back to users</Button>} /></Panel>
      ) : (
        <div className="flex flex-col gap-4">
          <UserDrawer inline key={q.data.id} profile={q.data} onClose={() => navigate('/admin-portal/users')} onChanged={q.reload} />
          {user?.role === 'super_admin' && user.id !== q.data.id && q.data.is_active && <CustomNotificationForm userId={q.data.id} name={q.data.full_name || q.data.email} />}
        </div>
      )}
    </Page>
  );
}
