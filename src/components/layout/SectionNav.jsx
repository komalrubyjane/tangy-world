import { Link, useLocation } from 'react-router-dom';
import { NAV_SECTIONS, sectionFor, itemFor } from '../../config/siteNav';

// Section sub-navigation and breadcrumbs for the public site, built from
// src/config/siteNav.js so they always match the Navbar. Every entry is a
// real route (router <Link>), never an in-page anchor.

const TONES = {
  // On the dark pages.
  dark: {
    link: 'border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C89D35] hover:text-[#11100C]',
    current: 'bg-[#C99A2E] border-[#C99A2E] text-[#11100C]',
    crumb: 'text-[#E7D5A4]/80 hover:text-[#C99A2E]',
  },
  // On the paper (light) pages.
  light: {
    link: 'border-[#11100C]/60 text-[#11100C] hover:bg-[#11100C] hover:text-[#EFE2C0]',
    current: 'bg-[#11100C] border-[#11100C] text-[#EFE2C0]',
    crumb: 'text-[#11100C]/75 hover:text-[#a64a2b]',
  },
};

// The current section's pages, as a row of links. `section` (a section title)
// defaults to the section of the current URL.
export const SectionNav = ({ section: sectionTitle, tone = 'dark', className = '' }) => {
  const { pathname } = useLocation();
  const section = sectionTitle ? NAV_SECTIONS.find((s) => s.title === sectionTitle) : sectionFor(pathname);
  if (!section) return null;
  const t = TONES[tone];
  return (
    <nav aria-label={`${section.title} pages`} className={`flex flex-wrap justify-center gap-2 sm:gap-3 ${className}`} data-section-nav={section.title}>
      {section.items.map((item) => {
        const current = item.path === pathname;
        return (
          <Link
            key={item.path}
            to={item.path}
            aria-current={current ? 'page' : undefined}
            className={`inline-flex items-center min-h-[36px] px-3 py-1.5 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border transition-colors ${current ? t.current : t.link}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

// "Sessions › Session Calendar". The parent links to its section page; the
// current page is not a link. Renders nothing on a section's own landing page.
// `parent` adds a middle level, e.g. Sessions › Previous Sessions › <session>.
export const PageCrumbs = ({ tone = 'dark', label, parent, className = '' }) => {
  const { pathname } = useLocation();
  const match = itemFor(pathname);
  const section = match?.section || sectionFor(pathname);
  if (!section || pathname === section.path) return null;
  const t = TONES[tone];
  const current = label || match?.item.label;
  return (
    <nav aria-label="Breadcrumb" className={`font-mono text-[10px] uppercase tracking-widest ${className}`}>
      <ol className="flex flex-wrap items-center justify-center gap-2 list-none m-0 p-0">
        <li><Link to={section.path} className={`underline-offset-4 hover:underline ${t.crumb}`}>{section.title}</Link></li>
        {parent && (
          <>
            <li aria-hidden="true" className="opacity-60">›</li>
            <li><Link to={parent.to} className={`underline-offset-4 hover:underline ${t.crumb}`}>{parent.label}</Link></li>
          </>
        )}
        {current && (
          <>
            <li aria-hidden="true" className="opacity-60">›</li>
            <li aria-current="page" className="font-bold">{current}</li>
          </>
        )}
      </ol>
    </nav>
  );
};
