// CORS for the browser-called Edge Functions. Every one of them also checks
// the caller's JWT, so CORS is defence in depth. Allowed origins come from
// ALLOWED_ORIGINS (comma separated) or SITE_URL; only when neither is set
// (local development) is any origin allowed.
const allowList = () => (Deno.env.get('ALLOWED_ORIGINS') || Deno.env.get('SITE_URL') || '')
  .split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);

export function corsFor(req: Request): Record<string, string> {
  const origins = allowList();
  const origin = req.headers.get('Origin') || '';
  const allow = origins.length === 0 ? '*' : origins.includes(origin) ? origin : origins[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...(origins.length ? { Vary: 'Origin' } : {}),
  };
}

// Default headers for responses built without the request at hand (kept for
// existing callers; handleOptions and the json helpers use corsFor).
export const corsHeaders = {
  'Access-Control-Allow-Origin': allowList()[0] || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function handleOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsFor(req) });
  }
  return null;
}
