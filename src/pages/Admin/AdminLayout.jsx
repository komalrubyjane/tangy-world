import { Link, useLocation } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const location = useLocation();

  const adminLinks = [
    { label: "📊 DASHBOARD", path: "/admin/dashboard" },
    { label: "🎟️ EVENTS", path: "/admin/events" },
    { label: "📄 BOOKINGS", path: "/admin/bookings" },
    { label: "🎤 ARTISTS", path: "/admin/artists" },
    { label: "🖼️ GALLERY", path: "/admin/gallery" },
    { label: "👥 CREW", path: "/admin/crew" },
    { label: "🏛️ FOUNDERS", path: "/admin/founders" },
    { label: "🔒 PRIVATE", path: "/admin/private" },
    { label: "💳 PAYMENTS", path: "/admin/payments" },
    { label: "👤 USERS", path: "/admin/users" },
    { label: "⚙️ SETTINGS", path: "/admin/settings" },
    { label: "🎟️ CHECK-IN", path: "/admin/checkin" }
  ];

  return (
    <div className="w-full min-h-screen bg-[#0d0a07] text-[#ecdcaf] flex flex-col md:flex-row pt-14 text-left">
      {/* ADMIN SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#191410] border-r-2 border-[#d1a437] p-5 flex flex-col gap-6">
        <div className="border-b border-[#ecdcaf]/20 pb-3">
          <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-widest uppercase">CONTROL DESK</span>
          <h2 className="font-poster text-xl text-[#ecdcaf]">TANGY ADMIN</h2>
        </div>

        <nav className="flex flex-col gap-1 font-mono text-xs">
          {adminLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`p-2 rounded border transition-all ${location.pathname === link.path ? 'bg-[#c2272a] text-[#ecdcaf] border-[#ecdcaf] font-bold' : 'bg-[#0d0a07] text-[#ecdcaf]/70 border-[#ecdcaf]/10 hover:border-[#d1a437]'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* ADMIN MAIN CONTENT */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
