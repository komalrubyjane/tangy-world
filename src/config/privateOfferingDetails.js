// Page content for the four private-session categories (/private/<slug>):
// what each suits, the venue options, a few photographs and an FAQ.
// Describes the offer only — no client names, no claims of past bookings.
// Photographs are the site's own /media/gallery event photos (not the posters,
// which carry performers' names and dates).
const COMMON_FAQ = [
  { q: 'How far ahead should we enquire?', a: 'Eight weeks is comfortable; four weeks is usually possible for smaller gatherings.' },
  { q: 'Is the music amplified?', a: 'Acoustic by default. A small, warm sound system is added only when the space needs it.' },
  { q: 'What happens after we enquire?', a: 'A coordinator replies within 48 hours with questions about the date, the space and the music you have in mind, then a written proposal.' },
];

export const PRIVATE_DETAILS = {
  gatherings: {
    suits: ['Birthdays and anniversaries at home', 'House concerts for 20–100 guests', 'Rooftop and courtyard evenings', 'Listening sessions for friends of a cause'],
    venue: 'Your home, rooftop or courtyard — or one of our partner heritage spaces. We visit first to plan seating and sound.',
    photos: [['/media/gallery/tangy4.jpg', 'A stepwell venue lit for an evening session'], ['/media/gallery/tangy9.jpg', 'A guitarist and a saxophonist performing under white drapes'], ['/media/gallery/tangy6.jpg', 'Two dancers seated on stepwell stone above the audience']],
    faq: [{ q: 'Can it be a surprise?', a: 'Yes — we can arrive, set up and start without the guest of honour knowing.' }, ...COMMON_FAQ],
  },
  corporate: {
    suits: ['Brand and product launches', 'Leadership offsites and retreats', 'Client dinners', 'Team evenings after a conference'],
    venue: 'Hotel lawns, offices, or a heritage venue we book for you. A sound engineer comes with every corporate session.',
    photos: [['/media/gallery/tangy4.jpg', 'A stepwell venue lit for an evening session'], ['/media/gallery/tangy3.jpg', 'A collage of moments from a Tangy evening'], ['/media/gallery/tangy8.jpg', 'A vocalist in a white kurta performing with tabla']],
    faq: [{ q: 'Can you work with our brand guidelines?', a: 'Yes — printed programmes and signage can follow your guidelines; the music stays ours.' }, { q: 'Do you provide invoices with GST?', a: 'Yes, with a written quote first.' }, ...COMMON_FAQ],
  },
  weddings: {
    suits: ['Sangeet and mehendi evenings', 'Sufi nights before the wedding', 'Ceremony music', 'Intimate receptions'],
    venue: 'Family homes, banquet lawns or heritage venues. We plan around the ceremony timings and the family’s customs.',
    photos: [['/media/gallery/tangy3.jpg', 'A collage of moments from a Tangy evening'], ['/media/gallery/tangy10.jpg', 'A violinist performing for an audience seated on the steps'], ['/media/gallery/tangy5.jpg', 'Flower petals floating in a stepwell pool']],
    faq: [{ q: 'Can we choose the songs?', a: 'Yes — send a list of family favourites and we will build the set around them.' }, ...COMMON_FAQ],
  },
  heritage: {
    suits: ['Palace and haveli dinners', 'Stepwell evenings', 'Cultural tours with a live set', 'Private restoration celebrations'],
    venue: 'Historic palaces, stepwells and havelis. Every heritage booking starts with a structural and acoustic walk-through; nothing is fixed to the walls.',
    photos: [['/media/gallery/tangy5.jpg', 'Flower petals floating in a stepwell pool'], ['/media/gallery/tngy7.jpg', 'Musicians performing on the stone steps of a stepwell'], ['/media/gallery/tangy6.jpg', 'Two dancers seated on stepwell stone above the audience']],
    faq: [{ q: 'Who handles venue permissions?', a: 'We help with the paperwork; permission is granted by the venue’s owner or trust.' }, ...COMMON_FAQ],
  },
};
