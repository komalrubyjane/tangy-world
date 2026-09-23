import { HOME_CHAPTERS } from '../../data/homeChapters';

// Back cover: umber, the masthead once more, an index of the chapters and a
// colophon. Bottom padding clears the fixed dock (--dock-space).
export const Footer = () => {
  return (
    <footer className="relative w-full theme-footer border-t-[3px] border-double border-[#EFE2C0]/20 pt-16 md:pt-24 pb-[calc(var(--dock-space)+2rem)]">
      <div className="t-container">
        <p className="t-label text-[#C89D35] m-0">Hyderabad / India // Est. 2016</p>
        <h2 className="font-display uppercase text-[#EFE2C0] leading-[0.85] mt-4 mb-0" style={{ fontSize: 'clamp(3rem, 12vw, 10rem)' }}>
          Tangy Sessions™
        </h2>
        <p className="t-label text-[#EFE2C0]/70 mt-5 mb-0">People • Music • Places • Stories</p>

        <div className="t-grid mt-14 pt-10 border-t border-[#EFE2C0]/15 gap-y-10">
          <nav aria-label="Archive index" className="col-span-4 md:col-span-4 lg:col-span-6">
            <p className="t-meta text-[#C89D35] m-0 mb-4">Archive index</p>
            <ol className="list-none m-0 p-0 grid grid-cols-2 gap-x-6 gap-y-2">
              {HOME_CHAPTERS.map((c, i) => (
                <li key={c.id}>
                  <a href={`/#${c.id}`} className="font-mono text-xs uppercase tracking-[0.14em] text-[#EFE2C0]/85 hover:text-[#C89D35]">
                    <span className="text-[#EFE2C0]/45 mr-2">{String(i + 1).padStart(2, '0')}</span>{c.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="col-span-4 md:col-span-4 lg:col-span-4 lg:col-start-9">
            <p className="t-meta text-[#C89D35] m-0 mb-4">Contact & credits</p>
            <ul className="list-none m-0 p-0 flex flex-col gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[#EFE2C0]/85">
              <li>Archive 2016 — 2026</li>
              <li><a href="mailto:hello@tangysessions.com" className="hover:text-[#C89D35] normal-case tracking-[0.06em]">hello@tangysessions.com</a></li>
              <li>Hyderabad, Telangana</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-[#EFE2C0]/15 flex flex-col md:flex-row justify-between gap-2 t-meta text-[#EFE2C0]/55">
          <span>© 2016–2026 Tangy Sessions. All rights reserved.</span>
          <span>An interactive physical music archive box</span>
        </div>
      </div>
    </footer>
  );
};
