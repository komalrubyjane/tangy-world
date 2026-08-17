// MOCK service — not connected to Supabase. Swap the internals for real
// calls later without changing any component that imports this file.
import { mockAgentRequests, saveAgentRequests, AGENT_REQUEST_STATUSES } from '../data/mock/agentRequests';

export const agentService = {
  getAll: () => mockAgentRequests,
  getByStatus: (status) => (status ? mockAgentRequests.filter((r) => r.status === status) : mockAgentRequests),
  getUnassigned: () => mockAgentRequests.filter((r) => r.status === 'pending' && !r.assignedTo),
  getAssignedTo: (name) => mockAgentRequests.filter((r) => r.assignedTo === name),

  create({ user, role, category, question, priority, conversationId }) {
    const request = {
      id: `agt-${Date.now()}`,
      user, role, category, question,
      priority: priority || 'normal',
      createdAt: new Date().toISOString(),
      status: 'pending',
      assignedTo: null,
      conversationId,
    };
    mockAgentRequests.unshift(request);
    saveAgentRequests();
    return request;
  },

  accept(id, adminName) {
    const req = mockAgentRequests.find((r) => r.id === id);
    if (!req) return null;
    req.status = 'active';
    req.assignedTo = adminName;
    saveAgentRequests();
    return req;
  },

  assign(id, adminName) {
    const req = mockAgentRequests.find((r) => r.id === id);
    if (!req) return null;
    req.status = 'assigned';
    req.assignedTo = adminName;
    saveAgentRequests();
    return req;
  },

  setStatus(id, status) {
    if (!AGENT_REQUEST_STATUSES.includes(status)) return null;
    const req = mockAgentRequests.find((r) => r.id === id);
    if (!req) return null;
    req.status = status;
    saveAgentRequests();
    return req;
  },

  setPriority(id, priority) {
    const req = mockAgentRequests.find((r) => r.id === id);
    if (!req) return null;
    req.priority = priority;
    saveAgentRequests();
    return req;
  },
};
