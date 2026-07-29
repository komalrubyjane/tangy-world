import { PrivateSessions } from '../components/sections/PrivateSessions';

export const PrivatePage = ({ onRequestPrivate }) => {
  return (
    <div className="w-full min-h-screen bg-[#315D73] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        
        {/* HEADER */}
        <div className="border-b-4 border-[#ecdcaf] pb-4 text-left">
          <span className="font-mono text-xs font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">10 PRIVATE SESSIONS // BESPOKE CURATION</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">MAKE THE NIGHT YOUR OWN</h1>
          <p className="font-mono text-sm text-[#ecdcaf]/80">PRIVATE GATHERINGS, HOUSE SESSIONS, & BRAND EXPERIENCES</p>
        </div>

        <PrivateSessions onRequestPrivate={onRequestPrivate} />

      </div>
    </div>
  );
};
