import AdminLayout from './AdminLayout';
import { adminBookings } from '../../data/adminData';

export default function AdminBookings() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <span className="font-mono text-xs font-bold text-[#d1a437] uppercase">TICKET LEDGER</span>
          <h1 className="font-poster text-3xl text-[#ecdcaf]">ALL BOOKINGS</h1>
        </div>

        <div className="bg-[#191410] border-2 border-[#d1a437] p-5 overflow-x-auto">
          <table className="w-full font-mono text-xs text-left">
            <thead>
              <tr className="border-b border-[#ecdcaf]/20 text-[#d1a437]">
                <th className="py-2">BOOKING ID</th>
                <th className="py-2">BUYER</th>
                <th className="py-2">SESSION</th>
                <th className="py-2">DATE</th>
                <th className="py-2">QTY</th>
                <th className="py-2">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {adminBookings.map((b) => (
                <tr key={b.id} className="border-b border-[#ecdcaf]/10">
                  <td className="py-2.5 font-bold text-[#c2272a]">{b.id}</td>
                  <td className="py-2.5">{b.name}</td>
                  <td className="py-2.5">{b.event}</td>
                  <td className="py-2.5">{b.date}</td>
                  <td className="py-2.5">{b.qty}</td>
                  <td className="py-2.5 text-[#d1a437] font-bold">{b.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
