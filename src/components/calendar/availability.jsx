import { AVAILABILITY } from './availabilityMeta';

export const AvailabilityPill = ({ status, detail }) => {
  const a = AVAILABILITY[status] || AVAILABILITY.unknown;
  return (
    <span className={`inline-flex items-center gap-1 h-6 px-2 rounded-full border text-[11px] font-medium whitespace-nowrap ${a.cls}`}
      data-availability={status} title={detail || a.label}>
      <span aria-hidden="true">{a.symbol}</span>{a.label}
    </span>
  );
};
