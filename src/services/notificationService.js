import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Thin client for the notification-tracking side of the approval lifecycle.
// Reading application_notifications is a normal RLS-authorized select (admin
// only — see 0015_application_lifecycle.sql); actually SENDING an email goes
// through the send-approval-email Edge Function, never a direct call from
// here, so RESEND_API_KEY is never anywhere near the browser.
export const notificationService = {
  // One row per (source_table, source_id, notification_type) — build a map
  // keyed by source_id so admin sections can look up "email: sent/failed/—"
  // per row without a second query per row.
  async getForSourceTable(sourceTable) {
    if (!isSupabaseConfigured) return {};
    const { data } = await supabase
      .from('application_notifications')
      .select('*')
      .eq('source_table', sourceTable)
      .eq('notification_type', 'approval');
    const map = {};
    (data || []).forEach((row) => { map[row.source_id] = row; });
    return map;
  },

  // Triggers (or re-triggers, with force:true) the approval email for one
  // application. Called right after the approve_* RPC succeeds.
  async sendApprovalEmail(sourceTable, sourceId, { force = false } = {}) {
    if (!isSupabaseConfigured) return { success: false, error: 'Not configured.' };
    const { data, error } = await supabase.functions.invoke('send-approval-email', {
      body: { source_table: sourceTable, source_id: sourceId, force },
    });
    if (error) return { success: false, error: error.message || 'Could not send email.' };
    if (data?.error) return { success: false, error: data.error };
    return { success: true, alreadySent: !!data?.already_sent };
  },
};
