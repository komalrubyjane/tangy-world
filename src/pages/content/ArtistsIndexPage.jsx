import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { content } from '../../lib/contentService';
import { useContent } from '../../hooks/useContent';
import { usePageMeta } from '../../hooks/usePageMeta';
import { ContentLoading, ContentError, ContentEmpty } from '../../components/ui/ContentStates';

// /artists — every approved artist (public_artists view), each linking to
// /artists/:slug.
export const ArtistsIndexPage = () => {
  const { data, loading, error, retry } = useContent(() => content.listArtists(200));
  const [genre, setGenre] = useState('');
  usePageMeta({ title: 'Artists', description: 'The artists who play Tangy Sessions.' });
  const artists = data || [];
  const genres = [...new Set(artists.map((a) => a.genre).filter(Boolean))].sort();
  const shown = genre ? artists.filter((a) => a.genre === genre) : artists;
  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono printNoise">
      <Navbar />
      <header className="pt-28 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <span className="text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mb-3">THE ROSTER</span>
        <h1 className="display text-5xl sm:text-7xl uppercase m-0">ARTISTS</h1>
        {genres.length > 1 && (
          <div className="flex gap-2 mt-6 overflow-x-auto sm:justify-center sm:flex-wrap pb-1" role="group" aria-label="Filter by genre">
            {['', ...genres].map((g) => (
              <button key={g || 'all'} type="button" aria-pressed={genre === g} onClick={() => setGenre(g)}
                className={`shrink-0 min-h-[40px] px-3 border border-[#C99A2E] text-[11px] uppercase tracking-wider ${genre === g ? 'bg-[#C99A2E] text-[#11100C]' : ''}`}>{g || 'All'}</button>
            ))}
          </div>
        )}
      </header>
      <main className="py-10 px-4 sm:px-6 max-w-6xl mx-auto">
        {loading && <ContentLoading label="Loading artists…" />}
        {!loading && error && <ContentError onRetry={retry}>We couldn’t load the artists right now.</ContentError>}
        {!loading && !error && shown.length === 0 && <ContentEmpty>No artists to show yet.</ContentEmpty>}
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 list-none m-0 p-0" data-artists-index>
          {shown.map((a) => (
            <li key={a.id}>
              <Link to={a.slug ? `/artists/${a.slug}` : '/artists'} className="block bg-[#11100C] border-2 border-[#C99A2E]/40 hover:border-[#C99A2E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]">
                <div className="aspect-square bg-black/40 flex items-center justify-center overflow-hidden">
                  {a.avatar_url ? <img src={a.avatar_url} alt="" loading="lazy" className="w-full h-full object-cover" /> : <span aria-hidden="true" className="display text-5xl">{(a.stage_name || a.name).slice(0, 1)}</span>}
                </div>
                <div className="p-3">
                  <div className="font-bold text-sm">{a.stage_name || a.name}</div>
                  <div className="text-[10px] opacity-60 mt-1">{[a.genre, a.city].filter(Boolean).join(' · ')}</div>
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
