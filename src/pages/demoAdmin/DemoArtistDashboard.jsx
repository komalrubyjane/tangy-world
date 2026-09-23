import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDemoAdmin } from '../../context/DemoAdminContext';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { DemoModeBanner } from './DemoModeBanner';
import { Badge, StatTile, fmtDate } from '../dashboards/portal/PortalUI';
import { DEMO_EVENTS } from './demoAdminData';

// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
//
// The real Artist Portal (ArtistLayout + DashboardPage/ProfilePage/
// CalendarPage/MediaPage) is built entirely around the CURRENTLY
// AUTHENTICATED artist's own auth.uid() (src/artist/contexts/AuthContext.jsx)
// — there is no real "artist row" to attach a demo session to without
// either impersonating a session or hacking that resolution, so unlike the
// other five role dashboards this is a purpose-built static tour, not a
// reuse of the real component. Every value below is inline, hardcoded,
// clearly labeled — never fetched, never written, never mistakeable for a
// real artist's data.
const DEMO_ARTIST = {
  name: 'Demo Artist',
  email: 'demo.artist@tangysessions.test',
  genre: 'Techno / Deep House',
  city: 'Hyderabad',
  bio: 'This is placeholder biography text for the internal team demo — no real artist is represented here.',
  instagram: '@demo.artist',
  soundcloud: 'soundcloud.com/demo-artist',
};

const DEMO_PERFORMANCES = [DEMO_EVENTS[0], DEMO_EVENTS[1]];
const DEMO_PAST_PERFORMANCES = [DEMO_EVENTS[2]];

const DEMO_AVAILABILITY = [
  { date: '2026-10-05', status: 'available' },
  { date: '2026-10-12', status: 'tentative' },
  { date: '2026-10-18', status: 'booked' },
];

const DEMO_MEDIA = [
  { name: 'Live Set — Stepwell Rehearsal.mp3', status: 'approved' },
  { name: 'Press Photo — Wide.jpg', status: 'approved' },
  { name: 'New Demo Track.wav', status: 'pending' },
];

const DEMO_REQUESTS = [
  { session: DEMO_EVENTS[0].name, status: 'accepted' },
  { session: DEMO_EVENTS[1].name, status: 'pending' },
];

export const DemoArtistDashboard = () => {
  const { enterDemo, isDemoAdmin, demoAdminEnabled } = useDemoAdmin();

  useEffect(() => {
    if (demoAdminEnabled) enterDemo();
  }, [demoAdminEnabled, enterDemo]);

  if (!demoAdminEnabled) {
    return (
      <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex flex-col items-center justify-center gap-3 font-mono text-xs">
        <span>Demo mode is not enabled in this build.</span>
        <Link to="/" className="underline text-[#C99A2E]">← Back to site</Link>
      </div>
    );
  }

  if (!isDemoAdmin) {
    return <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex items-center justify-center font-mono text-xs">ENTERING DEMO MODE...</div>;
  }

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C]">
      <Navbar />
      <DemoModeBanner />

      <main className="pt-6 pb-20 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col gap-6">
        <div className="bg-[#191410] border-2 border-[#C99A2E] p-5 sm:p-7 shadow-[8px_8px_0px_#11100C] flex items-start gap-4">
          <div className="w-16 h-16 shrink-0 rounded-full bg-[#E7D5A4] text-[#11100C] flex items-center justify-center font-display text-xl font-bold border-2 border-[#B94717]">
            D
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold uppercase">{DEMO_ARTIST.name}</h1>
            <p className="font-mono text-[10px] text-[#E7D5A4]/60">{DEMO_ARTIST.email}</p>
            <p className="font-mono text-[10px] text-[#E7D5A4]/60 mt-0.5">{DEMO_ARTIST.genre} · {DEMO_ARTIST.city}</p>
            <div className="mt-2"><Badge status="approved" /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Upcoming Shows" value={DEMO_PERFORMANCES.length} sub="demo data" />
          <StatTile label="Total Shows" value={DEMO_PERFORMANCES.length + DEMO_PAST_PERFORMANCES.length} sub="demo data" />
          <StatTile label="Media Files" value={DEMO_MEDIA.length} sub="demo data" />
          <StatTile label="Assignment Requests" value={DEMO_REQUESTS.length} sub="demo data" />
        </div>

        <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
          <h3 className="font-display text-base font-bold uppercase mb-2 text-[#C99A2E]">Bio</h3>
          <p className="font-mono text-xs text-[#E7D5A4]/80 whitespace-pre-wrap">{DEMO_ARTIST.bio}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-[#E7D5A4]/60">
            <span>IG: {DEMO_ARTIST.instagram}</span>
            <span>SC: {DEMO_ARTIST.soundcloud}</span>
          </div>
        </div>

        <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
          <h3 className="font-display text-base font-bold uppercase mb-3 text-[#C99A2E]">Upcoming Performances</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_PERFORMANCES.map((p) => (
              <div key={p.id} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                <h4 className="font-display font-bold uppercase">{p.name}</h4>
                <p className="font-mono text-[10px] mt-1">{fmtDate(p.event_date)} · {p.venue}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
          <h3 className="font-display text-base font-bold uppercase mb-3 text-[#C99A2E]">Availability Calendar (demo)</h3>
          <div className="flex flex-wrap gap-2">
            {DEMO_AVAILABILITY.map((a) => (
              <span key={a.date} className="px-2.5 py-1 text-[10px] font-bold uppercase border border-[#C99A2E]/40">{a.date} · {a.status}</span>
            ))}
          </div>
          <p className="font-mono text-[9px] text-[#E7D5A4]/40 mt-3">Real artists set this themselves — nothing here is saved in this tour.</p>
        </div>

        <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
          <h3 className="font-display text-base font-bold uppercase mb-3 text-[#C99A2E]">Media Uploads (demo)</h3>
          <div className="flex flex-col gap-2">
            {DEMO_MEDIA.map((m) => (
              <div key={m.name} className="flex justify-between items-center bg-[#11100C] border border-[#C99A2E]/20 px-3 py-2 text-xs">
                <span>{m.name}</span>
                <Badge status={m.status} />
              </div>
            ))}
          </div>
          <p className="font-mono text-[9px] text-[#E7D5A4]/40 mt-3">Uploads are disabled in this tour — the real Media Manager uses Supabase Storage.</p>
        </div>

        <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
          <h3 className="font-display text-base font-bold uppercase mb-3 text-[#C99A2E]">Assignment Requests (demo)</h3>
          <div className="flex flex-col gap-2">
            {DEMO_REQUESTS.map((r) => (
              <div key={r.session} className="flex justify-between items-center bg-[#11100C] border border-[#C99A2E]/20 px-3 py-2 text-xs">
                <span>{r.session}</span>
                <Badge status={r.status === 'accepted' ? 'approved' : r.status} />
              </div>
            ))}
          </div>
        </div>

        {DEMO_PAST_PERFORMANCES.length > 0 && (
          <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
            <h3 className="font-display text-base font-bold uppercase mb-3 text-[#C99A2E]">Past Performances</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_PAST_PERFORMANCES.map((p) => (
                <div key={p.id} className="bg-[#11100C] border-2 border-[#C99A2E]/30 p-3">
                  <h4 className="font-display font-bold uppercase">{p.name}</h4>
                  <p className="font-mono text-[10px] text-[#E7D5A4]/70 mt-1">{fmtDate(p.event_date)} · {p.venue}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
