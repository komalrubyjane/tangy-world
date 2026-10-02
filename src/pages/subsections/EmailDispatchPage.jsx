import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ContactEnquiryForm } from '../../components/contact/ContactEnquiryForm';
import { PageCrumbs, SectionNav } from '../../components/layout/SectionNav';
import { usePageMeta } from '../../hooks/usePageMeta';

export const EmailDispatchPage = () => {
  usePageMeta({ title: 'Email Dispatch', description: 'Write to the Tangy Sessions dispatch desk — questions, press, collaborations and venues.' });
  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono selection:bg-[#C89D35] selection:text-[#11100C] overflow-x-hidden printNoise">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="relative z-10">
          <PageCrumbs />
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            DISPATCH DESK // HYDERABAD
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-8xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            EMAIL<br/>DISPATCH
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            WRITE TO US DIRECTLY. WE REPLY TO EVERY DISPATCH WITHIN 48 HOURS.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-20 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-[#EFE2C0] paperTexture text-[#11100C] p-5 sm:p-10 md:p-14 border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] sm:shadow-[4px_4px_0px_#11100C]">
          <ContactEnquiryForm />
        </div>
      </section>

      <SectionNav className="py-10 px-4" />

      <Footer />
    </div>
  );
};
