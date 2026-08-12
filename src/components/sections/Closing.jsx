import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';

export const Closing = () => {
  const sectionRef = useGSAPContext((ctx) => {
    gsap.from('.contact-back-page', {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%'
      },
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });
  }, []);

  return (
    <section ref={sectionRef} id="contact" className="relative w-full py-20 sm:py-32 bg-[#11100C] text-[#E7D5A4] overflow-hidden flex flex-col items-center justify-center border-t-8 border-[#5A120D]">
      
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-overlay pointer-events-none" />

      {/* Background Archival Photo */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <img src="/media/gallery/tangy9.jpg" alt="After Hours" className="w-full h-full object-cover filter grayscale contrast-150" />
      </div>

      <div className="contact-back-page relative z-30 text-center px-4 max-w-4xl">
        <span className="font-mono text-[#C99A2E] text-[11px] tracking-[0.4em] mb-4 uppercase block font-bold">
          CONTACT // MAGAZINE BACK PAGE
        </span>
        
        <h2 className="display text-4xl sm:text-7xl md:text-9xl text-[#E7D5A4] mb-3 leading-tight sm:leading-none ink-bleed">
          COME<br/>
          <span className="italic text-[#C99A2E] font-normal">FIND US.</span>
        </h2>

        <p className="font-serif italic text-sm md:text-base text-[#E7D5A4]/90 mb-6">
          "Every journey begins somewhere."
        </p>

        {/* Contact Info Cards & Contact Us CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 font-mono text-xs text-[#E7D5A4] tracking-widest mt-6 border-t-2 border-[#E7D5A4]/30 pt-6 sm:pt-8">
          <div className="bg-[#11100C]/80 border-2 border-[#E7D5A4]/40 p-4 sm:p-6 backdrop-blur-xs">
            <span className="text-[#C99A2E] font-bold block mb-2 uppercase">LOCATION</span>
            <span>HYDERABAD · TELANGANA<br/>INDIA</span>
          </div>

          <div className="bg-[#11100C]/80 border-2 border-[#E7D5A4]/40 p-4 sm:p-6 backdrop-blur-xs">
            <span className="text-[#C99A2E] font-bold block mb-2 uppercase">DISPATCH</span>
            <span className="break-all">HELLO@TANGYSESSIONS.COM</span>
          </div>

          <div className="bg-[#11100C]/80 border-2 border-[#E7D5A4]/40 p-4 sm:p-6 backdrop-blur-xs">
            <span className="text-[#C99A2E] font-bold block mb-2 uppercase">ARCHIVE</span>
            <span>INSTAGRAM: @TANGYSESSIONS</span>
          </div>
        </div>

        <div className="mt-10">
          <a 
            href="/contact" 
            className="btn-ticket inline-block text-xs font-mono font-bold uppercase tracking-widest py-3.5 px-8 !bg-[#C99A2E] !text-[#11100C] hover:!bg-[#E7D5A4] shadow-[6px_6px_0px_#5A120D]"
          >
            CONTACT → VISIT TANGY
          </a>
        </div>

      </div>

    </section>
  );
};
