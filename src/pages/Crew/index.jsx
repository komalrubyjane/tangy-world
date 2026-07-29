import { Volunteer } from '../../components/sections/Volunteer';
import { PageTransition } from '../../components/ui/PageTransition';

export default function CrewPage() {
  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#8a2320] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-10">
          
          {/* HEADER */}
          <div className="border-b-4 border-[#ecdcaf] pb-4 text-left">
            <span className="font-mono text-xs font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">08 RECRUITMENT DESK // JOIN THE CREW</span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">TANGY CREW & VOLUNTEERS</h1>
            <p className="font-mono text-sm text-[#ecdcaf]/80">THE ARCHITECTS, SOUND ENGINEERS, & STORYTELLERS BEHIND THE NIGHTS</p>
          </div>

          <Volunteer 
            onApplyVolunteer={() => alert("Volunteer application recorded! We will reach out via email.")} 
            onApplyArtist={() => alert("Artist audition recorded! Send demo tapes to sound@tangysessions.com")} 
          />

        </div>
      </div>
    </PageTransition>
  );
}
