import { useEffect, useState } from 'react';
import { Panel, Skeleton, ErrorState, cx } from '../admin/ui';
import { rpc } from '../admin/api';

// Real, stored notification preferences (notification_preferences, 0020).
// notify() checks these server-side for every notification it creates, so a
// switch here changes what the user actually receives. Critical notices
// (event cancellations, revoked access, payment failures) always arrive in-app.

const LABELS = {
  booking_requests: ['Booking requests', 'New invitations to perform and their outcomes'],
  schedule_changes: ['Schedule changes', 'Call, soundcheck, performance and timing updates'],
  event_updates: ['Event updates', 'Date, venue or status changes to your events'],
  event_reminders: ['Event reminders', 'A reminder before each event you are part of'],
  requirement_requests: ['Requirement requests', 'When Tangy needs something from you'],
  requirement_reviews: ['Requirement reviews', 'Feedback on what you submitted (or responses to review)'],
  messages: ['Messages', 'New messages in your conversations'],
  announcements: ['Announcements', 'Notices for your events and groups'],
  document_updates: ['Documents & media', 'New documents, media and asset reviews'],
  payment_updates: ['Payments & invoices', 'Invoices, fee status and payment alerts'],
  tasks: ['Tasks', 'Assigned and overdue tasks'],
  access: ['Check-in access', 'Volunteer check-in access granted, ending or revoked'],
  applications: ['Applications', 'New applications to review'],
};
export const PREF_KEYS_BY_ROLE = {
  artist: ['booking_requests', 'schedule_changes', 'event_updates', 'event_reminders', 'requirement_requests', 'requirement_reviews', 'messages', 'announcements', 'document_updates', 'payment_updates'],
  partner: ['schedule_changes', 'event_updates', 'event_reminders', 'requirement_requests', 'requirement_reviews', 'messages', 'announcements', 'document_updates', 'payment_updates'],
  volunteer: ['event_updates', 'event_reminders', 'announcements', 'tasks', 'access'],
  console: ['applications', 'messages', 'requirement_reviews', 'access', 'event_updates', 'tasks', 'payment_updates', 'booking_requests', 'document_updates'],
};

const Toggle = ({ on, onChange, label, disabled }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)}
    className={cx('relative inline-flex h-5 w-9 rounded-full border transition-colors disabled:opacity-40', on ? 'bg-[#1f8a5b] border-[#1f8a5b]' : 'bg-[#11100C] border-[#E7D5A4]/25')}>
    <span className={cx('absolute top-0.5 h-3.5 w-3.5 rounded-full bg-[#EFE2C0] transition-all', on ? 'left-[18px]' : 'left-0.5')} />
  </button>
);

export const NotificationPreferences = ({ keys }) => {
  const [prefs, setPrefs] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState('');
  const [saved, setSaved] = useState('');
  const load = () => rpc('my_notification_preferences').then((p) => { setPrefs(p); setError(null); }, setError);
  useEffect(() => { load(); }, []);

  const set = async (key, channel, value) => {
    setSaving(`${key}:${channel}`);
    setSaved('');
    try {
      if (key === 'email_enabled') await rpc('set_notification_preference', { p_pref: 'email_enabled', p_email: value });
      else await rpc('set_notification_preference', { p_pref: key, p_in_app: channel === 'in_app' ? value : null, p_email: channel === 'email' ? value : null });
      await load();
      setSaved('Saved');
    } catch (err) { setError(err); }
    finally { setSaving(''); }
  };

  return (
    <Panel title="Notifications" subtitle="Choose what reaches you in the app and by email." actions={saved && <span role="status" className="font-mono text-[11px] text-[#5fd3a0]">{saved}</span>}>
      {error ? <ErrorState error={error} onRetry={load} /> : !prefs ? <Skeleton rows={5} /> : (
        <div className="flex flex-col gap-4 font-sans" data-notification-preferences>
          <label className="flex items-center justify-between gap-3 bg-[#11100C] border border-[#C99A2E]/25 rounded px-3 py-2.5">
            <span><span className="block text-[14px] text-[#EFE2C0]">Email notifications</span><span className="block text-[12px] text-[#E7D5A4]/55">Master switch for all notification emails</span></span>
            <Toggle on={prefs.email_enabled} label="Email notifications" disabled={saving === 'email_enabled:email'} onChange={(v) => set('email_enabled', 'email', v)} />
          </label>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#E7D5A4]/60">
                <th className="font-normal py-2">Category</th><th className="font-normal py-2 text-center w-20">In-app</th><th className="font-normal py-2 text-center w-20">Email</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const p = prefs.prefs?.[k] || { in_app: true, email: true };
                return (
                  <tr key={k} className="border-t border-[#E7D5A4]/[0.06]">
                    <td className="py-2.5 pr-2"><span className="block text-[#EFE2C0]">{LABELS[k][0]}</span><span className="block text-[11.5px] text-[#E7D5A4]/60">{LABELS[k][1]}</span></td>
                    <td className="text-center"><Toggle on={p.in_app} label={`${LABELS[k][0]} in-app`} disabled={saving === `${k}:in_app`} onChange={(v) => set(k, 'in_app', v)} /></td>
                    <td className="text-center"><Toggle on={p.email && prefs.email_enabled} label={`${LABELS[k][0]} email`} disabled={!prefs.email_enabled || saving === `${k}:email`} onChange={(v) => set(k, 'email', v)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[11.5px] text-[#E7D5A4]/60">Cancellations, revoked access and payment problems are always shown in-app.</p>
        </div>
      )}
    </Panel>
  );
};
