// DEMO CREW PROFILES — fictional people shown on the Crew pages so they can be
// reviewed with content. There is no public crew-profile data model (crew
// records are private), so these live here and are labelled "demo" on the page.
// Replace with real, consented profiles before launch.
export const DEMO_CREW = [
  { name: 'Aarav Kulkarni', role: 'Sound engineer', team: 'production', bio: 'Maps every venue by ear before a single cable goes down.', responsibilities: ['Acoustic walk-through', 'Mic placement', 'Front-of-house mix'] },
  { name: 'Nisha Fernandes', role: 'Lighting lead', team: 'production', bio: 'Lanterns, low-voltage spots and no floodlights, ever.', responsibilities: ['Lighting plan', 'Lantern rig', 'Power safety'] },
  { name: 'Faiz Hussain', role: 'Tape & recording', team: 'production', bio: 'Runs the two-track tape machine and the backup recorder.', responsibilities: ['Live recording', 'Archive tapes', 'Tangy TV rough cuts'] },
  { name: 'Revathi Menon', role: 'Production manager', team: 'production', bio: 'Holds the run sheet and the walkie that matters.', responsibilities: ['Run sheet', 'Artist call times', 'Venue liaison'] },
  { name: 'Kunal Shetty', role: 'Stage manager', team: 'stage', bio: 'Gets artists on and off stone stages without a stumble.', responsibilities: ['Stage plot', 'Changeovers', 'Artist green room'] },
  { name: 'Anjali Rao', role: 'Front of house', team: 'stage', bio: 'Leads the gate team and the seating plan.', responsibilities: ['Gate & check-in', 'Seating', 'Access needs'] },
  { name: 'Tariq Siddiqui', role: 'Venue crew lead', team: 'stage', bio: 'Rugs, cushions, chairs — in at five, out by midnight.', responsibilities: ['Load-in', 'Floor seating', 'Load-out'] },
  { name: 'Pooja Iyer', role: 'Volunteer coordinator', team: 'stage', bio: 'Briefs every volunteer and keeps the chai station running.', responsibilities: ['Volunteer briefing', 'Shift rota', 'Chai station'] },
];

export const crewByTeam = (team) => DEMO_CREW.filter((c) => c.team === team);
export const initials = (name) => name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
