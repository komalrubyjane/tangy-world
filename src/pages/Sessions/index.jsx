import { useState } from 'react';
import { Link } from 'react-router-dom';
import { events } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { PageTransition } from '../../components/ui/PageTransition';

export default function SessionsPage({ onSelectBooking }) {
  const { playSFX } = useAudio();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const tags = ['ALL', 'Sufi', 'Acoustic', 'Violin', 'Heritage', 'Fusion'];

  const filteredEvents = events.filter((evt) => {
    const matchesSearch = evt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          evt.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          evt.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'ALL' || (evt.tags && evt.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#3c0f0e] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          
          {/* HEADER */}
          <div className="border-b-4 border-[#d1a437] pb-4 text-left">
            <span className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em] uppercase">02 SESSIONS ARCHIVE // SEARCH & CATALOG</span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">CONCERT SESSIONS</h1>
            <p className="font-mono text-sm text-[#ecdcaf]/80">LIVE ARCHIVE OF MUSIC RITUALS IN HISTORIC SANCTUARIES</p>
          </div>

          {/* SEARCH, FILTER & TOGGLE TOOLBAR */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#191410] p-4 border-2 border-[#d1a437] shadow-md">
            {/* Search Input */}
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH SESSIONS, ARTISTS, VENUES..."
              className="px-3 py-2 bg-[#0d0a07] border border-[#ecdcaf]/30 font-mono text-xs text-[#ecdcaf] placeholder:text-[#ecdcaf]/50 outline-none flex-1"
            />

            {/* Tag Filters */}
            <div className="flex gap-1.5 overflow-x-auto">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => { playSFX('ticketClick'); setSelectedTag(tag); }}
                  className={`px-2.5 py-1 font-mono text-[9px] font-bold uppercase border transition-all ${selectedTag === tag ? 'bg-[#c2272a] text-[#ecdcaf] border-[#ecdcaf]' : 'bg-[#0d0a07] text-[#ecdcaf]/70 border-[#ecdcaf]/20 hover:border-[#d1a437]'}`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Grid/List Toggle */}
            <div className="flex border border-[#ecdcaf]/30 font-mono text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 uppercase ${viewMode === 'grid' ? 'bg-[#d1a437] text-[#191410] font-bold' : 'bg-[#0d0a07] text-[#ecdcaf]'}`}
              >
                GRID ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 uppercase ${viewMode === 'list' ? 'bg-[#d1a437] text-[#191410] font-bold' : 'bg-[#0d0a07] text-[#ecdcaf]'}`}
              >
                LIST ☰
              </button>
            </div>
          </div>

          {/* SESSIONS CONTENT DISPLAY */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((evt) => (
                <div 
                  key={evt.id} 
                  className="bg-[#191410] border-2 border-[#d1a437] p-5 shadow-[8px_8px_0px_#4c1210] flex flex-col justify-between text-left group hover:border-[#ecdcaf] transition-all"
                >
                  <div className="flex flex-col gap-3">
                    <div className="relative aspect-[4/3] overflow-hidden border border-[#ecdcaf]/20">
                      <img 
                        src={evt.image} 
                        alt={evt.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <span className="absolute top-2 left-2 font-mono text-[9px] font-bold bg-[#c2272a] text-[#ecdcaf] px-2.5 py-0.5 uppercase shadow">
                        {evt.city} · {evt.status}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] font-bold text-[#d1a437] uppercase">{evt.venue} · {evt.date}</span>
                    <h3 className="font-poster text-2xl text-[#ecdcaf] leading-tight">{evt.title}</h3>
                    <p className="font-mono text-xs text-[#c2272a] font-bold">{evt.artist}</p>
                    <p className="font-sans text-xs text-[#ecdcaf]/80 leading-relaxed">{evt.description}</p>
                  </div>

                  <div className="flex flex-col gap-2 mt-6 pt-3 border-t border-[#ecdcaf]/10">
                    <Link
                      to={`/sessions/${evt.slug}`}
                      onClick={() => playSFX('ticketClick')}
                      className="w-full py-2 bg-[#d1a437] text-[#191410] font-mono text-xs font-bold tracking-widest text-center uppercase hover:bg-[#ecdcaf] transition-all"
                    >
                      EXPLORE SESSION STORY →
                    </Link>

                    <button
                      onClick={() => { playSFX('ticketClick'); onSelectBooking && onSelectBooking(evt); }}
                      className="w-full py-2 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#191410] border border-[#c2272a] transition-all"
                    >
                      ADMIT ONE TICKET ({evt.price})
                    </button>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredEvents.map((evt) => (
                <div 
                  key={evt.id}
                  className="bg-[#191410] border-2 border-[#d1a437] p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-left shadow-md"
                >
                  <img src={evt.image} alt={evt.title} className="w-full md:w-48 aspect-[16/9] object-cover border border-[#ecdcaf]/20" />
                  <div className="flex-1">
                    <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase">{evt.venue} · {evt.date}</span>
                    <h3 className="font-poster text-2xl text-[#ecdcaf]">{evt.title}</h3>
                    <p className="font-mono text-xs text-[#d1a437]">{evt.artist}</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Link
                      to={`/sessions/${evt.slug}`}
                      className="px-4 py-2 bg-[#d1a437] text-[#191410] font-mono text-xs font-bold uppercase hover:bg-[#ecdcaf]"
                    >
                      STORY →
                    </Link>
                    <button
                      onClick={() => onSelectBooking && onSelectBooking(evt)}
                      className="px-4 py-2 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase hover:bg-[#191410]"
                    >
                      TICKET ({evt.price})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
