// The populated archive (LOCAL demo dataset: scripts/demo-data.sh seed).
// Previous sessions, programmes, gallery archive, artists, diary, TV:
// listings with real filters / search / pagination, every detail page by
// direct URL, reload and Back/Forward, the relationships between them,
// redirects, empty results, alt text, phone layout, and the admin
// Programmes editor.
import { execFileSync } from 'node:child_process';
import { launch, otpLogin, check, BASE } from './lib.mjs';

const DB = process.env.DB_CONTAINER || 'supabase_db_localstack';
const sql = (q) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', q]).toString().trim();
const path = (p) => new URL(p.url()).pathname + new URL(p.url()).search;
const count = async (p) => Number(await p.locator('[data-result-count]').getAttribute('data-result-count', { timeout: 15000 }));
// Wait until the result count differs from `prev` (a filter re-renders the list).
const countChange = async (p, prev) => {
  await p.waitForFunction((n) => Number(document.querySelector('[data-result-count]')?.getAttribute('data-result-count')) !== n, prev, { timeout: 15000 }).catch(() => {});
  return count(p);
};
const heading = async (p, text) => {
  await p.waitForFunction((t) => [...document.querySelectorAll('h1')].some((h) => h.innerText.toUpperCase().includes(t)), text.toUpperCase(), { timeout: 15000 });
  return true;
};

const { browser, page: p, errors } = await launch();

// --- Previous sessions --------------------------------------------------------------
await p.goto(BASE + '/sessions/archive');
await heading(p, 'PREVIOUS');
await p.locator('[data-result-count]').waitFor();
const total = await count(p);
check(total >= 15, `previous sessions lists the archive (${total})`);
check(await p.locator('[data-past-session]').count() === 12, 'the first page shows 12 sessions');
await p.locator('[data-filter="year"]').getByRole('button', { name: '2025', exact: true }).click();
const y2025 = await countChange(p, total);
check(y2025 > 0 && y2025 < total && path(p).includes('year=2025'), `the year filter narrows the list and is in the URL (${y2025})`);
await p.reload();
check(await countChange(p, -1) === y2025, 'a filtered view survives a reload');
await p.goBack();
await p.waitForFunction(() => !location.search.includes('year='));
check(await countChange(p, y2025) === total, 'Back returns to the unfiltered list');
await p.goForward();
await p.waitForFunction(() => location.search.includes('year=2025'));
check(await countChange(p, total) === y2025, 'Forward re-applies the filter');
await p.goto(BASE + '/sessions/archive?tag=Monsoon');
check(await count(p) >= 4, 'the type filter finds the monsoon nights');
await p.goto(BASE + '/sessions/archive');
await p.getByLabel('Search sessions').fill('qawwali');
await p.waitForFunction(() => location.search.includes('q=qawwali'));
check(await count(p) >= 1, 'search finds sessions by line-up and description');
await p.getByLabel('Search sessions').fill('zzzzzz');
await p.getByText('No sessions match these filters.').waitFor();
check(true, 'a search with no match shows an empty state');
await p.goto(BASE + '/sessions/archive');
await p.getByRole('button', { name: 'Older →' }).click();
await p.waitForFunction(() => location.search.includes('page=2'));
check(await p.locator('[data-past-session]').count() > 0, 'pagination reaches page 2');

// --- One past session and its relationships --------------------------------------------
await p.goto(BASE + '/sessions/archive/heritage-after-dark-2025');
await heading(p, 'HERITAGE AFTER DARK');
check(/Heritage After Dark \(2025\)/.test(await p.title()), `the session page has its own title (${await p.title()})`);
check(await p.locator('[data-attendance]').innerText() === '198 of 200', 'recorded attendance is shown');
check(await p.locator('[data-lineup-artist]').count() === 2, 'the line-up lists both artists');
check(await p.locator('[data-session-album]').count() === 1 && await p.locator('[data-session-tv]').count() === 1 && await p.locator('[data-session-diary]').count() === 1,
  'the session links its album, recording and diary post');
check(await p.getByRole('link', { name: 'Heritage After Dark 2025', exact: true }).count() === 1, 'the session links its programme');
check(await p.getByRole('navigation', { name: 'Breadcrumb' }).innerText().then((t) => /Sessions\s*›\s*Previous Sessions\s*›\s*Heritage After Dark/i.test(t)), 'breadcrumb: Sessions › Previous Sessions › session');
await p.locator('[data-lineup-artist="ananya-rao"]').click();
await p.waitForURL('**/artists/ananya-rao');
await heading(p, 'ANANYA');
check(await p.locator('[data-artist-session="heritage-after-dark-2025"]').waitFor({ timeout: 15000 }).then(() => true, () => false), 'the artist page lists the past session');
await p.goBack();
await heading(p, 'HERITAGE AFTER DARK');
await p.locator('[data-session-album]').click();
await p.waitForURL('**/gallery/heritage-after-dark-2025');
await heading(p, 'HERITAGE AFTER DARK');
const imgs = await p.locator('main img').evaluateAll((els) => els.map((e) => e.getAttribute('alt')));
check(imgs.length >= 4 && imgs.every((a) => a != null), `album photos carry alt text (${imgs.length})`);
await p.goto(BASE + '/sessions/archive/heritage-after-dark-2025');
await p.locator('[data-session-tv]').click();
await p.waitForURL(/\/tv\//);
check(await heading(p, 'LANTERN SET').catch(() => false), 'the recording opens on its own Tangy TV page');

// --- Redirects and not-found ---------------------------------------------------------------
await p.goto(BASE + '/sessions/heritage-after-dark-2025');
await p.waitForURL('**/sessions/archive/heritage-after-dark-2025');
check(true, 'a past session’s booking URL redirects to its archive page');
await p.goto(BASE + '/sessions/archive/heritage-after-dark');
await p.waitForURL('**/sessions/heritage-after-dark');
check(true, 'an upcoming session’s archive URL redirects to its booking page');
await p.goto(BASE + '/sessions/archive/no-such-night');
await p.locator('[data-not-found]').waitFor();
check(true, 'an unknown past session shows the not-found page');
await p.goto(BASE + '/archive/session-archive');
await p.waitForURL('**/sessions/archive');
check(true, 'the old Session Archive URL redirects to Previous Sessions');

// --- Programmes --------------------------------------------------------------------------
await p.goto(BASE + '/archive/programmes');
await heading(p, 'PROGRAMMES');
await p.locator('[data-programme]').first().waitFor();
check(await p.locator('[data-programme]').count() >= 8, 'eight or more programmes are listed');
await p.locator('[data-programme="season-2026"]').click();
await p.waitForURL('**/archive/programmes/season-2026');
await heading(p, 'SEASON 2026');
check(await p.locator('[data-past-session]').count() >= 3 && await p.locator('[data-upcoming-session]').count() >= 1, 'a programme lists its past and upcoming sessions');
await p.reload();
await heading(p, 'SEASON 2026');
check(true, 'a programme page reloads');
await p.goto(BASE + '/archive/programmes/no-such-programme');
await p.locator('[data-not-found]').waitFor();
check(true, 'an unknown programme shows the not-found page');

// --- Gallery -------------------------------------------------------------------------------
await p.goto(BASE + '/gallery');
await heading(p, 'GALLERY');
check(await p.locator('[data-album-card]').count() === 6, 'the gallery shows the six latest albums');
await p.locator('[data-gallery-archive-link]').click();
await p.waitForURL('**/gallery/archive');
const albums = await count(p);
check(albums >= 15, `the gallery archive lists every album (${albums})`);
await p.locator('[data-filter="kind"]').getByRole('button', { name: 'Behind the scenes' }).click();
check(await countChange(p, albums) === 1, 'the "shows" filter narrows to behind-the-scenes albums');
await p.goto(BASE + '/gallery/archive?year=2024');
const a2024 = await count(p);
check(a2024 > 0 && a2024 < albums, `the year filter works from the URL (${a2024})`);
await p.getByLabel('Search albums').fill('zzzzzz');
await p.getByText('No albums match these filters.').waitFor();
check(true, 'album search with no match shows an empty state');
const photos = Number(sql("select count(*) from gallery_photos where id::text like 'de300000-%'"));
check(photos >= 50, `50+ demo photos (${photos})`);

// --- Artists ---------------------------------------------------------------------------------
await p.goto(BASE + '/artists');
await heading(p, 'ARTISTS');
await p.locator('[data-result-count]').waitFor();
const artists = await count(p);
check(artists >= 20, `20+ artists (${artists})`);
await p.locator('[data-filter="when"]').getByRole('button', { name: 'On stage' }).click();
await p.waitForFunction(() => location.search.includes('when=upcoming'));
const onStage = await countChange(p, artists);
await p.locator('[data-filter="when"]').getByRole('button', { name: 'Played before' }).click();
const played = await countChange(p, onStage);
check(onStage > 0 && played > 0 && onStage < artists && played < artists, `upcoming / past filters split the roster (${onStage} on stage, ${played} played before)`);
await p.getByLabel('Search artists').fill('qawwali');
check(await count(p) >= 1, 'artist search finds by genre');

// --- Diary, TV, Archive hub ---------------------------------------------------------------
const diary = Number(sql("select count(*) from diary_posts where status = 'published' and published_at <= now()"));
check(diary >= 15, `15+ published diary posts (${diary})`);
await p.goto(BASE + '/diary/a-night-under-the-banyan');
await heading(p, 'A NIGHT UNDER THE BANYAN');
check(true, 'a diary post opens by direct URL');
await p.goto(BASE + '/diary/stories');
await p.locator('[data-recent-story]').first().waitFor();
check(await p.locator('[data-recent-story]').count() === 6, 'Recent Stories shows the six latest diary posts, each a link');
const tv = Number(sql("select count(*) from tv_videos where status = 'published' and published_at <= now()"));
check(tv >= 10, `10+ published Tangy TV videos (${tv})`);
await p.goto(BASE + '/archive');
await p.locator('[data-archive-area]').first().waitFor();
check(await p.locator('[data-archive-area]').count() === 6, 'the archive hub links every archive area');
check(await p.getByText('PRESS ARCHIVE').count() === 0, 'no press quotes attributed to real publications');
await p.locator('[data-archive-area="/archive/programmes"]').click();
await p.waitForURL('**/archive/programmes');
check(true, 'archive hub → programmes');

const realErrors = errors.filter((e) => !/http 4\d\d|Failed to load resource/.test(e));
check(realErrors.length === 0, `desktop: no page errors (${realErrors.slice(0, 3).join(' | ')})`);
await browser.close();

// --- Phone widths --------------------------------------------------------------------------
for (const width of [375, 390, 412]) {
  const m = await launch({ mobile: true });
  await m.page.setViewportSize({ width, height: 844 });
  for (const url of ['/sessions/archive', '/sessions/archive/monsoon-sessions-2025', '/archive/programmes/season-2026', '/gallery/archive', '/artists', '/archive']) {
    await m.page.goto(BASE + url);
    await m.page.locator('h1').first().waitFor();
    await m.page.waitForTimeout(800);
    check(await m.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: ${url} has no sideways scrolling`);
  }
  await m.browser.close();
}

// --- Admin: programmes are managed like other content ---------------------------------------
const admin = await launch();
await otpLogin(admin.page, 'ops@demo.tangy.local');
await admin.page.goto(BASE + '/admin-portal/content/programmes');
await admin.page.getByText('Season 2026').first().waitFor();
check(true, 'admin sees programmes in Content');
await admin.page.goto(BASE + '/admin-portal/content/programmes/season-2026');
const box = admin.page.locator('[data-programme-sessions] label').filter({ hasText: 'Brass on the Lawns' }).locator('input');
await box.waitFor();
const before = Number(sql("select count(*) from programme_events pe join programmes p on p.id = pe.programme_id where p.slug = 'season-2026'"));
await box.check();
await admin.page.getByRole('button', { name: /^Save/ }).click();
await admin.page.getByText(/Programme saved/).waitFor();
const after = Number(sql("select count(*) from programme_events pe join programmes p on p.id = pe.programme_id where p.slug = 'season-2026'"));
check(after === before + 1, `admin links a session to a programme (${before} → ${after})`);
await box.uncheck();
await admin.page.getByRole('button', { name: /^Save/ }).click();
await admin.page.getByText(/Programme saved/).first().waitFor();
await admin.page.waitForTimeout(500);
check(Number(sql("select count(*) from programme_events pe join programmes p on p.id = pe.programme_id where p.slug = 'season-2026'")) === before, '… and unlinks it again');
await admin.browser.close();
