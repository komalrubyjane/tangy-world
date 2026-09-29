import { aiService } from '../aiService';
import { Page, Panel, Badge, Textarea, Button } from '../ui';

// Deliberately no fake chat: until the admin-ai Edge Function exists this page
// documents the module and keeps the input disabled.
export default function AiPage() {
  return (
    <Page title="Tangy AI" subtitle="An assistant for operational questions, grounded only in data your role can already see.">
      <Panel title="Status">
        <div className="flex items-center gap-2"><Badge tone={aiService.isConfigured ? 'good' : 'muted'}>{aiService.isConfigured ? 'Connected' : 'Not connected'}</Badge>
          <span className="text-[13px] text-[#E7D5A4]/65">No AI model is connected, so no answers are generated. Nothing on this page is AI output.</span></div>
        <div className="mt-4 flex flex-col gap-2">
          <Textarea rows={3} disabled placeholder="Ask about today's events, applications or reports…" />
          <div><Button variant="primary" disabled>Ask Tangy AI</Button></div>
        </div>
      </Panel>
      <Panel title="Planned capabilities" subtitle="Each reads only through existing, permission-checked database functions" flush>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {aiService.capabilities.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="text-[13.5px] text-[#EFE2C0]">{c.label}</div>
              <div className="font-mono text-[11px] text-[#E7D5A4]/40 mt-0.5">{c.sources.join(' · ')}</div>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="How it plugs in">
        <ol className="list-decimal pl-5 text-[13px] text-[#E7D5A4]/70 flex flex-col gap-1.5">
          <li>Write a Supabase Edge Function <code className="font-mono text-[12px]">admin-ai</code> holding the model API key as a secret.</li>
          <li>It re-checks <code className="font-mono text-[12px]">has_permission('ai.use')</code> with the caller's JWT and fetches context through the existing report RPCs — never the service role.</li>
          <li>Implement <code className="font-mono text-[12px]">aiService.ask()</code> in <code className="font-mono text-[12px]">src/admin/aiService.js</code> and set <code className="font-mono text-[12px]">isConfigured</code>. No other admin code changes.</li>
        </ol>
      </Panel>
    </Page>
  );
}
