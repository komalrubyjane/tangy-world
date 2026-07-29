import { useParams, Link } from 'react-router-dom';
import { artists } from '../data/mockData';

export const ArtistProfilePage = () => {
  const { slug } = useParams();

  const artist = artists.find((a) => a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug) || artists[0];

  return (
    <div className="w-full min-h-screen bg-[#191410] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 text-left">
        
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#d1a437]">
          <Link to="/artists" className="hover:underline">← ALL ARTISTS</Link>
          <span>/</span>
          <span className="uppercase text-[#ecdcaf]">{artist.name}</span>
        </div>

        {/* PROFILE HEADER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-[#ecdcaf] text-[#191410] p-6 border-4 border-[#191410] shadow-[10px_10px_0px_#c2272a]">
          <div className="aspect-square border-2 border-[#191410] overflow-hidden">
            <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
          </div>

          <div className="md:col-span-2 flex flex-col gap-2">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">{artist.role} · {artist.genre}</span>
            <h1 className="font-poster text-4xl sm:text-5xl text-[#191410] uppercase">{artist.name}</h1>
            <p className="font-mono text-xs text-[#191410]/80">📍 {artist.location} · {artist.followers} LISTENERS · {artist.performances} PERFORMANCES</p>
            <p className="font-sans text-sm text-[#191410]/90 leading-relaxed font-normal mt-2">
              {artist.bio}
            </p>
          </div>
        </div>

        {/* INSTRUMENTS & SESSIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0d0a07] p-5 border-2 border-[#d1a437]">
            <h3 className="font-poster text-xl text-[#d1a437] uppercase mb-3">INSTRUMENTS & TOOLS</h3>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {(artist.instruments || ["Acoustic", "Vocals"]).map((inst, idx) => (
                <span key={idx} className="bg-[#191410] text-[#ecdcaf] px-3 py-1 border border-[#d1a437]/40">
                  {inst}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#0d0a07] p-5 border-2 border-[#c2272a]">
            <h3 className="font-poster text-xl text-[#c2272a] uppercase mb-3">TANGY SESSIONS PERFORMED</h3>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {(artist.sessions || ["Vol. 1", "Solstice Ritual"]).map((sess, idx) => (
                <span key={idx} className="bg-[#c2272a] text-[#ecdcaf] px-3 py-1 border border-[#ecdcaf]/40">
                  {sess}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
