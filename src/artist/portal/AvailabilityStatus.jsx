import { Btn, PIcon } from './kit';

const fmtStamp = (ts) => {
  if (!ts) return 'Never';
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? `Today, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
    : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// "Last updated" + the reminder when the calendar has gone stale (the
// threshold is the team's artists.availability_stale_days setting, applied on
// the server by artist_availability_summary).
export const AvailabilityFreshness = ({ summary, cta = true }) => {
  if (!summary) return null;
  return (
    <div className="flex flex-col gap-2" data-availability-freshness>
      <p className="text-sm m-0 text-[#E7D5A4]/85">Last updated: <span className="text-[#F3E7C9]" data-last-updated>{fmtStamp(summary.last_updated)}</span></p>
      {summary.is_stale && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-md border border-[#C99A2E]/50 bg-[#C99A2E]/10 px-3 py-2 text-sm" data-availability-stale>
          <PIcon name="AlertTriangle" size={16} className="text-[#E4BD5C]" />
          <span className="flex-1 min-w-[180px]">Your availability hasn't been updated recently.</span>
          {cta && <Btn size="sm" variant="primary" to="/artist/availability">Update availability</Btn>}
        </div>
      )}
    </div>
  );
};

// Next seven days at a glance (counts per state, from the same server answer the team sees).
export const NextSevenDays = ({ summary }) => {
  const n = summary?.next7 || {};
  const rows = [['available', 'available'], ['busy', 'booked'], ['tentative', 'tentative'], ['unavailable', 'unavailable'], ['unknown', 'not set']];
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-5 gap-2 m-0" data-next7>
      {rows.map(([k, label]) => (
        <div key={k} className="rounded-md border border-[#E7D5A4]/10 px-2 py-1.5">
          <dt className="text-[11px] text-[#E7D5A4]/60">{label}</dt>
          <dd className="m-0 font-condensed text-2xl text-[#F3E7C9]" data-next7-count={k}>{n[k] || 0}</dd>
        </div>
      ))}
    </dl>
  );
};
