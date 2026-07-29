import { todaysProgramme } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { PageTransition } from '../../components/ui/PageTransition';

export default function ProgrammePage() {
  const { playSFX } = useAudio();

  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#191410] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          
          {/* HEADER */}
          <div className="border-b-4 border-[#d1a437] pb-4 text-left">
            <span className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em] uppercase">12 SEASON PROGRAMME // THEATRE SCHEDULE</span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">TODAY'S PROGRAMME</h1>
            <p className="font-mono text-sm text-[#ecdcaf]/80">LIVE RUNNING ORDER & TIMELINE FOR BANSILALPET STEPWELL SESSIONS</p>
          </div>

          {/* SPLIT FLAP SCHEDULE BOARD */}
          <div className="bg-[#0d0a07] border-4 border-[#d1a437] p-6 shadow-[12px_12px_0px_#4c1210] flex flex-col gap-4">
            {todaysProgramme.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => playSFX('ticketClick')}
                className={`p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-all ${item.status === 'ACTIVE' ? 'bg-[#c2272a] text-[#ecdcaf] border-[#ecdcaf] shadow-md scale-[1.01]' : 'bg-[#191410] text-[#ecdcaf] border-[#ecdcaf]/20 hover:border-[#d1a437]'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold bg-[#0d0a07] text-[#d1a437] px-2.5 py-1 border border-[#d1a437]/30">
                    {item.time}
                  </span>
                  <div>
                    <h4 className="font-poster text-lg text-[#ecdcaf] tracking-wide">{item.title}</h4>
                    <p className="font-mono text-xs opacity-80">{item.desc}</p>
                  </div>
                </div>

                <span className={`font-mono text-[9px] font-bold tracking-widest px-3 py-1 uppercase border w-fit ${item.status === 'ACTIVE' ? 'bg-[#ecdcaf] text-[#191410] border-[#191410]' : item.status === 'COMPLETE' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-[#0d0a07] text-[#ecdcaf]/60 border-[#ecdcaf]/20'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
