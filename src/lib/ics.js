// Minimal RFC 5545 calendar export for "Add to calendar". Built from real
// event data only; times are written in UTC so every calendar app shows the
// correct local time regardless of the viewer's timezone.

const pad = (n) => String(n).padStart(2, '0');
const utc = (d) => {
  const x = new Date(d);
  return `${x.getUTCFullYear()}${pad(x.getUTCMonth() + 1)}${pad(x.getUTCDate())}T${pad(x.getUTCHours())}${pad(x.getUTCMinutes())}${pad(x.getUTCSeconds())}Z`;
};
const dateOnly = (iso) => iso.replace(/-/g, '');
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
// Lines longer than 75 octets must be folded.
const fold = (line) => {
  const out = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ` ${rest.slice(74)}`; }
  out.push(rest);
  return out.join('\r\n');
};

// items: [{ uid, title, start (ISO datetime) | date (YYYY-MM-DD), end?, location?, description?, url? }]
export function buildIcs(items, { name = 'Tangy Sessions' } = {}) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tangy Sessions//Artist Workspace//EN', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(name)}`];
  for (const it of items) {
    lines.push('BEGIN:VEVENT', `UID:${it.uid}@tangysessions.com`, `DTSTAMP:${utc(new Date())}`);
    if (it.start) {
      lines.push(`DTSTART:${utc(it.start)}`);
      lines.push(`DTEND:${utc(it.end || new Date(new Date(it.start).getTime() + 2 * 3600 * 1000))}`);
    } else {
      const next = new Date(`${it.date}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      lines.push(`DTSTART;VALUE=DATE:${dateOnly(it.date)}`, `DTEND;VALUE=DATE:${dateOnly(next.toISOString().slice(0, 10))}`);
    }
    lines.push(`SUMMARY:${esc(it.title)}`);
    if (it.location) lines.push(`LOCATION:${esc(it.location)}`);
    if (it.description) lines.push(`DESCRIPTION:${esc(it.description)}`);
    if (it.url) lines.push(`URL:${it.url}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n');
}

export function downloadIcs(items, filename = 'tangy-sessions.ics', opts) {
  const blob = new Blob([buildIcs(items, opts)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Google Calendar "add event" link — no OAuth, the user confirms in Google.
export function googleCalendarUrl({ title, start, end, location, description }) {
  const s = utc(start);
  const e = utc(end || new Date(new Date(start).getTime() + 2 * 3600 * 1000));
  const p = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${s}/${e}` });
  if (location) p.set('location', location);
  if (description) p.set('details', description);
  return `https://calendar.google.com/calendar/render?${p}`;
}
