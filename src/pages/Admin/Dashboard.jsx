import AdminLayout from './AdminLayout';
import { adminStats, adminBookings } from '../../data/adminData';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <span className="font-mono text-xs font-bold text-[#d1a437] uppercase">OVERVIEW</span>
          <h1 className="font-poster text-3xl text-[#ecdcaf]">CONTROL DASHBOARD</h1>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#191410] border-2 border-[#d1a437] p-4">
            <span className="font-mono text-[9px] text-[#d1a437] font-bold uppercase">TOTAL REVENUE</span>
            <h3 className="font-poster text-2xl text-[#ecdcaf] mt-1">{adminStats.totalRevenue}</h3>
          </div>
          <div className="bg-[#191410] border-2 border-[#c2272a] p-4">
            <span className="font-mono text-[9px] text-[#c2272a] font-bold uppercase">TICKETS SOLD</span>
            <h3 className="font-poster text-2xl text-[#ecdcaf] mt-1">{adminStats.ticketsSold}</h3>
          </div>
          <div className="bg-[#191410] border-2 border-[#315D73] p-4">
            <span className="font-mono text-[9px] text-[#315D73] font-bold uppercase">ACTIVE EVENTS</span>
            <h3 className="font-poster text-2xl text-[#ecdcaf] mt-1">{adminStats.activeEvents}</h3>
          </div>
          <div className="bg-[#191410] border-2 border-[#ecdcaf]/40 p-4">
            <span className="font-mono text-[9px] text-[#ecdcaf]/70 font-bold uppercase">CHECK-IN TODAY</span>
            <h3 className="font-poster text-2xl text-[#ecdcaf] mt-1">{adminStats.checkinCountToday}</h3>
          </div>
        </div>

        {/* RECENT BOOKINGS TABLE */}
        <div className="bg-[#191410] border-2 border-[#ecdcaf]/20 p-5 flex flex-col gap-3">
          <h3 className="font-poster text-xl text-[#ecdcaf]">RECENT BOOKINGS</h3>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs text-left">
              <thead>
                <tr className="border-b border-[#ecdcaf]/20 text-[#d1a437]">
                  <th className="py-2">ID</th>
                  <th className="py-2">NAME</th>
                  <th className="py-2">EVENT</th>
                  <th className="py-2">QTY</th>
                  <th className="py-2">AMOUNT</th>
                  <th className="py-2">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {adminBookings.map((b) => (
                  <tr key={b.id} className="border-b border-[#ecdcaf]/10">
                    <td className="py-2 font-bold">{b.id}</td>
                    <td className="py-2">{b.name}</td>
                    <td className="py-2">{b.event}</td>
                    <td className="py-2">{b.qty}</td>
                    <td className="py-2 text-[#d1a437] font-bold">{b.amount}</td>
                    <td className="py-2">
                      <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 border border-emerald-800 text-[9px]">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
