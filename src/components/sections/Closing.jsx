export const Closing = () => {
  return (
    <section 
      id="contact" 
      className="relative w-full min-h-screen bg-[#4B2D22] text-[#D9C6A0] overflow-hidden flex flex-col items-center justify-center p-8 md:p-16 border-t-8 border-[#3A241A]"
    >
      {/* NOISE OVERLAY & VINTAGE MAGAZINE BACK PAGE TEXTURE */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-overlay pointer-events-none z-0" />

      {/* RETRO CROP MARKS */}
      <div className="absolute top-6 left-6 font-mono text-[9px] text-[#9E6D35] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // BACK PAGE DISPATCH
      </div>
      <div className="absolute top-6 right-6 font-mono text-[9px] text-[#D9C6A0]/50 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        HYDERABAD HERITAGE DESK
      </div>

      <div className="relative z-10 max-w-4xl text-center">
        <span className="font-mono text-[10px] md:text-xs font-bold text-[#9E6D35] tracking-[0.35em] uppercase mb-4 block">
          CONTACT // MAGAZINE BACK PAGE
        </span>
        
        <h2 className="font-poster text-6xl md:text-9xl text-[#D9C6A0] mb-3 leading-none uppercase">
          COME<br/>
          <span className="italic text-[#9E6D35] font-serif-book font-normal">FIND US.</span>
        </h2>

        <p className="font-handwritten text-xl text-[#D9C6A0] mb-6">
          "Every journey begins somewhere."
        </p>

        {/* Contact Info Cards & Contact Us CTA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs text-[#D9C6A0] tracking-widest mt-6 border-t-2 border-[#D9C6A0]/20 pt-8">
          <div className="bg-[#3A241A]/90 border-2 border-[#9E6D35]/40 p-6 backdrop-blur-xs shadow-archival">
            <span className="text-[#9E6D35] font-bold block mb-2 uppercase">LOCATION</span>
            <span>HYDERABAD · TELANGANA<br/>INDIA</span>
          </div>

          <div className="bg-[#3A241A]/90 border-2 border-[#9E6D35]/40 p-6 backdrop-blur-xs shadow-archival">
            <span className="text-[#9E6D35] font-bold block mb-2 uppercase">DISPATCH</span>
            <span>HELLO@TANGYSESSIONS.COM</span>
          </div>

          <div className="bg-[#3A241A]/90 border-2 border-[#9E6D35]/40 p-6 backdrop-blur-xs shadow-archival">
            <span className="text-[#9E6D35] font-bold block mb-2 uppercase">ARCHIVE</span>
            <span>INSTAGRAM: @TANGYSESSIONS</span>
          </div>
        </div>

        <div className="mt-10">
          <a 
            href="/contact" 
            className="btn-ticket inline-block text-xs font-mono font-bold uppercase tracking-widest py-3.5 px-8 !bg-[#9E6D35] !text-[#35251A] hover:!bg-[#D9C6A0] shadow-archival !border-2 !border-[#35251A]"
          >
            CONTACT → VISIT TANGY
          </a>
        </div>

      </div>
    </section>
  );
};
