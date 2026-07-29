import { Founders } from '../../components/sections/Founders';

export const FoundersPage = () => {
  return (
    <div className="w-full min-h-screen bg-[#191410] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        
        {/* HEADER */}
        <div className="border-b-4 border-[#d1a437] pb-4 text-left">
          <span className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em] uppercase">09 FOUNDERS ARCHIVE // FILE 001</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">THE STORY BEHIND TANGY</h1>
          <p className="font-mono text-sm text-[#ecdcaf]/80">MEET ARJUNA & DEEPA — CREATORS OF HYDERABAD'S INDEPENDENT MUSIC MOVEMENT</p>
        </div>

        <Founders />

      </div>
    </div>
  );
};
