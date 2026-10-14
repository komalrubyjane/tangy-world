import { TornPaperEdgeTop } from '../ui/BackgroundDecorations';
import { TEMPORARY_SESSION, TEMP_SESSION_FORM_URL } from '../../config/launch';

// /sessions during the temporary launch: the one session the team designated
// (src/config/launch.js), in the poster-ticket style of PosterEventCard.
// Only confirmed fields are shown — an unset field is left out, never guessed.
// "Book now" is a plain link to the team's Google Form: it never touches
// checkout, Razorpay, bookings, tickets or email.
export const TemporarySession = ({ session = TEMPORARY_SESSION, formUrl = TEMP_SESSION_FORM_URL }) => {
  const details = [
    ['Date', session.date],
    ['Time', session.time],
    ['Venue', session.venue],
    ['Entry', session.price],
  ].filter(([, value]) => value);

  return (
    <section className="pt-10 pb-16 px-4 sm:px-6" aria-label="Next session" data-temporary-session>
      <article className="relative max-w-xl mx-auto bg-[#181614] p-2 sm:p-2.5 paperShadow">
        <div className="relative bg-[#EDE0C0] paperTexture text-[#181614] overflow-hidden flex">
          <div className="relative w-6 shrink-0 bg-[#B5532A]" aria-hidden="true">
            <span
              className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-medium text-[#EFE2C0] uppercase tracking-[0.22em] whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              LIVE · MUSIC · CULTURE
            </span>
          </div>

          <div className="relative flex-1 min-w-0 flex flex-col">
            <div className="flex justify-between items-center gap-2 px-3 py-2.5">
              <span className="t-meta">Next session</span>
              <span className="archiveStamp !text-[10px] !py-0.5 !px-1.5" style={{ color: '#4F5D3A', '--rest-rot': '-5deg' }}>
                {formUrl ? 'Registration open' : 'Opening soon'}
              </span>
            </div>

            {session.image && (
              <div className="photoFrame-img relative w-full aspect-[4/3] bg-[#181614]">
                <img src={session.image} alt={session.title || 'Tangy Sessions'} decoding="async" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="relative flex-1 flex flex-col">
              <TornPaperEdgeTop fill="#F5E9C9" />
              <div className="flex-1 flex flex-col bg-[#F5E9C9] px-4 sm:px-6 pt-7 pb-5">
                <h2 className="t-h3 m-0">{session.title || 'Our next session'}</h2>
                {session.artists && <p className="t-label text-[#B5532A] mt-1 mb-0">{session.artists}</p>}

                {details.length > 0 && (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-[#181614]/60 py-3 mt-4 mb-0">
                    {details.map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <dt className="t-meta text-[#B5532A]">{label}</dt>
                        <dd className="m-0 font-mono text-[12px] leading-snug">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <p className="t-small text-[#181614]/85 mt-4 mb-5">
                  {session.description || 'Details for our next session will be announced here soon.'}
                </p>

                {formUrl ? (
                  <a
                    href={formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-temp-session-book
                    className="ticket-cta mt-auto min-h-[48px] inline-flex items-center justify-center bg-[#181614] text-[#EFE2C0] hover:bg-[#B5532A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5532A] font-mono text-[12px] font-medium uppercase tracking-[0.16em] transition-colors"
                  >
                    Book now →<span className="sr-only"> (opens the registration form in a new tab)</span>
                  </a>
                ) : (
                  <p
                    data-temp-session-unavailable
                    className="mt-auto m-0 min-h-[48px] flex items-center justify-center text-center bg-[#181614]/10 border-2 border-dashed border-[#181614]/50 font-mono text-[11px] font-bold uppercase tracking-[0.16em] px-3"
                  >
                    Registration opens soon — check back shortly
                  </p>
                )}
                {formUrl && (
                  <p className="t-meta text-[#181614]/70 mt-3 mb-0 text-center">Registration is through our Google Form.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
};
