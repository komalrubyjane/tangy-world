// A poster-ticket: black mount, aged-paper poster, the event photograph in
// full colour, an oversized date numeral, then a ticket panel (info table,
// tags, perforated price stub, book bar). Every card — first, middle or
// last — renders through this exact markup; nothing branches on position.
//
// HARD RULE: the event photograph never receives a colour-altering filter
// and nothing is ever placed over it except the date numeral at its base.

import { TornPaperEdgeTop } from './BackgroundDecorations';

// Stamp ink per availability — muted green for available, per the catalogue.
const STATUS_STYLES = {
  'SOLD OUT': { ink: '#4A171D' },
  AVAILABLE: { ink: '#4F5D3A' },
  'ALMOST GONE': { ink: '#B5532A' },
  UPCOMING: { ink: '#181614' },
};

export const PosterEventCard = ({ event: evt, idx, onBook }) => {
  const isSoldOut = evt.status === 'SOLD OUT';
  const statusStyle = STATUS_STYLES[evt.status] || STATUS_STYLES.AVAILABLE;
  const [dateMain, dateYear] = (() => {
    const parts = evt.date?.split(',') || [];
    return parts.length > 1 ? [parts[0], parts[1].trim()] : [evt.date, ''];
  })();

  return (
    <article className="group relative h-full bg-[#181614] p-2 sm:p-2.5 paperShadow paperLift">
      <div className="relative h-full bg-[#EDE0C0] paperTexture text-[#181614] overflow-hidden flex">

        {/* Spot-colour side strip carrying the event's tags */}
        <div className="relative w-6 shrink-0 bg-[#B5532A]">
          <span
            className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-medium text-[#EFE2C0] uppercase tracking-[0.22em] whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {(evt.tags?.slice(0, 3).join(' · ') || 'LIVE · MUSIC · CULTURE')}
          </span>
        </div>

        <div className="relative flex-1 min-w-0 flex flex-col">
          {/* Ticket number + availability */}
          <div className="flex justify-between items-center gap-2 px-3 py-2.5">
            <span className="t-meta">Vol. TK-1974 · No. {String(idx + 1).padStart(3, '0')}</span>
            {/* Availability as a rubber stamp in the status ink */}
            <span className="archiveStamp !text-[10px] !py-0.5 !px-1.5" style={{ color: statusStyle.ink, '--rest-rot': '-5deg' }}>
              {evt.status}
            </span>
          </div>

          {/* Event photograph — full colour, unfiltered */}
          <div className="photoFrame-img relative w-full aspect-[4/3] bg-[#181614]">
            <img src={evt.image} alt={evt.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-3">
              <p className="display text-[#EDE0C0] m-0 !leading-[0.9]" style={{ fontSize: 'clamp(34px, 4vw, 48px)', textShadow: '0.04em 0.04em 0 #181614, -0.025em -0.02em 0 rgba(181,83,42,0.75)' }}>
                {dateMain}{dateYear && <><br />{dateYear}</>}
              </p>
            </div>
          </div>

          {/* Ticket panel */}
          <div className="relative flex-1 flex flex-col">
            <TornPaperEdgeTop fill="#F5E9C9" />
            <div className="flex-1 flex flex-col bg-[#F5E9C9] px-3 sm:px-4 pt-6 md:pt-7 pb-4">
              <h3 className="t-h3 m-0 line-clamp-2">{evt.title}</h3>
              <p className="t-label text-[#B5532A] mt-1 mb-3">{evt.artist}</p>

              <div className="grid grid-cols-3 divide-x divide-[#181614]/20 border-y border-[#181614]/60 py-2 mb-3">
                <div className="pr-2 min-w-0">
                  <span className="block t-meta text-[#B5532A]">Venue</span>
                  <span className="block font-mono text-[11px] leading-snug line-clamp-2">{evt.venue}</span>
                </div>
                <div className="px-2 min-w-0">
                  <span className="block t-meta text-[#B5532A]">Sound</span>
                  <span className="block font-mono text-[11px] leading-snug line-clamp-2">{evt.tags?.slice(0, 2).join(' · ') || '—'}</span>
                </div>
                <div className="pl-2 min-w-0">
                  <span className="block t-meta text-[#B5532A]">Time</span>
                  <span className="block font-mono text-[11px] leading-snug">{evt.time}</span>
                </div>
              </div>

              <p className="t-small text-[#181614]/85 m-0 mb-4 line-clamp-2">{evt.description}</p>

              <div className="mt-auto flex items-stretch gap-2">
                <button
                  onClick={onBook}
                  disabled={isSoldOut}
                  className={`ticket-cta flex-1 min-w-0 min-h-[44px] font-mono text-[11px] font-medium uppercase tracking-[0.16em] transition-colors ${
                    isSoldOut ? 'bg-[#4A171D] text-[#EFE2C0]/60 cursor-not-allowed' : 'bg-[#181614] text-[#EFE2C0] hover:bg-[#B5532A] group-hover:bg-[#B5532A]'
                  }`}
                >
                  {isSoldOut ? 'Sold out' : 'Book tickets →'}
                </button>
                <div className="shrink-0 w-16 flex flex-col items-center justify-center bg-[#B5532A] text-[#EFE2C0] border-l-2 border-dashed border-[#F5E9C9]">
                  <span className="font-mono text-[12px] font-medium leading-none">{evt.price}</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] opacity-80 mt-1">Entry 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
