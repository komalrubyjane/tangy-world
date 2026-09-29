import { useState } from 'react';
import { useDebounced, useServerTable } from '../hooks';
import { orIlike } from '../api';
import { AUDIT_GROUPS, auditLabel, auditSummary } from '../auditLabels';
import { Page, Panel, Toolbar, SearchInput, FilterSelect, Input, DataTable, Pagination, Badge, Drawer, fmt } from '../ui';

// Append-only (update/delete are blocked by a trigger, even for the table
// owner) and readable only with audit.view (Super Admin).
export default function AuditLogsPage() {
  const [group, setGroup] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [selected, setSelected] = useState(null);

  const table = useServerTable({
    table: 'audit_logs',
    pageSize: 50,
    deps: [group, from, to, q],
    build: (query) => {
      let x = query.order('created_at', { ascending: false });
      if (group) x = x.like('action', `${group}%`);
      if (from) x = x.gte('created_at', from);
      if (to) x = x.lt('created_at', new Date(new Date(to).getTime() + 86400000).toISOString());
      return orIlike(x, ['actor_email', 'action', 'resource_type', 'resource_id'], q);
    },
  });

  const columns = [
    { key: 'time', header: 'Time', render: (r) => <span className="font-mono text-[11.5px] whitespace-nowrap" title={r.created_at}>{fmt.dateTime(r.created_at)}</span> },
    { key: 'actor', header: 'Actor', render: (r) => (<div className="min-w-0"><div className="text-[#EFE2C0] truncate max-w-[200px]">{r.actor_email || 'System'}</div>{r.actor_role && <div className="font-mono text-[10px] uppercase text-[#E7D5A4]/40">{r.actor_role.replace('_', ' ')}</div>}</div>) },
    { key: 'action', header: 'Action', render: (r) => <span className="text-[13px]">{auditLabel(r.action)}</span> },
    { key: 'resource', header: 'Resource', mobileHidden: true, render: (r) => <span className="font-mono text-[11.5px] text-[#E7D5A4]/55">{r.resource_type}{r.resource_id ? ` · ${String(r.resource_id).slice(0, 8)}` : ''}</span> },
    { key: 'summary', header: 'Details', mobileHidden: true, render: (r) => <span className="text-[12px] text-[#E7D5A4]/55 truncate block max-w-[320px]">{auditSummary(r)}</span> },
  ];

  return (
    <Page title="Audit logs" subtitle="An append-only record of sign-ins, role changes, approvals, event and booking changes, check-ins, announcements and settings. It can't be edited or deleted from the app.">
      <Panel flush>
        <div className="p-3 border-b border-[#C99A2E]/15">
          <Toolbar right={<span className="font-mono text-[11px] text-[#E7D5A4]/45">{fmt.num(table.count)} entr{table.count === 1 ? 'y' : 'ies'}</span>}>
            <SearchInput value={search} onChange={setSearch} placeholder="Actor email, action, resource ID…" />
            <FilterSelect label="Action" value={group} onChange={setGroup} options={AUDIT_GROUPS} />
            <Input type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
            <Input type="date" aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
          </Toolbar>
        </div>
        <DataTable dense columns={columns} rows={table.rows} loading={table.loading} error={table.error} onRetry={table.reload} onRowClick={setSelected}
          empty={{ title: 'No log entries', hint: 'Try a wider date range.', icon: 'ScrollText' }} />
        <Pagination {...table} />
      </Panel>
      {selected && (
        <Drawer title={auditLabel(selected.action)} subtitle={fmt.dateTime(selected.created_at)} onClose={() => setSelected(null)}>
          <div className="flex gap-2"><Badge tone="gold">{selected.action}</Badge></div>
          <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-[13px]">
            {[['Actor', selected.actor_email || 'System'], ['Actor role', selected.actor_role], ['Resource', selected.resource_type], ['Resource ID', selected.resource_id], ['Event ID', selected.event_id], ['Timestamp', selected.created_at]].map(([k, v]) => (
              <div key={k} className="contents"><dt className="font-mono text-[10.5px] uppercase text-[#E7D5A4]/45 pt-0.5">{k}</dt><dd className="m-0 break-all">{v || '—'}</dd></div>
            ))}
          </dl>
          <pre className="text-[12px] bg-[#11100C] border border-[#C99A2E]/20 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(selected.metadata, null, 2)}</pre>
        </Drawer>
      )}
    </Page>
  );
}
