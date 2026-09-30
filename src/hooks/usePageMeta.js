import { useEffect } from 'react';

const SITE = 'Tangy Sessions';
const DEFAULT_DESCRIPTION = 'Live music in Hyderabad’s heritage spaces — sessions, artists, Tangy TV and the diary.';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// Per-page <title>, description and social preview tags for the SPA.
// (Crawlers that don't run JavaScript still see index.html's defaults.)
export function usePageMeta({ title, description, image, noindex = false } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE}` : SITE;
    const desc = (description || DEFAULT_DESCRIPTION).replace(/\s+/g, ' ').trim().slice(0, 200);
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', 'website');
    if (image) setMeta('property', 'og:image', new URL(image, window.location.origin).href);
    setMeta('name', 'robots', noindex ? 'noindex' : 'index,follow');
  }, [title, description, image, noindex]);
}
