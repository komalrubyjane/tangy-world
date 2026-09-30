import { useCallback, useEffect, useState } from 'react';

// Loads one content query ({ data, error } promise) with loading / error /
// retry state for the public CMS pages.
export function useContent(load, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [tick, setTick] = useState(0);
  const retry = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve(load()).then(
      ({ data, error }) => { if (!cancelled) setState({ loading: false, error: error || null, data: data ?? null }); },
      (error) => { if (!cancelled) setState({ loading: false, error, data: null }); },
    );
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, retry };
}

export const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : '');

// Published gallery photos in the { id, src, label } shape the archive pages
// were built around (formerly the static list in data/mockData.js).
export function useGalleryPhotos(limit = 60) {
  const [photos, setPhotos] = useState([]);
  useEffect(() => {
    let cancelled = false;
    import('../lib/contentService').then(({ content }) => content.recentPhotos(limit)).then(({ data }) => {
      if (!cancelled) setPhotos((data || []).map((p) => ({ id: p.id, src: p.image_url, label: p.caption || p.alt_text, alt: p.alt_text })));
    });
    return () => { cancelled = true; };
  }, [limit]);
  return photos;
}
