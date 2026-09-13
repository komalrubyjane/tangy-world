// Shared CORS headers for the razorpay-* Edge Functions. Restrict origin to
// your actual site domain(s) before going live — "*" is fine for local
// testing but wider than it needs to be for a function that creates orders.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function handleOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}
