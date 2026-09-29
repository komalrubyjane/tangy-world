// Human labels for audit_logs.action values written by the 0017/0018 migrations.
export const AUDIT_ACTIONS = {
  'auth.login': 'Signed in',
  'auth.logout': 'Signed out',
  'auth.session_expired': 'Signed out (idle timeout)',
  'user.role_changed': 'Changed role',
  'user.deactivated': 'Deactivated account',
  'user.reactivated': 'Reactivated account',
  'user.invited': 'Invited user',
  'application.approved': 'Approved application',
  'application.rejected': 'Rejected application',
  'event.created': 'Created event',
  'event.updated': 'Updated event',
  'event.deleted': 'Deleted event',
  'event_artist.created': 'Added artist to event',
  'event_artist.deleted': 'Removed artist from event',
  'assignment.created': 'Assigned team member',
  'assignment.updated': 'Updated assignment',
  'assignment.deleted': 'Removed assignment',
  'venue.created': 'Created venue',
  'venue.updated': 'Updated venue',
  'venue.deleted': 'Deleted venue',
  'booking.cancelled': 'Cancelled booking',
  'booking.comp_created': 'Created complimentary booking',
  'booking.status_changed': 'Booking status changed',
  'payment.refund_recorded': 'Recorded refund',
  'ticket.cancelled': 'Cancelled ticket',
  'checkin.scan': 'Checked in (QR)',
  'checkin.manual': 'Checked in (manual)',
  'announcement.created': 'Created announcement',
  'announcement.updated': 'Updated announcement',
  'announcement.deleted': 'Deleted announcement',
  'settings.updated': 'Changed setting',
  'access.granted': 'Granted volunteer check-in access',
  'access.revoked': 'Revoked volunteer check-in access',
  'access.expired': 'Volunteer check-in access expired',
  'access.requested': 'Requested check-in access',
  'access.request_declined': 'Declined check-in access request',
  'message.sent': 'Sent partner message',
  'permission.granted': 'Granted role permission',
  'permission.revoked': 'Removed role permission',
  'event_requirement.created': 'Requested information from partner',
  'event_requirement.updated': 'Updated requirement',
  'event_requirement.deleted': 'Deleted requirement',
  'event_document.created': 'Shared document',
  'event_document.updated': 'Updated document',
  'event_document.deleted': 'Removed document',
  'event_artist_details.created': 'Set artist logistics',
  'event_artist_details.updated': 'Updated artist logistics',
  'event_artist_details.deleted': 'Removed artist logistics',
};

export const AUDIT_GROUPS = [
  { value: '', label: 'All actions' },
  { value: 'auth.', label: 'Sign-in / out' },
  { value: 'user.', label: 'Users & roles' },
  { value: 'application.', label: 'Applications' },
  { value: 'event', label: 'Events & team' },
  { value: 'booking.', label: 'Bookings' },
  { value: 'payment.', label: 'Payments' },
  { value: 'ticket.', label: 'Tickets' },
  { value: 'checkin.', label: 'Check-ins' },
  { value: 'announcement.', label: 'Announcements' },
  { value: 'settings.', label: 'Settings' },
  { value: 'access.', label: 'Volunteer access' },
  { value: 'message.', label: 'Messages' },
  { value: 'permission.', label: 'Permissions' },
];

export const auditLabel = (action) => AUDIT_ACTIONS[action] || action;

// One-line context for a log row, built only from non-sensitive metadata.
export function auditSummary(row) {
  const m = row.metadata || {};
  switch (row.action) {
    case 'user.role_changed': return `${m.from} → ${m.to}${m.reason ? ` · ${m.reason}` : ''}`;
    case 'application.approved':
    case 'application.rejected': return [m.type, m.applicant, m.reason || m.notes].filter(Boolean).join(' · ');
    case 'booking.cancelled':
    case 'payment.refund_recorded': return [m.registration_code, m.reason, m.refund_reference].filter(Boolean).join(' · ');
    case 'booking.status_changed': return `${m.registration_code}: ${m.from} → ${m.to}`;
    case 'booking.comp_created': return `${m.registration_code} · ${m.quantity} × ${m.tier} · ${m.note}`;
    case 'checkin.scan':
    case 'checkin.manual': return [m.ticket_number, m.notes].filter(Boolean).join(' · ');
    case 'settings.updated': return `${row.resource_id}: ${JSON.stringify(m.before)} → ${JSON.stringify(m.after)}`;
    default:
      if (m.changed) return `Changed ${m.changed.join(', ')}`;
      return m.name || m.reason || '';
  }
}
