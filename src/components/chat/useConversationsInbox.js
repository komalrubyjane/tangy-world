import { useState, useEffect, useMemo } from 'react';
import { conversationService } from '../../services/conversationService';
import { roleBucket } from '../../utils/roleBucket';

const SCOPES = ['all', 'unread', 'open', 'pending', 'resolved', 'assigned_to_me', 'unassigned'];

// Admin-inbox data hook: fetches the conversation list (small dataset, same
// fetch-all + client-filter convention as useAdminList.js), keeps it live via
// conversationService.subscribeToInbox, and applies scope/role/search filters
// with a debounced search term.
export function useConversationsInbox({ viewerId } = {}) {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scope, setScope] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput), 250);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    conversationService
      .listConversations({ viewerId })
      .then((list) => {
        if (cancelled) return;
        setAll(list);
        setError('');
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load conversations.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerId, reloadKey]);

  useEffect(() => {
    const unsubscribe = conversationService.subscribeToInbox(() => reload());
    return () => unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = all;
    if (scope === 'unread') list = list.filter((c) => c.unread);
    else if (scope === 'open') list = list.filter((c) => c.status === 'open');
    else if (scope === 'pending') list = list.filter((c) => c.status === 'pending');
    else if (scope === 'resolved') list = list.filter((c) => c.status === 'resolved');
    else if (scope === 'assigned_to_me') list = list.filter((c) => c.assignedAdmin?.id === viewerId);
    else if (scope === 'unassigned') list = list.filter((c) => !c.assignedAdmin);

    if (roleFilter !== 'all') {
      list = list.filter((c) => roleBucket(c.createdBy?.role) === roleFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        [c.createdBy?.name, c.createdBy?.email, c.createdBy?.organization, c.subject].some((f) =>
          String(f || '').toLowerCase().includes(q)
        )
      );
    }
    return list;
  }, [all, scope, roleFilter, search, viewerId]);

  return {
    conversations: filtered,
    total: filtered.length,
    loading,
    error,
    scope,
    setScope,
    scopes: SCOPES,
    roleFilter,
    setRoleFilter,
    search: searchInput,
    setSearch: setSearchInput,
    reload,
  };
}
