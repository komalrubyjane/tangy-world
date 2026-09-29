import { Page } from '../ui';
import { NotificationsPanel } from '../../portal/PortalSections';

export default function NotificationsPage() {
  return (
    <Page title="Notifications" subtitle="Applications, partner messages, access requests and event updates addressed to you.">
      <NotificationsPanel />
    </Page>
  );
}
