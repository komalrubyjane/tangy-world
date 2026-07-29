import AdminLayout from './AdminLayout';
import { gallery } from '../../data/mockData';

export default function AdminGallery() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-mono text-xs font-bold text-[#315D73] uppercase">MEDIA VAULT</span>
            <h1 className="font-poster text-3xl text-[#ecdcaf]">GALLERY MANAGEMENT</h1>
          </div>
          <button className="px-4 py-2 bg-[#315D73] text-[#ecdcaf] font-mono text-xs font-bold uppercase border border-[#ecdcaf]">
            + UPLOAD PHOTO / FILM
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {gallery.map((g) => (
            <div key={g.id} className="bg-[#191410] border border-[#ecdcaf]/20 p-2 text-left">
              <img src={g.src} alt={g.label} className="w-full aspect-square object-cover" />
              <span className="font-mono text-[9px] text-[#d1a437] block mt-1">{g.emoji} {g.label}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
