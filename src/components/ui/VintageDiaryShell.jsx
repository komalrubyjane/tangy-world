// Reusable Premium Antique Vintage Diary Shell Component for Tangy World
// Occupies ~70% of viewport with thick aged leather cover, worn edges, spine binding threads, and paper stack depth.

export const VintageDiaryShell = ({ 
  isCoverOpen = false, 
  coverContent = null,
  children,
  className = "" 
}) => {
  return (
    <div className={`relative w-[min(540px,82vw)] lg:w-[min(900px,70vw)] h-[min(640px,75vh)] preserve-3d mx-auto z-20 flex items-center justify-center ${className}`}>

      {/* RIPPED/DECKLE PAPER STACK DEPTH UNDERNEATH (TOP, RIGHT, BOTTOM EDGES) */}
      <div className="absolute -top-3 -right-4 -bottom-3 -left-3 bg-[#E7D5A4] rounded-lg border-2 border-[#120A06] shadow-2xl opacity-90 pointer-events-none z-0 rotate-[-0.5deg]">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-multiply" />
        <div className="absolute top-0 right-0 bottom-0 w-5 bg-[repeating-linear-gradient(180deg,#D6C19A_0px,#D6C19A_3px,#B8A37C_3px,#B8A37C_6px)] border-l border-[#120A06]/40" />
      </div>

      {/* REALISTIC HARDCOVER LEATHER JOURNAL OUTER FRAME */}
      <div className="absolute inset-0 bg-[#25140C] rounded-xl border-4 border-[#120A06] shadow-[45px_45px_120px_rgba(0,0,0,0.98)] z-10 flex flex-col justify-center preserve-3d">
        
        {/* Aged Leather Scratches & Fiber Texture */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-35 mix-blend-overlay pointer-events-none rounded-xl" />

        {/* Center Leather Spine & Stitched Binding Threads (Left Edge) */}
        <div className="absolute top-0 bottom-0 left-0 w-8 md:w-12 bg-[linear-gradient(90deg,#140a05,#2d170d_60%,#140a05)] border-r-2 border-[#120A06] z-30 pointer-events-none flex flex-col justify-between py-8 items-center">
          {/* Stitched Binding Threads hanging from spine */}
          <div className="relative w-6 h-12">
            <div className="absolute top-0 left-2 w-0.5 h-14 bg-[#B8401C] rounded-full shadow-md rotate-[-15deg]" />
            <div className="absolute top-2 left-4 w-0.5 h-10 bg-[#D6C19A] rounded-full shadow-md rotate-[10deg]" />
          </div>
          <div className="relative w-6 h-12">
            <div className="absolute top-0 left-1 w-0.5 h-12 bg-[#B8401C] rounded-full shadow-md rotate-[20deg]" />
          </div>
        </div>

        {/* Interior Open Spread Shell (Warm Cream Paper with Center Rings) */}
        <div className={`book-interior absolute inset-2 md:inset-4 bg-[#11100C] rounded-lg p-2 md:p-4 border-2 border-[#120A06] shadow-inner z-10 flex flex-col justify-center preserve-3d transition-opacity duration-500 ${isCoverOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          
          {/* Center Leather Spine & Ring Clips */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 md:w-10 bg-[linear-gradient(90deg,#190d07,#351c11_50%,#190d07)] border-x-2 border-[#11100C] z-30 pointer-events-none flex flex-col justify-around items-center py-6 shadow-2xl">
            <div className="w-5 h-2.5 rounded-full border-2 border-[#C99A2E] bg-black shadow-md" />
            <div className="w-5 h-2.5 rounded-full border-2 border-[#C99A2E] bg-black shadow-md" />
            <div className="w-5 h-2.5 rounded-full border-2 border-[#C99A2E] bg-black shadow-md" />
            <div className="w-5 h-2.5 rounded-full border-2 border-[#C99A2E] bg-black shadow-md" />
          </div>

          {/* Hanging Woven Bookmark Ribbon */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-3.5 h-16 bg-[#7C2D18] border-x border-[#11100C] rounded-b-md shadow-xl z-20 pointer-events-none" />

          {/* Dynamic Content Spread Container */}
          {children}
        </div>

        {/* CLOSED LEATHER FRONT COVER (VINTAGE DIARY SHELL) */}
        <div className={`book-cover-front absolute inset-0 bg-gradient-to-br from-[#4A2F1F] via-[#25140C] to-[#1A0D07] rounded-xl border-4 border-[#120A06] border-r-[16px] border-b-[16px] border-r-[#D6C19A] border-b-[#C2B08B] shadow-[45px_45px_120px_rgba(0,0,0,0.98)] z-40 origin-left flex flex-col items-center justify-between p-6 md:p-8 text-center preserve-3d transition-transform duration-700 ${isCoverOpen ? 'rotate-y-[-140deg] opacity-0 pointer-events-none' : 'rotate-y-0 opacity-100'}`}>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-40 mix-blend-overlay pointer-events-none rounded-xl" />

          {/* BRASS CORNER ACCENTS */}
          <div className="absolute top-2 left-2 w-7 h-7 bg-gradient-to-br from-[#C99A2E] to-[#7A5C30] [clip-path:polygon(0_0,100%_0,0_100%)] shadow-md pointer-events-none z-10" />
          <div className="absolute top-2 right-2 w-7 h-7 bg-gradient-to-bl from-[#C99A2E] to-[#7A5C30] [clip-path:polygon(100%_0,100%_100%,0_0)] shadow-md pointer-events-none z-10" />
          <div className="absolute bottom-2 left-2 w-7 h-7 bg-gradient-to-tr from-[#C99A2E] to-[#7A5C30] [clip-path:polygon(0_0,0_100%,100%_100%)] shadow-md pointer-events-none z-10" />
          <div className="absolute bottom-2 right-2 w-7 h-7 bg-gradient-to-tl from-[#C99A2E] to-[#7A5C30] [clip-path:polygon(100%_100%,0_100%,100%_0)] shadow-md pointer-events-none z-10" />

          {/* INNER GOLD FILIGREE FRAME */}
          <div className="absolute inset-4 border border-[#C99A2E]/40 rounded-lg pointer-events-none z-10">
            <div className="absolute inset-1 border border-[#C99A2E]/20 rounded-md" />
          </div>

          {/* VINTAGE LIBRARY ARCHIVE STICKER (TOP LEFT) */}
          <div className="absolute top-5 left-5 bg-[#E9DCB8] text-[#2B211B] font-mono text-[7px] md:text-[8px] font-bold px-2 py-1 rotate-[-3deg] shadow-md z-20 border border-[#8A7F68] pointer-events-none">
            <div>NO. 001</div>
            <div className="h-1 mt-0.5 bg-[repeating-linear-gradient(90deg,#2B211B_0_1px,transparent_1px_3px)]" />
          </div>

          {/* HORIZONTAL LEATHER STRAP & BRASS BUCKLE */}
          <div className="absolute top-[62%] left-[-4%] right-[-4%] h-7 -translate-y-1/2 bg-gradient-to-r from-[#4A2C18] via-[#6B4024] to-[#3A2115] border-y border-dashed border-[#C99A2E]/50 shadow-lg z-20 pointer-events-none flex items-center justify-end pr-10">
            <div className="w-6 h-6 rounded border-2 border-[#C99A2E] bg-gradient-to-br from-[#C2A06A] to-[#8A6A3A] shadow-md relative">
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-[#C99A2E]" />
            </div>
          </div>

          {/* BURGUNDY WAX SEAL EMBLEM */}
          <div className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-radial from-[#9C2B2F] via-[#7A1F24] to-[#5A1216] border-2 border-[#120A06] shadow-2xl z-30 flex items-center justify-center rotate-[-4deg] pointer-events-none">
            <div className="w-[82%] h-[82%] rounded-full border border-[#C99A2E]/70 flex items-center justify-center font-serif text-sm font-bold text-[#F5E7C8] drop-shadow">
              TS
            </div>
          </div>

          {/* Render Cover Content inside Shell */}
          {coverContent || (
            <div className="w-48 h-28 border-2 border-[#C99A2E]/40 bg-[#1A0D07]/60 rounded-md flex items-center justify-center shadow-inner pointer-events-none my-auto">
              <div className="w-44 h-24 border border-[#C99A2E]/20 rounded-sm" />
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
