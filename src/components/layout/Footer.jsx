export const Footer = () => {
  return (
    <footer className="relative w-full bg-[#5A120D] text-[#E7D5A4] border-t-8 border-[#11100C] py-16 px-8 md:px-16">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-multiply pointer-events-none" />

      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
        <div>
          <p className="font-mono text-tangy-mustard text-[10px] tracking-[0.3em] font-bold uppercase mb-2">HYDERABAD / INDIA // EST. 2016</p>
          <h2 className="display text-5xl md:text-7xl text-[#E7D5A4] ink-bleed">TANGY SESSIONS™</h2>
          <p className="font-mono text-xs text-[#E7D5A4]/70 mt-2 uppercase">MUSIC • PEOPLE • PLACES • STORIES</p>
        </div>

        <div className="flex flex-col md:flex-row gap-10 font-mono text-xs tracking-widest text-[#E7D5A4]">
          <div className="flex flex-col gap-2">
            <span className="text-tangy-mustard font-bold uppercase">NAVIGATION</span>
            <a href="#hero" className="hover:text-tangy-mustard transition-colors">01 COVER POSTER</a>
            <a href="#manifesto" className="hover:text-tangy-mustard transition-colors">02 MANIFESTO</a>
            <a href="#sessions" className="hover:text-tangy-mustard transition-colors">03 SESSIONS</a>
            <a href="#artists" className="hover:text-tangy-mustard transition-colors">04 VINYL ROSTER</a>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-tangy-mustard font-bold uppercase">ARCHIVE</span>
            <span>ARCHIVE 2016 — 2026</span>
            <span>HELLO@TANGYSESSIONS.COM</span>
            <span>HYDERABAD, TELANGANA</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto mt-12 pt-6 border-t-2 border-[#E7D5A4]/20 flex flex-col md:flex-row justify-between font-mono text-[9px] text-[#E7D5A4]/70 relative z-10 uppercase">
        <span>© 2016–2026 TANGY SESSIONS. ALL RIGHTS RESERVED.</span>
        <span>AN INTERACTIVE SCREEN-PRINTED MUSIC ARCHIVE</span>
      </div>
    </footer>
  );
};
