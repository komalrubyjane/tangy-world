import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSharedStore, MOCK_INITIAL_ARTISTS } from '../store/artistStore';
import { useAudio } from '../../audio/AudioContext';

export const ArtistsDirectoryPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [allArtists] = useSharedStore("artists", MOCK_INITIAL_ARTISTS);

  const genres = ['All', 'Techno', 'House', 'Ambient', 'Jazz', 'World'];
  const approvedArtists = allArtists.filter(a => a.appStatus !== 'rejected');

  const filtered = approvedArtists.filter(a =>
    (filter === 'All' || a.tags.includes(filter) || a.genre.includes(filter)) &&
    (search === '' || a.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-7xl mx-auto flex flex-col gap-8 text-left">
      
      {/* HERO HEADER */}
      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[10px_10px_0px_#4c1210] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
            THE ROSTER // BANSILAL STEPWELL SESSIONS
          </span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#191410] leading-none mt-1">
            THE <span className="text-[#c2272a]">ARTISTS</span>
          </h1>
          <p className="font-mono text-xs text-[#241a12]/80 mt-1 uppercase max-w-xl">
            A curated collective of underground electronic & acoustic artists pushing spatial audio boundaries inside ancient Indian stepwells.
          </p>
        </div>

        <button
          onClick={() => { playSFX('ticketClick'); navigate('/artist/register'); }}
          className="px-6 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] hover:bg-[#191410] transition-all"
        >
          APPLY AS ARTIST →
        </button>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH ARTIST ROSTER..."
          className="p-3 bg-[#e9decb] border-2 border-[#191410] font-mono text-xs text-[#191410] placeholder:text-[#191410]/50 outline-none max-w-xs shadow-[3px_3px_0px_#191410]"
        />

        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => { playSFX('ticketClick'); setFilter(g); }}
              className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase border-2 border-[#191410] shadow-[2px_2px_0px_#191410] transition-all ${filter === g ? 'bg-[#c2272a] text-[#ecdcaf]' : 'bg-[#e9decb] text-[#191410] hover:bg-[#191410] hover:text-[#ecdcaf]'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ARTIST CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((artist) => (
          <div
            key={artist.id}
            onClick={() => { playSFX('ticketClick'); navigate(`/artist/profile/${artist.id}`); }}
            className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] shadow-[8px_8px_0px_#191410] hover:-translate-y-1 hover:shadow-[12px_12px_0px_#4c1210] transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
          >
            {/* AVATAR COVER */}
            <div className="w-full h-56 bg-[#191410] relative border-b-4 border-[#191410] overflow-hidden">
              {artist.avatar ? (
                <img 
                  src={artist.avatar} 
                  alt={artist.name} 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-poster text-6xl text-[#ecdcaf]">
                  {artist.name[0]}
                </div>
              )}

              {/* AVAILABILITY BADGE */}
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#191410] text-[#ecdcaf] font-mono text-[8.5px] font-bold uppercase border border-[#d1a437] flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${artist.status === 'available' ? 'bg-[#2e6834]' : 'bg-[#d1a437]'}`} />
                <span>{artist.status}</span>
              </div>
            </div>

            {/* INFO BODY */}
            <div className="p-5 flex flex-col gap-2">
              <h3 className="font-poster text-3xl text-[#191410] leading-none">{artist.name}</h3>
              <span className="font-mono text-[10px] font-bold text-[#c2272a] uppercase">{artist.genre}</span>
              <p className="font-sans text-xs text-[#241a12]/80 line-clamp-2 leading-relaxed">{artist.bio}</p>

              <div className="flex flex-wrap gap-1 mt-2">
                {artist.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-[#191410] text-[#ecdcaf] font-mono text-[8px] font-bold uppercase">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
