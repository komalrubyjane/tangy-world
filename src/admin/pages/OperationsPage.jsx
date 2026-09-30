import { useParams, Navigate } from 'react-router-dom';
import { Page, NotFound } from '../ui';
import { InboxSection } from '../sections/InboxSection';
import { PrivateEnquiriesSection, ContactEnquiriesSection } from '../sections/EnquiriesSection';
import { WaitlistSection } from '../sections/WaitlistSection';
import { NotificationsSection } from '../sections/NotificationsSection';
import { PortalsSection } from '../sections/PortalsSection';

// The pre-existing control-room sections, kept working inside the new shell.
const SECTIONS = {
  inbox: { title: 'Messages', component: InboxSection },
  enquiries: { title: 'Private session enquiries', component: PrivateEnquiriesSection },
  contact: { title: 'Contact messages', component: ContactEnquiriesSection },
  waitlist: { title: 'Waitlist', component: WaitlistSection },
  notifications: { title: 'Email delivery', component: NotificationsSection },
  portals: { title: 'View portals', component: PortalsSection },
};

export default function OperationsPage() {
  const { section } = useParams();
  // Tangy TV moved into the content CMS (database-backed, 0028).
  if (section === 'tv') return <Navigate to="/admin-portal/content/tv" replace />;
  const s = SECTIONS[section];
  if (!s) return <NotFound />;
  const Cmp = s.component;
  return (
    <Page title={s.title}>
      <div className={section === 'notifications' ? '' : 'font-mono'}><Cmp basePath="/admin/preview" onNavigate={() => {}} /></div>
    </Page>
  );
}
