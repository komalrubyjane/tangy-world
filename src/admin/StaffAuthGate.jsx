import { AdminSessionProvider } from './AdminSession';
import { AdminGate } from './AdminGate';
import { P } from './rbac';

// Gate for standalone staff surfaces outside the /admin shell (the check-in
// terminal and the /admin/preview/* portal inspectors). Same sign-in (email
// OTP) and the same database permission model as the console — access is a
// permission from role_permissions, not a role string compared in the browser.
//
// `allowedRoles` is kept for existing call sites: a list that includes
// 'staff' means "anyone who can check in"; otherwise it means admin-level
// operations access.
export const StaffAuthGate = ({ title, subtitle, allowedRoles = ['staff', 'admin', 'super_admin'], requires, children }) => {
  const permission = requires || (allowedRoles.includes('staff') ? P.CHECKIN : P.OPERATIONS);
  return (
    <AdminSessionProvider>
      <AdminGate requires={permission} title={title} subtitle={subtitle}>
        {children}
      </AdminGate>
    </AdminSessionProvider>
  );
};
