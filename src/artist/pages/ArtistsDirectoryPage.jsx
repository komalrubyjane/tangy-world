import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAudio } from '../../audio/AudioContext';
import { PhotoTreatment } from '../../components/ui/PhotoTreatment';
import { TextileBorderStrip } from '../../components/ui/CulturalMotifs';
import { ArchiveStamp } from '../../components/ui/ArchiveStamp';
import { RangoliDecoration, LotusStamp, PatternBackground, RetroGrain } from '../../components/ui/RetroAssets';

// Each poster card cycles through one of these spot-colour fields — real colour
// blocking per card rather than one uniform card background repeated N times.
const CARD_PALETTE = [
  { bg: '#EAD9A6', text: '#191410', accent: '#c2272a' },
  { bg: '#D1A437', text: '#191410', accent: '#5A120D' },
  { bg: '#5A120D', text: '#ECDCAF', accent: '#D1A437' },
  { bg: '#16323A', text: '#ECDCAF', accent: '#D91E18' },
];

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

      {/* HERO HEADER — a poster masthead, not a settings-page banner: a bleeding Rangoli */}
      {/* medallion, a huge outline "01" plate mark, and oversized rotated title type. */}
      <div className="relative bg-[#EFE2C0] paperTexture text-[#241a12] border-2 sm:border-4 border-[#191410] p-5 sm:p-10 shadow-[6px_6px_0px_#4c1210] sm:shadow-[12px_12px_0px_#4c1210] overflow-hidden max-w-full isolate">
        <PatternBackground category="textile" index={1} size="cover" blend="normal" />
        <RetroGrain index={0} opacity={0.09} blend="overlay" />
        <div className="hidden sm:block absolute -right-[8%] -top-[30%] w-[46%] max-w-[300px] aspect-square opacity-[0.18] animate-[spin_150s_linear_infinite] pointer-events-none">
          <RangoliDecoration index={0} spin={false} className="w-full h-full" />
        </div>
        {/* MOBILE — a real Rangoli photograph bleeding from the bottom-right, standing in */}
        {/* for the full medallion that's desktop-only above this breakpoint. */}
        <div className="sm:hidden absolute -bottom-[10%] -right-[10%] w-[46%] max-w-[160px] aspect-square opacity-[0.2] pointer-events-none">
          <RangoliDecoration index={0} spin={false} className="w-full h-full" />
        </div>
        <span
          className="hidden md:block absolute -left-[1%] -bottom-[18%] font-condensed font-black leading-none text-transparent pointer-events-none select-none"
          style={{ fontSize: 'clamp(90px,12vw,190px)', WebkitTextStroke: '2px rgba(90,18,13,0.14)' }}
          aria-hidden="true"
        >
          01
        </span>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
          <div className="flex flex-col gap-1 max-w-full">
            <span className="font-mono text-[8.5px] sm:text-[9px] font-bold text-[#c2272a] tracking-[0.25em] sm:tracking-[0.3em] uppercase">
              THE ROSTER // BANSILAL STEPWELL SESSIONS
            </span>
            <h1 className="font-poster text-[clamp(2.6rem,10vw,6.5rem)] text-[#191410] leading-[0.82] mt-1 -rotate-1 origin-left">
              THE<br /><span className="text-[#c2272a]">ARTISTS</span>
            </h1>
            <p className="font-mono text-[10.5px] sm:text-xs text-[#241a12]/80 mt-3 uppercase max-w-xl leading-relaxed border-l-2 border-[#c2272a] pl-3">
              A curated collective of underground electronic & acoustic artists pushing spatial audio boundaries inside ancient Indian stepwells.
            </p>
          </div>

          <button
            onClick={() => { playSFX('ticketClick'); navigate('/artist/register'); }}
            className="w-full md:w-auto shrink-0 px-6 py-3.5 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] hover:bg-[#191410] active:scale-95 transition-all text-center min-h-[44px] rotate-1"
          >
            APPLY AS ARTIST →
          </button>
        </div>
      </div>
      <TextileBorderStrip height={11} colorA="#c2272a" colorB="#191410" />

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
        <div className="p-10 text-center font-mono text-xs font-bold text-[#c2272a] border-2 border-dashed border-[#c2272a]/50 bg-[#EFE2C0] paperTexture">
          COULDN'T LOAD THE ROSTER RIGHT NOW. PLEASE TRY AGAIN SHORTLY.
        </div>
      )}

      {/* EMPTY STATE */}
      {status === 'ready' && filtered.length === 0 && (
        <div className="p-10 text-center font-mono text-xs font-bold text-[#241a12]/60 border-2 border-dashed border-[#191410]/40">
          {artists.length === 0 ? 'NO APPROVED ARTISTS YET — CHECK BACK SOON.' : 'NO ARTISTS MATCH YOUR SEARCH/FILTER.'}
        </div>
      )}

      {/* ARTIST CARDS GRID — each card is a self-contained poster composition: a full-bleed */}
      {/* halftone portrait with a huge outline plate number floating over it, the artist's */}
      {/* name set in oversized rotated poster type overlapping straight onto the photo, and */}
      {/* a rotating spot-colour field per card instead of one repeated card background. */}
      {status === 'ready' && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {filtered.map((artist, idx) => {
            const palette = CARD_PALETTE[idx % CARD_PALETTE.length];
            return (
              <div
                key={artist.id}
                onClick={() => { playSFX('ticketClick'); navigate(`/artist/profile/${artist.id}`); }}
                className="group relative aspect-[3/4] border-2 sm:border-4 border-[#191410] shadow-[6px_6px_0px_#191410] sm:shadow-[10px_10px_0px_#191410] hover:-translate-y-1.5 hover:rotate-[0.5deg] transition-all cursor-pointer overflow-hidden isolate"
                style={{ backgroundColor: palette.bg }}
              >
                {/* REAL PAPER-GRAIN LAYER — a physical-print imperfection, subtly more visible */}
                {/* on hover like the texture catching the light. */}
                <RetroGrain index={idx % 2} opacity={0.13} blend="overlay" />
                
                {/* FULL-BLEED PORTRAIT — top ~64% of the card, original colour, no padding */}
                <div className="absolute inset-x-0 top-0 h-[64%] overflow-hidden border-b-2 sm:border-b-4 border-[#191410]">
                  <PhotoTreatment
                    src={artist.avatar_url || '/media/gallery/tangy1.jpg'}
                    alt={artist.name}
                    className="w-full h-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/media/gallery/tangy1.jpg';
                    }}
                  />
                  {/* HUGE OUTLINE PLATE NUMBER — bleeds over the top of the photo */}
                  <span
                    className="absolute -top-[6%] -left-[3%] font-condensed font-black leading-none text-transparent pointer-events-none select-none"
                    style={{ fontSize: 'clamp(64px,13vw,110px)', WebkitTextStroke: '2px rgba(236,220,175,0.6)' }}
                    aria-hidden="true"
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <ArchiveStamp text={artist.genre || 'ARTIST'} rotation="4deg" color="dark" className="absolute top-2 right-2 z-10 !text-[8px]" />
                  <LotusStamp
                    index={idx}
                    bg="transparent"
                    border="#191410"
                    className="absolute bottom-2 right-2 z-10 w-8 h-8 sm:w-9 sm:h-9"
                  />
                </div>

                {/* NAME BAND — oversized rotated poster type overlapping the photo edge, */}
                {/* set in the card's own spot colour rather than a plain white panel, with */}
                {/* a Bandhani field as a real textile layer behind the type. */}
                <div className="absolute inset-x-0 bottom-0 h-[36%] flex flex-col justify-center px-3.5 sm:px-5 py-2 overflow-hidden" style={{ color: palette.text }}>
                  <PatternBackground category="textile" index={idx} opacity={0.12} size="180px" repeat />
                  <div className="flex items-center justify-between relative">
                    <span className="font-mono text-[7.5px] sm:text-[8px] font-bold uppercase tracking-widest opacity-70">PLATE {String(idx + 1).padStart(2, '0')} · LIVE ARCHIVE</span>
                  </div>
                  <h3
                    className="relative font-poster leading-[0.82] -rotate-1 origin-left -mt-[10%] drop-shadow-[2px_2px_0_rgba(0,0,0,0.35)]"
                    style={{ fontSize: 'clamp(26px,5.2vw,42px)' }}
                  >
                    {artist.name}
                  </h3>
                  <p className="relative font-sans text-[11px] sm:text-xs opacity-80 line-clamp-1 leading-relaxed mt-1.5">{artist.bio}</p>
                  {artist.city && (
                    <span className="relative font-mono text-[8px] sm:text-[8.5px] uppercase mt-1.5 tracking-widest" style={{ color: palette.accent }}>
                      ★ {artist.city}
                    </span>
                  )}
                </div>

                <TextileBorderStrip className="absolute bottom-0 inset-x-0 z-10" height={6} colorA={palette.accent} colorB="#191410" />
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
