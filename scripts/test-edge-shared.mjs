// Unit checks for supabase/functions/_shared/cors.ts and crypto.ts (no Deno:
// Node strips the types; Deno.env is shimmed).
// Run: node scripts/test-edge-shared.mjs
let env = {};
globalThis.Deno = { env: { get: (k) => env[k] } };
let failed = 0;
const check = (cond, label) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failed++; };
const req = (origin) => new Request('https://fn.example/x', { method: 'OPTIONS', headers: origin ? { Origin: origin } : {} });

const cors = await import('../supabase/functions/_shared/cors.ts');
env = {};
check(cors.corsFor(req('https://evil.example'))['Access-Control-Allow-Origin'] === undefined && cors.corsFor(req('http://127.0.0.1:5173'))['Access-Control-Allow-Origin'] === 'http://127.0.0.1:5173', 'no ALLOWED_ORIGINS/SITE_URL (local dev): loopback only, never "*"');
env = { SITE_URL: 'https://tangysessions.com/' };
check(cors.corsFor(req('https://tangysessions.com'))['Access-Control-Allow-Origin'] === 'https://tangysessions.com', 'SITE_URL origin is echoed');
check(cors.corsFor(req('https://evil.example'))['Access-Control-Allow-Origin'] === undefined, 'another origin is not allowed (no Access-Control-Allow-Origin)');
env = { ALLOWED_ORIGINS: 'https://tangysessions.com, https://www.tangysessions.com', SITE_URL: 'https://x.example' };
check(cors.corsFor(req('https://www.tangysessions.com'))['Access-Control-Allow-Origin'] === 'https://www.tangysessions.com', 'ALLOWED_ORIGINS list is honoured (and wins over SITE_URL)');
check(cors.corsFor(req('https://www.tangysessions.com')).Vary === 'Origin', 'Vary: Origin is set when restricted');
const pre = cors.handleOptions(req('https://www.tangysessions.com'));
check(pre && pre.headers.get('Access-Control-Allow-Origin') === 'https://www.tangysessions.com', 'preflight uses the allowlist');

const c = await import('../supabase/functions/_shared/crypto.ts');
// RFC 4231 test case 2.
check(await c.hmacSha256Hex('Jefe', 'what do ya want for nothing?') === '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843', 'HMAC-SHA256 matches the RFC 4231 vector');
check(c.timingSafeEqual('abc123', 'abc123') && !c.timingSafeEqual('abc123', 'abc124') && !c.timingSafeEqual('abc', 'abcd') && !c.timingSafeEqual('a', undefined), 'constant-time compare: equal / differ / length / non-string');
env = {};
check(c.requireSecret('RAZORPAY_WEBHOOK_SECRET') === null, 'a missing secret is reported as missing (never "undefined")');
env = { RAZORPAY_WEBHOOK_SECRET: 'short' };
check(c.requireSecret('RAZORPAY_WEBHOOK_SECRET') === null, 'an implausibly short secret is refused');
env = { RAZORPAY_WEBHOOK_SECRET: 'whsec_local_long_value' };
check(c.requireSecret('RAZORPAY_WEBHOOK_SECRET') === 'whsec_local_long_value', 'a configured secret is returned');

console.log(failed ? `${failed} FAILED` : 'ALL EDGE SHARED-MODULE CHECKS PASSED');
process.exit(failed ? 1 : 0);
