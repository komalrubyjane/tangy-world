// MOCK service — not connected to Supabase. Swap the internals for real
// calls later without changing any component that imports this file.
import { mockCollaborations, saveCollaborations } from '../data/mock/collaborations';

export const collaborationService = {
  getAll: () => mockCollaborations,
  getByType: (type) => (type ? mockCollaborations.filter((c) => c.type === type) : mockCollaborations),

  create(data) {
    const collab = { id: `col-${Date.now()}`, status: 'new', createdAt: new Date().toISOString(), ...data };
    mockCollaborations.unshift(collab);
    saveCollaborations();
    return collab;
  },

  updateStatus(id, status) {
    const c = mockCollaborations.find((x) => x.id === id);
    if (!c) return null;
    c.status = status;
    saveCollaborations();
    return c;
  },
};
