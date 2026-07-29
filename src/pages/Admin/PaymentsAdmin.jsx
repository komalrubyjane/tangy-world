import AdminLayout from './AdminLayout';
import { adminPayments } from '../../data/adminData';

export default function AdminPayments() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <span className="font-mono text-xs font-bold text-[#d1a437] uppercase">FINANCIAL TRANSACTIONS</span>
          <h1 className="font-poster text-3xl text-[#ecdcaf]">PAYMENTS LEDGER</h1>
        </div>

        <div className="bg-[#191410] border-2 border-[#d1a437] p-5 overflow-x-auto">
          <table className="w-full font-mono text-xs text-left">
            <thead>
              <tr className="border-b border-[#ecdcaf]/20 text-[#d1a437]">
                <th className="py-2">TXN ID</th>
                <th className="py-2">BUYER</th>
                <th className="py-2">METHOD</th>
                <th className="py-2">STATUS</th>
                <th className="py-2">AMOUNT</th>
                <th className="py-2">TIME</th>
              </tr>
            </thead>
            <tbody>
              {adminPayments.map((p) => (
                <tr key={p.txId} className="border-b border-[#ecdcaf]/10">
                  <td className="py-2 font-bold">{p.txId}</td>
                  <td className="py-2">{p.buyer}</td>
                  <td className="py-2">{p.method}</td>
                  <td className="py-2 text-emerald-400 font-bold">{p.status}</td>
                  <td className="py-2 text-[#d1a437] font-bold">{p.amount}</td>
                  <td className="py-2 text-[#ecdcaf]/60">{p.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
