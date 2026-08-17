// MOCK service — not connected to Supabase. Swap the internals for real
// calls later without changing any component that imports this file.
import { mockContactEnquiries, mockPrivateEnquiries, saveContactEnquiries, savePrivateEnquiries } from '../data/mock/enquiries';

export const enquiryService = {
  getContact: () => mockContactEnquiries,
  getPrivate: () => mockPrivateEnquiries,

  createContact(data) {
    const enquiry = { id: `enq-c${Date.now()}`, status: 'new', assignedTo: null, createdAt: new Date().toISOString(), ...data };
    mockContactEnquiries.unshift(enquiry);
    saveContactEnquiries();
    return enquiry;
  },
  updateContactStatus(id, status) {
    const e = mockContactEnquiries.find((x) => x.id === id);
    if (!e) return null;
    e.status = status;
    saveContactEnquiries();
    return e;
  },
  assignContact(id, assignedTo) {
    const e = mockContactEnquiries.find((x) => x.id === id);
    if (!e) return null;
    e.assignedTo = assignedTo;
    saveContactEnquiries();
    return e;
  },

  createPrivate(data) {
    const enquiry = { id: `enq-p${Date.now()}`, status: 'pending', assignedAgent: null, createdAt: new Date().toISOString(), ...data };
    mockPrivateEnquiries.unshift(enquiry);
    savePrivateEnquiries();
    return enquiry;
  },
  updatePrivateStatus(id, status) {
    const e = mockPrivateEnquiries.find((x) => x.id === id);
    if (!e) return null;
    e.status = status;
    savePrivateEnquiries();
    return e;
  },
  assignPrivate(id, assignedAgent) {
    const e = mockPrivateEnquiries.find((x) => x.id === id);
    if (!e) return null;
    e.assignedAgent = assignedAgent;
    savePrivateEnquiries();
    return e;
  },
};
