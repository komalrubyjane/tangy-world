import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { PageCrumbs } from '../../components/layout/SectionNav';
import { ContentLoading, ContentError, ContentEmpty } from '../../components/ui/ContentStates';
import { MediaImg } from '../../components/ui/Media';
import { useArchiveParams, FilterGroup, ArchiveSearch, Pagination, PAGE_SIZE, yearOf } from '../../components/archive/ArchiveKit';
import { archive } from '../../lib/archiveService';
import { useContent, formatDate } from '../../hooks/useContent';
import { usePageMeta } from '../../hooks/usePageMeta';

// Albums without a session are grouped by what they show.
const KIND = { 'artist-portraits': 'Artists', 'tangy-volunteers': 'Behind the scenes', 'tangy-spaces': 'Spaces' };
const kindOf = (a) => (a.event_id ? 'Sessions' : KIND[a.slug] || 'Other');

// /gallery/archive — every published album, filterable; each opens /gallery/:album.
export const GalleryArchivePage = () => {
  usePageMeta({ title: 'Gallery Archive', description: 'Every Tangy photo album — browse by year, venue and what it shows.' });
  const { data, loading, error, retry } = useContent(() => archive.listAlbums());
  const f = useArchiveParams();
  const [year, kind, venue, q] = [f.get('year'), f.get('kind'), f.get('venue'), f.get('q')];
  const albums = useMemo(() => data || [], [data]);
  const years = useMemo(() => [...new Set(albums.map((a) => yearOf(a.taken_on)).filter(Boolean))], [albums]);
  const kinds = useMemo(() => [...new Set(albums.map(kindOf))], [albums]);
  const venues = useMemo(() => [...new Set(albums.map((a) => a.event?.venue).filter(Boolean))].sort(), [albums]);
  const shown = albums.filter((a) => (!year || yearOf(a.taken_on) === year) && (!kind || kindOf(a) === kind)
    && (!venue || a.event?.venue === venue)
    && (!q || [a.title, a.description, a.event?.name, a.event?.venue].join(' ').toLowerCase().includes(q.toLowerCase())));
  const pageItems = shown.slice((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono overflow-x-hidden printNoise">
      <Navbar />
      <header className="pt-24 sm:pt-32 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <PageCrumbs parent={{ label: 'Gallery', to: '/gallery' }} label="Archive" />
        <span className="text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mt-3 mb-3">EVERY ALBUM</span>
        <h1 className="display text-4xl sm:text-7xl uppercase leading-none m-0">GALLERY<br />ARCHIVE</h1>
      </header>
      <main className="py-10 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-5 mb-8">
          <ArchiveSearch id="album-search" label="Search albums" value={q} onChange={(v) => f.set('q', v)} placeholder="Album, session or venue…" />
          {years.length > 0 && <FilterGroup label="Year" name="year" options={years} value={year} onChange={(v) => f.set('year', v)} />}
          {kinds.length > 1 && <FilterGroup label="Shows" name="kind" options={kinds} value={kind} onChange={(v) => f.set('kind', v)} />}
          {venues.length > 1 && <FilterGroup label="Venue" name="venue" options={venues.map((v) => [v, v.replace(' (demo)', '')])} value={venue} onChange={(v) => f.set('venue', v)} />}
        </div>
        {loading && <ContentLoading label="Developing…" />}
        {!loading && error && <ContentError onRetry={retry}>We couldn’t load the gallery right now.</ContentError>}
        {!loading && !error && albums.length === 0 && <ContentEmpty>No albums yet — check back soon.</ContentEmpty>}
        {!loading && !error && albums.length > 0 && (
          <p className="text-[10px] text-[#C99A2E] uppercase tracking-[0.3em] font-bold mb-4" aria-live="polite" data-result-count={shown.length}>{shown.length} {shown.length === 1 ? 'album' : 'albums'}</p>
        )}
        {!loading && !error && albums.length > 0 && shown.length === 0 && <ContentEmpty>No albums match these filters.</ContentEmpty>}
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none m-0 p-0">
          {pageItems.map((a) => (
            <li key={a.id}>
              <Link to={`/gallery/${a.slug}`} data-album-card={a.slug} className="block bg-[#EFE2C0] text-[#11100C] border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] hover:-translate-y-1 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]">
                <div className="aspect-[4/3] bg-[#11100C]/10 overflow-hidden">{a.cover_url && <MediaImg src={a.cover_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />}</div>
                <div className="p-3">
                  <div className="font-condensed text-lg font-bold uppercase">{a.title}</div>
                  <div className="text-[10px] opacity-75">{[formatDate(a.taken_on), a.event?.venue?.replace(' (demo)', ''), `${a.photoCount} photos`].filter(Boolean).join(' · ')}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <Pagination page={f.page} total={shown.length} onPage={(p) => { f.set('page', String(p)); window.scrollTo({ top: 0 }); }} />
      </main>
      <Footer />
    </div>
  );
};
