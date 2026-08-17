// Mock contact + private/corporate enquiries — feeds Admin Contact & Private
// sections, and the public Contact / Private Sessions forms in mock mode.
import { loadOrSeed, persist } from './store';

const CONTACT_SEED = [
  { id: 'enq-c001', category: 'General', name: 'Ishaan Kapoor', email: 'ishaan.kapoor@example.com', subject: 'Group booking discount', message: 'Do you offer a discount for groups of 10+ for Vol. 4?', status: 'new', createdAt: '2026-08-05T10:00:00Z', assignedTo: null },
  { id: 'enq-c002', category: 'Technical', name: 'Ritika Bose', email: 'ritika.bose@example.com', subject: 'QR ticket not loading', message: 'My QR code email link shows a blank page on mobile Safari.', status: 'read', createdAt: '2026-08-03T15:20:00Z', assignedTo: 'Founder' },
  { id: 'enq-c003', category: 'Artist', name: 'Nikhil Chandra', email: 'nikhil.chandra@example.com', subject: 'Collaboration idea', message: 'I run a small tabla ensemble — would love to be considered for Vol. 5.', status: 'replied', createdAt: '2026-07-28T09:10:00Z', assignedTo: 'Founder' },
  { id: 'enq-c004', category: 'Sponsor', name: 'Devika Rao', email: 'devika.rao@corporate.example', subject: 'Sponsorship enquiry', message: 'Our foundation would like to discuss season sponsorship.', status: 'new', createdAt: '2026-08-09T12:00:00Z', assignedTo: null },
  { id: 'enq-c005', category: 'Volunteer', name: 'Aakash Pillai', email: 'aakash.pillai@example.com', subject: 'How to join crew', message: 'I want to help backstage — what is the process?', status: 'new', createdAt: '2026-08-11T08:30:00Z', assignedTo: null },
];

const PRIVATE_SEED = [
  { id: 'enq-p001', name: 'Meher Events Co.', email: 'meher@eventsco.example', phone: '+91 99111 00222', type: 'wedding', preferredDate: '2027-01-14', guestCount: 120, budget: '₹4,00,000 – ₹6,00,000', message: 'Looking for an acoustic set for a sundowner wedding function.', status: 'pending', assignedAgent: null, createdAt: '2026-07-20T10:00:00Z' },
  { id: 'enq-p002', name: 'Quantify Labs', email: 'people@quantifylabs.example', phone: '+91 99222 11333', type: 'corporate_offsite', preferredDate: '2026-11-02', guestCount: 60, budget: '₹1,50,000 – ₹2,50,000', message: 'Team offsite — want a curated 45-minute heritage session.', status: 'approved', assignedAgent: 'Founder', createdAt: '2026-06-15T10:00:00Z' },
  { id: 'enq-p003', name: 'The Iyer Family', email: 'iyerfamily@example.com', phone: '+91 99333 22444', type: 'private_ritual', preferredDate: '2027-03-08', guestCount: 30, budget: 'Flexible', message: 'A small housewarming ritual with live Carnatic music.', status: 'pending', assignedAgent: null, createdAt: '2026-08-01T10:00:00Z' },
];

export const mockContactEnquiries = loadOrSeed('contact_enquiries', () => CONTACT_SEED);
export const mockPrivateEnquiries = loadOrSeed('private_enquiries', () => PRIVATE_SEED);
export const saveContactEnquiries = () => persist('contact_enquiries', mockContactEnquiries);
export const savePrivateEnquiries = () => persist('private_enquiries', mockPrivateEnquiries);
