import { useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../AdminSession';
import { P } from '../rbac';
import { Page, Button } from '../ui';
import { AttendeesTable } from '../components/Attendees';

export default function AttendeesPage() {
  const [params] = useSearchParams();
  const { can } = useAdminSession();
  return (
    <Page
      title="Attendees"
      subtitle={can(P.ATTENDEES_ALL)
        ? 'One row per ticket across all events. Check people in manually if a QR code fails.'
        : 'Attendees for the events you are assigned to. Contact details are visible to admins only.'}
      actions={can(P.CHECKIN) && <Button variant="primary" icon="ScanLine" to="/check-in">QR check-in</Button>}
    >
      <AttendeesTable initialEventId={params.get('event') || ''} />
    </Page>
  );
}
