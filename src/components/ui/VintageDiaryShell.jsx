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
      <div className="absolute -top-3 -right-4 -bottom-3 -left-3 bg-[#D9C6A0] rounded-lg border-2 border-[#35251A] shadow-archival opacity-90 pointer-events-none z-0 rotate-[-0.5deg]">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-multiply" />
        <div className="absolute top-0 right-0 bottom-0 w-5 bg-[repeating-linear-gradient(180deg,#D9C6A0_0px,#D9C6A0_3px,#CBB38C_3px,#CBB38C_6px)] border-l border-[#35251A]/40" />
      </div>

      {/* REALISTIC HARDCOVER LEATHER JOURNAL OUTER FRAME */}
      <div className="absolute inset-0 bg-[#3A241A] rounded-xl border-4 border-[#35251A] shadow-archival z-10 flex flex-col justify-center preserve-3d">
        
        {/* Aged Leather Scratches & Fiber Texture */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-35 mix-blend-overlay pointer-events-none rounded-xl" />

        {/* Center Leather Spine & Stitched Binding Threads (Left Edge) */}
        <div className="absolute top-0 bottom-0 left-0 w-8 md:w-12 bg-[linear-gradient(90deg,#2D1B13,#4B2D22_60%,#2D1B13)] border-r-2 border-[#35251A] z-30 pointer-events-none flex flex-col justify-between py-8 items-center">
          {/* Stitched Binding Threads hanging from spine */}
          <div className="relative w-6 h-12">
            <div className="absolute top-0 left-2 w-0.5 h-14 bg-[#7A2B24] rounded-full shadow-md rotate-[-15deg]" />
            <div className="absolute top-2 left-4 w-0.5 h-10 bg-[#D9C6A0] rounded-full shadow-md rotate-[10deg]" />
          </div>
          <div className="relative w-6 h-12">
            <div className="absolute top-0 left-1 w-0.5 h-12 bg-[#7A2B24] rounded-full shadow-md rotate-[20deg]" />
          </div>
        </div>

        {/* Interior Open Spread Shell (Warm Aged Paper with Center Rings) */}
        <div className={`book-interior absolute inset-2 md:inset-4 bg-[#35251A] rounded-lg p-2 md:p-4 border-2 border-[#35251A] shadow-inner z-10 flex flex-col justify-center preserve-3d transition-opacity duration-500 ${isCoverOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          
          {/* Center Leather Spine & Ring Clips */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 md:w-10 bg-[linear-gradient(90deg,#2D1B13,#4B2D22_50%,#2D1B13)] border-x-2 border-[#35251A] z-30 pointer-events-none flex flex-col justify-around items-center py-6 shadow-2xl">
            <div className="w-5 h-2.5 rounded-full border-2 border-[#9E6D35] bg-[#3A241A] shadow-md" />
            <div className="w-5 h-2.5 rounded-full border-2 border-[#9E6D35] bg-[#3A241A] shadow-md" />
            <div className="w-5 h-2.5 rounded-full border-2 border-[#9E6D35] bg-[#3A241A] shadow-md" />
            <div className="w-5 h-2.5 rounded-full border-2 border-[#9E6D35] bg-[#3A241A] shadow-md" />
          </div>

          {/* Hanging Woven Bookmark Ribbon */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-3.5 h-16 bg-[#7A2B24] border-x border-[#35251A] rounded-b-md shadow-xl z-20 pointer-events-none" />

          {/* Dynamic Content Spread Container */}
          {children}
        </div>

        {/* CLOSED LEATHER FRONT COVER (VINTAGE DIARY SHELL) */}
        <div className={`book-cover-front absolute inset-0 bg-[#3A241A] rounded-xl border-4 border-[#35251A] border-r-[16px] border-b-[16px] border-r-[#D9C6A0] border-b-[#CBB38C] shadow-archival z-40 origin-left flex flex-col items-center justify-between p-8 text-center preserve-3d transition-transform duration-700 ${isCoverOpen ? 'rotate-y-[-140deg] opacity-0 pointer-events-none' : 'rotate-y-0 opacity-100'}`}>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-40 mix-blend-overlay pointer-events-none rounded-xl" />

          {/* Worn Leather Edges & Faded Brass Corner Details */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#9E6D35]/50 pointer-events-none" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#9E6D35]/50 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#9E6D35]/50 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#9E6D35]/50 pointer-events-none" />

          {/* Render Cover Content inside Shell */}
          {coverContent || (
            <div className="w-48 h-28 border-2 border-[#9E6D35]/40 bg-[#2D1B13]/60 rounded-md flex items-center justify-center shadow-inner pointer-events-none my-auto">
              <div className="w-44 h-24 border border-[#9E6D35]/20 rounded-sm" />
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
