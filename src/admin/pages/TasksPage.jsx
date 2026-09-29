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
      subtitle={can(P.TEAM) ? 'Tasks across every event team. Add tasks from an event’s team tabs.' : 'Your checklist for the events you’re working.'}
    >
      <TasksTable initialStatus={params.get('status') ?? 'open'} />
    </Page>
  );
}
