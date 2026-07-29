import { useParams, Link } from 'react-router-dom';
import { diaryEntries } from '../../data/mockData';

export const DiaryPostPage = () => {
  const { slug } = useParams();

  const entry = diaryEntries.find((e) => e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug) || diaryEntries[0];

  return (
    <div className="w-full min-h-screen bg-[#ecdcaf] text-[#191410] pt-20 pb-28 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-8 text-left">
        
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#c2272a]">
          <Link to="/diary" className="hover:underline">← ALL DIARY ENTRIES</Link>
          <span>/</span>
          <span className="uppercase text-[#191410]">{entry.title}</span>
        </div>

        {/* HERO IMAGE */}
        <div className="w-full aspect-[16/9] border-4 border-[#191410] overflow-hidden shadow-md">
          <img src={entry.image} alt={entry.title} className="w-full h-full object-cover" />
        </div>

        {/* ARTICLE HEADER */}
        <div>
          <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">{entry.date} · {entry.location}</span>
          <h1 className="font-poster text-3xl sm:text-5xl text-[#191410] uppercase my-2">{entry.title}</h1>
        </div>

        {/* ARTICLE CONTENT */}
        <div className="bg-[#191410] text-[#ecdcaf] p-6 border-2 border-[#191410] shadow-[8px_8px_0px_#c2272a] font-serif text-base leading-relaxed space-y-4">
          <p>{entry.content}</p>
          <p>
            The acoustic reverberation inside historic masonry reminds us why we started Tangy. In a world saturated with digital compressed audio, stepping into a 300-year-old courtyard restores the tactile intimacy of music.
          </p>
        </div>

      </div>
    </div>
  );
};
