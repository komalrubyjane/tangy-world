-- LOCAL TEST DATA ONLY: approved partner/volunteer accounts for e2e/platform.mjs,
-- each placed on Tangy Sessions Vol. 5 the way an admin would. Idempotent.
update profiles set role = 'artist'    where email = 'artist@tangy.test';
update profiles set role = 'sponsor'   where email = 'sponsor@tangy.test';
update profiles set role = 'vendor'    where email = 'vendorco@tangy.test';
update profiles set role = 'venue'     where email = 'venue@tangy.test';
update profiles set role = 'volunteer' where email = 'volunteer@tangy.test';

insert into artists (user_id, name, email, genre, city, status)
select id, 'Aria Artist', email, 'Qawwali', 'Hyderabad', 'approved' from profiles p
where email = 'artist@tangy.test' and not exists (select 1 from artists a where a.user_id = p.id);

insert into collaborations (user_id, type, business_name, contact_name, email, status)
select p.id, x.t::collaboration_type, x.biz, p.full_name, p.email, 'approved'
from (values ('sponsor@tangy.test', 'sponsor', 'Saffron Tea Co'), ('vendorco@tangy.test', 'vendor', 'Chai Collective'), ('venue@tangy.test', 'venue_host', 'Stepwell Trust')) x(email, t, biz)
join profiles p on p.email = x.email
where not exists (select 1 from collaborations c where c.user_id = p.id);
insert into sponsor_profiles (id, organization_name) select id, 'Saffron Tea Co' from profiles where email = 'sponsor@tangy.test' on conflict do nothing;
insert into vendor_profiles (id, business_name) select id, 'Chai Collective' from profiles where email = 'vendorco@tangy.test' on conflict do nothing;
insert into venue_profiles (id, property_name) select id, 'Stepwell Trust' from profiles where email = 'venue@tangy.test' on conflict do nothing;

insert into crew_applications (user_id, name, email, role_interest, category, status)
select id, full_name, email, 'Volunteer', 'volunteer', 'approved' from profiles p
where email = 'volunteer@tangy.test' and not exists (select 1 from crew_applications c where c.user_id = p.id);
insert into volunteer_profiles (id) select id from profiles where email = 'volunteer@tangy.test' on conflict do nothing;

-- Vol. 5 memberships
insert into event_artists (event_id, artist_id)
select e.id, a.id from events e, artists a where e.slug = 'vol-5-local' and a.email = 'artist@tangy.test' on conflict do nothing;
insert into event_assignments (event_id, assignee_role, assignee_id, title, status, assigned_by)
select e.id, x.r, p.id, x.title, 'confirmed', (select id from profiles where email = 'manager@tangy.test')
from (values ('vendorco@tangy.test', 'vendor', 'Chai counter'), ('sponsor@tangy.test', 'sponsor', 'Title sponsor'), ('volunteer@tangy.test', 'volunteer', 'Gate volunteer')) x(email, r, title)
join profiles p on p.email = x.email
join events e on e.slug = 'vol-5-local'
where not exists (select 1 from event_assignments ea where ea.event_id = e.id and ea.assignee_id = p.id);
update events set venue_partner_id = (select id from profiles where email = 'venue@tangy.test') where slug = 'vol-5-local';
