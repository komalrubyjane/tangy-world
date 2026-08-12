export const events = [
  {
    id: 'vol-1',
    slug: 'vol-1',
    title: 'Tangy Sessions Vol. 1',
    artist: 'Damini Bhatla & Ensemble',
    date: 'Aug 15, 2025',
    time: '7:00 PM',
    venue: 'Bansilalpet Stepwell',
    city: 'HYDERABAD',
    description: 'An immersive night of underground acoustic & sufi music echoing through 300-year-old stone corridors.',
    image: '/media/gallery/tangy1.jpg',
    ticketUrl: '#book',
    status: 'AVAILABLE',
    price: '₹799',
    tags: ["Sufi", "Acoustic", "Heritage"],
    capacity: 200,
    story: "The night the 17th-century stepwell came alive. 200 listeners gathered under the open moonlight as acoustics rebounded off limestone walls.",
    setlist: [
      "01. Intro — Stepwell Echoes",
      "02. Mast Qalandar (Acoustic Raga)",
      "03. Sufi Drone Improvisation",
      "04. Midnight Jam w/ Tanpura"
    ]
  },
  {
    id: 'vol-2',
    slug: 'vol-2',
    title: 'Tangy Sessions Vol. 2',
    artist: 'Varun Rao (Violin Fusion)',
    date: 'Sep 20, 2025',
    time: '8:00 PM',
    venue: 'Taramati Baradari',
    city: 'HYDERABAD',
    description: 'Carnatic violin ragas fused with sub-bass textures inside historic acoustic pavilions.',
    image: '/media/gallery/tangy2.jpg',
    ticketUrl: '#book',
    status: 'AVAILABLE',
    price: '₹999',
    tags: ["Violin", "Fusion", "Carnatic"],
    capacity: 250,
    story: "Taramati Baradari was built for music projection. Varun's violin resonated across the entire valley without amplification.",
    setlist: [
      "01. Raga Hamsadhwani Prelude",
      "02. Sub-Bass & Strings",
      "03. Midnight Raag Bhairavi"
    ]
  },
  {
    id: 'solstice',
    slug: 'solstice',
    title: 'Tangy Sessions: Solstice',
    artist: 'Nikhil & Acoustic Collective',
    date: 'Dec 21, 2025',
    time: '6:30 PM',
    venue: 'Chowmahalla Courtyard',
    city: 'HYDERABAD',
    description: 'A winter solstice special — the longest night, the deepest sounds.',
    image: '/media/gallery/tangy3.jpg',
    ticketUrl: '#book',
    status: 'AVAILABLE',
    price: '₹1299',
    tags: ["Folk", "Solstice", "Live"],
    capacity: 180,
    story: "Fires lit in clay pots along the courtyard arches while folk melodies carried through midnight darkness.",
    setlist: [
      "01. Solstice Overture",
      "02. Telangana Folk Lullaby",
      "03. Open Jam & Chants"
    ]
  },
  {
    id: 'vol-3',
    slug: 'vol-3',
    title: 'Tangy Sessions Vol. 3',
    artist: 'Priya K & Tabla Collective',
    date: 'Feb 14, 2026',
    time: '7:30 PM',
    venue: 'Bansilalpet Stepwell',
    city: 'HYDERABAD',
    description: 'Experimental vocal ambient loops, tabla rhythms, and ancient stone resonance on Valentine\'s eve.',
    image: '/media/gallery/tangy8.jpg',
    ticketUrl: '#book',
    status: 'AVAILABLE',
    price: '₹899',
    tags: ['Vocal', 'Ambient', 'Tabla'],
    capacity: 200,
    story: 'A love letter to the forgotten stones of Hyderabad — intimate, raw, and unscripted.',
    setlist: ['01. Drone Prelude', '02. Tabla & Breath', '03. Stone Echo Improvisation', '04. Silent Raga Finale']
  },
  {
    id: 'solstice-2026',
    slug: 'solstice-2026',
    title: 'Tangy Sessions: Summer Solstice',
    artist: 'Damini Bhatla & Ensemble',
    date: 'Jun 21, 2026',
    time: '7:00 PM',
    venue: 'Taramati Baradari',
    city: 'HYDERABAD',
    description: 'A summer solstice celebration — the longest day, the most resonant night at the greatest acoustic pavilion.',
    image: '/media/gallery/tangy1.jpg',
    ticketUrl: '#book',
    status: 'AVAILABLE',
    price: '₹1499',
    tags: ['Sufi', 'Acoustic', 'Solstice'],
    capacity: 250,
    story: 'Under twelve arches built to carry a voice two miles, we gather for the longest night of 2026.',
    setlist: ['01. Solstice Dawn', '02. Sufi Kafi', '03. Valley Echo Raga']
  },
  {
    id: 'monsoon-2026',
    slug: 'monsoon-2026',
    title: 'Tangy Sessions: Monsoon Ritual',
    artist: 'Nikhil & Acoustic Collective',
    date: 'Jul 25, 2026',
    time: '6:00 PM',
    venue: 'Old City Courtyard',
    city: 'HYDERABAD',
    description: 'Unamplified folk music in a Nizam-era courtyard as the monsoon rains fall on ancient neem trees.',
    image: '/media/gallery/tangy3.jpg',
    ticketUrl: '#book',
    status: 'AVAILABLE',
    price: '₹799',
    tags: ['Folk', 'Monsoon', 'Heritage'],
    capacity: 180,
    story: 'The most honest recording is rain on clay pots and a flute in a 130-year-old courtyard.',
    setlist: ['01. Monsoon Overture', '02. Telangana Rain Song', '03. Open Jam']
  }
];

export const artists = [
  { id: 1, name: "Damini Bhatla", role: "Vocalist & Composer", image: "/media/gallery/tangy3.jpg", color: "#d1a437", bio: "Bridging Sufi tradition and contemporary acoustic soul. Damini's voice carries raw emotional weight that transforms historical monuments into sacred acoustic spaces.", genre: "Sufi & Contemporary", location: "Hyderabad, India", followers: "42.5K", performances: "140+", instruments: ["Vocals", "Harmonium", "Tanpura"], sessions: ["Vol. 1", "Solstice Ritual"] },
  { id: 2, name: "Varun Rao", role: "Carnatic Violinist", image: "/media/gallery/tangy4.jpg", color: "#c2272a", bio: "Violin virtuoso trained in classical Carnatic traditions. Varun explores microscopic microtonal shifts over deep bass drones.", genre: "Carnatic Fusion", location: "Hyderabad, India", followers: "28.2K", performances: "98+", instruments: ["Violin", "Loop Pedal"], sessions: ["Vol. 2", "Stepwell Nocturne"] },
  { id: 3, name: "Nikhil & Collective", role: "Acoustic Folk Ensemble", image: "/media/gallery/tangy5.jpg", color: "#315D73", bio: "Folk roots meets modern acoustic arrangements. Nikhil gathers rare instruments from across South Asia to weave rich tapestry soundscapes.", genre: "Acoustic Folk", location: "Secunderabad, India", followers: "31.0K", performances: "165+", instruments: ["Acoustic Guitar", "Flute", "Percussion"], sessions: ["Solstice 2024", "Vol. 3"] },
  { id: 4, name: "Priya K", role: "Experimental Vocalist", image: "/media/gallery/tangy8.jpg", color: "#8a2320", bio: "Combining traditional vocal improvisations with analog pitch shifting and ambient tape loops.", genre: "Vocal Ambient", location: "Hyderabad, India", followers: "19.4K", performances: "85+", instruments: ["Vocals", "Tape Machine"], sessions: ["Haveli Night"] }
];

export const venuesDetailed = [
  {
    id: "bansilalpet",
    name: "Bansilalpet Stepwell",
    type: "17th Century Stepwell Sanctuary",
    location: "Secunderabad, Telangana",
    yearBuilt: "1670 AD",
    image: "/media/gallery/tangy1.jpg",
    history: "A restored 17th-century stepwell that sat buried under rubble for decades before being excavated. Its tiered stone steps create a natural acoustic amphitheatre with 2.4-second natural reverb.",
    architecture: "Multi-tiered granite step structure with arched niches and natural spring water basin at the core.",
    soundscape: "Natural stone reverberation, trickling water echoes, sub-bass resonance.",
    sessionsHeld: 14
  },
  {
    id: "taramati",
    name: "Taramati Baradari",
    type: "Historic Acoustic Pavilion",
    location: "Ibrahim Bagh, Hyderabad",
    yearBuilt: "1680 AD",
    image: "/media/gallery/tangy2.jpg",
    history: "Legendary acoustic pavilion constructed atop a hill so that the singing of courtesan Taramati could be heard at Golconda Fort 2 miles away.",
    architecture: "12-arched open pavilion with domed ceiling designed specifically for voice projection.",
    soundscape: "Hilltop breeze, open-air high-frequency resonance, vocal echo.",
    sessionsHeld: 9
  },
  {
    id: "old-haveli",
    name: "Old City Courtyard",
    type: "Private Heritage Courtyard",
    location: "Charminar Lane, Old Hyderabad",
    yearBuilt: "1890 AD",
    image: "/media/gallery/tangy3.jpg",
    history: "A private 130-year-old Nizam-era courtyard sheltered by lime-plaster arches and ancient neem trees.",
    architecture: "Central open courtyard surrounded by carved teakwood pillars and Belgian glass lanterns.",
    soundscape: "Neem leaves rustling, distant minaret bells, intimate acoustic warm tone.",
    sessionsHeld: 11
  }
];

export const vinylCatalog = [
  {
    id: "v-01",
    catalogNo: "TS-VINYL-001",
    title: "BANSILALPET STEPWELL SESSION",
    artist: "Tangy Sessions Resident Collective",
    year: "2024",
    speed: "33⅓ RPM STEREO",
    cover: "/media/gallery/tangy1.jpg",
    previewTrack: "Side A — Stepwell Acoustics (Live at 2 AM)",
    lyrics: "The water speaks in whispers / Stone walls hold the night / Tangy roots run deeper / Into morning light...",
    story: "Pressed directly from 2-track master tape recorded live inside the stepwell during the winter solstice of 2024."
  },
  {
    id: "v-02",
    catalogNo: "TS-VINYL-002",
    title: "MIDNIGHT RAGAS & REVERB",
    artist: "Varun Rao & Damini Bhatla",
    year: "2025",
    speed: "33⅓ RPM MONO",
    cover: "/media/gallery/tangy2.jpg",
    previewTrack: "Side B — Raag Bhairavi (Acoustic Uncut)",
    lyrics: "Echoes of the pavilion / Wind through twelve arches / We play until dawn breaks...",
    story: "Recorded in a single live take with two vintage ribbion microphones suspended from the Baradari dome."
  }
];

export const soundArchive = [
  { id: "sa-1", title: "Rain at Bansilalpet Stepwell", duration: "03:45", category: "Ambient Field", freq: "432 Hz", note: "Monsoon raindrops trickling onto 350-year-old stone steps." },
  { id: "sa-2", title: "Audience Cheers & Chais", duration: "02:10", category: "Live Crowd", freq: "440 Hz", note: "Clapping and clinking glass chai cups after Damini's final raga." },
  { id: "sa-3", title: "Violin Practice Warmup", duration: "04:15", category: "Instrumental", freq: "432 Hz", note: "Varun tuning his 1920s violin inside the reverberant courtyard." },
  { id: "sa-4", title: "Mic Feedback & Sub Drone", duration: "01:50", category: "Analog Sound", freq: "60 Hz", note: "Pure analog valve amplifier warm hum before showtime." },
  { id: "sa-5", title: "Midnight Night Crickets", duration: "05:00", category: "Nature Acoustic", freq: "528 Hz", note: "Late night atmosphere at Taramati Baradari post midnight." }
];

export const archiveItems = [
  {
    id: "arch-1",
    title: "VINTAGE CONCERT POSTER — VOL. 01",
    category: "POSTER",
    year: "2016",
    image: "/media/gallery/tangy1.jpg",
    headline: "HAND-SCREENPRINTED IN HYDERABAD",
    details: "Limited 100-copy screenprinted poster on 300gsm recycled cream paper. Printed at Old City print press using oil inks."
  },
  {
    id: "arch-2",
    title: "ADMIT ONE TICKET STUB #09100",
    category: "TICKET STUB",
    year: "2018",
    image: "/media/gallery/tangy3.jpg",
    headline: "ARCHIVE ENTRY NO. 09100",
    details: "Original perforated ticket stub stamped with vintage ink seal. Used during the first midnight stepwell gathering."
  },
  {
    id: "arch-3",
    title: "NIZAM ERA NEWSPAPER PRESS FEATURE",
    category: "PRESS CLIPPING",
    year: "2020",
    image: "/media/gallery/tangy5.jpg",
    headline: "THE DECCAN CHRONICLE EXCLUSIVE",
    details: "\"How Tangy Sessions revived forgotten heritage stepwells through secret live acoustic concerts.\""
  },
  {
    id: "arch-4",
    title: "HANDWRITTEN ARTIST LINER NOTES",
    category: "HANDWRITTEN NOTE",
    year: "2023",
    image: "/media/gallery/tangy8.jpg",
    headline: "FIELD NOTEBOOK FILE #04",
    details: "Original notebook page written by Arjuna outlining the acoustic echo tuning for Bansilalpet Stepwell."
  }
];

export const todaysProgramme = [
  { time: "06:00 PM", status: "COMPLETE", title: "GATE OPEN & ENTRY", desc: "Welcome chais served at stepwell entrance." },
  { time: "06:30 PM", status: "COMPLETE", title: "LIVE SCREEN-PRINTING", desc: "Commemorative poster printing workshop." },
  { time: "07:15 PM", status: "ACTIVE", title: "HERITAGE COFFEE RITUAL", desc: "Single-origin filter coffee & soundcheck." },
  { time: "07:45 PM", status: "UPCOMING", title: "SET 01: DAMINI BHATLA", desc: "Sufi acoustic vocals & tanpura drone." },
  { time: "08:45 PM", status: "UPCOMING", title: "ACOUSTIC BREAK & CHAIS", desc: "Intermission & courtyard networking." },
  { time: "09:15 PM", status: "UPCOMING", title: "SET 02: VARUN RAO", desc: "Carnatic violin sub-bass fusion." },
  { time: "10:30 PM", status: "UPCOMING", title: "OPEN ACOUSTIC JAM", desc: "Artists & audience unscripted acoustic circle." },
  { time: "11:45 PM", status: "UPCOMING", title: "MIDNIGHT CLOSING", desc: "Final chant & candle lantern lighting." }
];

export const merchandiseStore = [
  {
    id: "m-01",
    name: "1970S SCREENPRINTED POSTER",
    category: "ART PRINT",
    price: "₹1,299",
    image: "/media/gallery/tangy1.jpg",
    description: "Limited 100-run screenprinted poster on thick 300gsm hand-made cream cotton paper."
  },
  {
    id: "m-02",
    name: "STEPWELL SESSION 33⅓ VINYL",
    category: "RECORD",
    price: "₹2,499",
    image: "/media/gallery/tangy2.jpg",
    description: "180g heavyweight audiophile vinyl pressed from 2-track master tape."
  },
  {
    id: "m-03",
    name: "CULTURE ALIVE VINTAGE TEE",
    category: "APPAREL",
    price: "₹1,499",
    image: "/media/gallery/tangy3.jpg",
    description: "100% washed heavy cotton tee featuring vintage screen-printed Tangy chest badge."
  },
  {
    id: "m-04",
    name: "HERITAGE CERAMIC CHAI MUG",
    category: "OBJECTS",
    price: "₹699",
    image: "/media/gallery/tangy4.jpg",
    description: "Hand-thrown clay ceramic mug stamped with Tangy Hyderabad seal."
  },
  {
    id: "m-05",
    name: "CANVAS ARCHIVE TOTE BAG",
    category: "ACCESSORIES",
    price: "₹899",
    image: "/media/gallery/tangy5.jpg",
    description: "Heavy 16oz natural canvas tote bag with brass rivets and vinyl pouch."
  }
];

export const digitalPassportStamps = [
  { id: "p-1", title: "BANSILALPET STEPWELL", date: "AUG 2024", location: "HYDERABAD", stampNo: "STAMP #001", active: true },
  { id: "p-2", title: "TARAMATI BARADARI", date: "OCT 2024", location: "HYDERABAD", stampNo: "STAMP #002", active: true },
  { id: "p-3", title: "SOLSTICE RITUAL", date: "DEC 2024", location: "HYDERABAD", stampNo: "STAMP #003", active: true },
  { id: "p-4", title: "OLD CITY HAVELI", date: "FEB 2025", location: "HYDERABAD", stampNo: "STAMP #004", active: false }
];

export const gallery = [
  { id: 1, type: "img", emoji: "🏛️", label: "Stepwell Entrance", src: "/media/gallery/tangy1.jpg" },
  { id: 2, type: "img", emoji: "🎶", label: "Stage Setup", src: "/media/gallery/tangy2.jpg" },
  { id: 3, type: "img", emoji: "💜", label: "Crowd Vibes", src: "/media/gallery/tangy3.jpg" },
  { id: 4, type: "img", emoji: "🌙", label: "Night Ambience", src: "/media/gallery/tangy4.jpg" },
  { id: 5, type: "img", emoji: "🎛️", label: "DJ Booth", src: "/media/gallery/tangy5.jpg" },
  { id: 6, type: "img", emoji: "✨", label: "Light Show", src: "/media/gallery/tangy6.jpg" },
  { id: 7, type: "img", emoji: "🏺", label: "The Descent", src: "/media/gallery/tngy7.jpg" },
  { id: 8, type: "img", emoji: "🔊", label: "Sound Check", src: "/media/gallery/tangy8.jpg" },
  { id: 9, type: "img", emoji: "🕛", label: "After Hours", src: "/media/gallery/tangy9.jpg" },
  { id: 10, type: "img", emoji: "🌀", label: "Sonic Rituals", src: "/media/gallery/tangy10.jpg" }
];

export const founders = [
  {
    id: 1,
    role: "Founder & Creator",
    name: "Arjuna",
    image: "/media/arjun.png",
    bio: "Born from an obsession with underground sound and ancient spaces. Tangy Sessions exists because Arjuna refused to let music stay ordinary."
  },
  {
    id: 2,
    role: "Co-Founder",
    name: "Deepa",
    image: "/media/deepa.jpg",
    bio: "The architect of community. Deepa ensures every event feels like a homecoming, transforming historical monuments into intimate gathering spaces."
  }
];

export const diaryEntries = [
  {
    id: 1,
    title: "WHY WE PLAY INSIDE A STEPWELL",
    date: "OCT 14, 2024",
    location: "BANSILALPET STEPWELL",
    image: "/media/gallery/tangy1.jpg",
    content: "The stepwell echoes before the crowd arrives. Water dripping against 350-year-old stone, acoustic instruments humming without amplification. The air smells like rain and ancient limestone."
  },
  {
    id: 2,
    title: "MONSOON ACOUSTIC SESSIONS",
    date: "DEC 21, 2024",
    location: "TARAMATI BARADARI",
    image: "/media/gallery/tangy3.jpg",
    content: "When the lights dropped at midnight, 300 people stood completely still under rain-soaked arches. No phones in the air. Just violin ragas vibrating through granite masonry."
  },
  {
    id: 3,
    title: "BEHIND THE MICROPHONES",
    date: "JAN 05, 2025",
    location: "OLD CITY HAVELI",
    image: "/media/gallery/tangy9.jpg",
    content: "3:00 AM. The artists gathered around the ribbon microphones for an unscripted acoustic jam. Someone pulled out a tanpura, another started a vocal chant."
  },
  {
    id: 4,
    title: 'THE NIGHT THE ELECTRICITY FAILED',
    date: 'FEB 20, 2025',
    location: 'TARAMATI BARADARI',
    image: '/media/gallery/tangy4.jpg',
    excerpt: 'Halfway through the second set, the power went out. What happened next became the most-talked-about moment in Tangy history.',
    content: 'The crowd gasped. The amplifiers clicked dead. Varun Rao picked up his violin, unplugged, and began to play in the darkness. Within ten seconds, 250 people were completely silent. We collectively held our breath for forty minutes. No recordings exist.'
  },
  {
    id: 5,
    title: 'HOW WE CHOOSE OUR VENUES',
    date: 'MAR 10, 2025',
    location: 'HYDERABAD',
    image: '/media/gallery/tangy5.jpg',
    excerpt: 'We have turned down stadiums, auditoriums, and modern arenas. Here is exactly what we look for when scouting a Tangy Sessions space.',
    content: 'Three rules: the walls must be at least 100 years old. The acoustics must work without amplification. And there must be a story buried in the stone — a story the music can excavate and bring back to life.'
  },
  {
    id: 6,
    title: 'FIELD NOTES: BEFORE THE SHOW',
    date: 'APR 01, 2025',
    location: 'BANSILALPET STEPWELL',
    image: '/media/gallery/tangy9.jpg',
    excerpt: 'A documentation of the five hours before the gates open — from chai setup to microphone placement to the last acoustic checks.',
    content: '4:30 PM: Clay chai stalls are assembled at the stepwell entrance. 5:00 PM: Two ribbon microphones suspended from ropes above the ancient water basin. 6:00 PM: Sound check — we drop a glass bottle and listen to it echo for three full seconds inside the stone chamber.'
  },
  {
    id: 7,
    title: 'WHAT A TANGY TICKET ACTUALLY IS',
    date: 'MAY 15, 2025',
    location: 'HYDERABAD',
    image: '/media/gallery/tangy10.jpg',
    excerpt: 'A hand-screenprinted rectangle of 300gsm cotton paper. Not a QR code, not a PDF. Here is why we still print physical tickets.',
    content: 'A ticket is a physical artefact. You keep it. You put it on your shelf. Years later, you hold it and remember the specific echo of that stepwell on that night. That is what we are making — not events, but objects of memory that outlast the music.'
  }
];

export const archive = [
  { year: 2023, title: 'BANSILALPET SESSIONS', type: 'EVENT SERIES', venue: 'HYDERABAD', image: '/media/gallery/tangy5.jpg', description: 'Transforming a forgotten stepwell into a pulsating heart of music.' },
  { year: 2024, title: 'THE EXPANSION', type: 'MULTI-CITY', venue: 'PAN-INDIA', image: '/media/gallery/tangy8.jpg', description: 'Taking the Tangy intimacy to Goa, Mumbai, and Delhi.' }
];

export const videos = {
  hero: "/media/videos/tangy.mp4",
  frontCamera: "/media/videos/hero-bg.mp4",
  backgrounds: [
    "/media/background-video/Fresh from the archives, when @daminibhatlach performed for us, the space softened around her, w.mp4",
    "/media/background-video/Video-63639.mp4",
    "/media/videos/tangy.mp4"
  ]
};
