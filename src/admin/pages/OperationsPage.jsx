import { useParams } from 'react-router-dom';
import { Page, NotFound } from '../ui';
import { InboxSection } from '../sections/InboxSection';
import { PrivateEnquiriesSection, ContactEnquiriesSection } from '../sections/EnquiriesSection';
import { WaitlistSection } from '../sections/WaitlistSection';
import { NotificationsSection } from '../sections/NotificationsSection';
import { PortalsSection } from '../sections/PortalsSection';
import { TVChannelsSection } from '../sections/TVChannelsSection';

// The pre-existing control-room sections, kept working inside the new shell.
const SECTIONS = {
  inbox: { title: 'Messages', component: InboxSection },
  enquiries: { title: 'Private session enquiries', component: PrivateEnquiriesSection },
  contact: { title: 'Contact messages', component: ContactEnquiriesSection },
  waitlist: { title: 'Waitlist', component: WaitlistSection },
  notifications: { title: 'Email notifications', component: NotificationsSection },
  portals: { title: 'View portals', component: PortalsSection },
  tv: { title: 'Tangy TV', component: TVChannelsSection },
};

export default function OperationsPage() {
  const { section } = useParams();
  const s = SECTIONS[section];
  if (!s) return <NotFound />;
  const Cmp = s.component;
  return (
    <Page title={s.title}>
      <div className="font-mono"><Cmp basePath="/admin/preview" onNavigate={() => {}} /></div>
    </Page>
  );
}
