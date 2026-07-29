import { useState } from 'react';
import { gallery } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { PageTransition } from '../../components/ui/PageTransition';

export default function GalleryPage() {
  const { playSFX } = useAudio();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [lightboxImg, setLightboxImg] = useState(null);

  const categories = ['ALL', 'Events', 'Artists', 'Venues', 'Backstage'];

  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#191410] text-[#ecdcaf] pt-20 pb-28 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          
          {/* HEADER */}
          <div className="border-b-4 border-[#d1a437] pb-4 text-left">
            <span className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em] uppercase">11 MASONRY GALLERY // LIGHTBOX VIEWER</span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] uppercase my-2">PHOTO & FILM GALLERY</h1>
            <p className="font-mono text-sm text-[#ecdcaf]/80">RAW MOMENTS FROM THE STEPWELLS & HERITAGE SANCTUARIES</p>
          </div>

          {/* FILTER BAR */}
          <div className="flex gap-2 border-b border-[#ecdcaf]/20 pb-3 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { playSFX('ticketClick'); setSelectedCategory(cat); }}
                className={`px-4 py-1.5 font-mono text-xs font-bold uppercase border transition-all ${selectedCategory === cat ? 'bg-[#c2272a] text-[#ecdcaf] border-[#ecdcaf]' : 'bg-[#0d0a07] text-[#ecdcaf]/70 border-[#ecdcaf]/20 hover:border-[#d1a437]'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* MASONRY GALLERY GRID */}
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {gallery.map((item) => (
              <div 
                key={item.id}
                onClick={() => { playSFX('ticketClick'); setLightboxImg(item); }}
                className="break-inside-avoid bg-[#0d0a07] border-2 border-[#ecdcaf]/20 p-2 shadow-md hover:border-[#d1a437] cursor-pointer group transition-all"
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={item.src} 
                    alt={item.label} 
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="font-mono text-xs font-bold text-[#ecdcaf]">{item.emoji} {item.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* LIGHTBOX FULLSCREEN VIEWER */}
          {lightboxImg && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
              <div onClick={() => setLightboxImg(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <div className="relative max-w-4xl max-h-[90vh] bg-[#191410] border-4 border-[#d1a437] p-3 z-10 flex flex-col items-center">
                <button 
                  onClick={() => setLightboxImg(null)}
                  className="absolute top-4 right-4 font-mono text-xs font-bold bg-[#c2272a] text-[#ecdcaf] px-3 py-1 border border-[#ecdcaf]"
                >
                  ✕ CLOSE
                </button>
                <img src={lightboxImg.src} alt={lightboxImg.label} className="max-h-[80vh] w-auto object-contain border border-[#ecdcaf]/20" />
                <span className="font-mono text-xs text-[#d1a437] font-bold mt-2">{lightboxImg.emoji} {lightboxImg.label}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
