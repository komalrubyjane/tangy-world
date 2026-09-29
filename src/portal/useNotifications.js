import { useState, useEffect, useCallback, useRef } from 'react';
import { portalApi, subscribeInserts } from './portalApi';

// Unread count + latest notifications for the signed-in user. Realtime pushes
// new rows when available; a light poll (paused while the tab is hidden)
// covers stacks without Realtime. Everything is cleaned up on unmount.
export function useNotifications(userId, { pollMs = 45000 } = {}) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [n, rows] = await Promise.all([portalApi.unreadCount(), portalApi.notifications({ limit: 12 })]);
      if (!alive.current) return;
      setCount(n);
      setItems(rows);
      setError(null);
    } catch (err) {
      if (alive.current) setError(err);
    }
  }, [userId]);

  useEffect(() => {
    alive.current = true;
    if (!userId) return undefined;
    refresh();
    const unsubscribe = subscribeInserts(`notifications:${userId}`, 'notifications', `user_id=eq.${userId}`, (row) => {
      setCount((c) => c + 1);
      setItems((list) => [row, ...(list || [])].slice(0, 12));
    });
    const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, pollMs);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive.current = false;
      unsubscribe();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId, pollMs, refresh]);

  const markRead = useCallback(async (ids = null) => {
    await portalApi.markNotificationsRead(ids);
    setItems((list) => (list || []).map((n) => (!ids || ids.includes(n.id) ? { ...n, read_at: n.read_at || new Date().toISOString() } : n)));
    setCount((c) => (ids ? Math.max(0, c - ids.length) : 0));
  }, []);

  return { count, items, error, refresh, markRead };
}
