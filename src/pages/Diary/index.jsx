import { Link } from 'react-router-dom';
import { diaryEntries } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { PageTransition } from '../../components/ui/PageTransition';

export default function DiaryPage() {
  const { playSFX } = useAudio();

  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#ecdcaf] text-[#191410] pt-20 pb-28 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-10">
          
          {/* HEADER */}
          <div className="border-b-4 border-[#191410] pb-4 text-left">
            <span className="font-mono text-xs font-bold text-[#c2272a] tracking-[0.3em] uppercase">07 JOURNAL // FIELD NOTEBOOK</span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#191410] uppercase my-2">TANGY DIARY</h1>
            <p className="font-mono text-sm text-[#191410]/80">UNFILTERED ESSAYS, MIDNIGHT ACOUSTIC NOTES, & VOLUNTEER STORIES</p>
          </div>

          {/* DIARY ENTRIES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {diaryEntries.map((entry) => {
              const slug = entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <div 
                  key={entry.id}
                  className="bg-[#191410] text-[#ecdcaf] border-2 border-[#191410] p-5 shadow-[6px_6px_0px_#c2272a] flex flex-col justify-between text-left group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="aspect-[4/3] overflow-hidden border border-[#ecdcaf]/20 relative">
                      <img src={entry.image} alt={entry.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className="absolute top-2 left-2 font-mono text-[8px] font-bold bg-[#c2272a] text-[#ecdcaf] px-2 py-0.5 uppercase">
                        {entry.date}
                      </span>
                    </div>

                    <span className="font-mono text-[9px] text-[#d1a437] font-bold uppercase">📍 {entry.location}</span>
                    <h3 className="font-poster text-xl text-[#ecdcaf] leading-tight my-0.5">{entry.title}</h3>
                    <p className="font-sans text-xs text-[#ecdcaf]/80 leading-relaxed font-normal">{entry.content}</p>
                  </div>

                  <Link
                    to={`/diary/${slug}`}
                    onClick={() => playSFX('ticketClick')}
                    className="w-full mt-6 py-2 bg-[#ecdcaf] text-[#191410] font-mono text-xs font-bold tracking-widest text-center uppercase hover:bg-[#c2272a] hover:text-[#ecdcaf] transition-all"
                  >
                    READ ENTRY 📖 →
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
