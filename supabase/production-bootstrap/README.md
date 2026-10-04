# Production bootstrap package

The exact SQL to build the **empty** TangySessions production database
(confirmed empty: no public tables, views, functions, triggers, enum types,
auth users, storage buckets or migration history). Nothing here has been
applied to production.

The canonical migration history in `supabase/migrations/` is **unchanged**.
This folder holds production copies of it:

| File | Relation to `supabase/migrations/` |
|---|---|
| `0001`–`0003`, `0005`–`0016`, `0018`–`0027`, `0029`–`0036` (33 files) | byte-identical copies |
| `0017_admin_system.production.sql` | `0017_admin_system.sql` minus 13 lines (mock announcements) |
| `0028_content_cms.production.sql` | `0028_content_cms.sql` minus 48 lines (TV / gallery / diary seed) |
| `0004_seed_events.sql` | **not included** — 7 demo events, 3 of them bookable |
| `checks/production_inventory.readonly.sql` | read-only inventory (one SELECT) to verify the result |
| `SHA256SUMS` | checksums of every SQL file here (`sha256sum -c SHA256SUMS`) |

`scripts/test-production-bootstrap.sh` re-verifies all of the above.

## What was removed, exactly

Both removals are a single contiguous block of deleted lines; no line was
added or changed (`diff supabase/migrations/<file>.sql <file>.production.sql`).

**0017 — lines 1280–1292 deleted:** the comment introducing the seed, this
statement, and the blank line after it:

```sql
insert into announcements (title, body, category, character, destination, audience, priority, publish_at, expire_at, status, author_id)
select * from (values
  ('NEW TANGY SESSION', ...),
  ('ARTIST APPLICATIONS OPEN', ...),
  ('CONTACT SHEETS DIGITIZED', ...),
  ('VOLUNTEER REGISTRATION OPEN', ...),
  ('VENUE PARTNERSHIP: OLD CITY HAVELI', ...)
) as seed(...)
where not exists (select 1 from announcements);
```

Kept: the `announcements` table, its RLS policies and every other statement of
0017 — RBAC (`role_permissions` rows), audit log, venues infrastructure (the
`venues` backfill from existing events stays; it inserts nothing on an empty
database), `system_settings` rows, functions and triggers.

**0028 — lines 325–372 deleted:** the `-- Seeds (existing site media)` comment
line and these four statements (plus the blank lines between them):

```sql
insert into tv_videos (...) values (... 8 rows ...) on conflict (slug) do nothing;
insert into gallery_albums (...) values ('tangy-sessions', ...) on conflict (slug) do nothing;
insert into gallery_photos (...) select ... (10 photos) ... where a.slug = 'tangy-sessions' and not exists (...);
insert into diary_posts (...) values (... 4 drafts ...) on conflict (slug) do nothing;
```

Kept: every CMS table, the `content.*` permissions, the `content-media` storage
bucket and its policies, functions, triggers, indexes, and the file's own
`begin;` (line 28) / `commit;`. The CMS starts empty and is filled through
Admin → Content.

## Apply order

Each file is its own query in the SQL editor, in this order. Take a database
backup first and stop at the first error.

```
0001 → 0002 → 0003 → 0005 → 0006 → 0007 → 0008 → 0009 → 0010 → 0011 → 0012 → 0013 → 0014
→ 0015 → 0016 → 0017 (.production) → 0018 → 0019 → 0020 → 0021 → 0022 → 0023 → 0024 → 0025
→ 0026 → 0027 → 0028 (.production) → 0029 → 0030 → 0031 → 0032 → 0033 → 0034
→ [run supabase/preflight/0035_phase1_security_gaps_preflight.sql] → 0035 → 0036
```

- Enum values must be committed before they are used, so never combine files
  into one query: 0005 and 0010 (role values), 0019 (before 0020), 0032
  (before 0033) each run on their own.
- 0035 refuses to run unless the 0034 schema is present.
- 0036 replaces the three `artist-documents` ownership policies from 0033,
  whose unqualified `name` resolved to `artists.name`, so no artist could
  upload, open or delete their own documents. It changes no rows. **Production
  already has 0036** (applied by hand after 0035, with zero objects in the
  bucket); the file records exactly the SQL that was run.
- After 0020: check that `pg_cron` is enabled and the `tangy-platform-jobs`
  job exists; otherwise schedule `select public.run_platform_jobs()` every
  5 minutes externally.
- Afterwards run `checks/production_inventory.readonly.sql`: expect
  migrations 0001–0003 and 0005–0036 detected, 6 storage buckets, and zero
  rows in every data table.
- Edge Functions and their secrets are deployed separately (see
  `supabase/README.md`).

## What the production database receives

Schema, RLS, functions, triggers and these configuration rows only:
`role_permissions`, `system_settings`, 6 storage buckets
(`artist-avatars`, `artist-media`, `event-documents`, `sponsor-assets`,
`content-media`, `artist-documents`), the `pg_cron` job, and 0035's
owner-only function-privilege snapshot (`_security_0035_function_acl`, used by
its rollback).

It receives **no** auth users, profiles, events, artists, bookings, tickets,
payments, check-ins, applications, enquiries, conversations, messages,
notifications, partner accounts, announcements or CMS content.

Never run against production: `supabase/demo/*`, `scripts/demo-data.sh`,
`supabase/tests/*`, `supabase/tests/local/supabase_shim.sql`, or
`supabase/migrations/0004_seed_events.sql`.

## Validation (local only)

`scripts/test-production-bootstrap.sh` builds a throwaway local PostgreSQL 16
database with the Supabase shim, then:

1. checks the package (0004 absent; 32 byte-identical copies; the two
   production files are deletions only),
2. applies all 35 files in order,
3. runs the read-only inventory and checks that the database holds the
   schema, the CMS / RBAC / settings tables, 6 buckets, permissions and
   settings — and no events, announcements, CMS content, users, bookings,
   tickets, payments, check-ins, applications, conversations or
   notifications,
4. checks the CMS and announcements are production-ready without content:
   RLS enabled and policies present on every CMS table, the three
   announcement policies, the announcement columns, every `content.*`
   permission on super_admin and none on staff, the CMS functions, the
   publish guard on every content table with a status, the private
   `content-media` bucket (50 MB, no HTML) and its storage policies,
5. runs every `supabase/tests/*.test.sql` suite unchanged — 19 suites, 949
   assertions — and checks the database is still empty afterwards.

**No seed or mock content is inserted at any point.** Suites that exercise
content rules (`content_cms`, `admin_system`) create their own clearly
test-owned rows (`test-…` slugs, a "Public notice" announcement) inside their
own transaction and roll them back, so they pass with or without seeded
content and never depend on it.

It does not exercise GoTrue, PostgREST, Storage, Realtime, pg_cron or the
Edge Functions.
