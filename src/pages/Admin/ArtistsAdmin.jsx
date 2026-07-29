import AdminLayout from './AdminLayout';
import { artists } from '../../data/mockData';

export default function AdminArtists() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">LINEAGE MANAGMENT</span>
            <h1 className="font-poster text-3xl text-[#ecdcaf]">ARTISTS DIRECTORY ADMIN</h1>
          </div>
          <button className="px-4 py-2 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border border-[#ecdcaf]">
            + ADD NEW ARTIST
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {artists.map((artist) => (
            <div key={artist.id} className="bg-[#191410] border border-[#ecdcaf]/20 p-4 text-left flex gap-3 items-center">
              <img src={artist.image} alt={artist.name} className="w-16 h-16 object-cover border border-[#191410]" />
              <div>
                <span className="font-mono text-[9px] text-[#c2272a] uppercase">{artist.genre}</span>
                <h3 className="font-poster text-lg text-[#ecdcaf]">{artist.name}</h3>
                <p className="font-mono text-xs text-[#ecdcaf]/70">{artist.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
