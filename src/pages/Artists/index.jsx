import { useState } from 'react';
import { Link } from 'react-router-dom';
import { artists } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { PageTransition } from '../../components/ui/PageTransition';

export default function ArtistsPage() {
  const { playSFX } = useAudio();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');

  const genres = ['ALL', 'Sufi', 'Violin', 'Folk', 'Ambient'];

  const filteredArtists = artists.filter((artist) => {
    const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          artist.genre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'ALL' || artist.genre.toLowerCase().includes(selectedGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#191410] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-10">
          
          {/* HEADER */}
          <div className="border-b-4 border-[#c2272a] pb-4 text-left">
            <span className="font-mono text-xs font-bold text-[#c2272a] tracking-[0.3em] uppercase">03 ARTISTS LINEAGE // DIRECTORY</span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">PERFORMING ARTISTS</h1>
            <p className="font-mono text-sm text-[#ecdcaf]/80">COMPOSERS, VOCALISTS, & INSTRUMENTALISTS IN THE TANGY LINEAGE</p>
          </div>

          {/* SEARCH & GENRE FILTER TOOLBAR */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#0d0a07] p-4 border-2 border-[#c2272a] shadow-md">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH ARTISTS BY NAME OR GENRE..."
              className="px-3 py-2 bg-[#191410] border border-[#ecdcaf]/30 font-mono text-xs text-[#ecdcaf] placeholder:text-[#ecdcaf]/50 outline-none flex-1"
            />

            <div className="flex gap-1.5 overflow-x-auto">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => { playSFX('ticketClick'); setSelectedGenre(g); }}
                  className={`px-3 py-1 font-mono text-[9px] font-bold uppercase border transition-all ${selectedGenre === g ? 'bg-[#c2272a] text-[#ecdcaf] border-[#ecdcaf]' : 'bg-[#191410] text-[#ecdcaf]/70 border-[#ecdcaf]/20 hover:border-[#d1a437]'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* ARTISTS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredArtists.map((artist) => {
              const slug = artist.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <div 
                  key={artist.id}
                  className="bg-[#ecdcaf] text-[#191410] border-2 border-[#191410] p-4 shadow-[6px_6px_0px_#c2272a] flex flex-col justify-between text-left group hover:scale-[1.02] transition-transform"
                >
                  <div className="flex flex-col gap-2">
                    <div className="aspect-square overflow-hidden border border-[#191410] relative">
                      <img 
                        src={artist.image} 
                        alt={artist.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <span className="absolute bottom-2 left-2 font-mono text-[8px] font-bold bg-[#c2272a] text-[#ecdcaf] px-2 py-0.5 uppercase">
                        {artist.genre}
                      </span>
                    </div>

                    <h3 className="font-poster text-2xl text-[#191410] my-1">{artist.name}</h3>
                    <p className="font-mono text-xs text-[#c2272a] font-bold">{artist.role}</p>
                    <p className="font-mono text-[10px] text-[#191410]/80 leading-relaxed truncate">{artist.bio}</p>
                  </div>

                  <Link
                    to={`/artists/${slug}`}
                    onClick={() => playSFX('ticketClick')}
                    className="w-full mt-4 py-2 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest text-center uppercase hover:bg-[#c2272a] transition-all"
                  >
                    VIEW PROFILE →
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
