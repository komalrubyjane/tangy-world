import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { founders } from '../../data/mockData';

export const Founders = () => {
  const sectionRef = useGSAPContext((ctx) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=300%',
        scrub: 0.5,
        pin: true,
        anticipatePin: 1
      }
    });

    const founderBlocks = gsap.utils.toArray('.founder-editorial-block');

    founderBlocks.forEach((block, i) => {
      tl.fromTo(block,
        { opacity: 0, y: 150, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power2.out' }
      );

      if (i < founderBlocks.length - 1) {
        tl.to(block, { opacity: 0, y: -150, scale: 0.8, duration: 1, ease: 'power2.in' }, '+=0.5');
      }
    });

  }, []);

  return (
    <section ref={sectionRef} id="founders" className="relative w-full h-screen bg-[#E7D5A4] text-[#11100C] overflow-hidden flex items-center justify-center border-t-8 border-[#11100C]">
      
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-multiply pointer-events-none" />

      {/* Header */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20 pointer-events-none">
        <p className="font-mono text-tangy-oxblood text-[10px] tracking-[0.3em] font-bold uppercase">MAGAZINE INTERVIEW // ISSUE 01</p>
        <h2 className="display text-5xl md:text-7xl text-[#11100C]">THE ARCHITECTS</h2>
      </div>

      {founders.map((founder, i) => (
        <div key={founder.id} className="founder-editorial-block absolute inset-0 flex items-center justify-center opacity-0 px-6 md:px-20 pointer-events-none z-10">
          <div className="max-w-[1100px] w-full flex flex-col md:flex-row items-center gap-10 md:gap-16 pointer-events-auto bg-[#F5E9C9] p-8 md:p-12 border-4 border-[#11100C] shadow-[20px_20px_0px_#11100C] relative">
            
            {/* Founder Portrait */}
            <div className="w-full md:w-1/2 relative group">
              <div className="w-full aspect-[3/4] bg-[#11100C] shadow-2xl border-2 border-[#11100C] overflow-hidden relative">
                <img src={founder.image} alt={founder.name} className="w-full h-full object-cover filter grayscale contrast-125" />
                <span className="absolute bottom-2 left-2 bg-[#5A120D] text-[#E7D5A4] font-mono text-[8px] px-2 py-0.5 font-bold tracking-widest">
                  FOUNDER NO. 0{founder.id}
                </span>
              </div>
            </div>

            {/* Magazine Article */}
            <div className="w-full md:w-1/2 flex flex-col text-[#11100C]">
              <span className="font-mono text-xs text-[#B94717] font-bold tracking-[0.2em] uppercase mb-2">{founder.role}</span>
              <h3 className="display text-5xl md:text-7xl mb-4 ink-bleed">{founder.name.toUpperCase()}</h3>
              
              <div className="relative font-body text-base md:text-lg leading-relaxed text-[#11100C]/90 mb-6 border-l-4 border-[#5A120D] pl-4">
                <span className="display text-6xl text-[#5A120D] absolute -top-6 -left-3 opacity-20">“</span>
                {founder.bio}
              </div>

              <div className="p-4 border-2 border-[#11100C] bg-[#E7D5A4] font-mono text-xs italic font-bold text-[#5A120D]">
                "Tangy was built so the city could finally hear itself think."
              </div>
            </div>

          </div>
        </div>
      ))}

    </section>
  );
};
