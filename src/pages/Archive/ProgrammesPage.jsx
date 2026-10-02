import { Link, useParams } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { PageCrumbs, SectionNav } from '../../components/layout/SectionNav';
import { ContentLoading, ContentError, ContentEmpty } from '../../components/ui/ContentStates';
import { MediaImg } from '../../components/ui/Media';
import { NotFoundPage } from '../content/NotFoundPage';
import { PastSessionCard } from '../../components/archive/ArchiveKit';
import { archive } from '../../lib/archiveService';
import { useContent, formatDate } from '../../hooks/useContent';
import { usePageMeta } from '../../hooks/usePageMeta';

// /archive/programmes — every published programme (season / series), by year.
export const ProgrammesPage = () => {
  usePageMeta({ title: 'Programmes', description: 'Tangy Sessions programmes by year — the seasons and series every session belonged to.' });
  const { data, loading, error, retry } = useContent(() => archive.listProgrammes());
  const programmes = data || [];
  const years = [...new Set(programmes.map((p) => p.year))];
  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono overflow-x-hidden printNoise">
      <Navbar />
      <header className="pt-24 sm:pt-32 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <PageCrumbs />
        <span className="text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mt-3 mb-3">PRINTED PROGRAMMES</span>
        <h1 className="display text-4xl sm:text-7xl uppercase leading-none m-0">PROGRAMMES</h1>
        <p className="text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 mt-6 uppercase">
          Every season and series, year by year, with the sessions in each.
        </p>
        <SectionNav className="mt-6" />
      </header>
      <main className="py-10 px-4 sm:px-6 max-w-6xl mx-auto">
        {loading && <ContentLoading label="Unfolding the programmes…" />}
        {!loading && error && <ContentError onRetry={retry}>We couldn’t load the programmes right now.</ContentError>}
        {!loading && !error && programmes.length === 0 && <ContentEmpty>No programmes published yet.</ContentEmpty>}
        {years.map((y) => (
          <section key={y} className="mb-10" aria-labelledby={`programmes-${y}`}>
            <h2 id={`programmes-${y}`} className="display text-3xl sm:text-4xl m-0 mb-4 border-b border-[#C99A2E]/30 pb-2">{y}</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 list-none m-0 p-0">
              {programmes.filter((p) => p.year === y).map((p) => (
                <li key={p.id}>
                  <Link to={`/archive/programmes/${p.slug}`} data-programme={p.slug}
                    className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] bg-[#EFE2C0] text-[#11100C] border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] hover:-translate-y-1 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]">
                    <div className="bg-[#11100C]/10 overflow-hidden">{p.cover_url && <MediaImg src={p.cover_url} alt="" loading="lazy" className="w-full h-full object-cover grayscale-[40%]" />}</div>
                    <div className="p-4">
                      <div className="font-mono text-[10px] font-bold uppercase text-[#7C2D18]">{[p.season, p.year].filter(Boolean).join(' · ')}</div>
                      <h3 className="font-condensed text-xl font-bold uppercase leading-tight m-0 mt-1">{p.title}</h3>
                      <p className="font-body text-sm text-[#11100C]/80 m-0 mt-1">{p.description}</p>
                      <p className="font-mono text-[10px] text-[#11100C]/70 m-0 mt-2">{p.programme_events?.[0]?.count ?? 0} sessions</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
};

// /archive/programmes/:slug — one programme as a printed card + its sessions.
export const ProgrammePage = () => {
  const { slug } = useParams();
  const { data: p, loading, error, retry } = useContent(() => archive.getProgramme(slug), [slug]);
  usePageMeta({ title: p ? `${p.title} ${p.year}` : loading ? 'Programmes' : 'Not found', description: p?.description, image: p?.cover_url, noindex: !loading && !p });
  if (!loading && !error && !p) return <NotFoundPage what="programme" back={{ to: '/archive/programmes', label: 'Back to programmes' }} />;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono overflow-x-hidden printNoise">
      <Navbar />
      <main className="pt-24 sm:pt-32 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <PageCrumbs parent={{ label: 'Programmes', to: '/archive/programmes' }} label={p ? `${p.title} ${p.year}` : undefined} className="[&_ol]:justify-start" />
        {loading && <ContentLoading label="Unfolding the programme…" />}
        {!loading && error && <ContentError onRetry={retry}>We couldn’t load this programme right now.</ContentError>}
        {p && (
          <article data-programme-page={p.slug}>
            {/* A designed programme card stands in for a printed PDF. */}
            <header className="mt-6 bg-[#EFE2C0] paperTexture text-[#11100C] border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] p-6 sm:p-10 text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-[#7C2D18] block">Tangy Sessions · Programme · {[p.season, p.year].filter(Boolean).join(' ')}</span>
              <h1 className="display text-4xl sm:text-6xl uppercase leading-none m-0 mt-3">{p.title}</h1>
              <p className="font-body text-sm sm:text-base max-w-2xl mx-auto mt-4 mb-0">{p.description}</p>
              {p.venue && <p className="font-mono text-[10px] uppercase tracking-widest mt-4 mb-0">{p.venue}</p>}
              <p className="font-mono text-[10px] uppercase tracking-widest mt-1 mb-0 text-[#11100C]/70">{p.sessions.length} sessions</p>
            </header>
            <h2 className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold mt-10 mb-4">In this programme</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none m-0 p-0">
              {p.sessions.map((s) => (
                <li key={s.id}>
                  {s.event_date < today ? <PastSessionCard s={s} /> : (
                    <Link to={`/sessions/${s.slug}`} data-upcoming-session={s.slug}
                      className="flex flex-col h-full bg-[#211915] border-2 border-[#C99A2E] p-4 hover:-translate-y-1 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]">
                      <span className="font-mono text-[10px] font-bold uppercase text-[#C99A2E]">Upcoming · {formatDate(s.event_date)}</span>
                      <h3 className="font-condensed text-xl font-bold uppercase m-0 mt-1">{s.name}</h3>
                      <p className="font-mono text-[11px] text-[#E7D5A4]/75 m-0">{s.venue}</p>
                      <span className="mt-auto pt-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#C99A2E]">Book →</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};
