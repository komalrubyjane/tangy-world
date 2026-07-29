import { useParams, Link } from 'react-router-dom';
import { archiveItems } from '../../data/mockData';

export const ArchiveItemPage = () => {
  const { slug } = useParams();

  const item = archiveItems.find((i) => i.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug) || archiveItems[0];

  return (
    <div className="w-full min-h-screen bg-[#e9decb] text-[#241a12] pt-20 pb-28 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 text-left">
        
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#c2272a]">
          <Link to="/archive" className="hover:underline">← ALL ARCHIVE COLLECTIONS</Link>
          <span>/</span>
          <span className="uppercase text-[#191410]">{item.title}</span>
        </div>

        {/* FULLSCREEN ARTIFACT CONTAINER */}
        <div className="bg-[#191410] p-4 border-4 border-[#191410] shadow-[12px_12px_0px_#4c1210] flex flex-col gap-4">
          <div className="w-full aspect-[16/10] overflow-hidden">
            <img src={item.image} alt={item.title} className="w-full h-full object-cover filter contrast-110" />
          </div>

          <div className="flex justify-between items-center text-[#ecdcaf] font-mono text-xs uppercase px-2">
            <span>FILE: {item.category}</span>
            <span>YEAR: {item.year}</span>
            <span>HYDERABAD ARCHIVE</span>
          </div>
        </div>

        {/* EDITORIAL STORY */}
        <div className="flex flex-col gap-3">
          <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">{item.category} DETAILS</span>
          <h1 className="font-poster text-3xl sm:text-5xl text-[#191410] uppercase">{item.title}</h1>
          <p className="font-mono text-sm text-[#241a12]/80 font-bold">{item.headline}</p>
          <p className="font-sans text-base text-[#241a12]/90 leading-relaxed font-normal mt-2">
            {item.details}
          </p>
        </div>

      </div>
    </div>
  );
};
