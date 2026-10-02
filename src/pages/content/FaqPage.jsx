import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { usePageMeta } from '../../hooks/usePageMeta';

// Answers describe how the platform actually behaves. Legal policies
// (terms, privacy, refunds) are the business's to write — this page points
// people to the team rather than inventing them.
const FAQ = [
  ['Booking', [
    ['How do I book?', 'Open a session, sign in with a one-time code sent to your email, choose a ticket type and the number of people, enter each attendee’s name, and pay securely through Razorpay. Your booking is confirmed only after the payment is verified.'],
    ['What do I show at the entrance?', 'One QR code covers your whole booking. It’s in your Passport (profile) and in your confirmation email. Staff check each person in by name, so your group can arrive separately.'],
    ['How long is my place held while I pay?', 'Seats are held for a short time while you complete payment. If payment isn’t completed in that time, the seats are released for others.'],
    ['Where do prices come from?', 'Each session lists its ticket types and prices; the total you see at review (including GST) is calculated by Tangy’s server and is exactly what you are charged.'],
  ]],
  ['Waitlist', [
    ['A session is sold out — what now?', 'Sign in and join the session’s waitlist. When seats are released they are offered in waitlist order.'],
    ['What happens when seats are offered to me?', 'We hold them for you for a limited time and notify you. Open the session and complete your booking before the hold ends; otherwise they pass to the next person in line.'],
    ['Can I leave the waitlist?', 'Yes — from the session page or your Passport, at any time.'],
  ]],
  ['Applications & enquiries', [
    ['Does choosing “Artist”, “Sponsor” or another path give me that role?', 'No. Choosing a path only starts an application. The Tangy team reviews it, and you’ll be notified of the decision.'],
    ['Why do I need to sign in to send an enquiry?', 'It links your message or application to your account, so you can follow its status and we can reply to you reliably.'],
  ]],
  ['Payments & refunds', [
    ['Is my card or UPI information stored by Tangy?', 'No. Payments are handled by Razorpay; your payment details never reach Tangy’s servers.'],
    ['I paid but my booking isn’t confirmed.', 'Occasionally a payment arrives after the hold ended or can’t be matched automatically. Our team is alerted and will either confirm your seats or refund you. Contact us with your payment reference if you’re unsure.'],
    ['Cancellations and refunds', 'Please contact the Tangy team for help with a cancellation or refund request.'],
  ]],
];

export const FaqPage = () => {
  usePageMeta({ title: 'FAQ', description: 'How booking, the waitlist, applications and payments work at Tangy Sessions.' });
  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-body t-quiet">
      <Navbar />
      <header className="pt-28 pb-10 px-4 sm:px-6 max-w-4xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <span className="text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mb-3">HELP DESK</span>
        <h1 className="display text-5xl sm:text-7xl uppercase m-0">FAQ</h1>
      </header>
      <main className="py-10 px-4 sm:px-6 max-w-3xl mx-auto flex flex-col gap-8">
        {FAQ.map(([section, items]) => (
          <section key={section} aria-labelledby={`faq-${section}`}>
            <h2 id={`faq-${section}`} className="font-condensed text-xl uppercase text-[#C99A2E] mb-3">{section}</h2>
            <div className="flex flex-col gap-2">
              {items.map(([q, a]) => (
                <details key={q} className="bg-[#11100C] border border-[#C99A2E]/40 open:border-[#C99A2E]">
                  <summary className="cursor-pointer p-4 min-h-[44px] font-bold text-sm">{q}</summary>
                  <p className="px-4 pb-4 m-0 text-sm leading-relaxed text-[#E7D5A4]/85">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <p className="text-xs text-[#E7D5A4]/70 m-0">Still stuck? <Link to="/contact" className="underline font-bold">Contact the team</Link>.</p>
      </main>
      <Footer />
    </div>
  );
};
