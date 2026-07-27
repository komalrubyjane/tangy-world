import clsx from 'clsx';

export const MenuOverlay = ({ isOpen, onClose }) => {
  const links = [
    { href: '#opening', label: '01 — WORLD' },
    { href: '#manifesto', label: '02 — MANIFESTO' },
    { href: '#tunnel', label: '03 — HOW IT STARTED' },
    { href: '#artists', label: '04 — ARTISTS' },
    { href: '#closing', label: '05 — CONTACT' },
  ];

  return (
    <nav 
      id="menuOverlay"
      className={clsx(
        "fixed inset-0 z-[65] bg-tangy-black flex flex-col justify-center px-[clamp(20px,6vw,80px)]",
        "transition-[clip-path] duration-700 ease-[cubic-bezier(.77,0,.18,1)]",
        isOpen ? "[clip-path:inset(0_0%_0_0)]" : "[clip-path:inset(0_100%_0_0)]"
      )}
      aria-hidden={!isOpen}
    >
      <ol className="list-none m-0 mb-12 p-0">
        {links.map((link, idx) => (
          <li key={idx} className="border-t border-[rgba(231,223,181,.15)] last:border-b">
            <a 
              href={link.href} 
              className="block py-[18px] px-1 font-display font-semibold text-[clamp(28px,5vw,56px)] text-tangy-paper transition-all duration-300 hover:text-tangy-cream hover:pl-5 focus-visible:text-tangy-cream focus-visible:pl-5"
              onClick={() => onClose()}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ol>
      <div className="flex gap-7 font-mono text-[11px] tracking-[.2em]">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-tangy-gold">INSTAGRAM</a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-tangy-gold">YOUTUBE</a>
        <a href="#closing" onClick={() => onClose()} className="text-tangy-gold">CONTACT</a>
      </div>
    </nav>
  );
};
