import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { usePageMeta } from '../../hooks/usePageMeta';

// Shown for unknown URLs (instead of silently redirecting home) and for
// content that doesn't exist or isn't published.
export const NotFoundPage = ({ what = 'page', back = { to: '/', label: 'Go to the home page' } }) => {
  usePageMeta({ title: 'Not found', noindex: true });
  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono flex flex-col printNoise">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-4 pt-28 pb-16" data-not-found>
        <span className="font-mono text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold">404</span>
        <h1 className="display text-4xl sm:text-6xl uppercase m-0">This {what} isn’t here</h1>
        <p className="max-w-md text-xs sm:text-sm text-[#E7D5A4]/75 m-0">It may have moved, been unpublished, or the link may be mistyped.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to={back.to} className="min-h-[44px] inline-flex items-center px-5 bg-[#C99A2E] text-[#11100C] font-bold uppercase tracking-widest border-2 border-[#C99A2E]">{back.label}</Link>
          <Link to="/sessions" className="min-h-[44px] inline-flex items-center px-5 border-2 border-[#C99A2E] font-bold uppercase tracking-widest">Upcoming sessions</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};
