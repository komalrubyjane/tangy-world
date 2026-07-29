import AdminLayout from './AdminLayout';

export default function AdminPrivate() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <span className="font-mono text-xs font-bold text-[#315D73] uppercase">BESPOKE EVENTS</span>
          <h1 className="font-poster text-3xl text-[#ecdcaf]">PRIVATE SESSIONS INQUIRIES</h1>
        </div>
        <div className="bg-[#191410] border-2 border-[#315D73] p-5 text-left font-mono text-xs">
          <p className="text-[#ecdcaf]">✦ 7 PENDING PRIVATE GATHERING REQUESTS</p>
        </div>
      </div>
    </AdminLayout>
  );
}
