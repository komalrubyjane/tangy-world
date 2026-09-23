-- Tangy Sessions — let a signed-in patron see their own waitlist entries.
--
-- 0002_rls.sql only granted staff/admin read on `waitlist` (it's joined
-- anonymously, before accounts necessarily exist). The real Patron Dashboard
-- (PatronDashboard.jsx) now shows "your waitlist status", which needs a
-- self-read path. `waitlist` has no user_id column — joining anonymously is
-- still supported — so this matches by email against the signed-in user's
-- own profile row instead of requiring a schema change.

create policy "waitlist: self read own by email" on waitlist for select
  using (email = (select email from profiles where id = auth.uid()));
