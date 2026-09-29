import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launch, otpLogin, shot, check, api, BASE } from './lib.mjs';

// Named attendees + one booking QR + partial check-in (0023), end to end:
// the customer names every attendee before payment (validated in the browser,
// the Edge Function and the database) and gets ONE QR; at the gate staff scan
// it, see the named attendees, tick who is actually here (3 now, 2 later) —
// by QR (fake camera) or manual lookup, which call the same server function.
// The server admits all-or-none, refuses already-checked-in / foreign /
// forged attendees and wrong events, and holds under concurrent gates.
// Everything at 390px.

const DB = process.env.DB_CONTAINER || 'supabase_db_localstack';
const ANON = process.env.ANON_KEY;
const sql = (q) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', q]).toString().trim();
const sqlFile = (file) => execFileSync('docker', ['exec', '-i', DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-q', '-v', 'ON_ERROR_STOP=1'],
  { input: execFileSync('cat', [fileURLToPath(new URL(file, import.meta.url))]) });
const inNames = (code) => sql(`select coalesce(string_agg(t.attendee_name, ', ' order by t.ticket_number), '') from tickets t join bookings b on b.id = t.booking_id where b.registration_code = '${code}' and t.status = 'checked_in'`);
const rows = (code) => Number(sql(`select count(*) from checkins c join tickets t on t.id = c.ticket_id join bookings b on b.id = t.booking_id where b.registration_code = '${code}'`));
const until = (p, ms = 15000) => p.waitFor({ timeout: ms }).then(() => true, () => false);
const text = async (loc) => (await loc.innerText().catch(() => '')).replace(/\s+/g, ' ');

// ---------------------------------------------------------------- fixtures + camera videos
sqlFile('./seed_group.sql');
const V5 = sql("select id from events where slug = 'vol-5-local'");
const QR = createRequire(new URL('../package.json', import.meta.url))('qrcode');
const CAM = fileURLToPath(new URL('./cam/', import.meta.url));
mkdirSync(CAM, { recursive: true });
const groupToken = (code) => sql(`select group_token from bookings where registration_code = '${code}'`);
async function video(name, value) {
  await QR.toFile(`${CAM}${name}.png`, value, { width: 480, margin: 4 });
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-loop', '1', '-i', `${CAM}${name}.png`, '-t', '4', '-r', '10',
    '-vf', 'scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2:white,format=yuv420p', `${CAM}${name}.y4m`]);
}
for (const [name, code] of [['grp5', 'TS-GRP5'], ['grp1', 'TS-GRP1'], ['grpmix', 'TS-GRPMIX'], ['grpv6', 'TS-GRPV6']]) await video(name, `TANGY:BOOKING:${groupToken(code)}`);
await video('grpbad', 'TANGY:BOOKING:0000000000000000000000000000000000000000');

const allErrors = [];
const refused = [];
const track = (label, errors) => allErrors.push(...errors.filter((e) => !/\b(401|403)\b|Failed to load resource|realtime\/v1\/websocket|favicon/.test(e)).map((e) => `${label}: ${e}`));
async function attempt(s, label, fn) {
  const before = s.errors.length;
  const out = await fn();
  refused.push(...s.errors.splice(before).map((e) => `${label}: ${e}`));
  return out;
}
async function terminal(email, camera) {
  const s = await launch({ mobile: true, camera: camera ? `${CAM}${camera}.y4m` : null });
  await otpLogin(s.page, email, '/check-in');
  return s;
}
async function fits(p, label) {
  const r = await p.evaluate(() => {
    const over = document.documentElement.scrollWidth - window.innerWidth;
    const small = [...document.querySelectorAll('[data-group-panel] button, [data-group-panel] label[data-attendee]')].filter((b) => b.offsetParent)
      .map((b) => b.getBoundingClientRect()).filter((b) => b.height < 44).length;
    return { over, small };
  });
  check(r.over <= 1 && r.small === 0, `${label}: fits 390px, every attendee row and button ≥ 44px tall (${r.over > 1 ? `+${r.over}px ` : ''}${r.small ? `${r.small} small` : 'ok'})`);
}
const panel = (p) => p.locator('[data-group-panel]');
const row = (p, name) => panel(p).locator(`label[data-attendee="${name}"]`);
const box = (p, name) => row(p, name).getByRole('checkbox');
const status = (p) => p.getByRole('status').filter({ hasNot: p.locator('[data-access-window]') });
const statsCheckedIn = () => Number(sql(`select count(*) from tickets where event_id = '${V5}' and status = 'checked_in'`));
const statsBefore = statsCheckedIn();

// ================================================================ 1. server refuses unnamed attendees
// (The customer journey itself — 5 named people, review, payment, one QR — is
// e2e/checkout.mjs.) Here: the Edge Function refuses a blank attendee name
// even when the browser's own checks are bypassed.
{
  const s = await launch({ mobile: true });
  await otpLogin(s.page, 'patron@tangy.test', '/join/login');
  const before = Number(sql("select count(*) from bookings where attendee_email = 'patron@tangy.test'"));
  const direct = await attempt(s, 'create-order with a blank name', () => s.page.evaluate(async ({ anon, event }) => {
    const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'));
    const token = JSON.parse(localStorage.getItem(key)).access_token;
    const res = await fetch('http://127.0.0.1:54321/functions/v1/razorpay-create-order', {
      method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: event, quantity: 2, tierId: 'gen', attendeeName: 'Pat Patron', attendeeEmail: 'patron@tangy.test', attendeePhone: '9876543210', attendeeNames: ['Pat Patron', ' '] }),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  }, { anon: ANON, event: V5 }));
  check(direct.status === 400 && /every attendee/.test(direct.body.error || ''), `Edge Function refuses a blank attendee name (HTTP ${direct.status})`);
  check(Number(sql("select count(*) from bookings where attendee_email = 'patron@tangy.test'")) === before, 'nothing was stored');
  track('customer', s.errors); await s.browser.close();
}

// ================================================================ 2. SCAN: select Rahul, Priya, Arjun -> later Kavya, Neha
{
  const s = await terminal('staff@tangy.test', 'grp5');
  const p = s.page;
  check(await until(panel(p)), 'booking QR opens the attendee list — nobody is checked in automatically');
  check(rows('TS-GRP5') === 0, 'scanning alone writes nothing');
  const pt = await text(panel(p));
  check(/TS-GRP5/.test(pt) && /Tangy Sessions Vol\. 5/.test(pt) && /5 attendees/.test(pt) && await text(p.locator('[data-party-progress]')) === '0 / 5'
    && await text(p.locator('[data-party-remaining]')) === '5', 'panel: booking, event, 5 attendees, 0 / 5, 5 remaining');
  for (const n of ['Rahul Sharma', 'Priya Mehta', 'Arjun Nair', 'Kavya Singh', 'Neha Verma']) {
    check(/Pending/i.test(await text(row(p, n))) && !(await box(p, n).isChecked()), `${n}: listed, Pending, unticked`);
  }
  check(await p.getByRole('button', { name: 'Check in selected (0)' }).isDisabled(), 'nothing selected: button disabled');
  await fits(p, 'attendee list');
  await shot(p, 'g01-attendees');
  for (const n of ['Rahul Sharma', 'Priya Mehta', 'Arjun Nair']) await row(p, n).tap();
  check(await until(p.getByRole('button', { name: 'Check in selected (3)' })), 'button counts the selection: (3)');
  await row(p, 'Arjun Nair').tap();
  check(await until(p.getByRole('button', { name: 'Check in selected (2)' })), 'unticking updates the count: (2)');
  await row(p, 'Arjun Nair').tap();
  await p.getByRole('button', { name: 'Check in selected (3)' }).tap();
  check(await until(status(p).getByText('Check-in successful', { exact: true })), 'CHECK-IN SUCCESSFUL');
  const res = await text(p.locator('[data-result-party]'));
  check(/3 attendees checked in: Rahul Sharma, Priya Mehta, Arjun Nair/.test(res) && /3 \/ 5/.test(res) && /Remaining 2/.test(res) && /stays valid/.test(res), `result names the 3, 3 / 5, 2 remaining (${res})`);
  const st = await text(p.locator('[data-attendee-status]'));
  check(/Kavya Singh Pending/.test(st) && /Neha Verma Pending/.test(st) && /Rahul Sharma Checked in/.test(st), 'status list: Rahul checked in, Kavya and Neha pending');
  check(inNames('TS-GRP5') === 'Rahul Sharma, Priya Mehta, Arjun Nair', 'database: exactly Rahul, Priya and Arjun are checked in');
  await fits(p, 'partial result');
  await shot(p, 'g02-partial');

  await p.reload();  // page refresh after a partial check-in; same QR still in front of the camera
  check(await until(panel(p)) && await text(p.locator('[data-party-progress]')) === '3 / 5', 'after refresh the same QR shows 3 / 5');
  for (const n of ['Rahul Sharma', 'Priya Mehta', 'Arjun Nair']) {
    check(await box(p, n).isDisabled() && await box(p, n).isChecked() && /Checked in/i.test(await text(row(p, n))) && /Sam Staff/.test(await text(row(p, n))),
      `${n}: checked in (by Sam Staff) and not selectable`);
  }
  check(!(await box(p, 'Kavya Singh').isDisabled()) && !(await box(p, 'Neha Verma').isDisabled()), 'Kavya and Neha are selectable');
  await shot(p, 'g03-later-arrival');
  await row(p, 'Kavya Singh').tap();
  await row(p, 'Neha Verma').tap();
  await p.getByRole('button', { name: 'Check in selected (2)' }).tap();
  check(await until(status(p).getByText('Check-in complete', { exact: true })), 'CHECK-IN COMPLETE');
  check(/5 \/ 5/.test(await text(p.locator('[data-result-party]'))) && /All attendees have arrived/.test(await text(p.locator('[data-result-party]'))), '5 / 5, all attendees have arrived');
  check(rows('TS-GRP5') === 5, 'database: 5 attendance records');
  await shot(p, 'g04-complete');

  await p.getByRole('button', { name: 'Dismiss' }).tap();  // same QR again
  check(await until(status(p).getByText('All attendees already checked in', { exact: true })), 'rescan after 5 / 5: ALL ATTENDEES ALREADY CHECKED IN');
  check(!(await panel(p).count()) && !(await p.getByRole('checkbox').count()), 'no selectable attendees');
  check(/5 \/ 5 attendees checked in\. No remaining check-ins\./.test(await text(status(p))), 'shows 5 / 5, no remaining check-ins');
  check(rows('TS-GRP5') === 5, 'no duplicate records');
  const recentList = p.locator('section', { hasText: 'Recent check-ins' });
  await until(recentList.getByText(/Kavya Singh, Neha Verma/));
  const recent = await text(recentList);
  check(/Kavya Singh, Neha Verma TS-GRP5/.test(recent) && /Rahul Sharma, Priya Mehta, Arjun Nair TS-GRP5/.test(recent), `recent check-ins name each arrival group (${recent.slice(0, 160)})`);
  await fits(p, 'fully checked-in state');
  await shot(p, 'g05-all-in');
  track('scan', s.errors); await s.browser.close();
}

// ================================================================ 3. single attendee, wrong event, invalid
{
  const s = await terminal('staff@tangy.test', 'grp1');
  const p = s.page;
  check(await until(panel(p)) && !(await p.locator('[data-party-progress]').count()), 'one-person booking: no group counters');
  check(await box(p, 'Priya Nair').isChecked() && /Pending/i.test(await text(row(p, 'Priya Nair'))), 'Priya Nair shown Pending and pre-selected');
  await p.getByRole('button', { name: 'Check in', exact: true }).tap();
  check(await until(status(p).getByText('Checked in', { exact: true })) && /Priya Nair/.test(await text(status(p))), 'CHECKED IN — Priya Nair (1 / 1)');
  await p.getByRole('button', { name: 'Dismiss' }).tap();
  check(await until(status(p).getByText('Already checked in', { exact: true })), 'rescanned: already checked in');
  check(rows('TS-GRP1') === 1, 'one attendance record');
  track('single', s.errors); await s.browser.close();
}
{
  const s = await terminal('staff@tangy.test', 'grpv6');
  check(await until(status(s.page).getByText('Wrong event', { exact: true })) && /Tangy Sessions Vol\. 6\. Nobody was checked in\./.test(await text(status(s.page))),
    'Vol. 6 booking QR at Vol. 5: WRONG EVENT, nobody checked in');
  check(!(await panel(s.page).count()) && rows('TS-GRPV6') === 0, 'no attendee list, no state change');
  await shot(s.page, 'g06-wrong-event');
  track('wrong event', s.errors); await s.browser.close();
}
{
  const s = await terminal('staff@tangy.test', 'grpbad');
  check(await until(status(s.page).getByText('Invalid ticket', { exact: true })), 'unknown booking QR: INVALID');
  track('invalid', s.errors); await s.browser.close();
}

// ================================================================ 4. MANUAL (Sam) -> QR (Mira), same engine, history
{
  const s = await terminal('staff@tangy.test');
  const p = s.page;
  await p.getByRole('button', { name: 'Manual', exact: true }).tap();
  await p.getByPlaceholder('Name, booking code or ticket number').fill('Ravi Iyer');  // an attendee's name finds the booking
  const mrow = p.locator('[data-manual-booking="TS-GRPMIX"]');
  check(await until(mrow) && /5 attendees/.test(await text(mrow)) && /0 \/ 5 checked in/.test(await text(mrow)), 'manual lookup by attendee name: TS-GRPMIX, 5 attendees, 0 / 5');
  await mrow.getByRole('button', { name: /Select attendees for TS-GRPMIX/ }).tap();
  check(await until(panel(p)) && /manual/.test(await text(panel(p))), 'manual opens the same attendee list');
  for (const n of ['Meera Iyer', 'Dev Iyer', 'Asha Iyer']) await row(p, n).tap();
  await p.getByRole('button', { name: 'Check in selected (3)' }).tap();
  check(await until(status(p).getByText('Check-in successful', { exact: true })), 'manual check-in of 3 named attendees');
  check(inNames('TS-GRPMIX') === 'Meera Iyer, Dev Iyer, Asha Iyer', 'database: exactly Meera, Dev and Asha');
  check(await until(mrow.getByText(/3 \/ 5 checked in · 2 remaining/)) && await until(mrow.getByText('Partial', { exact: true })), 'manual row: 3 / 5 · 2 remaining · Partial');
  await fits(p, 'manual lookup');
  await shot(p, 'g07-manual');
  track('manual', s.errors); await s.browser.close();
}
{
  // Reporting mid-way: a 5-person booking with 3 in reads 5 / 3 / 2, not "1 booking".
  const s = await terminal('manager@tangy.test');
  const p = s.page;
  await p.goto(`${BASE}/admin-portal/attendees`);
  await p.getByPlaceholder(/Name, booking code/).fill('TS-GRPMIX');
  const party = p.locator('[data-party="TS-GRPMIX"]:visible').first();
  check(await until(party) && /3 \/ 5 checked in/.test(await text(party)) && /Partial/i.test(await text(party)), 'attendee list: TS-GRPMIX 3 / 5 checked in · Partial');
  check(await p.locator('[data-party="TS-GRPMIX"]:visible').count() === 5, 'one row per named attendee (5)');
  for (const n of ['Meera Iyer', 'Ravi Iyer']) check(await until(p.locator(`[data-attendee="${n}"]:visible`).first()), `attendee list names ${n}`);
  const stats = await api(p, 'POST', '/rest/v1/rpc/event_checkin_stats', { p_event_id: V5 });
  const issuedInBooking = Number(sql("select count(*) from tickets t join bookings b on b.id = t.booking_id where b.registration_code = 'TS-GRPMIX' and t.status <> 'cancelled'"));
  check(issuedInBooking === 5 && stats.data?.checked_in === statsCheckedIn(), `reports count attendees: booking has 5, event checked-in = ${stats.data?.checked_in}`);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(over <= 1, `attendee list fits 390px${over > 1 ? ` (+${over}px)` : ''}`);
  await shot(p, 'g08-attendees-partial');
  track('reports', s.errors); await s.browser.close();
}
{
  const s = await terminal('manager@tangy.test', 'grpmix');
  const p = s.page;
  check(await until(panel(p)) && /Sam Staff/.test(await text(row(p, 'Meera Iyer'))) && await box(p, 'Meera Iyer').isDisabled(), 'QR by another staff member shows who manual-checked Meera in');
  for (const n of ['Ravi Iyer', 'Tara Iyer']) await row(p, n).tap();
  await p.getByRole('button', { name: 'Check in selected (2)' }).tap();
  check(await until(status(p).getByText('Check-in complete', { exact: true })) && /by Mira Manager/.test(await text(status(p))), 'second staff member completes 5 / 5');
  check(rows('TS-GRPMIX') === 5, 'manual + QR = 5 records, no duplicates');
  await p.goto(`${BASE}/admin-portal/bookings?q=TS-GRPMIX`);
  await p.locator('main').getByText('TS-GRPMIX').locator('visible=true').first().tap();
  const hist = p.locator('[data-arrivals]');
  check(await until(hist), 'booking drawer shows the check-in history');
  const h = await text(hist);
  check(/Meera Iyer checked in by Sam Staff · manual/.test(h) && /Asha Iyer checked in by Sam Staff · manual/.test(h)
    && /Ravi Iyer checked in by Mira Manager/.test(h) && /Tara Iyer checked in by Mira Manager/.test(h), 'history: every attendee, who checked them in, how');
  check(/5 \/ 5 checked in/.test(await text(p.getByRole('dialog').last())), 'drawer: 5 / 5');
  await shot(p, 'g09-history');
  track('manager', s.errors); await s.browser.close();
}

// ================================================================ 5. server contract with each user's own JWT
const staffA = await terminal('staff@tangy.test');
const staffB = await terminal('manager@tangy.test');
const rpc = (s, body) => api(s.page, 'POST', '/rest/v1/rpc/check_in_ticket', body);
// Staff get attendee ids + the booking credential the same way the terminal does (event-scoped view).
const party = async (s, code) => (await api(s.page, 'GET', `/rest/v1/attendee_tickets?registration_code=eq.${code}&select=ticket_id,guest_name,group_token&order=ticket_number`)).data || [];
const idOf = (list, name) => list.find((x) => x.guest_name === name)?.ticket_id;
{
  const g10 = await party(staffA, 'TS-GRP10');
  const t10 = g10[0]?.group_token;
  check(/^[0-9a-f]{40}$/.test(t10 || '') && g10.length === 10, 'staff read the booking credential and its 10 attendees from the event-scoped view');
  const grp5 = await party(staffA, 'TS-GRP5');
  const other = await party(staffA, 'TS-GRPOTHER');
  const v6Id = sql("select t.id from tickets t join bookings b on b.id = t.booking_id where b.registration_code = 'TS-GRPV6' limit 1");
  const cases = [
    [[idOf(grp5, 'Rahul Sharma')], 'invalid_attendee', 'attendee from another booking (already checked in elsewhere)'],
    [[idOf(g10, 'A. One'), idOf(other, 'Zoya Ali')], 'invalid_attendee', 'attendee injected from another booking'],
    [[v6Id], 'invalid_attendee', 'attendee from another event'],
    [['00000000-0000-4000-8000-000000000000'], 'invalid_attendee', 'forged attendee id'],
    [[], 'invalid_selection', 'empty selection'],
    [[idOf(g10, 'A. One'), idOf(g10, 'A. One')], 'invalid_selection', 'same attendee twice'],
  ];
  for (const [ids, expect, label] of cases) {
    const r = await rpc(staffA, { p_token: t10, p_event_id: V5, p_attendee_ids: ids });
    check(r.data?.result === expect, `${label}: refused (${r.data?.result})`);
  }
  const bad = await attempt(staffA, 'malformed attendee id', () => rpc(staffA, { p_token: t10, p_event_id: V5, p_attendee_ids: ['not-a-uuid'] }));
  check(bad.status >= 400 && !bad.data?.result, `malformed attendee id rejected (HTTP ${bad.status})`);
  check(rows('TS-GRP10') + rows('TS-GRPOTHER') + rows('TS-GRPV6') === 0, 'refused requests changed nothing anywhere');

  const ok = await rpc(staffA, { p_token: t10, p_event_id: V5, p_attendee_ids: [idOf(g10, 'A. One'), idOf(g10, 'B. Two')] });
  check(ok.data?.result === 'valid' && ok.data.quantity === 2, 'quantity is derived from the selected attendees (2)');
  const again = await rpc(staffA, { p_token: t10, p_event_id: V5, p_attendee_ids: [idOf(g10, 'C. Three'), idOf(g10, 'A. One')] });
  check(again.data?.result === 'attendee_already_checked_in' && JSON.stringify(again.data.already) === '["A. One"]' && inNames('TS-GRP10') === 'A. One, B. Two',
    'a selection containing an already checked-in attendee is refused whole (C. Three not admitted)');

  // Two gates, the same person, the same moment.
  const race = await party(staffA, 'TS-GRPRACE');
  const tr = race[0].group_token;
  const [a, b] = await Promise.all([
    rpc(staffA, { p_token: tr, p_event_id: V5, p_attendee_ids: [idOf(race, 'Kavi Reddy')] }),
    rpc(staffB, { p_token: tr, p_event_id: V5, p_attendee_ids: [idOf(race, 'Kavi Reddy')] }),
  ]);
  check([a, b].filter((r) => r.data?.result === 'valid').length === 1 && [a, b].some((r) => r.data?.result === 'attendee_already_checked_in'),
    `two staff check in Kavi at once: exactly one succeeds (${a.data?.result} / ${b.data?.result})`);
  check(rows('TS-GRPRACE') === 1, 'Kavi has exactly one attendance record');
  // Burst: six overlapping selections at once — all-or-nothing, never double.
  const picks = [['Isha Reddy', 'Lata Reddy'], ['Lata Reddy', 'Mohan Reddy'], ['Mohan Reddy', 'Nila Reddy'], ['Isha Reddy'], ['Nila Reddy'], ['Lata Reddy', 'Isha Reddy']];
  const burst = await Promise.all(picks.map((names, i) => rpc(i % 2 ? staffB : staffA, { p_token: tr, p_event_id: V5, p_attendee_ids: names.map((n) => idOf(race, n)) })));
  const admitted = burst.filter((r) => r.data?.result === 'valid').reduce((n, r) => n + r.data.quantity, 0);
  // Which requests win depends on arrival order; what must hold is all-or-nothing and ≤ 5.
  check(rows('TS-GRPRACE') === 1 + admitted && rows('TS-GRPRACE') <= 5 && admitted >= 3 && burst.every((r) => ['valid', 'attendee_already_checked_in', 'already_checked_in'].includes(r.data?.result)),
    `overlapping burst: ${admitted} admitted, ${rows('TS-GRPRACE')} / 5 records, every other request refused whole`);
  check(Number(sql('select count(*) from (select ticket_id from checkins group by 1 having count(*) > 1) d')) === 0, 'no attendee was ever checked in twice');

  const duo = await party(staffA, 'TS-GRP2');
  const both = await rpc(staffA, { p_token: duo[0].group_token, p_event_id: V5, p_attendee_ids: duo.map((x) => x.ticket_id) });
  check(both.data?.result === 'valid' && both.data.checked_in === 2, 'two attendees with the same name are distinct people; both admitted together');
}
{
  const bk = (await api(staffB.page, 'GET', '/rest/v1/bookings?registration_code=eq.TS-GRPCXL&select=id,group_token')).data?.[0];
  const cx = await party(staffA, 'TS-GRPCXL');
  const c = await api(staffB.page, 'POST', '/rest/v1/rpc/admin_cancel_booking', { p_booking_id: bk.id, p_reason: 'E2E guest cancelled' });
  check(c.status < 300, 'admin cancels a booking before the event');
  check(!(await party(staffA, 'TS-GRPCXL'))[0]?.group_token, 'a cancelled booking no longer exposes its credential to staff');
  const r = await rpc(staffA, { p_token: bk.group_token, p_event_id: V5, p_attendee_ids: [cx[0].ticket_id] });
  check(r.data?.result === 'cancelled' && rows('TS-GRPCXL') === 0, 'cancelled booking refused, nothing written');
}
{
  for (const email of ['patron@tangy.test', 'volunteer@tangy.test']) {
    const s = await launch();
    await otpLogin(s.page, email, '/join/login');
    const r = await attempt(s, `${email} check-in`, () => api(s.page, 'POST', '/rest/v1/rpc/check_in_ticket',
      { p_token: groupToken('TS-GRP10'), p_event_id: V5, p_attendee_ids: [sql("select t.id from tickets t join bookings b on b.id = t.booking_id where b.registration_code = 'TS-GRP10' and t.status = 'valid' limit 1")] }));
    check(r.status >= 400 && /permission/i.test(JSON.stringify(r.data)), `${email.split('@')[0]} cannot check anyone in (HTTP ${r.status})`);
    if (email.startsWith('patron')) {
      // The customer owns TS-LOCAL001: they can read their tickets but not change check-in state.
      const own = (await api(s.page, 'GET', "/rest/v1/tickets?select=id,status&ticket_number=like.TS-LOCAL001*")).data || [];
      const patch = await attempt(s, 'patron edits own ticket', () => api(s.page, 'PATCH', `/rest/v1/tickets?id=eq.${own[0]?.id}`, { status: 'checked_in', attendee_name: 'Someone Else' }));
      const ins = await attempt(s, 'patron inserts a check-in', () => api(s.page, 'POST', '/rest/v1/checkins', { ticket_id: own[0]?.id, event_id: V5 }));
      check(own.length > 0 && (patch.status >= 400 || (Array.isArray(patch.data) && patch.data.length === 0)) && ins.status >= 400
        && sql(`select status || coalesce(attendee_name, '') from tickets where id = '${own[0]?.id}'`) === 'valid',
        `a customer cannot mark themselves checked in or rename attendees (PATCH ${patch.status}, INSERT ${ins.status})`);
    }
    track(email, s.errors); await s.browser.close();
  }
  check(inNames('TS-GRP10') === 'A. One, B. Two', 'unauthorised attempts wrote nothing');
}

// ================================================================ 6. reporting totals
{
  const delta = statsCheckedIn() - statsBefore;
  const records = Number(sql("select count(*) from checkins c join tickets t on t.id = c.ticket_id join bookings b on b.id = t.booking_id where b.registration_code like 'TS-GRP%'"));
  const bookings = Number(sql("select count(distinct b.id) from checkins c join tickets t on t.id = c.ticket_id join bookings b on b.id = t.booking_id where b.registration_code like 'TS-GRP%'"));
  check(delta === records && records > bookings, `event check-ins grew by ${delta} attendees across ${bookings} bookings — attendees, not bookings`);
}

for (const [label, s] of [['staff', staffA], ['manager', staffB]]) { track(label, s.errors); await s.browser.close(); }
console.log('\nEXPECTED REFUSALS (deliberate attacks):\n' + (refused.join('\n') || '(none)'));
console.log('\nERRORS:\n' + (allErrors.join('\n') || '(none)'));
