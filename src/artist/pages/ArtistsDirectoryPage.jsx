import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAudio } from '../../audio/AudioContext';

export const ArtistsDirectoryPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [artists, setArtists] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const genres = ['All', 'Techno', 'House', 'Ambient', 'Jazz', 'World', 'Folk', 'Fusion'];

  useEffect(() => {
    let cancelled = false;
    if (!isSupabaseConfigured) {
      setStatus('error');
      return;
    }
    supabase
      .from('artists')
      .select('*')
      .eq('status', 'approved')
      .order('applied_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setStatus('error');
          return;
        }
        setArtists(data || []);
        setStatus('ready');
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = artists.filter((a) =>
    (filter === 'All' || (a.genre || '').toLowerCase().includes(filter.toLowerCase())) &&
    (search === '' || a.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full min-h-[calc(100vh-50px)] p-3 sm:p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-5 sm:gap-8 text-left overflow-x-hidden">

      {/* HERO HEADER */}
      <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-4 border-[#191410] p-4 sm:p-8 shadow-[6px_6px_0px_#4c1210] sm:shadow-[10px_10px_0px_#4c1210] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-full">
        <div className="flex flex-col gap-1 max-w-full">
          <span className="font-mono text-[8.5px] sm:text-[9px] font-bold text-[#c2272a] tracking-[0.25em] sm:tracking-[0.3em] uppercase">
            THE ROSTER // BANSILAL STEPWELL SESSIONS
          </span>
          <h1 className="font-poster text-3xl sm:text-5xl md:text-6xl text-[#191410] leading-none mt-1">
            THE <span className="text-[#c2272a]">ARTISTS</span>
          </h1>
          <p className="font-mono text-[10.5px] sm:text-xs text-[#241a12]/80 mt-1 uppercase max-w-xl leading-relaxed">
            A curated collective of underground electronic & acoustic artists pushing spatial audio boundaries inside ancient Indian stepwells.
          </p>
        </div>

        <button
          onClick={() => { playSFX('ticketClick'); navigate('/artist/register'); }}
          className="w-full sm:w-auto px-5 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#191410] sm:shadow-[4px_4px_0px_#191410] hover:bg-[#191410] active:scale-95 transition-all text-center min-h-[44px]"
        >
          APPLY AS ARTIST →
        </button>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH ARTIST ROSTER..."
          className="w-full p-3 bg-[#e9decb] border-2 border-[#191410] font-mono text-xs text-[#191410] placeholder:text-[#191410]/50 outline-none shadow-[3px_3px_0px_#191410]"
        />

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => { playSFX('ticketClick'); setFilter(g); }}
              className={`px-3 py-2 font-mono text-[10px] font-bold uppercase border-2 border-[#191410] shadow-[2px_2px_0px_#191410] transition-all min-h-[38px] ${filter === g ? 'bg-[#c2272a] text-[#ecdcaf]' : 'bg-[#e9decb] text-[#191410] hover:bg-[#191410] hover:text-[#ecdcaf]'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* LOADING STATE */}
      {status === 'loading' && (
        <div className="p-10 text-center font-mono text-xs font-bold text-[#241a12]/60 border-2 border-dashed border-[#191410]/40">
          LOADING ARTIST ROSTER...
        </div>
      )}

      {/* ERROR / NOT CONFIGURED STATE */}
      {status === 'error' && (
        <div className="p-10 text-center font-mono text-xs font-bold text-[#c2272a] border-2 border-dashed border-[#c2272a]/50 bg-[#e9decb]">
          COULDN'T LOAD THE ROSTER RIGHT NOW. PLEASE TRY AGAIN SHORTLY.
        </div>
      )}

      {/* EMPTY STATE */}
      {status === 'ready' && filtered.length === 0 && (
        <div className="p-10 text-center font-mono text-xs font-bold text-[#241a12]/60 border-2 border-dashed border-[#191410]/40">
          {artists.length === 0 ? 'NO APPROVED ARTISTS YET — CHECK BACK SOON.' : 'NO ARTISTS MATCH YOUR SEARCH/FILTER.'}
        </div>
      )}

      {/* ARTIST CARDS GRID */}
      {status === 'ready' && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((artist) => (
            <div
              key={artist.id}
              onClick={() => { playSFX('ticketClick'); navigate(`/artist/profile/${artist.id}`); }}
              className="bg-[#e9decb] text-[#241a12] border-2 sm:border-4 border-[#191410] shadow-[5px_5px_0px_#191410] sm:shadow-[8px_8px_0px_#191410] hover:-translate-y-1 transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              {/* AVATAR COVER WITH FALLBACK */}
              <div className="w-full h-44 sm:h-56 bg-[#191410] relative border-b-2 sm:border-b-4 border-[#191410] overflow-hidden">
                <img
                  src={artist.avatar_url || '/media/gallery/tangy1.jpg'}
                  alt={artist.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/media/gallery/tangy1.jpg';
                  }}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>

              {/* INFO BODY */}
              <div className="p-3.5 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
                <h3 className="font-poster text-2xl sm:text-3xl text-[#191410] leading-none">{artist.name}</h3>
                <span className="font-mono text-[9.5px] sm:text-[10px] font-bold text-[#c2272a] uppercase">{artist.genre}</span>
                <p className="font-sans text-xs text-[#241a12]/80 line-clamp-2 leading-relaxed">{artist.bio}</p>
                {artist.city && (
                  <span className="font-mono text-[8.5px] text-[#241a12]/60 uppercase mt-1">📍 {artist.city}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
