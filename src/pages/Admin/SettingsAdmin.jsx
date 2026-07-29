import AdminLayout from './AdminLayout';

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <span className="font-mono text-xs font-bold text-[#d1a437] uppercase">SYSTEM CONFIG</span>
          <h1 className="font-poster text-3xl text-[#ecdcaf]">ADMIN SETTINGS & SUPABASE INTEGRATION</h1>
        </div>
        <div className="bg-[#191410] border-2 border-[#d1a437] p-5 text-left font-mono text-xs flex flex-col gap-3">
          <div>
            <label className="block text-[#d1a437] mb-1">SUPABASE URL</label>
            <input type="text" readOnly value="https://xyz-tangy-world.supabase.co" className="w-full p-2 bg-[#0d0a07] border border-[#ecdcaf]/20" />
          </div>
          <div>
            <label className="block text-[#d1a437] mb-1">ANON API KEY</label>
            <input type="password" readOnly value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="w-full p-2 bg-[#0d0a07] border border-[#ecdcaf]/20" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
