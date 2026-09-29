// Formats a timestamp in an explicit IANA timezone (event local time). Tangy
// events default to Asia/Kolkata; callers pass the event's own timezone.
export const DEFAULT_TZ = 'Asia/Kolkata';

export const tzTime = (ts, tz = DEFAULT_TZ, withDate = false) => (ts
  ? new Intl.DateTimeFormat('en-IN', { timeZone: tz || DEFAULT_TZ, hour: 'numeric', minute: '2-digit', ...(withDate ? { day: 'numeric', month: 'short' } : {}) }).format(new Date(ts))
  : null);

export const tzAbbr = (tz = DEFAULT_TZ) => {
  try {
    return new Intl.DateTimeFormat('en-IN', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value || tz;
  } catch {
    return tz;
  }
};
