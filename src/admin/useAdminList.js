import { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { isMockAuth } from '../config/auth';

// Shared data-fetching hook for every admin list section: fetches a table,
// supports client-side search across given fields, and simple "load more"
// pagination. Admin datasets here are small enough that fetch-all + filter
// client-side is simpler and fast enough than building server-side query
// params for every section.
export function useAdminList(table, { select = '*', searchFields = [], orderBy = 'created_at', ascending = false, pageSize = 25 } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Every admin section calls this hook unconditionally (hooks can't be
    // conditional) even though it renders its own Mock* variant instead —
    // skip the real fetch entirely in mock mode so no Supabase request ever
    // fires from an admin screen while AUTH_MODE === 'mock'.
    if (isMockAuth) {
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError('not-configured');
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from(table)
      .select(select)
      .order(orderBy, { ascending })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setRows([]);
        } else {
          setError('');
          setRows(data || []);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, select, orderBy, ascending, reloadKey]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => searchFields.some((f) => String(r[f] ?? '').toLowerCase().includes(q)));
  }, [rows, search, searchFields]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const reload = () => setReloadKey((k) => k + 1);

  return {
    rows: visible,
    total: filtered.length,
    allCount: rows.length,
    loading,
    error,
    search,
    setSearch: (v) => { setSearch(v); setVisibleCount(pageSize); },
    hasMore,
    loadMore: () => setVisibleCount((c) => c + pageSize),
    reload,
    setRows,
  };
}
