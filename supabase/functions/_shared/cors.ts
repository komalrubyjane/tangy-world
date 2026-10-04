// CORS for the browser-called Edge Functions. Every one of them also checks
// the caller's JWT, so CORS is defence in depth.
//
// Allowed origins come from ALLOWED_ORIGINS (comma separated) or, if that is
// unset, SITE_URL — each reduced to its origin (scheme + host + port). A
// request whose Origin is on that list gets exactly that origin back; any
// other origin gets no Access-Control-Allow-Origin at all, so the browser
// rejects the response. The answer is never `*` and never an origin that is
// not configured. With neither variable set (local development) only
// loopback origins (http://localhost:<port>, http://127.0.0.1:<port>) are
// allowed — a deployment that forgot SITE_URL fails closed.
const LOOPBACK = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;

const toOrigin = (value: string): string | null => {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
};

const allowList = (): string[] => (Deno.env.get('ALLOWED_ORIGINS') || Deno.env.get('SITE_URL') || '')
  .split(',').map(toOrigin).filter((o): o is string => o !== null);

// The request's own origin when it is allowed, otherwise null.
export function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  const origins = allowList();
  if (origins.length === 0) return LOOPBACK.test(origin) ? origin : null;
  return origins.includes(origin) ? origin : null;
}

export function corsFor(req: Request): Record<string, string> {
  const allow = allowedOrigin(req.headers.get('Origin'));
  return {
    ...(allow ? { 'Access-Control-Allow-Origin': allow } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

// JSON response carrying the CORS headers for this request's origin.
export function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(req), 'Content-Type': 'application/json' },
  });
}

export function handleOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsFor(req) });
  }
  return null;
}
