import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { PageCrumbs, SectionNav } from '../../components/layout/SectionNav';
import { PrivateEnquiryForm } from '../../components/private/PrivateEnquiryForm';
import { offeringBySlug } from '../../config/privateOfferings';
import { PRIVATE_DETAILS } from '../../config/privateOfferingDetails';
import { usePageMeta } from '../../hooks/usePageMeta';

// /private/gatherings | corporate | weddings | heritage — one page per private
// category (config: src/config/privateOfferings.js).
const PrivateOfferingPage = ({ slug }) => {
  const o = offeringBySlug(slug);
  const d = PRIVATE_DETAILS[slug];
  usePageMeta({ title: o.navLabel, description: o.intro });
  return (
    <div className="min-h-screen bg-[#181614] text-[#ecdcaf] font-mono selection:bg-[#EFE2C0] selection:text-[#315D73] overflow-x-hidden pt-16 pb-20 printNoise">
      <Navbar />

      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <PageCrumbs className="[&_ol]:justify-start" />

        <div className="mt-6 mb-8 text-left">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">PRIVATE SESSIONS // CATEGORY {o.number}</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf]">{o.title}</h1>
          <p className="font-mono text-xs text-[#ecdcaf]/80 mt-2 max-w-xl">{o.intro}</p>
        </div>

        <section aria-labelledby="private-suits" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#211915] border-2 border-[#ecdcaf]/40 p-5">
            <h2 id="private-suits" className="font-poster text-2xl text-[#ecdcaf] m-0 mb-3">WHAT IT SUITS</h2>
            <ul className="list-none m-0 p-0 flex flex-col gap-2 font-mono text-xs text-[#ecdcaf]/85">
              {d.suits.map((x) => <li key={x} className="flex gap-2"><span aria-hidden="true" className="text-[#d1a437]">✦</span>{x}</li>)}
            </ul>
          </div>
          <div className="bg-[#211915] border-2 border-[#ecdcaf]/40 p-5">
            <h2 className="font-poster text-2xl text-[#ecdcaf] m-0 mb-3">THE SPACE</h2>
            <p className="font-mono text-xs text-[#ecdcaf]/85 leading-relaxed m-0">{d.venue}</p>
          </div>
        </section>

        <ul className="grid grid-cols-3 gap-3 list-none m-0 p-0 mb-10" aria-label={`${o.navLabel} photographs`}>
          {d.photos.map(([src, alt]) => (
            <li key={src} className="aspect-[4/3] overflow-hidden border-2 border-[#11100C] bg-black"><img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" /></li>
          ))}
        </ul>

        <h2 className="font-poster text-3xl text-[#ecdcaf] m-0 mb-4">ENQUIRE</h2>
        <div className="bg-[#181614] border-2 border-[#ecdcaf] p-6 sm:p-10 shadow-[4px_4px_0px_#191410] text-left">
          <PrivateEnquiryForm type={o.type} {...o.form} />
        </div>

        <section aria-labelledby="private-faq" className="mt-10">
          <h2 id="private-faq" className="font-poster text-3xl text-[#ecdcaf] m-0 mb-4">QUESTIONS</h2>
          <div className="flex flex-col gap-2">
            {d.faq.map(({ q, a }) => (
              <details key={q} className="bg-[#211915] border border-[#ecdcaf]/30 p-4 group">
                <summary className="cursor-pointer font-mono text-xs font-bold uppercase tracking-wider text-[#ecdcaf] min-h-[24px]">{q}</summary>
                <p className="font-mono text-xs text-[#ecdcaf]/80 leading-relaxed mt-3 mb-0">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <SectionNav section="Private" className="mt-10" />
      </main>

      <Footer />
    </div>
  );
};

export const PrivateGatheringsPage = () => <PrivateOfferingPage slug="gatherings" />;
export const CorporateEventsPage = () => <PrivateOfferingPage slug="corporate" />;
export const WeddingsPage = () => <PrivateOfferingPage slug="weddings" />;
export const HeritageExperiencesPage = () => <PrivateOfferingPage slug="heritage" />;
