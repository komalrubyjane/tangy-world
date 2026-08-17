// Mock conversation threads for the AI chat + human handoff.
// Each message: { id, sender: 'user' | 'ai' | 'team', text, timestamp }
//
// Unlike most other mock data files, this one always reads/writes straight
// through to localStorage (via readFresh/persist) instead of mutating a
// single cached in-memory array. That's deliberate: an admin's Inbox tab and
// a visitor's AI chat tab are two separate page loads with two separate
// in-memory copies of this module, and the whole point of the escalation
// loop is that a reply typed in the admin tab has to show up when the
// visitor tab polls — which only works if every read goes back to the one
// shared source of truth (localStorage) rather than a stale per-tab cache.
import { loadOrSeed, persist, readFresh } from './store';

// Still seeded once so the key exists / admin tooling that lists all keys
// works, but every read below re-fetches fresh rather than trusting this.
loadOrSeed('conversations', () => ({}));

function readAll() {
  return readFresh('conversations') || {};
}

export function getConversation(sessionId) {
  const all = readAll();
  return all[sessionId] || [];
}

export function appendMessage(sessionId, message) {
  const all = readAll();
  if (!all[sessionId]) all[sessionId] = [];
  all[sessionId].push({ id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...message });
  persist('conversations', all);
  return all[sessionId];
}
