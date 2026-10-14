import { Link } from 'react-router-dom';
import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';
import { usePageMeta } from '../../hooks/usePageMeta';
import { COMING_SOON_EMAIL } from '../../config/launch';

// The one "Coming soon" treatment for features held back during the temporary
// launch (src/config/launch.js). ComingSoonPage replaces a whole route;
// ComingSoonPanel replaces a form or sign-in step inside a page that stays up.

// `bare` drops the site Navbar/Footer for routes nested in a layout that has
// its own (the /artist layout).
export const ComingSoonPage = ({ title = 'Coming soon', text, back = { to: '/', label: 'Go to the home page' }, bare = false }) => {
  usePageMeta({ title, noindex: true });
  return (
    <div className={`${bare ? 'min-h-[70vh]' : 'min-h-screen'} bg-[#181614] text-[#E7D5A4] font-body flex flex-col t-quiet`}>
      {!bare && <Navbar />}
      <main className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-4 pt-28 pb-16" data-coming-soon>
        <span className="font-mono text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold">Coming soon</span>
        <h1 className="display text-4xl sm:text-6xl uppercase m-0">{title}</h1>
        <p className="max-w-md text-xs sm:text-sm text-[#E7D5A4]/75 m-0">
          {text || 'This part of Tangy Sessions isn’t open yet. We’re putting the finishing touches on it.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to={back.to} className="min-h-[44px] inline-flex items-center px-5 bg-[#C99A2E] text-[#11100C] font-bold uppercase tracking-widest border-2 border-[#C99A2E]">{back.label}</Link>
          {back.to !== '/sessions' && <Link to="/sessions" className="min-h-[44px] inline-flex items-center px-5 border-2 border-[#C99A2E] font-bold uppercase tracking-widest">Sessions</Link>}
        </div>
      </main>
      {!bare && <Footer />}
    </div>
  );
};

// Inherits the surrounding colours (border-current), like RequireAuthToApply.
export const ComingSoonPanel = ({ title = 'Coming soon', text, showEmail = true }) => (
  <div className="border-2 border-dashed border-current p-6 sm:p-8 text-center flex flex-col gap-3" data-coming-soon>
    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">Coming soon</span>
    <h3 className="display text-2xl sm:text-3xl uppercase m-0">{title}</h3>
    {text && <p className="font-mono text-xs opacity-80 m-0 max-w-md mx-auto">{text}</p>}
    {showEmail && (
      <p className="font-mono text-xs opacity-80 m-0">
        Until then, write to us at <a href={`mailto:${COMING_SOON_EMAIL}`} className="underline font-bold">{COMING_SOON_EMAIL}</a>.
      </p>
    )}
  </div>
);
