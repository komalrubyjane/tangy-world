import { useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../AdminSession';
import { P } from '../rbac';
import { Page, Button } from '../ui';
import { CheckinHistoryTable } from '../components/CheckinHistory';

export default function CheckInHistoryPage() {
  const [params] = useSearchParams();
  const { can } = useAdminSession();
  return (
    <Page
      title="Check-in history"
      subtitle="Every admission recorded at the door — by QR scan or manual check-in — and who recorded it."
      actions={can(P.CHECKIN) && <Button variant="primary" icon="ScanLine" to="/check-in">Open check-in</Button>}
    >
      <CheckinHistoryTable initialMine={params.get('mine') === '1'} />
    </Page>
  );
}
