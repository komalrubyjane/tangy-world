import { RoleApplicationDashboard } from './RoleApplicationDashboard';

const CONFIG = {
  icon: '💌',
  label: 'Private Sessions',
  applicationTable: 'private_enquiries',
  applyRoute: '/private-sessions',
};

export const PrivateDashboard = () => <RoleApplicationDashboard config={CONFIG} />;
