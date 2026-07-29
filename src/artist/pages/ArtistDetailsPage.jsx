import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAudio } from '../../audio/AudioContext';

const ARTIST_DB = {
  kryzen: {
    id: "kryzen",
    name: "KRYZEN",
    role: "Deep House / Hypnotic Techno",
    avatar: "/artists/artist1.jpg",
    location: "Mumbai, India",
    performances: "140+",
    yearsActive: "7 Years",
    availability: "Available for bookings",
    bio: "KRYZEN is an architect of deep, hypnotic soundscapes. Blurring the line between time and space, their sets are designed to transport listeners to the outer limits of perception. Heavily influenced by Berlin's industrial landscape and classical minimalism, they craft experiences that linger in the consciousness long after the night ends.",
    tags: ["Deep House", "Hypnotic Techno", "Industrial", "Minimalism"],
    upcoming: [
      { date: "JUN 14, 2026", venue: "Bansilal Stepwell", city: "Hyderabad, India" },
      { date: "JUL 05, 2026", venue: "Warehouse 10", city: "Mumbai, India" }
    ]
  },
  aurawav: {
    id: "aurawav",
    name: "Aura.wav",
    role: "Ambient / IDM",
    avatar: "/artists/artist2.jpg",
    location: "Bangalore, India",
    performances: "98+",
    yearsActive: "5 Years",
    availability: "Available for bookings",
    bio: "Aura.wav crafts delicate, breathtaking sonic landscapes from field recordings, modular synths, and processing algorithms. Their work is a translation of nature's chaos into crystalline structures of sound.",
    tags: ["Ambient", "IDM", "Modular", "Field Recordings"],
    upcoming: [
      { date: "JUN 21, 2026", venue: "Summer Solstice Sanctuary", city: "Bangalore, India" }
    ]
  },
  sonder: {
    id: "sonder",
    name: "SONDER",
    role: "Live Modular / Experimental",
    avatar: "/artists/artist3.jpg",
    location: "New Delhi, India",
    performances: "165+",
    yearsActive: "8 Years",
    availability: "Tentative",
    bio: "SONDER represents the realization that each random passerby is living a life as vivid and complex as one's own. No presets. No laptops. Just human emotion driving electrical current through copper wire.",
    tags: ["Live Modular", "Experimental", "Analog Synthesis"],
    upcoming: [
      { date: "AUG 10, 2026", venue: "National Art Gallery", city: "New Delhi, India" }
    ]
  }
};

export const ArtistDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [inquirySent, setInquirySent] = useState(false);

  const artistKey = id ? id.toLowerCase() : 'kryzen';
  const artist = ARTIST_DB[artistKey] || ARTIST_DB.kryzen;

  const handleInquiry = () => {
    playSFX('ticketClick');
    setInquirySent(true);
    setTimeout(() => setInquirySent(false), 4000);
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-6xl mx-auto flex flex-col gap-8 text-left">
      
      {/* FULL BLEED ARTIST HERO BANNER */}
      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] shadow-[12px_12px_0px_#4c1210] overflow-hidden flex flex-col md:flex-row">
        
        {/* AVATAR DISPLAY */}
        <div className="w-full md:w-1/2 h-80 md:h-auto bg-[#191410] border-b-4 md:border-b-0 md:border-r-4 border-[#191410] relative overflow-hidden">
          {artist.avatar ? (
            <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover grayscale" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-poster text-8xl text-[#ecdcaf]">
              {artist.name[0]}
            </div>
          )}

          <div className="absolute top-4 left-4 px-3 py-1 bg-[#191410] text-[#ecdcaf] font-mono text-[9px] font-bold uppercase border border-[#d1a437]">
            {artist.availability}
          </div>
        </div>

        {/* HERO DETAILS */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              ARTIST SPOTLIGHT // {artist.location}
            </span>
            <h1 className="font-poster text-5xl sm:text-7xl text-[#191410] leading-none">
              {artist.name}
            </h1>
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">{artist.role}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono text-xs border-y-2 border-[#191410] py-4">
            <div>
              <span className="text-[#241a12]/70 block text-[9px] uppercase">PERFORMANCES</span>
              <span className="font-poster text-3xl text-[#191410]">{artist.performances}</span>
            </div>
            <div>
              <span className="text-[#241a12]/70 block text-[9px] uppercase">YEARS ACTIVE</span>
              <span className="font-poster text-3xl text-[#191410]">{artist.yearsActive}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleInquiry}
              className="px-6 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] hover:bg-[#191410] transition-all"
            >
              SEND INQUIRY →
            </button>
            <button
              onClick={() => { playSFX('ticketClick'); navigate('/artist'); }}
              className="px-4 py-3 bg-[#e9decb] text-[#191410] font-mono text-xs font-bold uppercase border-2 border-[#191410]"
            >
              ← ROSTER
            </button>
          </div>
        </div>

      </div>

      {inquirySent && (
        <div className="p-4 bg-[#2e6834] text-[#ecdcaf] font-mono text-xs font-bold border-2 border-[#191410] shadow-[4px_4px_0px_#191410]">
          ✓ BOOKING INQUIRY TRANSMITTED TO {artist.name}'S MANAGEMENT!
        </div>
      )}

      {/* BIOGRAPHY & UPCOMING SHOWS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* BIO (2 COLS) */}
        <div className="md:col-span-2 bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[8px_8px_0px_#191410] flex flex-col gap-4">
          <span className="font-mono text-xs font-bold text-[#c2272a] uppercase border-b-2 border-[#191410] pb-2">BIOGRAPHY & SONIC PHILOSOPHY</span>
          <p className="font-sans text-sm text-[#241a12]/90 leading-relaxed font-normal">{artist.bio}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            {artist.tags.map((t) => (
              <span key={t} className="px-3 py-1 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold uppercase border border-[#191410]">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* UPCOMING SHOWS (1 COL) */}
        <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[8px_8px_0px_#191410] flex flex-col gap-4">
          <span className="font-mono text-xs font-bold text-[#c2272a] uppercase border-b-2 border-[#191410] pb-2">UPCOMING SHOWS</span>
          
          <div className="flex flex-col gap-3 font-mono text-xs">
            {artist.upcoming.map((show, idx) => (
              <div key={idx} className="p-3 bg-[#ecdcaf] border border-[#191410]">
                <span className="font-bold text-[#c2272a] block">{show.date}</span>
                <span className="text-[#191410] font-bold block">{show.venue}</span>
                <span className="text-[#241a12]/60 text-[10px] block">{show.city}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
