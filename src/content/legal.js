// Legal pages — DRAFTS. Versioned here so changes are reviewable in git.
//
// These describe only how the platform actually works (what is collected,
// which processors are involved, how bookings and the waitlist behave).
// Every business or legal decision is left as an explicit
// "[To be confirmed by Tangy]" placeholder. They MUST be reviewed and
// completed by the business and a lawyer before launch; the pages show a
// visible draft notice while `status` is 'draft'.
//
// To publish a reviewed version: replace the placeholders, bump `version`,
// set `updated`, and set status: 'final'.

const TBC = '[To be confirmed by Tangy]';

export const LEGAL = {
  terms: {
    path: '/terms',
    title: 'Terms of use',
    version: '0.1-draft',
    updated: '2026-09-30',
    status: 'draft',
    sections: [
      ['Who we are', [`Tangy Sessions (“Tangy”, “we”) runs this website and the events booked through it. Legal entity name, registered address and contact for legal notices: ${TBC}.`]],
      ['Your account', [
        'You sign in with a one-time code sent to your email. Keep access to that inbox secure; anyone who can read it can sign in as you.',
        'Choosing a path such as artist, sponsor, vendor, venue host, crew or volunteer only starts an application. It does not grant that role; the Tangy team reviews every application.',
      ]],
      ['Booking tickets', [
        'Prices, ticket types and taxes are shown before you pay and are calculated by our server. The amount charged is the amount shown at review.',
        'Seats are held for a short time while you pay. If payment is not completed in that time, the seats are released.',
        'Each booking has one QR code covering every named attendee. Staff check people in by name at the entrance.',
        `Entry conditions (age limits, ID requirements, prohibited items, right of admission): ${TBC}.`,
      ]],
      ['Waitlist', [
        'If a session is sold out you may join its waitlist. Released seats are offered in waitlist order and held for a limited time. An offer is not a booking until you complete checkout.',
      ]],
      ['Changes and cancellations by Tangy', [`What happens if Tangy reschedules or cancels a session: ${TBC}. See also the refund policy.`]],
      ['Content you send us', ['Messages, enquiries and applications you send are read by the Tangy team to respond to you. Messages are not end-to-end encrypted.']],
      ['Acceptable use', [`Rules on misuse of the site, resale of tickets and conduct at events: ${TBC}.`]],
      ['Liability, governing law and disputes', [`${TBC} — to be written with legal advice.`]],
      ['Contact', ['Questions about these terms: hello@tangysessions.com.']],
    ],
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy notice',
    version: '0.1-draft',
    updated: '2026-09-30',
    status: 'draft',
    sections: [
      ['What we collect', [
        'Account: your email address, and the name and phone number you give us.',
        'Bookings: the names of everyone in a booking, your contact details, answers to the session’s booking questions (for example seating needs), optional Instagram handle, notes and collaboration interests you choose to share.',
        'Payments: Razorpay processes card and UPI payments. We receive the payment reference and status; we never receive or store your card or UPI details.',
        'Attendance: when each attendee is checked in, and by which staff member.',
        'Applications and enquiries: what you submit in those forms, linked to your account.',
        'Messages: conversations between partners (artists, sponsors, vendors, venue hosts) and the Tangy team.',
      ]],
      ['Who can see it', [
        'You can see your own bookings, applications, messages and notifications.',
        'The Tangy team sees what it needs for its role, enforced by the database: for example event staff see attendee names for their events but not booking answers or contact details.',
        'Messages are not end-to-end encrypted: the Tangy team can read partner conversations.',
      ]],
      ['Service providers', [
        'Supabase (database, authentication and file storage), Razorpay (payments), and an email delivery provider for notifications and tickets.',
        `Where these providers store data, and the transfer safeguards that apply: ${TBC}.`,
      ]],
      ['Emails', ['We send booking confirmations, waitlist offers, application updates and notifications you can control in your notification settings. Message emails do not include the message text.']],
      ['Cookies and local storage', ['The site stores your sign-in session and a few display preferences in your browser. It does not use advertising cookies.']],
      ['How long we keep data', [`Retention periods for bookings, attendance, applications and messages: ${TBC}.`]],
      ['Your rights', [`How to request access, correction or deletion, and the grievance officer / data protection contact required by applicable Indian law: ${TBC}.`]],
      ['Contact', ['Privacy questions: hello@tangysessions.com.']],
    ],
  },
  refunds: {
    path: '/refund-policy',
    title: 'Refund & cancellation policy',
    version: '0.1-draft',
    updated: '2026-09-30',
    status: 'draft',
    sections: [
      ['Cancelling a booking', [`Whether and until when customers can cancel, and what is refunded: ${TBC}.`]],
      ['If Tangy cancels or reschedules', [`Refund or transfer options when a session is cancelled or moved: ${TBC}.`]],
      ['Payments that can’t be matched', [
        'Occasionally a payment arrives after your seat hold ended, for a cancelled booking, or for a different amount than the booking. Such payments are never silently accepted into an over-sold session: our finance team is alerted and will either confirm your seats or refund you.',
        `Target time for these reviews and refunds: ${TBC}.`,
      ]],
      ['How refunds are paid', ['Refunds go back to the original payment method through Razorpay. The time it takes to reach your account depends on your bank.']],
      ['Contact', ['For a cancellation or refund request, write to hello@tangysessions.com with your booking ID.']],
    ],
  },
};
