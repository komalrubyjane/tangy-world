// A single, richly-detailed poster-ticket composition built to the user's own
// reference mock-up: a torn black mounting frame around an aged paper poster,
// a real lotus-photograph medallion overlapping the (full-colour, unfiltered)
// event photo, a taped real print fragment, an oversized date numeral bleeding
// off the photo's base, and a torn ticket-stub panel below carrying a 3-column
// info table, tag pills, a perforated price stub and a printed "book" bar.
//
// HARD RULE: the event photograph itself never receives a colour-altering
// filter — it renders in its original colours, exactly like the reference.
// Every retro cue instead comes from real lotus/textile/Bandhani/Rangoli/
// cutout assets layered around it, never a CSS-invented substitute.

import { TornPaperEdgeTop } from './BackgroundDecorations';
import { RetroGrain, LotusStamp, PatternBackground } from './RetroAssets';
import { pickAsset } from '../../data/retroAssets';

const STATUS_STYLES = {
  'SOLD OUT': { bg: '#5A120D', text: '#E7D5A4' },
  AVAILABLE: { bg: '#2D5A1B', text: '#E7D5A4' },
  'ALMOST GONE': { bg: '#B94717', text: '#E7D5A4' },
  UPCOMING: { bg: '#11100C', text: '#C99A2E' },
};

const CORNER_MARK = 'absolute text-[#E7D5A4]/70 text-[9px] sm:text-[10px] leading-none pointer-events-none select-none z-30';

export const PosterEventCard = ({ event: evt, idx, onBook }) => {
  const isSoldOut = evt.status === 'SOLD OUT';
  const statusStyle = STATUS_STYLES[evt.status] || STATUS_STYLES.AVAILABLE;
  const tapedFragment = idx % 2 === 0 ? pickAsset('cutout', idx) : pickAsset('halftone', idx);
  const [dateMain, dateYear] = (() => {
    const parts = evt.date?.split(',') || [];
    return parts.length > 1 ? [parts[0], parts[1].trim()] : [evt.date, ''];
  })();

  return (
    <div className="relative bg-[#11100C] p-[8px] sm:p-[12px] shadow-[8px_8px_0px_#11100C] sm:shadow-[14px_14px_0px_#11100C] group hover:-translate-y-1 transition-transform duration-200">
      {/* CROP-MARK CORNERS on the outer black mount, echoing the print-registration marks */}
      {/* on the reference mock-up. */}
      <span className={`${CORNER_MARK} top-1 left-1`}>✦</span>
      <span className={`${CORNER_MARK} top-1 right-1`}>✦</span>
      <span className={`${CORNER_MARK} bottom-1 left-1`}>✦</span>
      <span className={`${CORNER_MARK} bottom-1 right-1`}>✦</span>

      {/* AGED PAPER BODY */}
      <div className="relative bg-[#EDE0C0] text-[#11100C] overflow-hidden flex">
        <RetroGrain index={idx % 2} opacity={0.14} blend="multiply" />

        {/* REAL BANDHANI SIDE STRIP — vertical spot-colour panel carrying the event's tags, */}
        {/* a genuine textile photograph rather than a CSS pattern. */}
        <div className="relative w-5 sm:w-6 shrink-0 bg-[#B94717] overflow-hidden">
          <PatternBackground category="bandhani" index={idx % 3} opacity={0.4} size="cover" blend="multiply" />
          <span
            className="absolute inset-0 flex items-center justify-center font-mono text-[7px] sm:text-[7.5px] font-bold text-[#E7D5A4] uppercase tracking-[0.25em] whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {(evt.tags?.slice(0, 3).join(' · ') || 'LIVE · MUSIC · CULTURE')}
          </span>
        </div>

        <div className="relative flex-1 min-w-0">
          {/* TOP BAR — archive number + availability + REC label */}
          <div className="relative z-20 flex justify-between items-start p-2 sm:p-2.5">
            <span className="font-mono text-[7.5px] sm:text-[8px] font-bold uppercase tracking-widest">
              VOL. TK-1974 · NO. 00{idx + 1}
            </span>
            <div className="flex flex-col items-end gap-1">
              <span
                className="font-mono text-[7.5px] sm:text-[8px] font-bold uppercase px-2 py-0.5 border border-[#11100C]"
                style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
              >
                {evt.status}
              </span>
              <span className="hidden sm:block font-mono text-[7px] font-bold uppercase px-1.5 py-0.5 bg-[#5A120D] text-[#E7D5A4] border border-[#11100C]">
                REC · LIVE AT VENUE
              </span>
            </div>
          </div>

          {/* MAIN PHOTO — full colour, no filter, exactly the supplied photograph. */}
          <div className="relative w-full aspect-[4/3] overflow-hidden">
            <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />

            {/* REAL LOTUS MEDALLION — overlapping the photo's top-left corner. */}
            <div className="absolute top-2 left-2 z-20 w-12 h-12 sm:w-16 sm:h-16 -rotate-6">
              <LotusStamp index={idx} bg="transparent" border="#B94717" className="w-full h-full shadow-lg" />
            </div>

            {/* TAPED REAL PRINT FRAGMENT — a genuine supplied photograph, taped at an angle */}
            {/* onto the poster, top-right. */}
            {tapedFragment && (
              <div className="hidden sm:block absolute top-2 right-2 z-20 w-11 rotate-6">
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-[rgba(231,213,164,0.85)] border border-black/25 rotate-[-3deg] z-10" />
                <div className="border-2 border-[#11100C] shadow-[3px_3px_0px_rgba(17,16,12,0.7)] overflow-hidden aspect-[3/4]">
                  <img src={tapedFragment} alt="" aria-hidden="true" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* OVERSIZED DATE NUMERAL bleeding off the photo's base. */}
            <div className="absolute -bottom-1 left-2 sm:left-3 z-20">
              <h2 className="display font-black text-[#EDE0C0] leading-[0.78] ink-bleed uppercase drop-shadow-[2px_2px_0_#11100C]" style={{ fontSize: 'clamp(28px,7vw,46px)' }}>
                {dateMain}{dateYear && <><br />{dateYear}</>}
              </h2>
              <div className="w-2/3 h-[3px] bg-[#B94717] mt-0.5" />
            </div>

            {/* SMALL RED LOTUS INK STAMP */}
            <LotusStamp index={(idx + 2) % 4} bg="transparent" border="transparent" className="absolute bottom-2 right-2 z-20 w-8 h-8 sm:w-9 sm:h-9 opacity-90" />
          </div>

          {/* TORN TICKET PANEL */}
          <div className="relative z-20">
            <TornPaperEdgeTop fill="#F5E9C9" />
            <div className="bg-[#F5E9C9] px-2.5 sm:px-4 pt-2 pb-3 sm:pb-4">
              <h3 className="display text-xl sm:text-2xl leading-[0.85] uppercase mb-0.5 line-clamp-2">
                {evt.title}
              </h3>
              <p className="font-mono text-[9px] sm:text-[10px] font-bold text-[#B94717] uppercase tracking-wide mb-2">{evt.artist}</p>

              {/* THREE-COLUMN INFO TABLE — venue / sound / time, printed poster-ticket style. */}
              <div className="grid grid-cols-3 divide-x divide-[#11100C]/25 border-y border-[#11100C] py-1.5 mb-2">
                <div className="pr-1.5">
                  <span className="block font-mono text-[6.5px] sm:text-[7px] font-bold text-[#B94717] uppercase tracking-widest">Venue</span>
                  <span className="block font-mono text-[7.5px] sm:text-[8.5px] font-bold leading-tight line-clamp-2">{evt.venue}</span>
                </div>
                <div className="px-1.5">
                  <span className="block font-mono text-[6.5px] sm:text-[7px] font-bold text-[#B94717] uppercase tracking-widest">Sound</span>
                  <span className="block font-mono text-[7.5px] sm:text-[8.5px] font-bold leading-tight line-clamp-2">{evt.tags?.slice(0, 2).join(' · ') || '—'}</span>
                </div>
                <div className="pl-1.5">
                  <span className="block font-mono text-[9px] sm:text-[10px] font-bold leading-tight">{evt.time}</span>
                  <span className="block font-mono text-[6.5px] sm:text-[7px] opacity-70 leading-tight">{evt.date}</span>
                </div>
              </div>

              <p className="font-mono text-[8.5px] sm:text-[9.5px] leading-snug border-l-2 border-[#B94717] pl-2 mb-2 line-clamp-2 opacity-90">
                {evt.description}
              </p>

              {/* TAG PILLS */}
              {evt.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {evt.tags.slice(0, 3).map((t) => (
                    <span key={t} className="font-mono text-[6.5px] sm:text-[7px] font-bold uppercase border border-[#11100C] px-1.5 py-0.5">{t}</span>
                  ))}
                </div>
              )}

              {/* BOOK BAR + PERFORATED PRICE STUB */}
              <div className="flex items-stretch gap-2">
                <button
                  onClick={onBook}
                  disabled={isSoldOut}
                  className={`flex-1 min-w-0 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    isSoldOut ? 'bg-[#5A120D] text-[#E7D5A4]/60 cursor-not-allowed' : 'bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717]'
                  }`}
                >
                  {isSoldOut ? 'SOLD OUT ✗' : 'BOOK TICKETS →'}
                </button>
                <div className="shrink-0 w-14 flex flex-col items-center justify-center bg-[#B94717] text-[#E7D5A4] border-l-2 border-dashed border-[#F5E9C9]">
                  <span className="font-mono text-[10px] sm:text-[11px] font-black leading-none">{evt.price}</span>
                  <span className="font-mono text-[5.5px] uppercase tracking-widest opacity-80" style={{ writingMode: 'vertical-rl' }}>ENTRY 1</span>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER STRIP */}
          <div className="relative z-20 flex justify-between items-center px-2.5 sm:px-4 py-1.5 border-t border-[#11100C]/30 font-mono text-[6.5px] sm:text-[7px] font-bold uppercase tracking-widest opacity-80">
            <span>Tangy Music Collective</span>
            <span>Hyderabad — Est. 2016</span>
          </div>
        </div>
      </div>
    </div>
  );
};
