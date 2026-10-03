-- Tangy Sessions — extend user_role with the remaining account types the
-- site needs (vendor/sponsor/volunteer/crew), and round out `profiles` with
-- the generic fields every role needs. Run as its own query, after 0004.
--
-- Note: each ALTER TYPE ... ADD VALUE below must not be referenced by a
-- literal comparison in this same transaction (Postgres forbids using a new
-- enum value before the transaction that added it commits) — nothing in
-- this file or 0006/0007 compares against these literals, so that's safe.

alter type user_role add value if not exists 'vendor';
alter type user_role add value if not exists 'sponsor';
alter type user_role add value if not exists 'volunteer';
alter type user_role add value if not exists 'crew';

alter table profiles
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists organization_name text,
  add column if not exists updated_at timestamptz not null default now();

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Let an application (vendor/sponsor/volunteer/crew) carry the applicant's
-- own account forward, so an admin approval can promote that same account's
-- role instead of only ever creating disconnected records. Nullable — a
-- great many applicants apply before ever creating an account.
alter table collaborations add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table crew_applications add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table private_enquiries add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists collaborations_user_id_idx on collaborations (user_id);
create index if not exists crew_applications_user_id_idx on crew_applications (user_id);
create index if not exists private_enquiries_user_id_idx on private_enquiries (user_id);
