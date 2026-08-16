import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const InstagramPage = () => {
  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/contact" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO CONTACT</a>
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            FIND US ONLINE
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-8xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            INSTAGRAM
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            SESSION ANNOUNCEMENTS, ARCHIVE DROPS, AND DMs OPEN FOR INQUIRIES.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-8 sm:p-12 shadow-[8px_8px_0px_#11100C]">
          <div className="text-4xl mb-4">📷</div>
          <h2 className="display text-3xl sm:text-4xl mb-2">@TANGYSESSIONS</h2>
          <p className="font-mono text-xs text-[#11100C]/70 uppercase tracking-wider mb-6">
            DMs open for inquiries. New session drops posted first here.
          </p>
          <a
            href="https://instagram.com/tangysessions"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#11100C] text-[#E7D5A4] font-mono text-xs font-bold px-6 py-3 uppercase tracking-widest hover:bg-[#B94717] transition-colors border-2 border-[#11100C] shadow-[4px_4px_0px_#B94717]"
          >
            FOLLOW ON INSTAGRAM →
          </a>
        </div>

        <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mt-8">
          {[
            { label: 'YOUTUBE ARCHIVE', icon: '🎬' },
            { label: 'SPOTIFY PLAYLIST', icon: '🎵' },
          ].map((s) => (
            <span key={s.label} title="Channel launching soon" className="flex items-center gap-2 bg-[#E7D5A4]/20 text-[#E7D5A4]/50 font-mono text-[10px] sm:text-xs font-bold uppercase px-4 py-2.5 border-2 border-[#E7D5A4]/20 cursor-default select-none">
              <span className="opacity-60">{s.icon}</span>
              <span>{s.label}</span>
              <span className="text-[8px] font-normal normal-case opacity-70">(soon)</span>
            </span>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};
