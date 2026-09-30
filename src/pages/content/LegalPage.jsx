import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { usePageMeta } from '../../hooks/usePageMeta';
import { LEGAL } from '../../content/legal';

// /terms, /privacy, /refund-policy — versioned text from src/content/legal.js.
// While a document is a draft the page says so, prominently, and asks search
// engines not to index it.
export const LegalPage = ({ doc }) => {
  const d = LEGAL[doc];
  const draft = d.status !== 'final';
  usePageMeta({ title: d.title, description: `${d.title} for Tangy Sessions.`, noindex: draft });
  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono printNoise">
      <Navbar />
      <main className="pt-28 pb-16 px-4 sm:px-6 max-w-3xl mx-auto" data-legal={doc}>
        <h1 className="display text-4xl sm:text-6xl uppercase m-0">{d.title}</h1>
        <p className="text-[11px] text-[#E7D5A4]/60 mt-3 mb-0">Version {d.version} · last updated {d.updated}</p>
        {draft && (
          <div role="note" className="mt-6 p-4 border-2 border-[#f5b544] bg-[#f5b544]/10 text-[#f5d49a] text-sm leading-relaxed" data-legal-draft>
            <strong className="block uppercase tracking-widest text-xs mb-1">Draft — not yet reviewed</strong>
            This document is a working draft awaiting review by Tangy and its legal advisers. It is not final and is not legal advice.
            Items marked “[To be confirmed by Tangy]” have not been decided yet.
          </div>
        )}
        <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed">
          {d.sections.map(([heading, paras]) => (
            <section key={heading} aria-labelledby={`legal-${heading}`}>
              <h2 id={`legal-${heading}`} className="font-condensed text-xl uppercase text-[#C99A2E] mb-2">{heading}</h2>
              {paras.map((para, i) => <p key={i} className="m-0 mb-2 text-[#E7D5A4]/85">{para}</p>)}
            </section>
          ))}
        </div>
        <nav aria-label="Other policies" className="mt-12 pt-6 border-t border-[#C99A2E]/30 flex flex-wrap gap-4 text-xs uppercase tracking-widest">
          {Object.entries(LEGAL).filter(([k]) => k !== doc).map(([k, v]) => <Link key={k} to={v.path} className="underline">{v.title}</Link>)}
          <Link to="/faq" className="underline">FAQ</Link>
        </nav>
      </main>
      <Footer />
    </div>
  );
};

export const TermsPage = () => <LegalPage doc="terms" />;
export const PrivacyPage = () => <LegalPage doc="privacy" />;
export const RefundPolicyPage = () => <LegalPage doc="refunds" />;
