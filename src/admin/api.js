import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Every admin data call goes through here so errors are mapped to safe,
// human messages in one place (never raw SQL/RLS internals). The database
// enforces every rule — these wrappers only shape calls and errors.

export class AdminApiError extends Error {
  constructor(message, { code, forbidden = false } = {}) {
    super(message);
    this.code = code;
    this.forbidden = forbidden;
  }
}

// Messages raised by our own RPCs (0017/0018 migrations) are written for
// humans and safe to show. Everything else gets a generic message.
const SAFE_RPC_MESSAGE = /^(You |Only |A |An |This |Cannot |Invalid |Unknown |Not enough|Booking not|Ticket not|User not|Application not|Event not|Attendee |Quantity |Unsupported |Messaging |Messages |Temporary |Check-in |Choose |Requirement|Tell |Please |Grant |Conversation |That |Your |Role |Request )/;

export function friendlyError(error) {
  if (!error) return null;
  const message = error.message || String(error);
  const code = error.code;
  if (code === '42501' || /row-level security|permission denied/i.test(message)) {
    return new AdminApiError("You don't have permission to do that.", { code, forbidden: true });
  }
  if (/Failed to fetch|NetworkError|network/i.test(message)) {
    return new AdminApiError('Network error — check your connection and try again.', { code });
  }
  if (code === '23505') return new AdminApiError('That already exists.', { code });
  if (code === 'P0001' && SAFE_RPC_MESSAGE.test(message)) {
    return new AdminApiError(message, { code, forbidden: /permission/i.test(message) });
  }
  if (SAFE_RPC_MESSAGE.test(message) && message.length < 200) return new AdminApiError(message, { code });
  if (import.meta.env.DEV) console.error('[admin api]', error);
  return new AdminApiError('Something went wrong. Please try again.', { code });
}

function client() {
  if (!isSupabaseConfigured) throw new AdminApiError('Backend not connected.', { code: 'not-configured' });
  return supabase;
}

export async function rpc(name, args) {
  const { data, error } = await client().rpc(name, args);
  if (error) throw friendlyError(error);
  return data;
}

// Runs a query builder and returns { rows, count }. `build` receives a
// PostgREST query already scoped to `table` with an exact count.
export async function list(table, { select = '*', build, from = 0, to = 24, count = 'exact' } = {}) {
  let q = client().from(table).select(select, { count });
  if (build) q = build(q);
  const { data, error, count: total } = await q.range(from, to);
  if (error) throw friendlyError(error);
  return { rows: data || [], count: total ?? (data || []).length };
}

export async function one(table, { select = '*', match }) {
  let q = client().from(table).select(select);
  Object.entries(match).forEach(([k, v]) => { q = q.eq(k, v); });
  const { data, error } = await q.maybeSingle();
  if (error) throw friendlyError(error);
  return data;
}

export async function insert(table, values, { select = '*' } = {}) {
  const { data, error } = await client().from(table).insert(values).select(select).single();
  if (error) throw friendlyError(error);
  return data;
}

export async function update(table, id, values, { select = '*' } = {}) {
  const { data, error } = await client().from(table).update(values).eq('id', id).select(select).maybeSingle();
  if (error) throw friendlyError(error);
  // RLS turns an unauthorized UPDATE into "0 rows" rather than an error.
  if (!data) throw new AdminApiError("You don't have permission to change this record.", { forbidden: true });
  return data;
}

export async function remove(table, id) {
  const { error, count } = await client().from(table).delete({ count: 'exact' }).eq('id', id);
  if (error) throw friendlyError(error);
  if (count === 0) throw new AdminApiError("You don't have permission to delete this record.", { forbidden: true });
}

// Escape user input for PostgREST `or=(...ilike...)` filters.
export function ilikeTerm(term) {
  return `%${String(term).trim().replace(/[%_,()*\\]/g, (c) => `\\${c}`)}%`;
}

export function orIlike(q, columns, term) {
  if (!term || !term.trim()) return q;
  const t = ilikeTerm(term);
  return q.or(columns.map((c) => `${c}.ilike.${t}`).join(','));
}

// ---------------------------------------------------------------------------
// Typed wrappers for the admin RPCs.
// ---------------------------------------------------------------------------

export const adminApi = {
  myPermissions: () => rpc('my_permissions'),
  runtimeSettings: () => rpc('get_runtime_settings'),
  logAuthEvent: (action) => rpc('log_auth_event', { p_action: action }).catch(() => null),

  dashboardSummary: () => rpc('admin_dashboard_summary'),
  staffDashboard: () => rpc('staff_dashboard'),

  approveApplication: (sourceTable, id, notes) => rpc(APPROVE_RPC[sourceTable], { p_id: id, p_notes: notes || null }),
  rejectApplication: (sourceTable, id, reason) => rpc(REJECT_RPC[sourceTable], { p_id: id, p_reason: reason || null }),

  cancelBooking: (id, reason) => rpc('admin_cancel_booking', { p_booking_id: id, p_reason: reason }),
  recordRefund: (id, reason, reference) => rpc('admin_record_refund', { p_booking_id: id, p_reason: reason, p_reference: reference }),
  cancelTicket: (id, reason) => rpc('admin_cancel_ticket', { p_ticket_id: id, p_reason: reason }),
  createCompBooking: (args) => rpc('admin_create_comp_booking', {
    p_event_id: args.eventId,
    p_attendee_name: args.name,
    p_attendee_email: args.email,
    p_attendee_phone: args.phone || null,
    p_quantity: Number(args.quantity),
    p_tier: args.tier,
    p_note: args.note,
  }),

  checkIn: (token, eventId, method = 'qr', notes = null) => rpc('check_in_ticket', { p_token: token, p_event_id: eventId, p_method: method, p_notes: notes }),
  myCheckinEvents: () => rpc('my_checkin_events'),
  eventCheckinStats: (eventId) => rpc('event_checkin_stats', { p_event_id: eventId }),
  checkinHistory: ({ eventId = null, mine = false, limit = 50, offset = 0 } = {}) =>
    rpc('get_checkin_history', { p_event_id: eventId, p_mine: mine, p_limit: limit, p_offset: offset }),

  setUserRole: (userId, role, reason) => rpc('admin_set_user_role', { p_user_id: userId, p_role: role, p_reason: reason || null }),
  setUserActive: (userId, active, reason) => rpc('admin_set_user_active', { p_user_id: userId, p_active: active, p_reason: reason || null }),

  updateSetting: (key, value) => rpc('update_system_setting', { p_key: key, p_value: value }),

  reportEventPerformance: (from, to) => rpc('report_event_performance', { p_from: from || null, p_to: to || null }),
  reportRevenueByMonth: (from, to) => rpc('report_revenue_by_month', { p_from: from || null, p_to: to || null }),
  reportApplications: (from, to) => rpc('report_applications', { p_from: from || null, p_to: to || null }),
  reportStaffActivity: (from, to) => rpc('report_staff_activity', { p_from: from || null, p_to: to || null }),

  // Creating a login needs the service role key, so it runs in an Edge
  // Function that re-verifies the caller is a super admin.
  inviteUser: async ({ email, fullName, role }) => {
    const { data, error } = await client().functions.invoke('admin-invite-user', { body: { email, full_name: fullName, role } });
    if (error) throw new AdminApiError(data?.error || error.message || 'Could not invite user.');
    if (data?.error) throw new AdminApiError(data.error);
    return data;
  },
};

const APPROVE_RPC = {
  artists: 'approve_artist_application',
  collaborations: 'approve_collaboration',
  crew_applications: 'approve_crew_application',
};
const REJECT_RPC = {
  artists: 'reject_artist_application',
  collaborations: 'reject_collaboration',
  crew_applications: 'reject_crew_application',
};
