import { useMemo } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { PageCrumbs, SectionNav } from '../../components/layout/SectionNav';
import { ContentLoading, ContentError, ContentEmpty } from '../../components/ui/ContentStates';
import { useArchiveParams, FilterGroup, ArchiveSearch, Pagination, PastSessionCard, PAGE_SIZE, yearOf } from '../../components/archive/ArchiveKit';
import { archive } from '../../lib/archiveService';
import { useContent } from '../../hooks/useContent';
import { usePageMeta } from '../../hooks/usePageMeta';

// /sessions/archive — every session that has already happened (or was
// cancelled), newest first. Each opens its own page at /sessions/archive/:slug.
export const PreviousSessionsPage = () => {
  usePageMeta({ title: 'Previous Sessions', description: 'Every past Tangy session — venues, line-ups, photos, recordings and programmes.' });
  const { data, loading, error, retry } = useContent(() => archive.listPastSessions());
  const f = useArchiveParams();
  const [year, tag, venue, q] = [f.get('year'), f.get('tag'), f.get('venue'), f.get('q')];
  const sessions = useMemo(() => data || [], [data]);

  const years = useMemo(() => [...new Set(sessions.map((s) => yearOf(s.event_date)))], [sessions]);
  const tags = useMemo(() => [...new Set(sessions.flatMap((s) => s.tags || []))].sort(), [sessions]);
  const venues = useMemo(() => [...new Set(sessions.map((s) => s.venue).filter(Boolean))].sort(), [sessions]);

  const shown = sessions.filter((s) => (!year || yearOf(s.event_date) === year)
    && (!tag || (s.tags || []).includes(tag))
    && (!venue || s.venue === venue)
    && (!q || [s.name, s.venue, s.description, ...(s.artists || []).map((a) => a.stage_name || a.name)].join(' ').toLowerCase().includes(q.toLowerCase())));
  const pageItems = shown.slice((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE);

  return (
    <div className="theme-sessions min-h-screen text-[#E7D5A4] font-mono overflow-x-hidden printNoise">
      <Navbar />
      <header className="pt-24 sm:pt-32 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <PageCrumbs />
        <span className="text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mt-3 mb-3">THE SESSION ARCHIVE</span>
        <h1 className="display text-4xl sm:text-7xl uppercase leading-none m-0">PREVIOUS<br />SESSIONS</h1>
        <p className="text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 mt-6 uppercase">
          Every night on record — who played, where, how many came, and the photos and recordings it left behind.
        </p>
        <SectionNav className="mt-6" />
      </header>

      <main className="py-10 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-5 mb-8">
          <ArchiveSearch id="past-session-search" label="Search sessions" value={q} onChange={(v) => f.set('q', v)} placeholder="Session, artist or venue…" />
          {years.length > 0 && <FilterGroup label="Year" name="year" options={years} value={year} onChange={(v) => f.set('year', v)} />}
          {tags.length > 0 && <FilterGroup label="Type" name="tag" options={tags} value={tag} onChange={(v) => f.set('tag', v)} />}
          {venues.length > 1 && <FilterGroup label="Venue" name="venue" options={venues.map((v) => [v, v.replace(' (demo)', '')])} value={venue} onChange={(v) => f.set('venue', v)} />}
        </div>

        {loading && <ContentLoading label="Opening the archive…" />}
        {!loading && error && <ContentError onRetry={retry}>We couldn’t load the session archive right now.</ContentError>}
        {!loading && !error && sessions.length === 0 && <ContentEmpty>No past sessions on record yet.</ContentEmpty>}
        {!loading && !error && sessions.length > 0 && (
          <p className="text-[10px] text-[#C99A2E] uppercase tracking-[0.3em] font-bold mb-4" aria-live="polite" data-result-count={shown.length}>
            {shown.length} {shown.length === 1 ? 'session' : 'sessions'}
          </p>
        )}
        {!loading && !error && sessions.length > 0 && shown.length === 0 && <ContentEmpty>No sessions match these filters.</ContentEmpty>}

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none m-0 p-0">
          {pageItems.map((s) => <li key={s.id}><PastSessionCard s={s} /></li>)}
        </ul>
        <Pagination page={f.page} total={shown.length} onPage={(p) => { f.set('page', String(p)); window.scrollTo({ top: 0 }); }} />
      </main>
      <Footer />
    </div>
  );
};
