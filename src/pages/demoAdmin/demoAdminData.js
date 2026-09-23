// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
//
// Entirely fabricated, clearly-labeled placeholder content for the internal
// team demo. The real database has no seed data yet, so without this every
// demo screen would show honest-but-uninformative empty states. This file
// is the ONLY source of "populated-looking" data in demo mode — nothing
// here is ever written to Supabase, and nothing in demo mode ever reads
// from Supabase. Every id below is a clearly-fake `demo-*` string, every
// name/email is obviously placeholder text — never mistakeable for a real
// record if it were ever seen out of context.

export const DEMO_EVENTS = [
  {
    id: 'demo-evt-1', name: 'Stepwell Sessions Vol. 12', slug: 'demo-stepwell-12',
    event_date: '2026-10-18', event_time: '7:00 PM', venue: 'Bansilal Stepwell',
    status: 'on-sale', capacity: 120, price: 799, featured: true,
  },
  {
    id: 'demo-evt-2', name: 'Underground Vol. 4', slug: 'demo-underground-4',
    event_date: '2026-11-02', event_time: '9:30 PM', venue: 'The Cellar, Jubilee Hills',
    status: 'on-sale', capacity: 80, price: 599, featured: false,
  },
  {
    id: 'demo-evt-3', name: 'Heritage Sessions — Golconda', slug: 'demo-heritage-golconda',
    event_date: '2026-09-05', event_time: '6:30 PM', venue: 'Golconda Fort Lawns',
    status: 'past', capacity: 200, price: 999, featured: false,
  },
];

export const DEMO_BOOKINGS = [
  {
    id: 'demo-bkg-1', registration_code: 'TS-DEMO001', attendee_name: 'Demo Patron', attendee_email: 'demo.patron@tangysessions.test',
    quantity: 2, amount: 1598, status: 'confirmed', created_at: '2026-09-10T10:00:00Z', events: DEMO_EVENTS[0],
  },
  {
    id: 'demo-bkg-2', registration_code: 'TS-DEMO002', attendee_name: 'Demo Patron', attendee_email: 'demo.patron@tangysessions.test',
    quantity: 1, amount: 999, status: 'confirmed', created_at: '2026-08-20T14:30:00Z', events: DEMO_EVENTS[2],
  },
  {
    id: 'demo-bkg-3', registration_code: 'TS-DEMO003', attendee_name: 'Ananya Rao', attendee_email: 'demo.guest1@tangysessions.test',
    quantity: 3, amount: 2397, status: 'confirmed', created_at: '2026-09-14T09:15:00Z', events: DEMO_EVENTS[1],
  },
  {
    id: 'demo-bkg-4', registration_code: 'TS-DEMO004', attendee_name: 'Vikram Nair', attendee_email: 'demo.guest2@tangysessions.test',
    quantity: 1, amount: 799, status: 'pending', created_at: '2026-09-15T18:45:00Z', events: DEMO_EVENTS[0],
  },
];

export const DEMO_WAITLIST = [
  { id: 'demo-wl-1', name: 'Demo Patron', email: 'demo.patron@tangysessions.test', phone: '+91 90000 00001', events: DEMO_EVENTS[1] },
];

export const DEMO_ARTISTS = [
  { id: 'demo-art-1', name: 'Arjun Mehta', email: 'demo.artist1@tangysessions.test', genre: 'Techno / Deep House', city: 'Hyderabad', status: 'approved', applied_at: '2026-06-01T00:00:00Z' },
  { id: 'demo-art-2', name: 'Sara Iyer', email: 'demo.artist2@tangysessions.test', genre: 'Ambient / Downtempo', city: 'Bengaluru', status: 'pending', applied_at: '2026-09-12T00:00:00Z' },
];

export const DEMO_CREW_APPLICATIONS = [
  { id: 'demo-crew-1', name: 'Demo Crew Member', email: 'demo.crew@tangysessions.test', phone: '+91 90000 00002', role_interest: 'PRODUCTION & SOUND', category: 'crew', status: 'approved', message: 'Excited to help run sound for Tangy sessions.', created_at: '2026-07-01T00:00:00Z' },
  { id: 'demo-crew-2', name: 'Rohan Das', email: 'demo.guest3@tangysessions.test', phone: '+91 90000 00003', role_interest: 'PHOTOGRAPHY', category: 'crew', status: 'pending', message: 'Portfolio attached — happy to shoot upcoming sessions.', created_at: '2026-09-11T00:00:00Z' },
];

export const DEMO_VOLUNTEER_APPLICATIONS = [
  { id: 'demo-vol-1', name: 'Demo Volunteer', email: 'demo.volunteer@tangysessions.test', phone: '+91 90000 00004', role_interest: 'Front of House', category: 'volunteer', status: 'approved', message: 'Weekends only, happy to help wherever needed.', created_at: '2026-07-05T00:00:00Z' },
];

export const DEMO_COLLABORATIONS = [
  { id: 'demo-vendor-1', type: 'vendor', business_name: 'Demo Vendor', contact_name: 'Demo Vendor', email: 'demo.vendor@tangysessions.test', phone: '+91 90000 00005', status: 'approved', details: 'Chai and light snacks stall.', created_at: '2026-06-15T00:00:00Z' },
  { id: 'demo-sponsor-1', type: 'sponsor', business_name: 'Demo Sponsor', contact_name: 'Demo Sponsor', email: 'demo.sponsor@tangysessions.test', phone: '+91 90000 00006', status: 'approved', details: 'Season sponsorship — logo placement + programme mention.', created_at: '2026-06-20T00:00:00Z' },
  { id: 'demo-venue-1', type: 'venue_host', business_name: 'Demo Venue Partner', contact_name: 'Demo Venue Partner', email: 'demo.venue@tangysessions.test', phone: '+91 90000 00007', status: 'approved', details: 'Rooftop space, capacity ~150.', created_at: '2026-06-25T00:00:00Z' },
];

export const DEMO_SPONSOR_DELIVERABLES = [
  { id: 'demo-deliv-1', title: 'Logo on programme card', status: 'delivered', due_date: '2026-09-01', description: 'Included on printed programme for Heritage Sessions.', events: DEMO_EVENTS[2] },
  { id: 'demo-deliv-2', title: 'Stage banner placement', status: 'pending', due_date: '2026-10-10', description: 'Banner to be displayed at Stepwell Sessions Vol. 12.', events: DEMO_EVENTS[0] },
];

export const DEMO_ASSIGNMENTS = {
  crew: [
    {
      id: 'demo-assign-crew-1', event_id: DEMO_EVENTS[0].id, assignee_role: 'crew', title: 'Sound Engineer',
      status: 'confirmed', notes: null, events: DEMO_EVENTS[0],
      event_tasks: [
        { id: 'demo-task-1', title: 'Soundcheck by 6 PM', priority: 'high', due_at: '2026-10-18T18:00:00Z', status: 'pending' },
        { id: 'demo-task-2', title: 'Pack up PA system', priority: 'normal', due_at: '2026-10-18T23:30:00Z', status: 'pending' },
      ],
    },
    {
      id: 'demo-assign-crew-2', event_id: DEMO_EVENTS[2].id, assignee_role: 'crew', title: 'Backstage & Artist Care',
      status: 'completed', notes: null, events: DEMO_EVENTS[2], event_tasks: [],
    },
  ],
  volunteer: [
    {
      id: 'demo-assign-vol-1', event_id: DEMO_EVENTS[0].id, assignee_role: 'volunteer', title: 'Front of House',
      status: 'assigned', notes: null, events: DEMO_EVENTS[0],
    },
  ],
  vendor: [
    {
      id: 'demo-assign-vendor-1', event_id: DEMO_EVENTS[0].id, assignee_role: 'vendor', title: 'Chai Stall',
      status: 'confirmed', notes: null, events: DEMO_EVENTS[0],
    },
  ],
};

export const DEMO_PROFILE_FIELDS = {
  crew: { department: 'Production & Sound', shift_preference: 'Evenings', certifications: 'First Aid Certified (2025)' },
  volunteer: { availability: 'Weekends', skills: 'Front of house, ticketing', emergency_contact: 'Demo Contact — +91 90000 00099' },
  vendor: { business_name: 'Demo Vendor', category: 'Chai & Snacks', gstin: '', phone: '+91 90000 00005', description: 'Chai and light snacks stall, self-contained setup.' },
  sponsor: { organization_name: 'Demo Sponsor', sponsorship_tier: 'Season Partner', website: 'https://example.com', contact_designation: 'Marketing Lead' },
  venue: { property_name: 'Demo Venue Partner', location: 'Jubilee Hills, Hyderabad', capacity: 150, description: 'Rooftop heritage space, capacity ~150 standing.' },
};

export const DEMO_USERS = [
  { id: 'demo-user-1', full_name: 'Demo Patron', email: 'demo.patron@tangysessions.test', role: 'user', passport_id: 'DEMO-PATRON', member_since: '2026-05-01T00:00:00Z' },
  { id: 'demo-user-2', full_name: 'Ananya Rao', email: 'demo.guest1@tangysessions.test', role: 'user', passport_id: 'DEMO-GUEST1', member_since: '2026-08-14T00:00:00Z' },
  { id: 'demo-user-3', full_name: 'Demo Crew Member', email: 'demo.crew@tangysessions.test', role: 'crew', passport_id: 'DEMO-CREW', member_since: '2026-07-01T00:00:00Z' },
  { id: 'demo-user-4', full_name: 'Demo Vendor', email: 'demo.vendor@tangysessions.test', role: 'vendor', passport_id: 'DEMO-VENDOR', member_since: '2026-06-15T00:00:00Z' },
];

export const DEMO_CONTACT_ENQUIRIES = [
  { id: 'demo-contact-1', name: 'Priya Menon', email: 'demo.guest4@tangysessions.test', subject: 'Group booking question', inquiry_type: 'General', message: 'Can we book a table of 8 for the October session?', status: 'new', created_at: '2026-09-16T08:00:00Z' },
  { id: 'demo-contact-2', name: 'Karthik Iyer', email: 'demo.guest5@tangysessions.test', subject: 'Press enquiry', inquiry_type: 'Press', message: 'Writing a feature on Hyderabad live music — could we chat?', status: 'new', created_at: '2026-09-17T11:30:00Z' },
];

export const DEMO_PRIVATE_ENQUIRIES = [
  { id: 'demo-private-1', name: 'Demo Client', email: 'demo.client@tangysessions.test', type: 'wedding', preferred_date: '2026-12-05', guest_count: 80, message: 'Looking for a heritage venue for a sangeet evening.', status: 'pending', created_at: '2026-09-13T00:00:00Z' },
];

// Admin Overview / Control Room summary numbers — plausible, round, and
// internally consistent with the fabricated rows above.
export const DEMO_ADMIN_STATS = {
  revenue: DEMO_BOOKINGS.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.amount, 0),
  confirmedBookings: DEMO_BOOKINGS.filter((b) => b.status === 'confirmed').length,
  events: DEMO_EVENTS.filter((e) => e.status !== 'draft').length,
  pendingArtists: DEMO_ARTISTS.filter((a) => a.status === 'pending').length,
  approvedArtists: DEMO_ARTISTS.filter((a) => a.status === 'approved').length,
  pendingCrew: [...DEMO_CREW_APPLICATIONS, ...DEMO_VOLUNTEER_APPLICATIONS].filter((a) => a.status === 'pending').length,
  pendingCollab: DEMO_COLLABORATIONS.filter((c) => c.status === 'pending').length,
  pendingPrivate: 1,
  newContact: 2,
  waitlist: DEMO_WAITLIST.length,
  checkins: 1,
};

// Shaped exactly like what each real dashboard's `demoData` prop expects
// (see the `demoData` doc-comment at the top of each dashboard component).
// One place to keep the per-role wiring, instead of duplicating this
// assembly in DemoRoleDashboard.jsx.
export const DEMO_DASHBOARD_DATA = {
  patron: {
    bookings: DEMO_BOOKINGS,
    waitlist: DEMO_WAITLIST,
  },
  crew: {
    applications: DEMO_CREW_APPLICATIONS,
    profile: DEMO_PROFILE_FIELDS.crew,
    assignments: DEMO_ASSIGNMENTS.crew,
  },
  volunteer: {
    applications: DEMO_VOLUNTEER_APPLICATIONS,
    profile: DEMO_PROFILE_FIELDS.volunteer,
    assignments: DEMO_ASSIGNMENTS.volunteer,
  },
  vendor: {
    applications: DEMO_COLLABORATIONS.filter((c) => c.type === 'vendor'),
    profile: DEMO_PROFILE_FIELDS.vendor,
    assignments: DEMO_ASSIGNMENTS.vendor,
  },
  sponsor: {
    applications: DEMO_COLLABORATIONS.filter((c) => c.type === 'sponsor'),
    profile: DEMO_PROFILE_FIELDS.sponsor,
    deliverables: DEMO_SPONSOR_DELIVERABLES,
  },
  venue: {
    applications: DEMO_COLLABORATIONS.filter((c) => c.type === 'venue_host'),
    profile: DEMO_PROFILE_FIELDS.venue,
    hostedEvents: [DEMO_EVENTS[0], DEMO_EVENTS[2]],
  },
};
