// Mock human-agent escalation requests (AI -> Tangy Team handoff)
import { loadOrSeed, persist } from './store';

const SEED = [
  { id: 'agt-001', user: 'Ananya Reddy', role: 'patron', category: 'Booking', question: 'I need help changing the quantity on my Vol. 4 ticket.', priority: 'normal', createdAt: '2026-08-10T09:30:00Z', status: 'pending', assignedTo: null, conversationId: 'conv-demo-1' },
  { id: 'agt-002', user: 'Kabir Collective', role: 'artist', category: 'Artist Application', question: 'Following up on our pending application status.', priority: 'normal', createdAt: '2026-08-09T14:00:00Z', status: 'assigned', assignedTo: 'Founder', conversationId: 'conv-demo-2' },
  { id: 'agt-003', user: 'Guest Visitor', role: 'guest', category: 'Private Events', question: 'Do you curate heritage experiences for a 60-person wedding?', priority: 'high', createdAt: '2026-08-11T11:15:00Z', status: 'resolved', assignedTo: 'Main Team', conversationId: 'conv-demo-3' },
];

export const mockAgentRequests = loadOrSeed('agentRequests', () => SEED);
export const saveAgentRequests = () => persist('agentRequests', mockAgentRequests);

export const AGENT_REQUEST_STATUSES = ['pending', 'assigned', 'active', 'resolved', 'closed'];
