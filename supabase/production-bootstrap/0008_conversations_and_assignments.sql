-- Tangy Sessions — real chat (conversations/messages) and the
-- admin -> artist session assignment request workflow.
-- Run after 0007_payments.sql.
--
-- Confirmed assignment reuses the existing event_artists join table (no new
-- "confirmed assignment" table) — it is written to only by
-- respond_to_assignment_request() below, on accept.

create type conversation_status as enum ('open', 'pending', 'resolved', 'closed');
create type assignment_status as enum ('pending', 'accepted', 'declined', 'cancelled');

-- CONVERSATIONS — one thread per support/assignment/general chat.
create table conversations (
  id uuid primary key default gen_random_uuid(),
  subject text,
  category text not null default 'support' check (category in ('support', 'assignment', 'general')),
  status conversation_status not null default 'open',
  created_by uuid not null references auth.users(id),
  assigned_admin_id uuid references auth.users(id),
  related_session_id uuid references events(id) on delete set null,
  related_artist_id uuid references artists(id) on delete set null,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CONVERSATION_PARTICIPANTS — who can read/post in a conversation. Always
-- populated from inside the RPCs below, never by a bare client insert.
create table conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- MESSAGES — immutable once sent (no update/delete policy below).
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  content text not null,
  message_type text not null default 'text' check (message_type in ('text', 'system')),
  created_at timestamptz not null default now()
);

-- MESSAGE_READ_STATES — per-participant read cursor, used to derive unread
-- counts/badges. Deliberately not a notifications table: unread state here
-- and assignment_requests.status below are the only sources of truth needed.
create table message_read_states (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- ASSIGNMENT_REQUESTS — admin requests an artist for a session; artist
-- accepts/declines via respond_to_assignment_request() below.
create table assignment_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references events(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  status assignment_status not null default 'pending',
  message text,
  conversation_id uuid references conversations(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Only one live (pending/accepted) request per session+artist pair — a
-- declined/cancelled row doesn't block re-requesting the same pairing.
create unique index assignment_requests_active_unique
  on assignment_requests (session_id, artist_id)
  where status in ('pending', 'accepted');

create index messages_conversation_id_created_at_idx on messages (conversation_id, created_at);
create index messages_sender_id_idx on messages (sender_id);
create index conversation_participants_user_id_idx on conversation_participants (user_id);
create index conversations_assigned_admin_id_idx on conversations (assigned_admin_id);
create index conversations_status_idx on conversations (status);
create index conversations_created_by_idx on conversations (created_by);
create index assignment_requests_session_id_idx on assignment_requests (session_id);
create index assignment_requests_artist_id_idx on assignment_requests (artist_id);
create index assignment_requests_status_idx on assignment_requests (status);

-- set_updated_at() already exists (defined in 0006_role_profiles.sql) — reuse it.
create trigger conversations_set_updated_at before update on conversations
  for each row execute function set_updated_at();
create trigger assignment_requests_set_updated_at before update on assignment_requests
  for each row execute function set_updated_at();

-- ROW LEVEL SECURITY -----------------------------------------------------

alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table message_read_states enable row level security;
alter table assignment_requests enable row level security;

create function is_participant(conv_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from conversation_participants
    where conversation_id = conv_id and user_id = auth.uid()
  );
$$;

-- CONVERSATIONS
create policy "conversations: participant or staff read" on conversations for select
  using (is_participant(id) or is_staff_or_admin());
create policy "conversations: creator or staff insert" on conversations for insert
  with check (created_by = auth.uid() or is_staff_or_admin());
create policy "conversations: staff/admin update" on conversations for update
  using (is_staff_or_admin());
-- Non-admin state transitions (reopen own conversation) go through
-- reopen_conversation() below, not a bare self-update policy — a plain RLS
-- policy has no column granularity to stop a patron from also reassigning
-- or resolving their own conversation.

-- CONVERSATION_PARTICIPANTS
create policy "participants: self or staff read" on conversation_participants for select
  using (user_id = auth.uid() or is_staff_or_admin());
create policy "participants: staff/admin manage" on conversation_participants for all
  using (is_staff_or_admin());
-- Rows for a brand-new conversation are inserted by get_or_create_support_
-- conversation()/create_assignment_request() below (SECURITY DEFINER),
-- which is why there's no self-insert policy here.

-- MESSAGES
create policy "messages: participant or staff read" on messages for select
  using (is_participant(conversation_id) or is_staff_or_admin());
create policy "messages: participant or staff insert" on messages for insert
  with check (
    sender_id = auth.uid()
    and (is_participant(conversation_id) or is_staff_or_admin())
  );

-- MESSAGE_READ_STATES
create policy "read_states: self manage" on message_read_states for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read_states: staff read all" on message_read_states for select
  using (is_staff_or_admin());

-- ASSIGNMENT_REQUESTS
create policy "assignment_requests: admin full access" on assignment_requests for all
  using (is_staff_or_admin());
create policy "assignment_requests: artist read own" on assignment_requests for select
  using (exists (select 1 from artists a where a.id = artist_id and a.user_id = auth.uid()));
-- Artist accept/decline goes through respond_to_assignment_request() below
-- only — never a direct UPDATE — so the event_artists side-effect and the
-- "already responded"/"not yours" checks are atomic and can't be bypassed
-- by hitting the table directly.

-- RPCs --------------------------------------------------------------------

-- A patron/guest opening chat/support reuses their existing open-or-pending
-- support conversation instead of spawning a new one on every visit.
create function get_or_create_support_conversation(p_subject text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from conversations
    where created_by = auth.uid() and category = 'support' and status <> 'closed'
    order by created_at desc limit 1;
  if v_id is not null then
    return v_id;
  end if;

  insert into conversations (subject, category, status, created_by)
    values (coalesce(p_subject, 'Support request'), 'support', 'open', auth.uid())
    returning id into v_id;
  insert into conversation_participants (conversation_id, user_id, role)
    values (v_id, auth.uid(), 'owner');
  return v_id;
end;
$$;

-- Admin claims/reassigns a conversation. Adds the admin as a participant so
-- there is never an "Assigned to Me" conversation with no working chat.
create function assign_conversation(p_conversation_id uuid, p_admin_id uuid default auth.uid())
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_staff_or_admin() then
    raise exception 'Only staff/admin can assign conversations.';
  end if;
  update conversations set assigned_admin_id = p_admin_id, status = 'pending'
    where id = p_conversation_id;
  insert into conversation_participants (conversation_id, user_id, role)
    values (p_conversation_id, p_admin_id, 'admin')
    on conflict (conversation_id, user_id) do nothing;
end;
$$;

-- Conversation owner (or staff/admin) reopens a resolved/closed conversation.
create function reopen_conversation(p_conversation_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from conversations
    where id = p_conversation_id and (created_by = auth.uid() or is_staff_or_admin())
  ) then
    raise exception 'Not authorized to reopen this conversation.';
  end if;
  update conversations set status = 'open' where id = p_conversation_id;
end;
$$;

-- Admin requests an artist for a session: creates a linked conversation
-- (admin + artist as participants), the assignment_requests row, and a seed
-- message, in one call.
create function create_assignment_request(p_session_id uuid, p_artist_id uuid, p_message text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_request_id uuid;
  v_conversation_id uuid;
  v_artist_user_id uuid;
begin
  if not is_staff_or_admin() then
    raise exception 'Only staff/admin can request an artist assignment.';
  end if;

  select user_id into v_artist_user_id from artists where id = p_artist_id;
  if v_artist_user_id is null then
    raise exception 'Artist has no linked user account.';
  end if;

  -- assigned_admin_id is set to the requester immediately — the admin who
  -- opens this workflow is already the one handling it, so there's never a
  -- gap where an assignment conversation exists unassigned.
  insert into conversations (subject, category, status, created_by, assigned_admin_id, related_session_id, related_artist_id)
    values ('Session assignment request', 'assignment', 'open', auth.uid(), auth.uid(), p_session_id, p_artist_id)
    returning id into v_conversation_id;
  insert into conversation_participants (conversation_id, user_id, role) values
    (v_conversation_id, auth.uid(), 'admin'),
    (v_conversation_id, v_artist_user_id, 'member');

  insert into assignment_requests (session_id, artist_id, requested_by, message, conversation_id)
    values (p_session_id, p_artist_id, auth.uid(), p_message, v_conversation_id)
    returning id into v_request_id;

  insert into messages (conversation_id, sender_id, content, message_type)
    values (v_conversation_id, auth.uid(), coalesce(p_message, 'You have a new session assignment request.'), 'text');

  return v_request_id;
end;
$$;

-- Artist accepts/declines their own pending request. On accept, confirms the
-- assignment via the existing event_artists table (no new table) and posts a
-- system message into the linked conversation.
create function respond_to_assignment_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_req assignment_requests%rowtype;
begin
  select * into v_req from assignment_requests where id = p_request_id;
  if v_req.id is null then
    raise exception 'Assignment request not found.';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request has already been responded to.';
  end if;
  if not exists (select 1 from artists where id = v_req.artist_id and user_id = auth.uid()) then
    raise exception 'Not authorized to respond to this request.';
  end if;

  update assignment_requests
    set status = case when p_accept then 'accepted' else 'declined' end,
        responded_at = now()
    where id = p_request_id;

  if p_accept then
    insert into event_artists (event_id, artist_id) values (v_req.session_id, v_req.artist_id)
      on conflict do nothing;
  end if;

  if v_req.conversation_id is not null then
    insert into messages (conversation_id, sender_id, content, message_type)
      values (v_req.conversation_id, auth.uid(),
        case when p_accept then 'Accepted the assignment request.' else 'Declined the assignment request.' end,
        'system');
  end if;
end;
$$;

-- Admin withdraws a still-pending request.
create function cancel_assignment_request(p_request_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_staff_or_admin() then
    raise exception 'Only staff/admin can cancel a request.';
  end if;
  update assignment_requests set status = 'cancelled'
    where id = p_request_id and status = 'pending';
end;
$$;

-- REALTIME ------------------------------------------------------------------
-- Realtime must also be enabled for this project in the Supabase dashboard
-- if it isn't already; this just adds the tables to the publication.
alter publication supabase_realtime add table conversations, messages;
