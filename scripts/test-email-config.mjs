// Unit checks for supabase/functions/_shared/email.ts provider selection
// (no Deno needed: Node 22.6+ strips the TypeScript types; Deno.env is
// shimmed and fetch stubbed, so nothing leaves the machine).
// Run: node scripts/test-email-config.mjs
const mod = await import('../supabase/functions/_shared/email.ts');

let env = {};
const calls = [];
globalThis.Deno = { env: { get: (k) => env[k] } };
globalThis.fetch = async (url, init) => { calls.push({ url: String(url), body: JSON.parse(init.body) }); return { ok: true, status: 200, text: async () => '' }; };
const logs = [];
const origLog = console.log; console.log = (...a) => logs.push(a.join(' '));

let failed = 0;
const check = (cond, label) => { origLog(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failed++; };
const msg = { to: 'a@example.com', subject: 'Hello', html: '<p>secret body</p>', text: 'secret body' };

env = {};
let r = await mod.sendEmail(msg);
check(!r.ok && r.notConfigured && calls.length === 0, 'no RESEND_API_KEY: not configured, nothing sent, no crash');
check(mod.emailConfig().configured === false, 'emailConfig reports not configured');

env = { EMAIL_PROVIDER: 'disabled', RESEND_API_KEY: 'x' };
r = await mod.sendEmail(msg);
check(!r.ok && r.notConfigured && calls.length === 0, 'EMAIL_PROVIDER=disabled sends nothing even with a key');

env = { EMAIL_PROVIDER: 'log' };
r = await mod.sendEmail(msg);
check(r.ok && calls.length === 0 && logs.some((l) => l.includes('to=a@example.com')) && !logs.some((l) => l.includes('secret body')), 'log provider logs recipient/subject only, never the body');

env = { RESEND_API_KEY: 're_test', EMAIL_FROM: 'Tangy <hi@tangy.test>', EMAIL_REPLY_TO: 'team@tangy.test' };
r = await mod.sendEmail({ ...msg, attachments: [{ filename: 'pass.png', content: 'AAAA' }] });
const sent = calls.at(-1);
check(r.ok && sent.url === 'https://api.resend.com/emails', 'resend is used when a key is set');
check(sent.body.from === 'Tangy <hi@tangy.test>' && sent.body.reply_to === 'team@tangy.test' && sent.body.attachments.length === 1, 'EMAIL_FROM, EMAIL_REPLY_TO and attachments are passed');

env = { RESEND_API_KEY: 're_test', RESEND_FROM_EMAIL: 'Old <old@tangy.test>' };
await mod.sendEmail(msg);
check(calls.at(-1).body.from === 'Old <old@tangy.test>', 'RESEND_FROM_EMAIL still works as the sender');

env = { EMAIL_PROVIDER: 'carrier-pigeon', RESEND_API_KEY: 'x' };
r = await mod.sendEmail(msg);
check(!r.ok && r.notConfigured, 'an unknown provider is treated as not configured');

console.log = origLog;
console.log(failed ? `${failed} FAILED` : 'ALL EMAIL CONFIG CHECKS PASSED');
process.exit(failed ? 1 : 0);
