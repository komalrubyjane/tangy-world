import { Link, useParams } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { content } from '../../lib/contentService';
import { useContent, formatDate } from '../../hooks/useContent';
import { usePageMeta } from '../../hooks/usePageMeta';
import { ContentLoading, ContentError } from '../../components/ui/ContentStates';
import { NotFoundPage } from './NotFoundPage';
import { MediaImg } from '../../components/ui/Media';

// /diary/:slug — one published post. The body is plain text (paragraphs
// separated by blank lines); nothing is rendered as HTML.
export const DiaryPostPage = () => {
  const { slug } = useParams();
  const { data: post, loading, error, retry } = useContent(() => content.getDiary(slug), [slug]);
  usePageMeta({ title: post?.title || (loading ? 'Diary' : 'Not found'), description: post?.seo_description || post?.excerpt || post?.body?.slice(0, 180), image: post?.cover_url, noindex: !loading && !post });

  if (!loading && !error && !post) return <NotFoundPage what="diary entry" back={{ to: '/diary', label: 'Back to the diary' }} />;

  return (
    <div className="min-h-screen bg-[#211915] text-[#E7D5A4] font-mono printNoise">
      <Navbar />
      <main className="pt-28 pb-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <Link to="/diary" className="font-mono text-[10px] text-[#D19A24] tracking-widest uppercase hover:underline">← The diary</Link>
        {loading && <ContentLoading label="Loading entry…" />}
        {!loading && error && <ContentError onRetry={retry} />}
        {post && (
          <article className="mt-6 bg-[#EFE2C0] text-[#11100C] border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C]" data-diary-post>
            {post.cover_url && <MediaImg src={post.cover_url} alt="" className="w-full max-h-[420px] object-cover border-b-4 border-[#11100C]" />}
            <div className="p-5 sm:p-10">
              <p className="font-mono text-[10px] font-bold text-[#7C2D18] uppercase tracking-widest m-0">
                {[formatDate(post.published_at), post.location, post.author_name && `by ${post.author_name}`].filter(Boolean).join(' · ')}
              </p>
              <h1 className="font-serif italic text-3xl sm:text-5xl font-bold leading-tight my-3">{post.title}</h1>
              {post.excerpt && <p className="font-body text-base sm:text-lg border-l-4 border-[#D19A24] pl-4 text-[#11100C]/80">{post.excerpt}</p>}
              <div className="font-body text-sm sm:text-base leading-relaxed flex flex-col gap-4 mt-6">
                {post.body.split(/\n\s*\n/).map((para, i) => <p key={i} className="m-0 whitespace-pre-line">{para}</p>)}
              </div>
              {(post.tags || []).length > 0 && (
                <p className="font-mono text-[10px] font-bold text-[#7C2D18] uppercase mt-8 pt-4 border-t border-[#11100C]/20">Tags: {post.tags.join(' · ')}</p>
              )}
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};
