// Centralized mock events — single source of truth for Homepage, Sessions,
// Calendar, and Admin. (Separate from the real Supabase `events` table used
// by the existing booking flow — this powers the new mock dashboards/AI.)
export const mockEvents = [
  {
    id: 'evt-vol4',
    slug: 'vol-4',
    name: 'Tangy Sessions Vol. 4',
    description: 'The roster returns to the stepwell for another unamplified night of heritage acoustics.',
    date: '2026-09-19',
    time: '7:00 PM',
    venue: 'Bansilalpet Stepwell',
    city: 'Hyderabad',
    image: '/media/gallery/tangy4.jpg',
    capacity: 220,
    sold: 148,
    price: 899,
    status: 'on-sale',
    featured: true,
    artists: ['art-m01'],
    tags: ['Heritage', 'Live', 'Acoustic'],
  },
  {
    id: 'evt-solstice27',
    slug: 'solstice-2027',
    name: 'Tangy Sessions: Summer Solstice',
    description: 'A summer solstice celebration at the greatest acoustic pavilion in the city.',
    date: '2027-06-21',
    time: '7:00 PM',
    venue: 'Taramati Baradari',
    city: 'Hyderabad',
    image: '/media/gallery/tangy1.jpg',
    capacity: 250,
    sold: 40,
    price: 1499,
    status: 'on-sale',
    featured: true,
    artists: [],
    tags: ['Sufi', 'Acoustic', 'Solstice'],
  },
  {
    id: 'evt-monsoon27',
    slug: 'monsoon-2027',
    name: 'Tangy Sessions: Monsoon Ritual',
    description: 'Unamplified folk music in a Nizam-era courtyard as the monsoon rains fall.',
    date: '2027-07-25',
    time: '6:00 PM',
    venue: 'Old City Courtyard',
    city: 'Hyderabad',
    image: '/media/gallery/tangy3.jpg',
    capacity: 180,
    sold: 12,
    price: 799,
    status: 'on-sale',
    featured: false,
    artists: [],
    tags: ['Folk', 'Monsoon', 'Heritage'],
  },
  {
    id: 'evt-vol3',
    slug: 'vol-3',
    name: 'Tangy Sessions Vol. 3',
    description: 'Experimental vocal ambient loops, tabla rhythms, and ancient stone resonance.',
    date: '2026-02-14',
    time: '7:30 PM',
    venue: 'Bansilalpet Stepwell',
    city: 'Hyderabad',
    image: '/media/gallery/tangy8.jpg',
    capacity: 200,
    sold: 200,
    price: 899,
    status: 'past',
    featured: false,
    artists: [],
    tags: ['Vocal', 'Ambient', 'Tabla'],
  },
  {
    id: 'evt-vol2',
    slug: 'vol-2',
    name: 'Tangy Sessions Vol. 2',
    description: 'Carnatic violin ragas fused with sub-bass textures inside historic acoustic pavilions.',
    date: '2025-09-20',
    time: '8:00 PM',
    venue: 'Taramati Baradari',
    city: 'Hyderabad',
    image: '/media/gallery/tangy2.jpg',
    capacity: 250,
    sold: 250,
    price: 999,
    status: 'past',
    featured: false,
    artists: [],
    tags: ['Violin', 'Fusion', 'Carnatic'],
  },
  {
    id: 'evt-vol1',
    slug: 'vol-1',
    name: 'Tangy Sessions Vol. 1',
    description: 'An immersive night of underground acoustic & sufi music echoing through 300-year-old stone corridors.',
    date: '2025-08-15',
    time: '7:00 PM',
    venue: 'Bansilalpet Stepwell',
    city: 'Hyderabad',
    image: '/media/gallery/tangy1.jpg',
    capacity: 200,
    sold: 200,
    price: 799,
    status: 'past',
    featured: false,
    artists: ['art-m01'],
    tags: ['Sufi', 'Acoustic', 'Heritage'],
  },
];

export function getUpcomingEvents(limit) {
  const upcoming = mockEvents
    .filter((e) => e.status !== 'past')
    .sort((a, b) => a.date.localeCompare(b.date));
  return typeof limit === 'number' ? upcoming.slice(0, limit) : upcoming;
}

export function getPastEvents() {
  return mockEvents.filter((e) => e.status === 'past').sort((a, b) => b.date.localeCompare(a.date));
}

export function getEventBySlug(slug) {
  return mockEvents.find((e) => e.slug === slug || e.id === slug);
}

export function getEventsByMonth(year, month) {
  // month is 0-indexed (JS Date convention)
  return mockEvents.filter((e) => {
    const d = new Date(`${e.date}T00:00:00`);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}
