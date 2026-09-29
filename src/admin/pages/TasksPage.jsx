import { useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../AdminSession';
import { P } from '../rbac';
import { Page } from '../ui';
import { TasksTable } from '../components/Tasks';

export default function TasksPage() {
  const [params] = useSearchParams();
  const { can } = useAdminSession();
  return (
    <Page
      title="Event tasks"
      subtitle={can(P.TEAM) ? 'Tasks across every event — by person, team or event. Switch to the board to move work along.' : 'Your checklist for the events you’re working.'}
    >
      <TasksTable initialStatus={params.get('status') ?? 'open'} initialMine={params.get('mine') === '1'} />
    </Page>
  );
}
