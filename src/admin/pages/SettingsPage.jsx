import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from '../AdminSession';
import { adminApi, friendlyError } from '../api';
import { useAsync } from '../hooks';
import { ROLE_LABELS, CONSOLE_ROLES } from '../rbac';
import { Page, Panel, Button, Input, AsyncBlock, Badge, fmt, useToast } from '../ui';

const SettingRow = ({ s, onSaved }) => {
  const toast = useToast();
  const [value, setValue] = useState(s.value);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(value) !== JSON.stringify(s.value);
  const save = async (next = value) => {
    setBusy(true);
    try { await adminApi.updateSetting(s.key, next); toast(`${s.label} updated`); onSaved(); } catch (err) { toast(err.message, 'bad'); setValue(s.value); }
    setBusy(false);
  };
  return (
    <li className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-[#EFE2C0]">{s.label}</div>
        {s.description && <div className="text-[12px] text-[#E7D5A4]/50 mt-0.5">{s.description}</div>}
        <div className="font-mono text-[10.5px] text-[#E7D5A4]/30 mt-1">{s.key} · updated {fmt.relative(s.updated_at)}</div>
      </div>
      {s.value_type === 'boolean' ? (
        <button role="switch" aria-checked={!!value} aria-label={s.label} disabled={busy} onClick={() => { setValue(!value); save(!value); }}
          className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-[#C99A2E]' : 'bg-[#E7D5A4]/15'} disabled:opacity-50`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-[#11100C] transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <Input type={s.value_type === 'integer' ? 'number' : 'text'} min={s.value_type === 'integer' ? 0 : undefined} aria-label={s.label}
            value={value ?? ''} onChange={(e) => setValue(s.value_type === 'integer' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
            className="w-full sm:w-64" />
          <Button size="sm" variant="primary" disabled={!dirty || busy || value === ''} onClick={() => save()}>Save</Button>
        </div>
      )}
    </li>
  );
};

export default function SettingsPage() {
  const { reload: reloadSession } = useAdminSession();
  const settings = useAsync(async () => {
    const { data, error } = await supabase.from('system_settings').select('*').order('category').order('key');
    if (error) throw friendlyError(error);
    return data || [];
  }, []);
  const matrix = useAsync(async () => {
    const { data, error } = await supabase.from('role_permissions').select('role, permission');
    if (error) throw friendlyError(error);
    return data || [];
  }, []);

  const groups = {};
  (settings.data || []).forEach((s) => { (groups[s.category] = groups[s.category] || []).push(s); });
  const perms = [...new Set((matrix.data || []).map((r) => r.permission))].sort();
  const has = new Set((matrix.data || []).map((r) => `${r.role}:${r.permission}`));
  const onSaved = () => { settings.reload(); reloadSession(); };

  return (
    <Page title="System settings" subtitle="Super Admin only. Changes apply immediately and are recorded in the audit log. Secrets (Razorpay, Resend, service keys) live in Supabase Edge Function secrets and are never shown here.">
      <AsyncBlock loading={settings.loading} error={settings.error} onRetry={settings.reload} empty={Object.keys(groups).length === 0} emptyProps={{ title: 'No settings found', icon: 'Settings' }}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Object.entries(groups).map(([cat, rows]) => (
            <Panel key={cat} title={cat} flush>
              <ul className="divide-y divide-[#E7D5A4]/[0.06]">{rows.map((s) => <SettingRow key={`${s.key}-${s.updated_at}`} s={s} onSaved={onSaved} />)}</ul>
            </Panel>
          ))}
        </div>
      </AsyncBlock>
      <Panel title="Role permissions" subtitle="Enforced in the database (role_permissions + has_permission). Change via migration, not from the app." flush>
        <AsyncBlock loading={matrix.loading} error={matrix.error} empty={perms.length === 0}>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-[#C99A2E]/20">
                <th className="px-4 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/45">Permission</th>
                {CONSOLE_ROLES.map((r) => <th key={r} className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[#E7D5A4]/45">{ROLE_LABELS[r]}</th>)}
              </tr></thead>
              <tbody>
                {perms.map((p) => (
                  <tr key={p} className="border-b border-[#E7D5A4]/[0.06]">
                    <td className="px-4 py-1.5 font-mono text-[11.5px]">{p}</td>
                    {CONSOLE_ROLES.map((r) => <td key={r} className="px-4 py-1.5 text-center">{has.has(`${r}:${p}`) ? <Badge tone="good">Yes</Badge> : <span className="text-[#E7D5A4]/20">—</span>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncBlock>
      </Panel>
    </Page>
  );
}
