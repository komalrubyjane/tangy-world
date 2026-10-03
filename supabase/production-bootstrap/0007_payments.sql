-- Tangy Sessions — Razorpay verification support.
--
-- `bookings` already carries razorpay_order_id/razorpay_payment_id (0001).
-- What's missing: an explicit flag that a payment's signature was actually
-- verified server-side (never inferred from the mere presence of a payment
-- id, which a client could set on its own if it could write these columns —
-- it can't, since only the razorpay-* Edge Functions touch them, using the
-- service role key, never the anon/authenticated client), a 'paid' status
-- distinct from the pre-payment-gate 'confirmed' default, and an idempotency
-- table for the Razorpay webhook (the same event can be delivered more than
-- once — Razorpay's own docs say so — so processing must be safe to repeat).

alter table bookings
  add column if not exists razorpay_signature_verified boolean not null default false;

create index if not exists bookings_razorpay_order_id_idx on bookings (razorpay_order_id);

create table payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique not null, -- Razorpay's own event/payment identifier — enforces idempotency
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists payment_webhook_events_event_type_idx on payment_webhook_events (event_type);

alter table payment_webhook_events enable row level security;

-- No insert/update policy for anon/authenticated: the razorpay-webhook Edge
-- Function writes here with the service-role key, which bypasses RLS
-- entirely by design. Only admins can ever read this table from the app.
create policy "payment_webhook_events: admin read" on payment_webhook_events for select using (is_admin());
