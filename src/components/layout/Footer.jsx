export const Footer = () => {
  return (
    <footer className="relative bg-[#2D1B13] text-[#D9C6A0] font-mono text-[10px] md:text-xs tracking-widest border-t-4 border-[#9E6D35]/40 px-6 md:px-12 py-10 z-20">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* LEFT: COPYRIGHT & HERITAGE ARCHIVE NOTE */}
        <div className="flex flex-col gap-1 text-center md:text-left">
          <span className="font-poster text-lg md:text-xl text-[#D9C6A0] tracking-wider uppercase">TANGY SESSIONS</span>
          <span className="opacity-70">© 2016–2026 TANGY SESSIONS. ALL RIGHTS RESERVED.</span>
          <span className="text-[#9E6D35] font-bold">HYDERABAD HERITAGE MUSIC ARCHIVE // 33⅓ RPM</span>
        </div>

        {/* CENTER: QUICK LINKS */}
        <div className="flex flex-wrap justify-center gap-4 text-[10px] uppercase font-bold">
          <a href="/about" className="hover:text-[#9E6D35] transition-colors">ABOUT</a>
          <span>·</span>
          <a href="/sessions" className="hover:text-[#9E6D35] transition-colors">SESSIONS</a>
          <span>·</span>
          <a href="/archive" className="hover:text-[#9E6D35] transition-colors">ARCHIVE</a>
          <span>·</span>
          <a href="/apply/crew" className="hover:text-[#9E6D35] transition-colors">CREW</a>
          <span>·</span>
          <a href="/private-sessions" className="hover:text-[#9E6D35] transition-colors">PRIVATE</a>
          <span>·</span>
          <a href="/blogs" className="hover:text-[#9E6D35] transition-colors">DIARY</a>
          <span>·</span>
          <a href="/contact" className="hover:text-[#9E6D35] transition-colors">CONTACT</a>
        </div>

        {/* RIGHT: CREDITS & DISPATCH */}
        <div className="text-center md:text-right opacity-70">
          <p>PRINTED ON RECYCLED ARCHIVAL PAPER</p>
          <p className="text-[#9E6D35]">HANDCRAFTED IN HYDERABAD</p>
        </div>

      </div>
    </footer>
  );
};
