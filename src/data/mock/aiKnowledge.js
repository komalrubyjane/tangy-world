// Tangy AI mock knowledge base.
// This is a structured, hand-authored Q&A/keyword system — NOT a trained
// model and NOT connected to any external AI API. It exists so the chat UI,
// quick-question chips, and escalation flow can be built and verified now;
// later this file is what gets replaced by real retrieval (see architecture
// note in aiSupportService.js).

export const AI_CATEGORIES = [
  { id: 'tickets', label: 'TICKETS' },
  { id: 'sessions', label: 'SESSIONS' },
  { id: 'artists', label: 'ARTISTS' },
  { id: 'collaborate', label: 'COLLABORATE' },
  { id: 'crew', label: 'CREW' },
  { id: 'private', label: 'PRIVATE EVENTS' },
  { id: 'archive', label: 'ARCHIVE' },
  { id: 'about', label: 'ABOUT TANGY' },
  { id: 'contact', label: 'CONTACT' },
];

// Each entry: predefined question, the answer, optional CTA, optional
// related question ids, and keywords used for free-text matching.
export const aiKnowledge = [
  // ---------------- TICKETS ----------------
  {
    id: 'tickets-book',
    category: 'tickets',
    question: 'How do I book a ticket?',
    answer: "Open a session from the Sessions page, choose a ticket tier and quantity, and confirm your details. You'll need to be signed in first so your ticket lands in your Passport.",
    cta: { label: 'VIEW SESSIONS', to: '/sessions' },
    related: ['tickets-qr', 'tickets-find'],
    keywords: ['book', 'buy ticket', 'purchase', 'get a ticket', 'booking'],
  },
  {
    id: 'tickets-find',
    category: 'tickets',
    question: 'Where can I find my ticket?',
    answer: 'All your confirmed bookings live in your Passport, along with the QR code you show at check-in.',
    cta: { label: 'OPEN PASSPORT', to: '/dashboard' },
    related: ['tickets-qr'],
    keywords: ['find my ticket', 'where is my ticket', 'passport', 'my booking'],
  },
  {
    id: 'tickets-qr',
    category: 'tickets',
    question: 'How does the QR ticket work?',
    answer: 'Each confirmed booking generates a unique QR code tied to your registration. Staff scan it at the door to check you in — one scan per ticket, so it can only be used once.',
    related: ['tickets-find'],
    keywords: ['qr', 'qr code', 'scan', 'check in', 'checkin'],
  },
  {
    id: 'tickets-waitlist',
    category: 'tickets',
    question: 'Can I join a waitlist?',
    answer: "Yes — sold-out sessions have a waitlist form right on the Sessions page. We'll reach out 48 hours before public tickets reopen.",
    cta: { label: 'JOIN A WAITLIST', to: '/sessions#waitlist' },
    keywords: ['waitlist', 'sold out', 'wait list', 'notify me'],
  },

  // ---------------- SESSIONS ----------------
  {
    id: 'sessions-next',
    category: 'sessions',
    question: 'What is the next Tangy Session?',
    answer: 'Our next confirmed session is Tangy Sessions Vol. 4 at Bansilalpet Stepwell. Check the Sessions page for the exact date and ticket status.',
    cta: { label: 'VIEW SESSIONS', to: '/sessions' },
    related: ['sessions-what'],
    keywords: ['next session', 'upcoming', 'when is the next', 'whats next'],
  },
  {
    id: 'sessions-venue',
    category: 'sessions',
    question: 'Where are sessions held?',
    answer: "In heritage spaces across Hyderabad — Bansilalpet Stepwell, Taramati Baradari, and Old City courtyards, chosen for how they naturally carry unamplified sound.",
    keywords: ['where', 'venue', 'location', 'held'],
  },
  {
    id: 'sessions-what',
    category: 'sessions',
    question: 'What is Tangy Sessions?',
    answer: 'Tangy Sessions is a live-music series that stages unamplified performances inside historic Hyderabad venues — stepwells, courtyards, pavilions — building a growing cultural archive as it goes.',
    cta: { label: 'ABOUT TANGY', to: '/about' },
    keywords: ['what is tangy', 'about tangy sessions', 'what is this'],
  },
  {
    id: 'sessions-past',
    category: 'sessions',
    question: 'How can I see past sessions?',
    answer: 'The Archive holds our full session history — photos, timelines, and contact sheets from every past Tangy Session.',
    cta: { label: 'VISIT THE ARCHIVE', to: '/archive' },
    keywords: ['past session', 'previous session', 'history', 'old sessions'],
  },

  // ---------------- ARTISTS ----------------
  {
    id: 'artists-apply',
    category: 'artists',
    question: 'How can I apply as an artist?',
    answer: 'You can apply through the Artists section. Start by opening the Artist Application and sharing your profile, work, and performance details.',
    cta: { label: 'OPEN ARTIST APPLICATION', to: '/artist/register' },
    related: ['artists-process', 'artists-directory'],
    keywords: ['apply as artist', 'artist application', 'perform', 'become an artist'],
  },
  {
    id: 'artists-process',
    category: 'artists',
    question: 'How does the artist process work?',
    answer: 'Our curation team reviews every application — your sound, your story, and how it fits a specific venue — and reaches out within 3-5 days with a decision or follow-up questions.',
    related: ['artists-apply'],
    keywords: ['artist process', 'selection', 'how does it work', 'review'],
  },
  {
    id: 'artists-directory',
    category: 'artists',
    question: 'Where can I see Tangy artists?',
    answer: 'The Artists Directory has profiles for every approved artist in the roster, with genre, city, and past performances.',
    cta: { label: 'ARTISTS DIRECTORY', to: '/artist' },
    keywords: ['see artists', 'artist directory', 'roster', 'lineup'],
  },

  // ---------------- COLLABORATE ----------------
  {
    id: 'collab-general',
    category: 'collaborate',
    question: 'How can I collaborate with Tangy?',
    answer: 'We work with vendors, sponsors, and venue hosts. The Collaborate page has a dedicated application track for each.',
    cta: { label: 'EXPLORE OPPORTUNITIES', to: '/collaborate' },
    related: ['collab-vendor', 'collab-sponsor', 'collab-venue'],
    keywords: ['collaborate', 'partner', 'work with tangy', 'partnership'],
  },
  {
    id: 'collab-vendor',
    category: 'collaborate',
    question: 'How can I become a vendor?',
    answer: 'Food artisans, chai stalls, and craft makers can apply through the Vendor track — we look for handcrafted quality and cultural authenticity.',
    cta: { label: 'APPLY AS VENDOR', to: '/apply/vendors' },
    keywords: ['vendor', 'food stall', 'craft', 'chai'],
  },
  {
    id: 'collab-sponsor',
    category: 'collaborate',
    question: 'How can I become a sponsor?',
    answer: 'Sponsorships fund venue restoration, artist grants, and vinyl pressings. The Sponsor track outlines partnership levels.',
    cta: { label: 'SPONSORSHIP INQUIRY', to: '/apply/sponsors' },
    keywords: ['sponsor', 'sponsorship', 'fund', 'grant'],
  },
  {
    id: 'collab-venue',
    category: 'collaborate',
    question: 'How can I host a Tangy session?',
    answer: "If you own or manage a heritage property — a stepwell, haveli, or courtyard — the Venue/Host track starts with a site assessment.",
    cta: { label: 'SUBMIT A VENUE', to: '/apply/venue-host' },
    keywords: ['host', 'venue', 'my property', 'heritage property'],
  },

  // ---------------- CREW ----------------
  {
    id: 'crew-join',
    category: 'crew',
    question: 'How can I join the crew?',
    answer: 'Crew roles cover production, stage operations, and hospitality. The Crew page lists open roles and a direct application form.',
    cta: { label: 'APPLY TO CREW', to: '/crew#apply' },
    related: ['crew-volunteer'],
    keywords: ['join crew', 'crew role', 'production team', 'stage operations'],
  },
  {
    id: 'crew-volunteer',
    category: 'crew',
    question: 'How can I volunteer?',
    answer: "Volunteers help with everything from registration to social coverage on session nights. Same application form as crew — just pick 'Volunteer' as your interest.",
    cta: { label: 'VOLUNTEER WITH US', to: '/crew#apply' },
    keywords: ['volunteer', 'volunteering', 'help out'],
  },

  // ---------------- PRIVATE ----------------
  {
    id: 'private-general',
    category: 'private',
    question: 'Do you host private events?',
    answer: 'Yes — private gatherings, weddings, corporate events, and curated heritage experiences, all in the same unamplified-acoustic style as our public sessions.',
    cta: { label: 'PRIVATE SESSIONS', to: '/private-sessions' },
    related: ['private-corporate', 'private-heritage'],
    keywords: ['private event', 'private session', 'book tangy for'],
  },
  {
    id: 'private-corporate',
    category: 'private',
    question: 'Do you work with corporate events?',
    answer: "We curate unplugged music for brand launches, executive retreats, and private dinners — reach out with your guest count and date.",
    cta: { label: 'CORPORATE ENQUIRY', to: '/private-sessions#corporate' },
    keywords: ['corporate', 'brand launch', 'company event'],
  },
  {
    id: 'private-heritage',
    category: 'private',
    question: 'Can Tangy curate a heritage experience?',
    answer: 'Yes — we can transform a palace, stepwell, or haveli into a private acoustic sanctuary for a wedding, ritual, or milestone celebration.',
    keywords: ['heritage experience', 'palace', 'wedding venue'],
  },

  // ---------------- ARCHIVE ----------------
  {
    id: 'archive-what',
    category: 'archive',
    question: 'What is the Tangy Archive?',
    answer: "A growing digital museum of every Tangy Session — photos, a museum timeline, past memories, and 35mm contact sheets.",
    cta: { label: 'VISIT THE ARCHIVE', to: '/archive' },
    keywords: ['archive', 'what is the archive'],
  },
  {
    id: 'archive-past-sessions',
    category: 'archive',
    question: 'Where can I see past sessions?',
    answer: 'The Session Archive section holds the full history, searchable by year and venue.',
    cta: { label: 'SESSION ARCHIVE', to: '/archive/session-archive' },
    keywords: ['past sessions archive', 'old session photos'],
  },
  {
    id: 'archive-museum',
    category: 'archive',
    question: 'What is the Tangy Museum?',
    answer: "It's our informal name for the Archive experience as a whole — a museum timeline of Tangy's history alongside the photo and contact-sheet collections.",
    cta: { label: 'MUSEUM TIMELINE', to: '/archive/museum-timeline' },
    keywords: ['museum', 'tangy museum'],
  },

  // ---------------- ABOUT ----------------
  {
    id: 'about-general',
    category: 'about',
    question: 'What is Tangy?',
    answer: 'Tangy Sessions is a Hyderabad-based live music and heritage platform, founded in 2016, staging unamplified performances in historic spaces across the city.',
    cta: { label: 'FULL STORY', to: '/about/full-story' },
    keywords: ['what is tangy', 'about', 'who are you', 'tell me about tangy'],
  },

  // ---------------- CONTACT ----------------
  {
    id: 'contact-general',
    category: 'contact',
    question: 'How can I contact Tangy?',
    answer: 'Email hello@tangysessions.com or use the contact form — we reply within 48 hours.',
    cta: { label: 'CONTACT PAGE', to: '/contact' },
    keywords: ['contact', 'email', 'reach out', 'get in touch'],
  },
  {
    id: 'contact-location',
    category: 'contact',
    question: 'Where is Tangy based?',
    answer: 'Hyderabad, Telangana, India — our primary heritage sanctuary is Bansilalpet Stepwell in Secunderabad.',
    keywords: ['where based', 'location', 'city', 'address'],
  },
];

export function findAnswerById(id) {
  return aiKnowledge.find((k) => k.id === id) || null;
}

export function getQuestionsByCategory(categoryId) {
  return aiKnowledge.filter((k) => k.category === categoryId);
}

// Very small keyword-overlap matcher for free-text input. This is
// intentionally simple/mock — see aiSupportService.js for the note on
// upgrading this to real retrieval later.
export function matchFreeText(text) {
  const q = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const entry of aiKnowledge) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) score += kw.split(' ').length; // longer phrase matches score higher
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore > 0 ? best : null;
}
