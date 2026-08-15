import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAudio } from '../../audio/AudioContext';

export const ArtistDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [artist, setArtist] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error

  useEffect(() => {
    let cancelled = false;
    if (!isSupabaseConfigured || !id) {
      setStatus('error');
      return;
    }
    setStatus('loading');

    supabase
      .from('artists')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setStatus('error'); return; }
        if (!data) { setStatus('notfound'); return; }
        setArtist(data);
        setStatus('ready');

        supabase
          .from('event_artists')
          .select('events(id, name, event_date, venue)')
          .eq('artist_id', id)
          .then(({ data: rows }) => {
            if (cancelled || !rows) return;
            const events = rows.map((r) => r.events).filter(Boolean);
            setUpcoming(events);
          });
      });

    return () => { cancelled = true; };
  }, [id]);

  if (status === 'loading') {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] flex items-center justify-center font-mono text-xs font-bold text-[#ecdcaf]">
        LOADING ARTIST PROFILE...
      </div>
    );
  }

  if (status === 'notfound' || status === 'error') {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-4 font-mono text-xs font-bold text-[#ecdcaf] p-8 text-center">
        <span>{status === 'notfound' ? 'ARTIST NOT FOUND OR NOT YET APPROVED.' : "COULDN'T LOAD THIS PROFILE RIGHT NOW."}</span>
        <button
          onClick={() => navigate('/artist')}
          className="px-4 py-2 bg-[#c2272a] text-[#ecdcaf] border-2 border-[#191410] uppercase"
        >
          ← BACK TO ROSTER
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-6xl mx-auto flex flex-col gap-8 text-left">

      {/* FULL BLEED ARTIST HERO BANNER */}
      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] shadow-[12px_12px_0px_#4c1210] overflow-hidden flex flex-col md:flex-row">

        {/* AVATAR DISPLAY */}
        <div className="w-full md:w-1/2 h-80 md:h-auto bg-[#191410] border-b-4 md:border-b-0 md:border-r-4 border-[#191410] relative overflow-hidden">
          {artist.avatar_url ? (
            <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover grayscale" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-poster text-8xl text-[#ecdcaf]">
              {artist.name[0]}
            </div>
          )}
        </div>

        {/* HERO DETAILS */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              ARTIST SPOTLIGHT {artist.city ? `// ${artist.city}` : ''}
            </span>
            <h1 className="font-poster text-5xl sm:text-7xl text-[#191410] leading-none">
              {artist.name}
            </h1>
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">{artist.genre}</span>
          </div>

          {artist.experience_level && (
            <div className="font-mono text-xs border-y-2 border-[#191410] py-4">
              <span className="text-[#241a12]/70 block text-[9px] uppercase">EXPERIENCE</span>
              <span className="font-poster text-2xl text-[#191410]">{artist.experience_level}</span>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            {artist.instagram && (
              <a
                href={artist.instagram.startsWith('http') ? artist.instagram : `https://instagram.com/${artist.instagram.replace(/^@/, '')}`}
                target="_blank" rel="noopener noreferrer"
                onClick={() => playSFX('ticketClick')}
                className="px-6 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] hover:bg-[#191410] transition-all"
              >
                INSTAGRAM →
              </a>
            )}
            <button
              onClick={() => { playSFX('ticketClick'); navigate('/artist'); }}
              className="px-4 py-3 bg-[#e9decb] text-[#191410] font-mono text-xs font-bold uppercase border-2 border-[#191410]"
            >
              ← ROSTER
            </button>
          </div>
        </div>

      </div>

      {/* BIOGRAPHY & UPCOMING SHOWS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* BIO (2 COLS) */}
        <div className="md:col-span-2 bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[8px_8px_0px_#191410] flex flex-col gap-4">
          <span className="font-mono text-xs font-bold text-[#c2272a] uppercase border-b-2 border-[#191410] pb-2">BIOGRAPHY & SONIC PHILOSOPHY</span>
          <p className="font-sans text-sm text-[#241a12]/90 leading-relaxed font-normal">{artist.bio || 'No biography submitted yet.'}</p>
        </div>

        {/* UPCOMING SHOWS (1 COL) */}
        <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[8px_8px_0px_#191410] flex flex-col gap-4">
          <span className="font-mono text-xs font-bold text-[#c2272a] uppercase border-b-2 border-[#191410] pb-2">UPCOMING SHOWS</span>

          <div className="flex flex-col gap-3 font-mono text-xs">
            {upcoming.length === 0 ? (
              <span className="text-[#241a12]/60">No upcoming shows announced yet.</span>
            ) : (
              upcoming.map((show) => (
                <div key={show.id} className="p-3 bg-[#ecdcaf] border border-[#191410]">
                  <span className="font-bold text-[#c2272a] block">{show.event_date}</span>
                  <span className="text-[#191410] font-bold block">{show.name}</span>
                  <span className="text-[#241a12]/60 text-[10px] block">{show.venue}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
