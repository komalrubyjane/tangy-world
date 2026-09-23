import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { StaffAuthGate } from '../../admin/StaffAuthGate';
import { supabase } from '../../lib/supabaseClient';

// Picking WHO to inspect before previewing a role's portal. Every query here
// reads through the admin's own real session — the existing "*_profiles:
// admin full access" / "profiles: admin read all" RLS policies (see
// 0002_rls.sql, 0006_role_profiles.sql) already grant this, so no new
// backend access was needed for Phase 4.
const ROLE_CONFIG = {
  patron: {
    label: 'Patron',
    icon: '🎟',
    query: async (search) => {
      let q = supabase.from('profiles').select('id, full_name, email, role').order('member_since', { ascending: false }).limit(50);
      if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data } = await q;
      return (data || []).map((p) => ({ id: p.id, name: p.full_name || p.email, sub: p.email }));
    },
  },
  crew: {
    label: 'Crew',
    icon: '🎬',
    query: async (search) => {
      let q = supabase.from('crew_profiles').select('id, department, profiles(full_name, email)').limit(50);
      const { data } = await q;
      let rows = (data || []).map((r) => ({ id: r.id, name: r.profiles?.full_name || r.profiles?.email, sub: [r.department, r.profiles?.email].filter(Boolean).join(' · ') }));
      if (search) rows = rows.filter((r) => r.name?.toLowerCase().includes(search.toLowerCase()));
      return rows;
    },
  },
  volunteer: {
    label: 'Volunteer',
    icon: '🤝',
    query: async (search) => {
      const { data } = await supabase.from('volunteer_profiles').select('id, availability, profiles(full_name, email)').limit(50);
      let rows = (data || []).map((r) => ({ id: r.id, name: r.profiles?.full_name || r.profiles?.email, sub: [r.availability, r.profiles?.email].filter(Boolean).join(' · ') }));
      if (search) rows = rows.filter((r) => r.name?.toLowerCase().includes(search.toLowerCase()));
      return rows;
    },
  },
  vendor: {
    label: 'Vendor',
    icon: '🍵',
    query: async (search) => {
      const { data } = await supabase.from('vendor_profiles').select('id, business_name, profiles(full_name, email)').limit(50);
      let rows = (data || []).map((r) => ({ id: r.id, name: r.business_name || r.profiles?.full_name || r.profiles?.email, sub: r.profiles?.email }));
      if (search) rows = rows.filter((r) => r.name?.toLowerCase().includes(search.toLowerCase()));
      return rows;
    },
  },
  sponsor: {
    label: 'Sponsor',
    icon: '✦',
    query: async (search) => {
      const { data } = await supabase.from('sponsor_profiles').select('id, organization_name, profiles(full_name, email)').limit(50);
      let rows = (data || []).map((r) => ({ id: r.id, name: r.organization_name || r.profiles?.full_name || r.profiles?.email, sub: r.profiles?.email }));
      if (search) rows = rows.filter((r) => r.name?.toLowerCase().includes(search.toLowerCase()));
      return rows;
    },
  },
  venue: {
    label: 'Venue / Host',
    icon: '🏛',
    query: async (search) => {
      const { data } = await supabase.from('venue_profiles').select('id, property_name, profiles(full_name, email)').limit(50);
      let rows = (data || []).map((r) => ({ id: r.id, name: r.property_name || r.profiles?.full_name || r.profiles?.email, sub: r.profiles?.email }));
      if (search) rows = rows.filter((r) => r.name?.toLowerCase().includes(search.toLowerCase()));
      return rows;
    },
  },
  artist: {
    label: 'Artist',
    icon: '🎸',
    query: async (search) => {
      let q = supabase.from('artists').select('id, name, email, status').order('applied_at', { ascending: false }).limit(50);
      if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data } = await q;
      return (data || []).map((a) => ({ id: a.id, name: a.name, sub: `${a.email} · ${a.status}` }));
    },
  },
};

// Exported for reuse under a different auth gate if ever needed. Never
// render this without an auth gate wrapping it (AdminEntitySelector below).
// The demo-admin build doesn't use this — a demo session has no real
// database rows to pick from (RLS blocks everything without a real admin
// session), so it goes straight to a synthetic per-role dashboard instead;
// see src/pages/demoAdmin/DemoRoleDashboard.jsx.
export const AdminEntitySelectorInner = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const config = ROLE_CONFIG[role];
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    setLoading(true);
    config.query(search).then((r) => { if (!cancelled) { setRows(r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [config, search]);

  const previewPath = useMemo(() => (id) => (role === 'artist' ? `/admin/preview/artist/${id}` : `/admin/preview/${role}/${id}`), [role]);

  if (!config) {
    return (
      <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex items-center justify-center font-mono text-xs">
        Unknown portal type. <Link to="/admin" className="underline ml-2">Back to Control Room</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono">
      <Navbar />
      <main className="pt-24 sm:pt-28 pb-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="bg-[#191410] border-2 border-[#C99A2E] p-5 sm:p-7 shadow-[8px_8px_0px_#11100C]">
          <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase tracking-widest block mb-1">ADMIN PREVIEW · {config.label.toUpperCase()} PORTAL</span>
          <h1 className="font-condensed text-2xl font-bold uppercase mb-4">SELECT {config.label.toUpperCase()} TO INSPECT</h1>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${config.label.toLowerCase()} by name or email...`}
            className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2.5 text-xs text-[#E7D5A4] focus:outline-none focus:border-[#C99A2E] mb-4"
          />

          {loading ? (
            <div className="p-8 text-center font-mono text-xs opacity-50">LOADING...</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs font-bold text-[#E7D5A4]/50 border-2 border-dashed border-[#C99A2E]/30">
              NO APPROVED {config.label.toUpperCase()}S FOUND{search ? ' MATCHING YOUR SEARCH' : ' YET'}.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {rows.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(previewPath(r.id))}
                  className="text-left flex items-center justify-between gap-3 bg-[#11100C] border border-[#C99A2E]/30 hover:border-[#C99A2E] px-4 py-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{r.name}</div>
                    {r.sub && <div className="text-[10px] text-[#E7D5A4]/60 truncate">{r.sub}</div>}
                  </div>
                  <span className="text-[9px] font-bold uppercase text-[#C99A2E] shrink-0">INSPECT →</span>
                </button>
              ))}
            </div>
          )}

          <Link to="/admin" className="inline-block mt-6 text-[10px] font-bold uppercase tracking-wider text-[#E7D5A4]/60 hover:text-[#E7D5A4] underline">
            ← Back to Control Room
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export const AdminEntitySelector = () => (
  <StaffAuthGate title="ADMIN PREVIEW" subtitle="Select an account to inspect" allowedRoles={['admin', 'super_admin']}>
    <AdminEntitySelectorInner />
  </StaffAuthGate>
);
