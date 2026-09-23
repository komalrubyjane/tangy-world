// Normalizes the several role vocabularies in play (real DB user_role enum:
// user/artist/staff/admin/super_admin/vendor/sponsor/volunteer/crew; mock
// ROLE_META: patron/artist/vendor/crew/volunteer/sponsor/venue/private/admin;
// anonymous chat requesters: 'guest') into the six buckets the Admin Inbox
// filters by, so one filter works regardless of which auth mode produced the
// conversation.
const BUCKET_BY_RAW_ROLE = {
  user: 'attendee',
  patron: 'attendee',
  guest: 'attendee',
  vendor: 'vendor',
  sponsor: 'sponsor',
  artist: 'artist',
  volunteer: 'volunteer',
  crew: 'crew',
};

export const ROLE_BUCKETS = [
  { id: 'attendee', label: 'Attendee' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'sponsor', label: 'Sponsor' },
  { id: 'artist', label: 'Artist' },
  { id: 'volunteer', label: 'Volunteer' },
  { id: 'crew', label: 'Crew' },
];

export function roleBucket(rawRole) {
  return BUCKET_BY_RAW_ROLE[(rawRole || '').toLowerCase()] || 'attendee';
}
