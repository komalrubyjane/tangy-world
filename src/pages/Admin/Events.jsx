import AdminLayout from './AdminLayout';
import { events } from '../../data/mockData';

export default function AdminEvents() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-mono text-xs font-bold text-[#d1a437] uppercase">CATALOG MANAGEMENT</span>
            <h1 className="font-poster text-3xl text-[#ecdcaf]">EVENTS MANAGEMENT</h1>
          </div>
          <button className="px-4 py-2 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border border-[#ecdcaf]">
            + ADD NEW EVENT
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((evt) => (
            <div key={evt.id} className="bg-[#191410] border-2 border-[#d1a437] p-4 flex gap-4 items-center">
              <img src={evt.image} alt={evt.title} className="w-24 h-24 object-cover border border-[#ecdcaf]/20" />
              <div className="flex-1 text-left">
                <span className="font-mono text-[9px] text-[#c2272a] font-bold">{evt.city} · {evt.status}</span>
                <h3 className="font-poster text-xl text-[#ecdcaf]">{evt.title}</h3>
                <p className="font-mono text-xs text-[#ecdcaf]/70">{evt.venue} · {evt.date}</p>
                <p className="font-mono text-xs text-[#d1a437] font-bold mt-1">TICKET: {evt.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
