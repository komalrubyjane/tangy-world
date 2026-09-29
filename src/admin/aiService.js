// Tangy AI — admin module seam. NOT connected to any model yet.
//
// Intended architecture (so this can be implemented without restructuring
// the admin system):
//   Admin UI (pages/AiPage.jsx)
//     → aiService.ask()                       (this file)
//     → Supabase Edge Function `admin-ai`      (not yet written)
//         · re-verifies has_permission('ai.use') under the caller's JWT
//         · gathers context ONLY via the existing read RPCs/views
//           (admin_dashboard_summary, report_*, applications_overview…),
//           never with the service role, so AI sees exactly what the caller may
//         · calls the model with the provider key held as a function secret
//         · writes an audit_logs row ('ai.query')
//   Answers must cite which RPC/view each number came from; the UI must label
//   AI output as generated and never write it back as system data.
export class AiNotConfiguredError extends Error {
  constructor() {
    super('Tangy AI is not connected yet.');
    this.code = 'ai-not-configured';
  }
}

export const aiService = {
  isConfigured: false,
  // Planned capabilities, shown in the UI as the roadmap.
  capabilities: [
    { id: 'summarize-day', label: "Summarize today's operations", sources: ['admin_dashboard_summary', 'staff_dashboard'] },
    { id: 'event-brief', label: 'Draft an event staff briefing', sources: ['events', 'event_assignments', 'event_tasks'] },
    { id: 'review-assist', label: 'Summarize a pending application', sources: ['applications_overview'] },
    { id: 'report-explain', label: 'Explain a report in plain language', sources: ['report_event_performance', 'report_revenue_by_month'] },
  ],
  async ask() {
    throw new AiNotConfiguredError();
  },
};
