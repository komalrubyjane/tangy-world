import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ContactEnquiryForm } from '../components/contact/ContactEnquiryForm';
import { SectionNav } from '../components/layout/SectionNav';
import { usePageMeta } from '../hooks/usePageMeta';

export const ContactPage = () => {
  usePageMeta({ title: 'Contact', description: 'Write to Tangy Sessions — questions, press, collaborations and venues.' });
  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono selection:bg-[#C89D35] selection:text-[#11100C] overflow-x-hidden t-quiet">
      <Navbar />

      {/* PAGE HERO */}
      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/40">

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.04]">
          <span className="font-condensed text-[16vw] leading-none text-[#E7D5A4] font-bold uppercase">CONTACT</span>
        </div>

        <div className="relative z-10">
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 block">
            DISPATCH & CORRESPONDENCE // TANGY SESSIONS
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-9xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            GET IN<br/>TOUCH
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            REACH OUT FOR INQUIRIES, HERITAGE VENUE COLLABORATIONS, PRESS DISPATCHES, AND GENERAL CORRESPONDENCE.
          </p>
          <SectionNav className="mt-6" />
        </div>
      </section>

      {/* CONTACT INFO CARDS & LOCATION MAP */}
      <section id="location" className="py-8 sm:py-12 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-14">
          {[
            {
              icon: '✉',
              label: 'EMAIL DISPATCH',
              value: 'hello@tangysessions.com',
              sub: 'WE REPLY WITHIN 48 HOURS',
              href: 'mailto:hello@tangysessions.com'
            },
            {
              icon: '📍',
              label: 'LOCATION & MAP',
              value: 'Hyderabad · Telangana · India',
              sub: 'BANSILALPET / TARAMATI / HAVELI',
              href: null
            },
            {
              icon: '📷',
              label: 'INSTAGRAM',
              value: '@tangysessions',
              sub: 'DMs OPEN FOR INQUIRIES',
              href: 'https://instagram.com/tangysessions'
            }
          ].map((card, i) => (
            <div
              key={i}
              className={`bg-[#EFE2C0] paperTexture text-[#11100C] border-2 border-[#11100C] p-4 sm:p-6 shadow-[4px_4px_0px_#11100C] sm:shadow-[4px_4px_0px_#11100C] ${card.href ? 'cursor-pointer hover:-translate-y-1 transition-transform' : ''}`}
              onClick={() => card.href && window.open(card.href, '_blank', 'noopener,noreferrer')}
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className="font-mono text-[9px] font-bold text-[#B94717] uppercase tracking-wider mb-1">{card.label}</div>
              <div className="font-mono text-xs sm:text-sm font-bold text-[#11100C] mb-1">{card.value}</div>
              <div className="font-mono text-[8px] sm:text-[9px] text-[#11100C]/70 uppercase">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* MAP LOCATION DISPLAY */}
        <div className="bg-[#211915] border-2 border-[#C99A2E] p-4 sm:p-8 mb-10 text-center">
          <span className="font-mono text-[9px] text-[#C99A2E] tracking-[0.3em] uppercase block mb-2 font-bold">
            PRIMARY HERITAGE SANCTUARY
          </span>
          <h3 className="display text-2xl sm:text-4xl text-[#E7D5A4] mb-2">BANSILALPET STEPWELL</h3>
          <p className="font-mono text-xs text-[#E7D5A4]/70">Bansilalpet, Secunderabad, Hyderabad, Telangana 500003</p>
        </div>

        {/* CONTACT FORM / EMAIL DISPATCH */}
        <div id="dispatch" className="bg-[#EFE2C0] paperTexture text-[#11100C] p-5 sm:p-10 md:p-14 border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] sm:shadow-[4px_4px_0px_#11100C] relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center font-mono text-[9px] sm:text-xs font-bold text-[#B94717] border-b-2 border-[#11100C] pb-3 mb-5 sm:mb-6 uppercase gap-1">
            <span>TANGY SESSIONS // CORRESPONDENCE FORM</span>
            <span className="hidden sm:block">DISPATCH DESK · HYDERABAD</span>
          </div>

          <ContactEnquiryForm />
        </div>
      </section>

      {/* SOCIAL LINKS STRIP */}
      <section id="instagram" className="bg-[#211915] t-quiet border-t-4 border-[#C99A2E]/30 py-10 sm:py-12 px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mb-4">
          FIND US ONLINE // INSTAGRAM &amp; MEDIA DISPATCHES
        </span>
        <div className="flex justify-center flex-wrap gap-3 sm:gap-4">
          {[
            { label: 'INSTAGRAM: @TANGYSESSIONS', href: 'https://instagram.com/tangysessions', icon: '📷' },
            { label: 'YOUTUBE ARCHIVE', href: null, icon: '🎬' },
            { label: 'SPOTIFY PLAYLIST', href: null, icon: '🎵' },
            { label: 'EMAIL DESK', href: 'mailto:hello@tangysessions.com', icon: '✉' }
          ].map((s) => (
            s.href ? (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#EFE2C0] text-[#11100C] font-mono text-[10px] sm:text-xs font-bold uppercase px-4 py-2.5 border-2 border-[#11100C] hover:bg-[#C89D35] hover:border-[#C99A2E] transition-colors shadow-[3px_3px_0px_#11100C]"
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </a>
            ) : (
              <span
                key={s.label}
                title="Channel launching soon"
                className="flex items-center gap-2 bg-[#EFE2C0]/40 text-[#11100C]/70 font-mono text-[10px] sm:text-xs font-bold uppercase px-4 py-2.5 border-2 border-[#11100C]/30 cursor-default select-none"
              >
                <span className="opacity-60">{s.icon}</span>
                <span>{s.label}</span>
                <span className="text-[8px] font-normal normal-case opacity-70">(soon)</span>
              </span>
            )
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};
