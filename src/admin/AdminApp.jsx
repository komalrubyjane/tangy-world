import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AdminSessionProvider, useAdminSession } from './AdminSession';
import { AdminGate } from './AdminGate';
import { AdminShell } from './AdminShell';
import { ToastProvider, Forbidden, NotFound, Skeleton } from './ui';
import { P, LEGACY_TAB_ROUTES } from './rbac';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const MyEventsPage = lazy(() => import('./pages/MyEventsPage'));
const StaffEventPage = lazy(() => import('./pages/StaffEventPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const AttendeesPage = lazy(() => import('./pages/AttendeesPage'));
const CheckInHistoryPage = lazy(() => import('./pages/CheckInHistoryPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const PeoplePage = lazy(() => import('./pages/PeoplePage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const StaffAnnouncementsPage = lazy(() => import('./pages/StaffAnnouncementsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AiPage = lazy(() => import('./pages/AiPage'));
const OperationsPage = lazy(() => import('./pages/OperationsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const VolunteersPage = lazy(() => import('./pages/VolunteersPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));

// Route-level guard. Hiding a nav item is not security — this renders the
// Forbidden state for direct URL access, and the database refuses the data.
const Guard = ({ requires, anyOf, children }) => {
  const { can } = useAdminSession();
  return can(requires, anyOf) ? children : <Forbidden />;
};

const DashboardIndex = () => {
  const [params] = useSearchParams();
  const tab = params.get('tab');
  if (tab && LEGACY_TAB_ROUTES[tab]) return <Navigate to={LEGACY_TAB_ROUTES[tab]} replace />;
  return <DashboardPage />;
};

export const AdminApp = () => (
  <AdminSessionProvider>
    <AdminGate>
      <ToastProvider>
        <AdminShell>
          <Suspense fallback={<Skeleton rows={8} />}>
            <Routes>
              <Route index element={<Guard requires={P.DASHBOARD}><DashboardIndex /></Guard>} />
              <Route path="applications" element={<Guard requires={P.APPLICATIONS_VIEW}><ApplicationsPage /></Guard>} />
              <Route path="events" element={<Guard requires={P.EVENTS_ALL}><EventsPage /></Guard>} />
              <Route path="events/:id" element={<Guard requires={P.EVENTS_ALL}><EventDetailPage /></Guard>} />
              <Route path="my-events" element={<Guard requires={P.EVENTS_ASSIGNED}><MyEventsPage /></Guard>} />
              <Route path="my-events/:id" element={<Guard requires={P.EVENTS_ASSIGNED}><StaffEventPage /></Guard>} />
              <Route path="event-info" element={<Guard requires={P.EVENTS_ASSIGNED}><MyEventsPage infoMode /></Guard>} />
              <Route path="bookings" element={<Guard requires={P.BOOKINGS_ALL}><BookingsPage /></Guard>} />
              <Route path="attendees" element={<Guard anyOf={[P.ATTENDEES_ALL, P.ATTENDEES_ASSIGNED]}><AttendeesPage /></Guard>} />
              <Route path="check-ins" element={<Guard requires={P.CHECKIN_HISTORY}><CheckInHistoryPage /></Guard>} />
              <Route path="tasks" element={<Guard anyOf={[P.TASKS_OWN, P.TEAM]}><TasksPage /></Guard>} />
              <Route path="people" element={<Guard requires={P.ENTITIES}><PeoplePage /></Guard>} />
              <Route path="people/:kind" element={<Guard requires={P.ENTITIES}><PeoplePage /></Guard>} />
              <Route path="reviews" element={<Guard requires={P.ENTITIES}><ReviewsPage /></Guard>} />
              <Route path="invoices" element={<Guard requires={[P.PAYMENTS, P.BOOKINGS_MANAGE]}><InvoicesPage /></Guard>} />
              <Route path="team" element={<Guard requires={P.TEAM}><TeamPage /></Guard>} />
              <Route path="users" element={<Guard requires={P.USERS_MANAGE}><UsersPage /></Guard>} />
              <Route path="content" element={<Guard requires={P.CONTENT}><ContentPage /></Guard>} />
              <Route path="announcements" element={<Guard requires={P.ANNOUNCEMENTS_VIEW}><StaffAnnouncementsPage /></Guard>} />
              <Route path="reports" element={<Guard requires={P.REPORTS}><ReportsPage /></Guard>} />
              <Route path="audit" element={<Guard requires={P.AUDIT}><AuditLogsPage /></Guard>} />
              <Route path="settings" element={<Guard requires={P.SETTINGS}><SettingsPage /></Guard>} />
              <Route path="ai" element={<Guard requires={P.AI}><AiPage /></Guard>} />
              <Route path="messages" element={<Guard requires={P.MESSAGES}><MessagesPage /></Guard>} />
              <Route path="volunteers" element={<Guard requires={P.VOLUNTEERS}><VolunteersPage /></Guard>} />
              <Route path="roles" element={<Guard requires={P.ROLES}><RolesPage /></Guard>} />
              <Route path="notifications" element={<Guard requires={P.DASHBOARD}><NotificationsPage /></Guard>} />
              <Route path="ops/:section" element={<Guard requires={P.OPERATIONS}><OperationsPage /></Guard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AdminShell>
      </ToastProvider>
    </AdminGate>
  </AdminSessionProvider>
);
