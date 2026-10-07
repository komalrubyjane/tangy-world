# 33 — How to Explain Tangy World to Someone

*Plain language, no jargon. Use this when talking to a client, a new team member or anyone non-technical.*

## The one-sentence version

Tangy World is the website and back-office for Tangy Sessions. Fans discover and book intimate live-music nights. Artists and partners apply and work with the team. The Tangy team runs every event from one control room.

## Three layers

**Tangy World has three major layers that all share one secure database.**

**First, the public website.** This is what fans see. It looks like a 1970s concert poster and a music museum: a hanging microphone you follow down the page, a diary whose pages turn as you scroll, Tangy TV, a gallery and an archive of past sessions. Each upcoming session has its own page, and that same page is where you book.

**Second, the operations system.** The Tangy team signs in to the "Admin Portal". There they create sessions, choose artists, set ticket types and prices, see bookings and payments, publish content, answer messages, manage volunteers, read reports and see a full history of who did what. A separate check-in screen runs on a phone at the door.

**Third, the artist and partner portals.** Artists, sponsors, vendors, venue hosts, crew and volunteers each get their own workspace after the team approves them. Artists mark when they are free, accept or decline performance requests, upload media and documents, and message the team. Partners see the events they are part of, send what the team needs, and see invoices.

## Everything is decided by the database

The website only *shows* things. Every rule lives in the database, and it checks every single request no matter how the request was sent. That covers who can see what, how many seats are left, what a ticket costs, and whether a payment really happened. Hiding a button on screen is never the security; the database is.

## Walk-throughs

**When a customer books a ticket…**

1. They open a session and pick a ticket type and how many people.
2. The price, including tax, is calculated by the database, not by the browser.
3. They sign in with a one-time code sent to their email.
4. They enter a name for each person coming.
5. The system holds those seats for 30 minutes and opens the Razorpay payment window.

**When payment succeeds…**

1. Two independent messages confirm it: one from the customer's browser and one sent directly by Razorpay to our server.
2. Each is checked with a secret cryptographic signature.
3. Whichever arrives first confirms the booking and creates one ticket per named person. The second does nothing extra, so nobody is double-charged or double-ticketed.
4. Even if the customer closes the browser, Razorpay's own message still confirms the booking.
5. The customer sees one QR code for their whole group. The same QR is emailed to them once email is switched on.

**When a session sells out…**

1. Fans can join a waitlist.
2. If someone cancels, or the team adds seats, the next person in line gets those seats held for two hours and is notified.
3. If they don't book in time, the seats move to the next person.

**When someone arrives at the event…**

1. Staff (or a volunteer given temporary access for that night) scan the QR on their phone.
2. The system checks the ticket is real, paid and for tonight's event.
3. It shows the list of names on the booking. Staff tick off who has arrived, and latecomers can be checked in later from the same QR.
4. Every check-in is recorded.

**When an artist applies…**

1. They fill in an 8-step application: about them, their music, experience, links, a performance video, technical needs, availability, then a final review.
2. Their answers save automatically as they go.
3. The team reviews it and can ask for more information. The artist updates and resubmits.
4. Once approved, the artist's account becomes an artist account and their portal opens.

**When the team creates an event…**

1. They set the date, venue, capacity, ticket types and the booking form.
2. Then they build the line-up. The system shows which artists are free, tentative, unavailable or already booked that day.
3. It refuses to double-book an artist, even if two team members try at the same moment.

**When an artist accepts a performance…**

1. They open the request in their portal and accept it (or decline with a reason).
2. The system checks again that they are not booked elsewhere at that time, then adds them to the line-up.
3. The team confirms, and the artist sees their call time, soundcheck, set time and fee.

**When the team publishes the event…**

1. It appears on the public site.
2. The artists already on the line-up are told they are performing.

## Honest status

The platform is fully built and tested on a local copy of the system. Going live still needs the production setup:

- loading the database into the production project
- adding the Razorpay and email service keys
- setting up the email sending schedule
- pointing the website at the real domain

None of that is done yet.

Two things fans might expect are not built yet:

- reminder emails to ticket holders before the event
- automatic messages to ticket holders if an event is cancelled

The public "Tangy AI" assistant answers from a fixed list of questions rather than a real AI model, and hands over to a human when it can't help.
