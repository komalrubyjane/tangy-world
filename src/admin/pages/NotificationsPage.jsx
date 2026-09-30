import { useSearchParams, Navigate } from 'react-router-dom';
import { Page, Tabs } from '../ui';
import { NotificationsPanel } from '../../portal/PortalSections';
import { NotificationPreferences, PREF_KEYS_BY_ROLE } from '../../portal/NotificationPreferences';

// /admin-portal/notifications (inbox) and /admin-portal/notifications/settings.
export default function NotificationsPage({ section = 'inbox' }) {
  const [params] = useSearchParams();
  if (params.get('tab') === 'settings') return <Navigate to="/admin-portal/notifications/settings" replace />;
  return (
    <Page title="Notifications" subtitle="Applications, partner messages, access requests and event updates addressed to you."
      crumbs={section === 'settings' ? [{ label: 'Preferences' }] : undefined}>
      <Tabs value={section} tabs={[{ id: 'inbox', label: 'Inbox', to: '/admin-portal/notifications' }, { id: 'settings', label: 'Preferences', to: '/admin-portal/notifications/settings' }]} />
      {section === 'settings' ? <NotificationPreferences keys={PREF_KEYS_BY_ROLE.console} /> : <NotificationsPanel settingsTo="/admin-portal/notifications/settings" />}
    </Page>
  );
}
