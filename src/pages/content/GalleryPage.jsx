import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { content } from '../../lib/contentService';
import { useContent, formatDate } from '../../hooks/useContent';
import { usePageMeta } from '../../hooks/usePageMeta';
import { ContentLoading, ContentError, ContentEmpty } from '../../components/ui/ContentStates';
import { NotFoundPage } from './NotFoundPage';

// /gallery — published albums.
export const GalleryPage = () => {
  const { data, loading, error, retry } = useContent(() => content.listAlbums());
  usePageMeta({ title: 'Gallery', description: 'Photographs from Tangy Sessions.' });
  const albums = data || [];
  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono printNoise">
      <Navbar />
      <header className="pt-28 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <span className="text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mb-3">CONTACT SHEETS</span>
        <h1 className="display text-5xl sm:text-7xl uppercase m-0">GALLERY</h1>
      </header>
      <main className="py-10 px-4 sm:px-6 max-w-6xl mx-auto">
        {loading && <ContentLoading label="Developing…" />}
        {!loading && error && <ContentError onRetry={retry}>We couldn’t load the gallery right now.</ContentError>}
        {!loading && !error && albums.length === 0 && <ContentEmpty>No albums yet — check back soon.</ContentEmpty>}
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none m-0 p-0">
          {albums.map((a) => (
            <li key={a.id}>
              <Link to={`/gallery/${a.slug}`} className="block bg-[#EFE2C0] text-[#11100C] border-4 border-[#11100C] shadow-[6px_6px_0px_#11100C] hover:-translate-y-1 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]" data-album-card>
                <div className="aspect-[4/3] bg-[#11100C]/10 overflow-hidden">{a.cover_url && <img src={a.cover_url} alt="" loading="lazy" className="w-full h-full object-cover" />}</div>
                <div className="p-3">
                  <div className="font-condensed text-lg font-bold uppercase">{a.title}</div>
                  <div className="text-[10px] opacity-70">{[formatDate(a.taken_on), `${a.gallery_photos?.[0]?.count ?? 0} photos`].filter(Boolean).join(' · ')}</div>
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

// /gallery/:album — one album with an accessible lightbox.
export const GalleryAlbumPage = () => {
  const { album: slug } = useParams();
  const { data: album, loading, error, retry } = useContent(() => content.getAlbum(slug), [slug]);
  const [open, setOpen] = useState(null);
  usePageMeta({ title: album?.title || (loading ? 'Gallery' : 'Not found'), description: album?.description, image: album?.cover_url, noindex: !loading && !album });
  const photos = album?.gallery_photos || [];

  useEffect(() => {
    if (open == null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % photos.length);
      if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, photos.length]);

  if (!loading && !error && !album) return <NotFoundPage what="album" back={{ to: '/gallery', label: 'Back to the gallery' }} />;

  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono printNoise">
      <Navbar />
      <main className="pt-28 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <Link to="/gallery" className="text-[10px] text-[#C99A2E] tracking-widest uppercase hover:underline">← Gallery</Link>
        {loading && <ContentLoading label="Developing…" />}
        {!loading && error && <ContentError onRetry={retry} />}
        {album && (
          <>
            <h1 className="display text-4xl sm:text-6xl uppercase mt-4 mb-2">{album.title}</h1>
            {album.description && <p className="text-sm text-[#E7D5A4]/80 max-w-2xl">{album.description}</p>}
            {photos.length === 0 && <ContentEmpty>No photos in this album yet.</ContentEmpty>}
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 list-none m-0 p-0 mt-6" data-album-photos>
              {photos.map((ph, i) => (
                <li key={ph.id}>
                  <button type="button" onClick={() => setOpen(i)} className="block w-full aspect-square overflow-hidden border-2 border-[#C99A2E]/40 hover:border-[#C99A2E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]"
                    aria-label={`Open photo: ${ph.alt_text}`}>
                    <img src={ph.image_url} alt={ph.alt_text} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      {open != null && photos[open] && (
        <div role="dialog" aria-modal="true" aria-label={photos[open].alt_text} className="fixed inset-0 z-[10000] bg-black/90 flex flex-col items-center justify-center p-4 gap-3" onClick={() => setOpen(null)}>
          <img src={photos[open].image_url} alt={photos[open].alt_text} className="max-w-full max-h-[80vh] object-contain" onClick={(e) => e.stopPropagation()} />
          {(photos[open].caption || photos[open].credit) && <p className="text-xs text-center m-0">{[photos[open].caption, photos[open].credit && `Photo: ${photos[open].credit}`].filter(Boolean).join(' — ')}</p>}
          <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="min-h-[44px] px-4 border border-[#E7D5A4]" onClick={() => setOpen((i) => (i - 1 + photos.length) % photos.length)}>← Previous</button>
            <button type="button" className="min-h-[44px] px-4 border border-[#E7D5A4]" onClick={() => setOpen(null)} autoFocus>Close</button>
            <button type="button" className="min-h-[44px] px-4 border border-[#E7D5A4]" onClick={() => setOpen((i) => (i + 1) % photos.length)}>Next →</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};
