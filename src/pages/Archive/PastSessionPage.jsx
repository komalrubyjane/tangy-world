import { Fragment } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { PageCrumbs } from '../../components/layout/SectionNav';
import { ContentLoading, ContentError } from '../../components/ui/ContentStates';
import { MediaImg } from '../../components/ui/Media';
import { NotFoundPage } from '../content/NotFoundPage';
import { archive } from '../../lib/archiveService';
import { useContent, formatDate } from '../../hooks/useContent';
import { usePageMeta } from '../../hooks/usePageMeta';
import { useSessionBackground } from '../../lib/sessionBackground';

const Block = ({ title, children }) => (
  <section className="border-t border-[#C99A2E]/30 pt-6 mt-10">
    <h2 className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold mb-4">{title}</h2>
    {children}
  </section>
);
const CARD = 'block bg-[#EFE2C0] text-[#11100C] border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] hover:-translate-y-1 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]';

// /sessions/archive/:slug — one past session and everything it left behind.
export const PastSessionPage = () => {
  const { slug } = useParams();
  const { data: s, loading, error, retry } = useContent(() => archive.getPastSession(slug), [slug]);
  const pageBackground = useSessionBackground(s?.page_background, s?.image_url);
  usePageMeta({
    title: s ? `${s.name} (${String(s.event_date).slice(0, 4)})` : loading ? 'Previous Sessions' : 'Not found',
    description: s?.description, image: s?.image_url, noindex: !loading && !s,
  });

  if (!loading && !error && !s) return <NotFoundPage what="session" back={{ to: '/sessions/archive', label: 'Back to previous sessions' }} />;
  if (s?.upcoming) return <Navigate to={`/sessions/${s.slug}`} replace />;

  return (
    <div className="theme-sessions relative isolate min-h-screen text-[#E7D5A4] font-mono overflow-x-hidden printNoise" data-page-background={s?.page_background || 'default'}>
      <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none" style={pageBackground} data-session-backdrop />
      <Navbar />
      <main className="pt-24 sm:pt-32 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <PageCrumbs parent={{ label: 'Previous Sessions', to: '/sessions/archive' }} label={s?.name} className="[&_ol]:justify-start" />
        {loading && <ContentLoading label="Opening the record…" />}
        {!loading && error && <ContentError onRetry={retry}>We couldn’t load this session right now.</ContentError>}
        {s && (
          <article data-past-session-page={s.slug}>
            <header className="mt-6">
              <span className="text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mb-2">
                {formatDate(s.event_date)} · {s.venue}{s.status === 'cancelled' ? ' · CANCELLED' : ''}
              </span>
              <h1 className="display text-4xl sm:text-6xl uppercase leading-none m-0">{s.name}</h1>
              {s.image_url && (
                <div className="mt-6 border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] aspect-[16/8] overflow-hidden bg-black">
                  <MediaImg src={s.image_url} alt={`${s.name} at ${s.venue}`} className="w-full h-full object-cover" />
                </div>
              )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 mt-8">
              <div className="font-body text-sm sm:text-base leading-relaxed text-[#E7D5A4]/90">
                <p className="m-0">{s.description}</p>
                {s.story && <p className="mt-4 italic text-[#E7D5A4]/80">“{s.story}”</p>}
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs m-0 self-start bg-[#211915] border border-[#C99A2E]/30 p-4">
                <dt className="text-[#C99A2E] uppercase">Date</dt><dd className="m-0">{formatDate(s.event_date)}{s.event_time ? ` · ${s.event_time}` : ''}</dd>
                <dt className="text-[#C99A2E] uppercase">Venue</dt><dd className="m-0">{s.venue}</dd>
                <dt className="text-[#C99A2E] uppercase">Status</dt><dd className="m-0">{s.status === 'cancelled' ? 'Cancelled' : 'Held'}</dd>
                {s.attendance_recorded != null && (<><dt className="text-[#C99A2E] uppercase">Attendance</dt><dd className="m-0" data-attendance>{s.attendance_recorded} of {s.capacity}</dd></>)}
                {s.tags?.length > 0 && (<><dt className="text-[#C99A2E] uppercase">Type</dt><dd className="m-0">{s.tags.join(' · ')}</dd></>)}
                {s.programmes.map((p) => (
                  <Fragment key={p.slug}>
                    <dt className="text-[#C99A2E] uppercase">Programme</dt>
                    <dd className="m-0"><Link to={`/archive/programmes/${p.slug}`} className="underline underline-offset-4 hover:text-[#C99A2E]">{p.title} {p.year}</Link></dd>
                  </Fragment>
                ))}
              </dl>
            </div>

            {s.artists.length > 0 && (
              <Block title="Line-up">
                <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 list-none m-0 p-0">
                  {s.artists.map((a) => (
                    <li key={a.id}>
                      <Link to={`/artists/${a.slug}`} className={CARD} data-lineup-artist={a.slug}>
                        <div className="aspect-square bg-[#11100C]/10 overflow-hidden">{a.avatar_url && <MediaImg src={a.avatar_url} alt="" loading="lazy" className="w-full h-full object-cover" />}</div>
                        <div className="p-3"><div className="font-condensed text-base font-bold uppercase leading-tight">{a.stage_name || a.name}</div><div className="text-[10px] opacity-75">{a.genre}</div></div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {s.albums.length > 0 && (
              <Block title="Photographs">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none m-0 p-0">
                  {s.albums.map((a) => (
                    <li key={a.id}><Link to={`/gallery/${a.slug}`} className={CARD} data-session-album={a.slug}>
                      <div className="aspect-[4/3] overflow-hidden bg-[#11100C]/10">{a.cover_url && <MediaImg src={a.cover_url} alt="" loading="lazy" className="w-full h-full object-cover" />}</div>
                      <div className="p-3 font-condensed text-lg font-bold uppercase">{a.title}</div>
                    </Link></li>
                  ))}
                </ul>
              </Block>
            )}

            {s.tv.length > 0 && (
              <Block title="On Tangy TV">
                <ul className="flex flex-col gap-2 list-none m-0 p-0">
                  {s.tv.map((v) => <li key={v.id}><Link to={`/tv/${v.slug}`} className="inline-flex min-h-[44px] items-center gap-2 underline underline-offset-4 hover:text-[#C99A2E]" data-session-tv={v.slug}>▶ {v.title}</Link></li>)}
                </ul>
              </Block>
            )}

            {s.diary.length > 0 && (
              <Block title="From the diary">
                <ul className="flex flex-col gap-2 list-none m-0 p-0">
                  {s.diary.map((d) => <li key={d.id}><Link to={`/diary/${d.slug}`} className="inline-flex min-h-[44px] items-center underline underline-offset-4 hover:text-[#C99A2E]" data-session-diary={d.slug}>{d.title}</Link></li>)}
                </ul>
              </Block>
            )}

            <div className="mt-12 flex flex-wrap gap-3">
              <Link to="/sessions/archive" className="t-btn t-btn-ghost">← All previous sessions</Link>
              <Link to="/sessions" className="t-btn">Upcoming sessions</Link>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};
