import { useState, useEffect, useCallback, useRef } from 'react';
import { conversationService } from '../../services/conversationService';

// Loads a conversation's messages and keeps them live — real Supabase
// Realtime in real mode, the proven localStorage poll in mock mode (both
// exposed behind conversationService.subscribeToConversation so this hook
// doesn't know which). Handles loading/error state, de-dupes the sender's
// own echoed message, and cleans up its subscription on unmount/id change.
export function useConversationRealtime(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const seenIds = useRef(new Set());

  useEffect(() => {
    seenIds.current = new Set();
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    conversationService
      .getMessages(conversationId)
      .then((msgs) => {
        if (cancelled) return;
        seenIds.current = new Set(msgs.map((m) => m.id));
        setMessages(msgs);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load messages.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = conversationService.subscribeToConversation(conversationId, (payload) => {
      if (Array.isArray(payload)) {
        seenIds.current = new Set(payload.map((m) => m.id));
        setMessages(payload);
        return;
      }
      if (seenIds.current.has(payload.id)) return;
      seenIds.current.add(payload.id);
      setMessages((prev) => [...prev, payload]);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (text, extra = {}) => {
      // extra (e.g. { sender }) is required by mockChatService to label who
      // sent it; real mode derives the sender from auth.uid() and ignores it.
      const sent = await conversationService.sendMessage(conversationId, { text, ...extra });
      if (!seenIds.current.has(sent.id)) {
        seenIds.current.add(sent.id);
        setMessages((prev) => [...prev, sent]);
      }
      return sent;
    },
    [conversationId]
  );

  return { messages, loading, error, sendMessage };
}
