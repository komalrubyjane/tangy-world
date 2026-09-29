import { useState, useEffect, useCallback, useRef } from 'react';
import { list } from './api';

export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Runs an async loader, re-running when `deps` change. Stale responses from a
// superseded run are dropped, so fast filter changes never flash old data.
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [reloadKey, setReloadKey] = useState(0);
  const runId = useRef(0);

  useEffect(() => {
    const id = ++runId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(loader)
      .then(
        (data) => { if (id === runId.current) setState({ data, error: null, loading: false }); },
        (error) => { if (id === runId.current) setState({ data: null, error, loading: false }); }
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { ...state, reload };
}

// Server-side paginated table: filtering, search and paging all happen in
// PostgREST (range + exact count), so the browser never holds more than one
// page. `build(q)` applies filters/search/order to the base query.
export function useServerTable({ table, select = '*', build, pageSize = 25, deps = [] }) {
  const depsKey = JSON.stringify(deps);
  // Page is keyed to the filter set: any filter change reads as page 0 in the
  // same render, so there's exactly one request per change.
  const [pageState, setPageState] = useState({ key: depsKey, page: 0 });
  const page = pageState.key === depsKey ? pageState.page : 0;
  const setPage = useCallback((p) => setPageState({ key: depsKey, page: p }), [depsKey]);

  const result = useAsync(
    () => list(table, { select, build, from: page * pageSize, to: page * pageSize + pageSize - 1 }),
    [table, select, page, pageSize, depsKey]
  );

  const count = result.data?.count ?? 0;
  return {
    rows: result.data?.rows ?? [],
    count,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(count / pageSize)),
    setPage,
    loading: result.loading,
    error: result.error,
    reload: result.reload,
  };
}
