// The four private-session categories. Each has its own page
// (/private/gatherings, /private/corporate, /private/weddings,
// /private/heritage) rendered by PrivateOfferingPage, and a card on the
// /private-sessions overview. Copy and form options are unchanged from the
// four pages they replace.
export const PRIVATE_OFFERINGS = [
  {
    slug: 'gatherings', type: 'private_gathering', number: '01', title: 'PRIVATE GATHERINGS', navLabel: 'Private Gatherings',
    summary: 'Intimate acoustic soundscapes hosted inside private courtyards, living rooms, and rooftops.',
    intro: 'Intimate acoustic soundscapes hosted inside private courtyards, living rooms, and rooftops — three to five artists, portable vintage sound, curated for small guest lists.',
    form: {
      guestOptions: [['20-50', '20 - 50 GUESTS'], ['50-100', '50 - 100 GUESTS'], ['100+', '100+ GUESTS']], defaultGuests: '20-50',
      venuePlaceholder: 'EVENT VENUE / LOCATION *', messagePlaceholder: 'DETAILS ABOUT YOUR GATHERING & PREFERRED MUSIC TYPE...', cta: 'REQUEST A PRIVATE GATHERING →',
    },
  },
  {
    slug: 'corporate', type: 'corporate_event', number: '02', title: 'CORPORATE EVENTS', navLabel: 'Corporate Events',
    summary: 'Unplugged music curation for brand launches, executive retreats, and private dinners.',
    intro: 'Unplugged music curation for brand launches, executive retreats, and private dinners — a full resident collective with a dedicated sound engineer for larger corporate footprints.',
    form: {
      guestOptions: [['50-100', '50 - 100 GUESTS'], ['100-200', '100 - 200 GUESTS'], ['200+', '200+ GUESTS']], defaultGuests: '50-100',
      budgetOptions: ['₹100,000 - ₹200,000', '₹200,000 - ₹400,000', '₹400,000+'],
      venuePlaceholder: 'COMPANY / VENUE / LOCATION *', messagePlaceholder: 'DETAILS ABOUT YOUR CORPORATE EVENT...', cta: 'REQUEST A CORPORATE SESSION →',
    },
  },
  {
    slug: 'weddings', type: 'wedding', number: '03', title: 'WEDDINGS & RITUALS', navLabel: 'Weddings',
    summary: 'Acoustic Sufi and Carnatic fusion for intimate wedding gatherings and ceremonies.',
    intro: 'Acoustic Sufi and Carnatic fusion curated for intimate wedding gatherings and ceremonies — free from harsh digital noise and commercial playlists.',
    form: {
      guestOptions: [['50-100', '50 - 100 GUESTS'], ['100-200', '100 - 200 GUESTS'], ['200+', '200+ GUESTS']], defaultGuests: '100-200',
      venuePlaceholder: 'WEDDING VENUE / LOCATION *', messagePlaceholder: 'TELL US ABOUT YOUR CEREMONY & PREFERRED MUSIC TYPE...', cta: 'REQUEST A WEDDING SESSION →',
    },
  },
  {
    slug: 'heritage', type: 'heritage_experience', number: '04', title: 'HERITAGE EXPERIENCES', navLabel: 'Heritage Experiences',
    summary: 'Transform historic palaces, stepwells, and havelis into private music sanctuaries.',
    intro: 'Transform your historic palace, stepwell, or haveli into a private music sanctuary — full acoustic structural assessment included, with zero structural impact guaranteed.',
    form: {
      guestOptions: [['20-50', '20 - 50 GUESTS'], ['50-100', '50 - 100 GUESTS'], ['100+', '100+ GUESTS']], defaultGuests: '50-100',
      venuePlaceholder: 'HERITAGE PROPERTY / LOCATION *', messagePlaceholder: 'TELL US ABOUT THE HERITAGE PROPERTY & YOUR VISION...', cta: 'REQUEST A HERITAGE SESSION →',
    },
  },
];

export const offeringBySlug = (slug) => PRIVATE_OFFERINGS.find((o) => o.slug === slug);
