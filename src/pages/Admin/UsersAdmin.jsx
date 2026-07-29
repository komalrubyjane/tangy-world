import AdminLayout from './AdminLayout';

export default function AdminUsers() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">COMMUNITY ROSTER</span>
          <h1 className="font-poster text-3xl text-[#ecdcaf]">MEMBERS & USERS</h1>
        </div>
        <div className="bg-[#191410] border-2 border-[#c2272a] p-5 text-left font-mono text-xs">
          <p className="text-[#ecdcaf]">✦ 582 REGISTERED PASSPORT RESIDENTS</p>
        </div>
      </div>
    </AdminLayout>
  );
}
