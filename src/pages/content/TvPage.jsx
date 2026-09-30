import { Link, useParams } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { content } from '../../lib/contentService';
import { useContent } from '../../hooks/useContent';
import { usePageMeta } from '../../hooks/usePageMeta';
import { ContentLoading, ContentError, ContentEmpty } from '../../components/ui/ContentStates';
import { NotFoundPage } from './NotFoundPage';
import { MediaImg, MediaVideo } from '../../components/ui/Media';

const duration = (s) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '');

// /tv — every published Tangy TV video (the retro TV set plays the subset
// marked "plays on the TV set").
export const TvPage = () => {
  const { data, loading, error, retry } = useContent(() => content.listTv());
  usePageMeta({ title: 'Tangy TV', description: 'Live sessions and field recordings from Tangy Sessions.' });
  const videos = data || [];
  const categories = [...new Set(videos.map((v) => v.category).filter(Boolean))];
  const groups = categories.length ? categories.map((c) => [c, videos.filter((v) => v.category === c)]) : [['', videos]];
  const uncategorised = categories.length ? videos.filter((v) => !v.category) : [];

  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono printNoise">
      <Navbar />
      <header className="pt-28 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <span className="text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mb-3">BROADCASTING FROM THE STEPWELL</span>
        <h1 className="display text-5xl sm:text-7xl uppercase m-0">TANGY TV</h1>
      </header>
      <main className="py-10 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col gap-10">
        {loading && <ContentLoading label="Tuning in…" />}
        {!loading && error && <ContentError onRetry={retry}>We couldn’t load Tangy TV right now.</ContentError>}
        {!loading && !error && videos.length === 0 && <ContentEmpty>No videos yet — check back soon.</ContentEmpty>}
        {!loading && [...groups, ...(uncategorised.length ? [['More', uncategorised]] : [])].map(([name, list]) => list.length > 0 && (
          <section key={name || 'all'} aria-label={name || 'Videos'}>
            {name && <h2 className="font-condensed text-xl uppercase tracking-wider text-[#C99A2E] mb-4">{name}</h2>}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none m-0 p-0">
              {list.map((v) => (
                <li key={v.id}>
                  <Link to={`/tv/${v.slug}`} className="block bg-[#11100C] border-2 border-[#C99A2E]/50 hover:border-[#C99A2E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]" data-tv-card>
                    <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                      {v.thumbnail_url
                        ? <MediaImg src={v.thumbnail_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                        : <MediaVideo src={v.video_url} preload="metadata" muted playsInline aria-hidden="true" className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-sm">{v.title}</div>
                      <div className="text-[10px] opacity-60 mt-1">{[v.category, duration(v.duration_seconds)].filter(Boolean).join(' · ')}</div>
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

// /tv/:slug — one video.
export const TvVideoPage = () => {
  const { slug } = useParams();
  const { data: video, loading, error, retry } = useContent(() => content.getTv(slug), [slug]);
  usePageMeta({ title: video?.title || (loading ? 'Tangy TV' : 'Not found'), description: video?.description, image: video?.thumbnail_url, noindex: !loading && !video });

  if (!loading && !error && !video) return <NotFoundPage what="video" back={{ to: '/tv', label: 'Back to Tangy TV' }} />;

  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono printNoise">
      <Navbar />
      <main className="pt-28 pb-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <Link to="/tv" className="text-[10px] text-[#C99A2E] tracking-widest uppercase hover:underline">← Tangy TV</Link>
        {loading && <ContentLoading label="Tuning in…" />}
        {!loading && error && <ContentError onRetry={retry} />}
        {video && (
          <article className="mt-6 flex flex-col gap-4" data-tv-video>
            <MediaVideo src={video.video_url} poster={video.thumbnail_url} controls playsInline preload="metadata"
              className="w-full aspect-video bg-black border-2 border-[#C99A2E]/60">
              Your browser can’t play this video.
            </MediaVideo>
            <h1 className="font-condensed text-3xl sm:text-4xl uppercase m-0">{video.title}</h1>
            {video.category && <p className="text-[10px] text-[#C99A2E] uppercase tracking-widest m-0">{video.category}</p>}
            {video.description && <p className="text-sm leading-relaxed whitespace-pre-line m-0 text-[#E7D5A4]/85">{video.description}</p>}
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};
