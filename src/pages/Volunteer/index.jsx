import { Volunteer } from '../../components/sections/Volunteer';
import { PageTransition } from '../../components/ui/PageTransition';

export default function VolunteerPage() {
  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#8a2320] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-10">
          
          {/* HEADER */}
          <div className="border-b-4 border-[#ecdcaf] pb-4 text-left">
            <span className="font-mono text-xs font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">13 VOLUNTEER DESK // COMMUNITY</span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">JOIN THE TANGY CREW</h1>
            <p className="font-mono text-sm text-[#ecdcaf]/80">BECOME A VOLUNTEER OR APPLY AS A PERFORMING ARTIST</p>
          </div>

          <Volunteer 
            onApplyVolunteer={() => alert("Volunteer application recorded!")}
            onApplyArtist={() => alert("Artist audition recorded!")}
          />

        </div>
      </div>
    </PageTransition>
  );
}
