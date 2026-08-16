// MOCK service — part of the new mock account/dashboard/AI system.
// Not connected to Supabase. Swap the internals for real calls later
// without changing any component that imports this file.
import { getConversation, appendMessage } from '../data/mock/messages';

export const messageService = {
  getConversation: (sessionId) => getConversation(sessionId),
  sendUserMessage: (sessionId, text) => appendMessage(sessionId, { sender: 'user', text, timestamp: new Date().toISOString() }),
  sendAiMessage: (sessionId, text, extra = {}) => appendMessage(sessionId, { sender: 'ai', text, timestamp: new Date().toISOString(), ...extra }),
  sendTeamMessage: (sessionId, text, agentName = 'Tangy Team') => appendMessage(sessionId, { sender: 'team', text, timestamp: new Date().toISOString(), agentName }),
};
