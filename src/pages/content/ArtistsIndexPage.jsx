import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { content } from '../../lib/contentService';
import { artistTimeline } from '../../lib/archiveService';
import { useContent } from '../../hooks/useContent';
import { usePageMeta } from '../../hooks/usePageMeta';
import { ContentLoading, ContentError, ContentEmpty } from '../../components/ui/ContentStates';
import { useArchiveParams, FilterGroup, ArchiveSearch } from '../../components/archive/ArchiveKit';

// "On stage" = has an upcoming session; "Played before" = has past sessions.
const WHEN = [['upcoming', 'On stage'], ['past', 'Played before']];

// /artists — every approved artist (public_artists view), each linking to
// /artists/:slug. Filters live in the URL (?when=past&genre=Folk&q=…).
export const ArtistsIndexPage = () => {
  const { data, loading, error, retry } = useContent(() => content.listArtists(200));
  usePageMeta({ title: 'Artists', description: 'The artists who play Tangy Sessions — on stage now and on record.' });
  const f = useArchiveParams();
  const [genre, when, q] = [f.get('genre'), f.get('when'), f.get('q')];
  const artists = useMemo(() => data || [], [data]);
  const [timeline, setTimeline] = useState({});
  useEffect(() => {
    let cancelled = false;
    artistTimeline(artists.map((a) => a.id)).then((t) => { if (!cancelled) setTimeline(t); });
    return () => { cancelled = true; };
  }, [artists]);
  const genres = [...new Set(artists.map((a) => a.genre).filter(Boolean))].sort();
  const shown = artists.filter((a) => (!genre || a.genre === genre)
    && (!when || (timeline[a.id]?.[when] ?? 0) > 0)
    && (!q || [a.name, a.stage_name, a.genre, a.city].join(' ').toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono printNoise">
      <Navbar />
      <header className="pt-28 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <span className="text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mb-3">THE ROSTER</span>
        <h1 className="display text-5xl sm:text-7xl uppercase m-0">ARTISTS</h1>
      </header>
      <main className="py-10 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex flex-col gap-5 mb-8">
          <ArchiveSearch id="artist-search" label="Search artists" value={q} onChange={(v) => f.set('q', v)} placeholder="Name, genre or city…" />
          <FilterGroup label="Appearances" name="when" options={WHEN} value={when} onChange={(v) => f.set('when', v)} />
          {genres.length > 1 && <FilterGroup label="Genre" name="genre" options={genres} value={genre} onChange={(v) => f.set('genre', v)} />}
        </div>
        {loading && <ContentLoading label="Loading artists…" />}
        {!loading && error && <ContentError onRetry={retry}>We couldn’t load the artists right now.</ContentError>}
        {!loading && !error && artists.length > 0 && (
          <p className="text-[10px] text-[#C99A2E] uppercase tracking-[0.3em] font-bold mb-4" aria-live="polite" data-result-count={shown.length}>{shown.length} {shown.length === 1 ? 'artist' : 'artists'}</p>
        )}
        {!loading && !error && shown.length === 0 && <ContentEmpty>{artists.length ? 'No artists match these filters.' : 'No artists to show yet.'}</ContentEmpty>}
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 list-none m-0 p-0" data-artists-index>
          {shown.map((a) => (
            <li key={a.id}>
              <Link to={a.slug ? `/artists/${a.slug}` : '/artists'} data-artist-card={a.slug} className="block bg-[#11100C] border-2 border-[#C99A2E]/40 hover:border-[#C99A2E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]">
                <div className="aspect-square bg-black/40 flex items-center justify-center overflow-hidden">
                  {a.avatar_url ? <img src={a.avatar_url} alt="" loading="lazy" className="w-full h-full object-cover" /> : <span aria-hidden="true" className="display text-5xl">{(a.stage_name || a.name).slice(0, 1)}</span>}
                </div>
                <div className="p-3">
                  <div className="font-bold text-sm">{a.stage_name || a.name}</div>
                  <div className="text-[10px] opacity-75 mt-1">{[a.genre, a.city].filter(Boolean).join(' · ')}</div>
                  {timeline[a.id] && (
                    <div className="text-[10px] text-[#C99A2E] mt-1">
                      {[timeline[a.id].upcoming && `${timeline[a.id].upcoming} upcoming`, timeline[a.id].past && `${timeline[a.id].past} past`].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
};
