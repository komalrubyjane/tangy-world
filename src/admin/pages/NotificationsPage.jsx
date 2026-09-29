import { useSearchParams } from 'react-router-dom';
import { Page, Tabs } from '../ui';
import { NotificationsPanel } from '../../portal/PortalSections';
import { NotificationPreferences, PREF_KEYS_BY_ROLE } from '../../portal/NotificationPreferences';

export default function NotificationsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'settings' ? 'settings' : 'inbox';
  return (
    <Page title="Notifications" subtitle="Applications, partner messages, access requests and event updates addressed to you.">
      <Tabs value={tab} onChange={(t) => setParams(t === 'settings' ? { tab: 'settings' } : {}, { replace: true })}
        tabs={[{ id: 'inbox', label: 'Inbox' }, { id: 'settings', label: 'Preferences' }]} />
      {tab === 'settings' ? <NotificationPreferences keys={PREF_KEYS_BY_ROLE.console} /> : <NotificationsPanel settingsTo="/admin-portal/notifications?tab=settings" />}
    </Page>
  );
}
