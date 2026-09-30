import { Page } from '../ui';
import { WaitlistSection } from '../sections/WaitlistSection';

// /admin-portal/waitlist — the server-authoritative waitlist (0027).
export default function WaitlistPage() {
  return (
    <Page title="Waitlist" subtitle="Who is waiting for sold-out sessions, who holds an offer and until when. Offers and order are decided by the database.">
      <div className="font-mono"><WaitlistSection /></div>
    </Page>
  );
}
