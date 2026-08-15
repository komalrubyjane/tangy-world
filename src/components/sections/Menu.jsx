import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

export const Menu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      gsap.fromTo('.programme-paper',
        { yPercent: -100 },
        { yPercent: 0, duration: 0.7, ease: 'power3.out' }
      );
      gsap.fromTo('.programme-item',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.04, duration: 0.5, delay: 0.3, ease: 'power2.out' }
      );
    } else {
      document.body.style.overflow = '';
      gsap.to('.programme-paper', {
        yPercent: -100, duration: 0.5, ease: 'power3.in'
      });
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const links = [
    { num: "01", label: "THE STAGE", href: "#hero" },
    { num: "02", label: "MANIFESTO", href: "#manifesto" },
    { num: "03", label: "TIMELINE", href: "#history" },
    { num: "04", label: "THE ARCHIVE", href: "#archive" },
    { num: "05", label: "HERITAGE SPACES", href: "#spaces" },
    { num: "06", label: "RAW FOOTAGE", href: "#front-camera" },
    { num: "07", label: "PRIVATE DIARY", href: "#diary" },
    { num: "08", label: "ARTIST PORTAL ✦", route: "/artist" },
    { num: "09", label: "ARCHITECTS", href: "#founders" },
    { num: "10", label: "SESSIONS & TICKETS", href: "#sessions" },
    { num: "11", label: "VOLUNTEER CREW ✦", route: "/crew" },
    { num: "12", label: "PRIVATE SESSIONS ✦", route: "/private-sessions" }
  ];

  const handleNav = (link) => {
    onClose();
    setTimeout(() => {
      if (link.route) {
        navigate(link.route);
      } else if (link.href) {
        if (window.location.pathname !== '/') {
          navigate('/');
          setTimeout(() => {
            document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        } else {
          document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 400);
  };

  return (
    <div 
      className="programme-paper fixed inset-0 bg-[#E7D5A4] border-b-8 border-[#5A120D] z-[150] p-6 md:p-16 flex flex-col justify-between shadow-[0_30px_100px_rgba(0,0,0,0.95)]"
      style={{ transform: 'translateY(-100%)' }}
    >
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-multiply pointer-events-none" />

      {/* Top Header */}
      <div className="flex justify-between items-start border-b-2 border-[#11100C] pb-4 relative z-10">
        <div>
          <span className="font-mono text-[10px] text-[#5A120D] font-bold tracking-[0.3em] uppercase block">TANGY SESSIONS</span>
          <h2 className="display text-3xl md:text-4xl text-[#11100C]">TONIGHT'S PROGRAMME</h2>
        </div>
        <button 
          onClick={onClose} 
          className="font-mono text-xs text-[#11100C] border-2 border-[#11100C] px-3 py-1 hover:bg-[#11100C] hover:text-[#E7D5A4] transition-colors font-bold tracking-widest"
        >
          CLOSE [ ✕ ]
        </button>
      </div>

      {/* Programme Index Grid */}
      <div className="flex-grow flex items-center justify-center py-8 relative z-10">
        <ul className="w-full max-w-2xl flex flex-col gap-2 font-mono text-sm md:text-base text-[#11100C]">
          {links.map((link) => (
            <li key={link.num} className="programme-item flex justify-between items-baseline border-b border-[#11100C]/20 py-2 group cursor-pointer" onClick={() => handleNav(link)}>
              <span className="font-bold text-[#B94717] text-xs mr-4">{link.num}</span>
              <span className="display text-2xl md:text-4xl group-hover:italic group-hover:text-[#5A120D] transition-all uppercase">{link.label}</span>
              <span className="opacity-40 group-hover:opacity-100 transition-opacity">⟶</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Metadata */}
      <div className="flex justify-between items-end border-t-2 border-[#11100C] pt-4 font-mono text-[10px] tracking-widest text-[#11100C] relative z-10 uppercase">
        <div>
          HYDERABAD · INDIA<br/>
          EST. 2016 // PRIVATE ARCHIVE
        </div>
        <div className="text-right">
          <span>33⅓ RPM // SIDE A</span>
        </div>
      </div>

    </div>
  );
};
