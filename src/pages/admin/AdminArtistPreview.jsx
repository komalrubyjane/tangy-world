import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StaffAuthGate } from '../../admin/StaffAuthGate';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { supabase } from '../../lib/supabaseClient';
import { AdminPreviewBanner, Badge, Empty, fmtDate, StatTile } from '../dashboards/portal/PortalUI';

// The real artist portal (ArtistLayout + DashboardPage/ProfilePage/
// CalendarPage/MediaPage) is built entirely around the CURRENTLY
// AUTHENTICATED artist's own auth.uid() (see src/artist/contexts/
// AuthContext.jsx) — reusing it for a different artist would mean either
// impersonating that artist's session or hacking the context to resolve a
// different uid, both explicitly disallowed. This is a dedicated read-only
// summary instead, sourced from the same tables, under the admin's own real
// session (already permitted by "artists: admin full access" and friends —
// see 0002_rls.sql, 0011/0012/0013 migrations).
// Exported for reuse under a different auth gate if ever needed. Never
// render without an auth gate wrapping it (AdminArtistPreview below).
// The demo-admin build uses a separate static tour instead of this
// component — see src/pages/demoAdmin/DemoArtistDashboard.jsx for why.
export const AdminArtistPreviewInner = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [media, setMedia] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: a }, { data: avail }, { data: med }, { data: perf }, { data: reqs }] = await Promise.all([
      supabase.from('artists').select('*').eq('id', id).maybeSingle(),
      supabase.from('artist_availability').select('*').eq('artist_id', id).gte('date', new Date().toISOString().slice(0, 10)).order('date', { ascending: true }).limit(20),
      supabase.from('artist_media').select('*').eq('artist_id', id).order('created_at', { ascending: false }),
      supabase.from('event_artists').select('events(name, event_date, event_time, venue, status)').eq('artist_id', id),
      supabase.from('assignment_requests').select('*, events(name)').eq('artist_id', id).order('created_at', { ascending: false }),
    ]);
    setArtist(a || null);
    setAvailability(avail || []);
    setMedia(med || []);
    setPerformances((perf || []).map((p) => p.events).filter(Boolean));
    setRequests(reqs || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex items-center justify-center font-mono text-xs">LOADING...</div>;
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex flex-col items-center justify-center gap-3 font-mono text-xs">
        <span>Artist not found.</span>
        <Link to="/admin/preview/artist" className="underline text-[#C99A2E]">← Choose a different artist</Link>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcomingPerformances = performances.filter((p) => p.event_date >= today);

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C]">
      <Navbar />
      <AdminPreviewBanner label={`Viewing Artist Portal — ${artist.name}`} />

      <main className="pt-6 pb-20 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col gap-6">
        <div className="bg-[#191410] border-2 border-[#C99A2E] p-5 sm:p-7 shadow-[8px_8px_0px_#11100C] flex items-start gap-4">
          {artist.avatar_url ? (
            <img src={artist.avatar_url} alt={artist.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#B94717]" />
          ) : (
            <div className="w-16 h-16 shrink-0 rounded-full bg-[#E7D5A4] text-[#11100C] flex items-center justify-center font-condensed text-xl font-bold border-2 border-[#B94717]">
              {artist.name?.[0] || 'A'}
            </div>
          )}
          <div>
            <h1 className="font-condensed text-2xl font-bold uppercase">{artist.name}</h1>
            <p className="font-mono text-[10px] text-[#E7D5A4]/60">{artist.email}</p>
            <p className="font-mono text-[10px] text-[#E7D5A4]/60 mt-0.5">{artist.genre || 'Genre not set'} · {artist.city || 'City not set'}</p>
            <div className="mt-2"><Badge status={artist.status} /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Upcoming Shows" value={upcomingPerformances.length} />
          <StatTile label="Total Shows" value={performances.length} />
          <StatTile label="Media Files" value={media.length} />
          <StatTile label="Assignment Requests" value={requests.length} />
        </div>

        {artist.bio && (
          <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
            <h3 className="font-condensed text-base font-bold uppercase mb-2 text-[#C99A2E]">Bio</h3>
            <p className="font-mono text-xs text-[#E7D5A4]/80 whitespace-pre-wrap">{artist.bio}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-[#E7D5A4]/60">
              {artist.instagram && <span>IG: {artist.instagram}</span>}
              {artist.soundcloud && <span>SC: {artist.soundcloud}</span>}
              {artist.spotify && <span>Spotify: {artist.spotify}</span>}
            </div>
          </div>
        )}

        <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
          <h3 className="font-condensed text-base font-bold uppercase mb-3 text-[#C99A2E]">Upcoming Performances</h3>
          {upcomingPerformances.length === 0 ? <Empty>NO UPCOMING PERFORMANCES CONFIRMED.</Empty> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {upcomingPerformances.map((p) => (
                <div key={p.name + p.event_date} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                  <h4 className="font-condensed font-bold uppercase">{p.name}</h4>
                  <p className="font-mono text-[10px] mt-1">{fmtDate(p.event_date)} · {p.venue}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
          <h3 className="font-condensed text-base font-bold uppercase mb-3 text-[#C99A2E]">Availability (next 20 entries)</h3>
          {availability.length === 0 ? <Empty>NO AVAILABILITY SET.</Empty> : (
            <div className="flex flex-wrap gap-2">
              {availability.map((a) => (
                <span key={a.id} className="px-2.5 py-1 text-[10px] font-bold uppercase border border-[#C99A2E]/40">{a.date} · {a.status}</span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
          <h3 className="font-condensed text-base font-bold uppercase mb-3 text-[#C99A2E]">Media Uploads</h3>
          {media.length === 0 ? <Empty>NO MEDIA UPLOADED.</Empty> : (
            <div className="flex flex-col gap-2">
              {media.map((m) => (
                <div key={m.id} className="flex justify-between items-center bg-[#11100C] border border-[#C99A2E]/20 px-3 py-2 text-xs">
                  <span>{m.file_name}</span>
                  <Badge status={m.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
          <h3 className="font-condensed text-base font-bold uppercase mb-3 text-[#C99A2E]">Assignment Requests</h3>
          {requests.length === 0 ? <Empty>NO ASSIGNMENT REQUESTS ON FILE.</Empty> : (
            <div className="flex flex-col gap-2">
              {requests.map((r) => (
                <div key={r.id} className="flex justify-between items-center bg-[#11100C] border border-[#C99A2E]/20 px-3 py-2 text-xs">
                  <span>{r.events?.name || 'Session'}</span>
                  <Badge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export const AdminArtistPreview = () => (
  <StaffAuthGate title="ADMIN PREVIEW" subtitle="Inspecting an artist" allowedRoles={['admin', 'super_admin']}>
    <AdminArtistPreviewInner />
  </StaffAuthGate>
);
