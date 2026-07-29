import AdminLayout from './AdminLayout';
import { founders } from '../../data/mockData';

export default function AdminFounders() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <span className="font-mono text-xs font-bold text-[#d1a437] uppercase">HISTORICAL EDITORIAL</span>
          <h1 className="font-poster text-3xl text-[#ecdcaf]">FOUNDERS STORY EDIT</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {founders.map((f) => (
            <div key={f.id} className="bg-[#191410] border border-[#d1a437] p-4 text-left">
              <span className="font-mono text-[9px] text-[#c2272a] uppercase">{f.role}</span>
              <h3 className="font-poster text-xl text-[#ecdcaf]">{f.name}</h3>
              <p className="font-sans text-xs text-[#ecdcaf]/80 mt-2">{f.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
