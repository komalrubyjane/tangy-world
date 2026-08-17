import { loadOrSeed, persist } from './store';

const SEED = [
  { id: 'ann-001', title: 'NEW TANGY SESSION', description: 'An evening at Bansilalpet Stepwell — Vol. 4 tickets are now on sale.', category: 'SESSION', character: 'violinist', destination: '/book/vol-4', audience: 'all', priority: 'high', publishAt: '2026-08-01T00:00:00Z', expireAt: '2026-09-19T23:59:00Z', status: 'published' },
  { id: 'ann-002', title: 'ARTIST APPLICATIONS OPEN', description: 'The curation desk is reviewing new artist submissions for 2027.', category: 'ARTIST', character: 'guitarist', destination: '/artist/register', audience: 'guest', priority: 'normal', publishAt: '2026-07-01T00:00:00Z', expireAt: '2026-12-31T23:59:00Z', status: 'published' },
  { id: 'ann-003', title: 'CONTACT SHEETS DIGITIZED', description: 'The full 35mm contact sheet archive from Vol. 1-3 is now browsable.', category: 'ARCHIVE', character: 'kathak', destination: '/archive/contact-sheets', audience: 'all', priority: 'low', publishAt: '2026-06-01T00:00:00Z', expireAt: null, status: 'draft' },
  { id: 'ann-004', title: 'VOLUNTEER REGISTRATION OPEN', description: 'Sign up to join the crew for Vol. 4 — front of house and backstage roles open.', category: 'GENERAL', character: 'hiphop', destination: '/collaborate', audience: 'guest', priority: 'normal', publishAt: '2026-08-02T00:00:00Z', expireAt: '2026-09-19T23:59:00Z', status: 'published' },
  { id: 'ann-005', title: 'VENUE PARTNERSHIP: OLD CITY HAVELI', description: 'A new heritage venue joins the Tangy circuit for 2027.', category: 'CULTURE', character: 'veena', destination: '/crew', audience: 'all', priority: 'normal', publishAt: '2026-08-08T00:00:00Z', expireAt: null, status: 'published' },
];

export const mockAnnouncements = loadOrSeed('announcements', () => SEED);
export const saveAnnouncements = () => persist('announcements', mockAnnouncements);

export const ANNOUNCEMENT_STATUSES = ['draft', 'scheduled', 'published', 'expired', 'archived'];
export const ANNOUNCEMENT_CATEGORIES = ['SESSION', 'ARTIST', 'TICKET', 'ARCHIVE', 'CULTURE', 'GENERAL'];
