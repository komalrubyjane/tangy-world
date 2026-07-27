import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useCursor } from '../../hooks/useCursor';

export const Navigation = ({ isLoaded, isMenuOpen, toggleMenu }) => {
  const { setLabel, setActive } = useCursor();

  return (
    <header 
      className={clsx(
        "fixed top-0 left-0 right-0 z-[70] flex items-center justify-between py-[26px] px-[clamp(20px,4vw,56px)] font-mono text-[12px] tracking-[.25em]",
        "transition-opacity duration-600 ease-out",
        isLoaded ? "opacity-100" : "opacity-0"
      )}
    >
      <a href="#opening" className="text-tangy-cream">TANGY WORLD</a>
      <button 
        className={clsx("flex items-center gap-2 text-tangy-cream", isMenuOpen && "is-open")}
        aria-expanded={isMenuOpen}
        onClick={() => toggleMenu()}
        onMouseEnter={() => { setActive(true); setLabel('ENTER'); }}
        onMouseLeave={() => { setActive(false); setLabel(''); }}
      >
        MENU <span className={clsx("text-tangy-gold transition-transform duration-300", isMenuOpen && "rotate-45")}>+</span>
      </button>
    </header>
  );
};
