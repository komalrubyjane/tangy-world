// MOCK service — aggregates counts across every mock collection for the
// Admin Overview screen. Not connected to Supabase.
import { mockBookings } from '../data/mock/bookings';
import { mockEvents } from '../data/mock/events';
import { mockArtists } from '../data/mock/artists';
import { mockCrew } from '../data/mock/crew';
import { mockVolunteers } from '../data/mock/volunteers';
import { mockContactEnquiries, mockPrivateEnquiries } from '../data/mock/enquiries';
import { mockCollaborations } from '../data/mock/collaborations';
import { mockWaitlist } from '../data/mock/waitlist';
import { mockAgentRequests } from '../data/mock/agentRequests';
import { mockCheckins } from '../data/mock/checkins';
import { userService } from './userService';

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const adminStatsService = {
  getOverview() {
    const confirmedBookings = mockBookings.filter((b) => b.status === 'confirmed');
    const revenue = confirmedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const ticketsSold = confirmedBookings.reduce((sum, b) => sum + b.quantity, 0);
    const totalUsers = userService.getAllAccounts().length;

    return {
      totalUsers,
      upcomingEvents: mockEvents.filter((e) => e.status !== 'past').length,
      ticketsSold,
      revenue,
      artists: mockArtists.filter((a) => a.status === 'approved').length,
      pendingArtists: mockArtists.filter((a) => a.status === 'pending').length,
      crew: mockCrew.length,
      pendingCrew: mockCrew.filter((c) => c.status === 'pending').length,
      volunteers: mockVolunteers.length,
      pendingVolunteers: mockVolunteers.filter((v) => v.status === 'pending').length,
      openEnquiries: mockContactEnquiries.filter((e) => e.status === 'new').length + mockPrivateEnquiries.filter((e) => e.status === 'pending').length,
      pendingAgents: mockAgentRequests.filter((r) => r.status === 'pending').length,
      waitlist: mockWaitlist.filter((w) => w.status === 'waiting').length,
      checkins: mockCheckins.length,
      pendingCollaborations: mockCollaborations.filter((c) => c.status === 'new' || c.status === 'reviewing').length,
    };
  },

  getRecentBookings(limit = 5) {
    return [...mockBookings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
      .map((b) => ({ ...b, event: mockEvents.find((e) => e.id === b.eventId) }));
  },

  getUpcomingSessions(limit = 4) {
    return [...mockEvents]
      .filter((e) => e.status !== 'past')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, limit);
  },

  getPendingActions() {
    const actions = [];
    mockArtists.filter((a) => a.status === 'pending').forEach((a) => actions.push({ id: `pa-art-${a.id}`, label: `Review artist application — ${a.name}`, kind: 'artist' }));
    mockContactEnquiries.filter((e) => e.status === 'new').slice(0, 3).forEach((e) => actions.push({ id: `pa-enq-${e.id}`, label: `New enquiry — ${e.subject}`, kind: 'enquiry' }));
    mockPrivateEnquiries.filter((e) => e.status === 'pending').forEach((e) => actions.push({ id: `pa-priv-${e.id}`, label: `Private event request — ${e.name}`, kind: 'private' }));
    mockAgentRequests.filter((r) => r.status === 'pending').forEach((r) => actions.push({ id: `pa-agt-${r.id}`, label: `Human agent requested — ${r.user}`, kind: 'agent' }));
    return actions.slice(0, 8);
  },

  getRecentActivity(limit = 8) {
    const events = [];
    mockBookings.slice(0, 5).forEach((b) => events.push({ id: `act-bkg-${b.id}`, text: `Ticket booked — ${b.attendeeName} (${b.registrationCode})`, at: b.createdAt }));
    mockArtists.slice(0, 3).forEach((a) => events.push({ id: `act-art-${a.id}`, text: `Artist application — ${a.name}`, at: a.appliedAt || a.createdAt }));
    mockCollaborations.slice(0, 3).forEach((c) => events.push({ id: `act-col-${c.id}`, text: `${c.type.replace('_', ' ')} enquiry — ${c.businessName}`, at: c.createdAt }));
    mockVolunteers.slice(0, 2).forEach((v) => events.push({ id: `act-vol-${v.id}`, text: `Volunteer joined — ${v.fullName}`, at: v.createdAt }));
    mockAgentRequests.slice(0, 3).forEach((r) => events.push({ id: `act-agt-${r.id}`, text: `Agent requested — ${r.user}`, at: r.createdAt }));
    return events
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, limit)
      .map((e) => ({ ...e, timeAgo: timeAgo(e.at) }));
  },
};
