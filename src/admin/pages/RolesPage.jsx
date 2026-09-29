import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Page, Panel, AsyncBlock, Icon, useToast, cx } from '../ui';
import { useAsync } from '../hooks';
import { rpc, friendlyError } from '../api';

// Role → permission matrix (role_permissions). Super Admin is fixed; Admin /
// Manager and Staff can be adjusted here. Every change is re-checked and
// audited by set_role_permission(); `roles.manage` is never delegable.
const DESCRIBE = {
  'dashboard.view': ['Dashboard', 'See the role dashboard'],
  'applications.view': ['View applications', 'Read artist / partner / crew / volunteer applications'],
  'applications.review': ['Review applications', 'Approve or reject applications (activates roles)'],
  'events.view_all': ['All events', 'See every event and its team'],
  'events.manage': ['Manage events', 'Create, edit, publish and cancel events'],
  'events.view_assigned': ['Assigned events', 'See events they are assigned to'],
  'bookings.view_all': ['All bookings & tickets', 'Read bookings, tickets and check-ins'],
  'bookings.manage': ['Manage bookings', 'Cancel, refund-record and comp bookings'],
  'payments.view': ['Payments & revenue', 'See payment status and revenue'],
  'attendees.view_all': ['All attendees', 'Attendee lists with contact details'],
  'attendees.view_assigned': ['Assigned attendees', 'Attendees of assigned events, without contact details'],
  'checkin.perform': ['QR check-in', 'Check tickets in (assigned events unless they see all events)'],
  'checkin.history': ['Check-in history', 'Read check-in records'],
  'content.manage': ['Announcements & content', 'Create and publish announcements'],
  'announcements.view': ['Read announcements', 'See team announcements'],
  'team.manage': ['Team assignments', 'Assign staff and partners to events, set tasks'],
  'tasks.view_own': ['Own tasks', 'See and update their own tasks'],
  'entities.manage': ['Artists & partners', 'Manage artists, sponsors, vendors, venues, crew'],
  'users.view': ['View users', 'Read the user directory'],
  'users.manage': ['Manage users', 'Invite, activate and deactivate accounts'],
  'roles.manage': ['Role management', 'Change roles — Super Admin only'],
  'reports.view': ['Reports & analytics', 'Operational and partner reports'],
  'audit.view': ['Audit logs', 'Security and activity log'],
  'settings.manage': ['System settings', 'Platform configuration'],
  'ai.use': ['Tangy AI', 'AI workspace'],
  'operations.manage': ['Operations', 'Waitlist, enquiries, website support, TV'],
  'messages.manage': ['Partner messages', 'Read and reply to partner conversations'],
  'volunteers.manage': ['Volunteers', 'Volunteer directory and access requests'],
  'access.grant': ['Grant check-in access', 'Grant / revoke temporary volunteer check-in'],
};
const EDITABLE = ['admin', 'staff'];

export default function RolesPage() {
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const matrix = useAsync(async () => {
    const { data, error } = await supabase.from('role_permissions').select('role, permission');
    if (error) throw friendlyError(error);
    return data || [];
  }, []);
  const has = (role, perm) => (matrix.data || []).some((r) => r.role === role && r.permission === perm);
  const perms = [...new Set((matrix.data || []).filter((r) => r.role === 'super_admin').map((r) => r.permission))]
    .sort((a, b) => Object.keys(DESCRIBE).indexOf(a) - Object.keys(DESCRIBE).indexOf(b));

  const toggle = async (role, perm) => {
    const on = !has(role, perm);
    setBusy(`${role}:${perm}`);
    try {
      await rpc('set_role_permission', { p_role: role, p_permission: perm, p_enabled: on });
      toast(`${DESCRIBE[perm]?.[0] || perm} ${on ? 'granted to' : 'removed from'} ${role === 'admin' ? 'Admin / Manager' : 'Staff'}`);
      matrix.reload();
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Page title="Roles & Permissions" subtitle="What each console role can do. The database enforces this matrix on every request; changes are audited.">
      <Panel flush>
        <AsyncBlock loading={matrix.loading} error={matrix.error} onRetry={matrix.reload} empty={!perms.length} emptyProps={{ title: 'No permissions found' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#E7D5A4]/50 border-b border-[#C99A2E]/15">
                  <th className="px-4 py-2.5 font-normal">Permission</th>
                  <th className="px-3 py-2.5 font-normal text-center">Super Admin</th>
                  <th className="px-3 py-2.5 font-normal text-center">Admin / Manager</th>
                  <th className="px-3 py-2.5 font-normal text-center">Staff</th>
                </tr>
              </thead>
              <tbody>
                {perms.map((perm) => (
                  <tr key={perm} className="border-b border-[#E7D5A4]/[0.05]">
                    <td className="px-4 py-2.5">
                      <div className="text-[#EFE2C0]">{DESCRIBE[perm]?.[0] || perm}</div>
                      <div className="text-[11.5px] text-[#E7D5A4]/45">{DESCRIBE[perm]?.[1]} <span className="font-mono">· {perm}</span></div>
                    </td>
                    <td className="px-3 py-2.5 text-center"><Icon name="Check" size={16} className="inline text-[#5fd3a0]" aria-label="Always on" /></td>
                    {EDITABLE.map((role) => {
                      const locked = perm === 'roles.manage';
                      const on = has(role, perm);
                      return (
                        <td key={role} className="px-3 py-2.5 text-center">
                          <button role="switch" aria-checked={on} aria-label={`${DESCRIBE[perm]?.[0] || perm} for ${role}`}
                            disabled={locked || busy === `${role}:${perm}`} onClick={() => toggle(role, perm)}
                            title={locked ? 'Role management stays with Super Admins' : undefined}
                            className={cx('relative inline-flex h-5 w-9 rounded-full border transition-colors disabled:opacity-40',
                              on ? 'bg-[#1f8a5b] border-[#1f8a5b]' : 'bg-[#11100C] border-[#E7D5A4]/25')}>
                            <span className={cx('absolute top-0.5 h-3.5 w-3.5 rounded-full bg-[#EFE2C0] transition-all', on ? 'left-[18px]' : 'left-0.5')} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncBlock>
      </Panel>
    </Page>
  );
}
