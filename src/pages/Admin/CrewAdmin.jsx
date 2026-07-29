import AdminLayout from './AdminLayout';

export default function AdminCrew() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <span className="font-mono text-xs font-bold text-[#ecdcaf] uppercase">VOLUNTEER DESK</span>
          <h1 className="font-poster text-3xl text-[#ecdcaf]">CREW & AUDITIONS ADMIN</h1>
        </div>
        <div className="bg-[#191410] border-2 border-[#ecdcaf]/20 p-6 text-left font-mono text-xs">
          <p>✦ 14 NEW VOLUNTEER APPLICATIONS PENDING REVIEW</p>
          <p className="mt-2 text-[#d1a437]">✦ 5 ARTIST AUDITION TAPES SUBMITTED THIS WEEK</p>
        </div>
      </div>
    </AdminLayout>
  );
}
