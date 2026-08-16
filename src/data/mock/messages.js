// Mock conversation threads for the AI chat + human handoff.
// Each message: { id, sender: 'user' | 'ai' | 'team', text, timestamp }
export const mockConversations = {};

export function getConversation(sessionId) {
  return mockConversations[sessionId] || [];
}

export function appendMessage(sessionId, message) {
  if (!mockConversations[sessionId]) mockConversations[sessionId] = [];
  mockConversations[sessionId].push({ id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...message });
  return mockConversations[sessionId];
}
