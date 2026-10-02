import { Link, useParams } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { content } from '../../lib/contentService';
import { useContent, formatDate } from '../../hooks/useContent';
import { usePageMeta } from '../../hooks/usePageMeta';
import { ContentLoading, ContentError } from '../../components/ui/ContentStates';
import { NotFoundPage } from './NotFoundPage';

const LINKS = [['instagram', 'Instagram'], ['spotify', 'Spotify'], ['soundcloud', 'SoundCloud'], ['youtube', 'YouTube']];
const href = (v) => (/^https:\/\//.test(v || '') ? v : null);

// /artists/:slug — an approved artist's public page (public_artists view:
// approved artists only, no private fields) and their Tangy sessions.
export const ArtistPage = () => {
  const { slug } = useParams();
  const { data: artist, loading, error, retry } = useContent(() => content.getArtist(slug), [slug]);
  const { data: sessions } = useContent(() => (artist ? content.artistSessions(artist.id) : Promise.resolve({ data: [] })), [artist?.id]);
  const name = artist ? artist.stage_name || artist.name : '';
  usePageMeta({ title: name || (loading ? 'Artist' : 'Not found'), description: artist?.bio, image: artist?.avatar_url, noindex: !loading && !artist });

  if (!loading && !error && !artist) return <NotFoundPage what="artist" back={{ to: '/artist', label: 'All artists' }} />;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (sessions || []).filter((s) => s.event_date >= today && s.status !== 'draft');
  const past = (sessions || []).filter((s) => s.event_date < today);

  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono printNoise">
      <Navbar />
      <main className="pt-28 pb-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <Link to="/artist" className="text-[10px] text-[#C99A2E] tracking-widest uppercase hover:underline">← All artists</Link>
        {loading && <ContentLoading label="Loading artist…" />}
        {!loading && error && <ContentError onRetry={retry} />}
        {artist && (
          <article className="mt-6 grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6" data-artist-page>
            <div className="aspect-square bg-[#11100C] border-2 border-[#C99A2E]/60 flex items-center justify-center overflow-hidden">
              {artist.avatar_url ? <img src={artist.avatar_url} alt={name} className="w-full h-full object-cover" /> : <span aria-hidden="true" className="display text-6xl">{name.slice(0, 1)}</span>}
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="display text-4xl sm:text-6xl uppercase m-0">{name}</h1>
              <p className="text-xs text-[#C99A2E] uppercase tracking-widest m-0">{[artist.genre, artist.subgenre, artist.city].filter(Boolean).join(' · ')}</p>
              {artist.bio && <p className="text-sm leading-relaxed whitespace-pre-line m-0">{artist.bio}</p>}
              <ul className="flex flex-wrap gap-2 list-none m-0 p-0">
                {LINKS.filter(([k]) => href(artist[k])).map(([k, label]) => (
                  <li key={k}><a href={href(artist[k])} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center px-3 border border-[#C99A2E]/60 text-xs hover:border-[#C99A2E]">{label} ↗</a></li>
                ))}
              </ul>
            </div>
            {(upcoming.length > 0 || past.length > 0) && (
              <section className="sm:col-span-2 flex flex-col gap-4" aria-label="Sessions">
                {[['Upcoming at Tangy', upcoming], ['Played at Tangy', past]].map(([title, list]) => list.length > 0 && (
                  <div key={title}>
                    <h2 className="font-condensed text-xl uppercase text-[#C99A2E] mb-2">{title}</h2>
                    <ul className="list-none m-0 p-0 flex flex-col gap-2">
                      {list.map((s) => (
                        <li key={s.id}><Link to={list === past ? `/sessions/archive/${s.slug}` : `/sessions/${s.slug || s.id}`} data-artist-session={s.slug} className="flex justify-between gap-3 border border-[#C99A2E]/40 p-3 hover:border-[#C99A2E]"><span className="font-bold">{s.name}</span><span className="text-xs opacity-70">{formatDate(s.event_date)} · {s.venue}</span></Link></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};
