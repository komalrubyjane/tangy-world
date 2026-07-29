import { useState } from 'react';
import AdminLayout from './AdminLayout';

export default function AdminCheckin() {
  const [scannedId, setScannedId] = useState('');
  const [checkinMsg, setCheckinMsg] = useState(null);

  const handleCheckin = (e) => {
    e.preventDefault();
    if (!scannedId) return;
    setCheckinMsg(`✓ CHECK-IN SUCCESSFUL FOR TICKET ${scannedId.toUpperCase()}`);
    setScannedId('');
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-xl">
        <div>
          <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">GATE ENTRY SYSTEM</span>
          <h1 className="font-poster text-3xl text-[#ecdcaf]">TICKET CHECK-IN TERMINAL</h1>
        </div>

        <form onSubmit={handleCheckin} className="bg-[#191410] border-4 border-[#c2272a] p-6 flex flex-col gap-4 text-left shadow-lg">
          <label className="font-mono text-xs text-[#d1a437]">ENTER / SCAN TICKET STUB ID</label>
          <input 
            type="text"
            required
            value={scannedId}
            onChange={(e) => setScannedId(e.target.value)}
            placeholder="e.g. BK-9081 OR #09100"
            className="p-3 bg-[#0d0a07] border border-[#ecdcaf]/40 font-mono text-base text-[#ecdcaf] outline-none"
          />

          <button 
            type="submit"
            className="w-full py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border border-[#ecdcaf] hover:bg-[#d1a437] hover:text-[#191410] transition-all"
          >
            VALIDATE & STAMP TICKET →
          </button>
        </form>

        {checkinMsg && (
          <div className="p-4 bg-[#e9decb] text-[#191410] font-mono text-xs font-bold border-2 border-[#191410] text-center shadow">
            {checkinMsg}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
