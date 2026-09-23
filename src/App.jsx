import { useState, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { LenisProvider } from './components/layout/LenisProvider';
import { CursorProvider } from './hooks/useCursor';
import { AudioProvider } from './audio/AudioContext';
import { UserAuthProvider } from './context/UserAuthContext';
import { DemoAdminProvider } from './context/DemoAdminContext';
import { CustomCursor } from './components/ui/CustomCursor';
import { Navbar } from './components/layout/Navbar';
import { Menu } from './components/sections/Menu';
import { CurtainOverlay } from './components/ui/CurtainOverlay';
import { MicNavRail } from './components/ui/MicNavRail';

// Museum Interactive Modals & Dock
import { CassetteSoundArchiveModal } from './components/museum/CassetteSoundArchiveModal';
import { VinylRecordPlayerModal } from './components/museum/VinylRecordPlayerModal';
import { ProgrammeBoardModal } from './components/museum/ProgrammeBoardModal';
import { ArchiveSpreadModal } from './components/museum/ArchiveSpreadModal';
import { GlobalDock } from './components/museum/GlobalDock';

// Dedicated Standalone Pages
const CollaboratePage = lazy(() => import('./pages/CollaboratePage').then((m) => ({ default: m.CollaboratePage })));
const BookingPage = lazy(() => import('./pages/BookingPage').then((m) => ({ default: m.BookingPage })));
const CrewPage = lazy(() => import('./pages/CrewPage').then((m) => ({ default: m.CrewPage })));
const PrivateSessionsPage = lazy(() => import('./pages/PrivateSessionsPage').then((m) => ({ default: m.PrivateSessionsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const SessionsPage = lazy(() => import('./pages/SessionsPage').then((m) => ({ default: m.SessionsPage })));
const ArchivePage = lazy(() => import('./pages/ArchivePage').then((m) => ({ default: m.ArchivePage })));
const VendorApplyPage = lazy(() => import('./pages/VendorApplyPage').then((m) => ({ default: m.VendorApplyPage })));
const SponsorApplyPage = lazy(() => import('./pages/SponsorApplyPage').then((m) => ({ default: m.SponsorApplyPage })));
const VenueHostApplyPage = lazy(() => import('./pages/VenueHostApplyPage').then((m) => ({ default: m.VenueHostApplyPage })));
const BlogsPage = lazy(() => import('./pages/BlogsPage').then((m) => ({ default: m.BlogsPage })));
const InnerCirclePage = lazy(() => import('./pages/InnerCirclePage').then((m) => ({ default: m.InnerCirclePage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const AdminEntitySelector = lazy(() => import('./pages/admin/AdminEntitySelector').then((m) => ({ default: m.AdminEntitySelector })));
const AdminPortalPreview = lazy(() => import('./pages/admin/AdminPortalPreview').then((m) => ({ default: m.AdminPortalPreview })));
const AdminArtistPreview = lazy(() => import('./pages/admin/AdminArtistPreview').then((m) => ({ default: m.AdminArtistPreview })));

// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
const DemoAdminLogin = lazy(() => import('./pages/demoAdmin/DemoAdminLogin').then((m) => ({ default: m.DemoAdminLogin })));
const DemoControlRoom = lazy(() => import('./pages/demoAdmin/DemoControlRoom').then((m) => ({ default: m.DemoControlRoom })));
const DemoRoleDashboard = lazy(() => import('./pages/demoAdmin/DemoRoleDashboard').then((m) => ({ default: m.DemoRoleDashboard })));
const DemoArtistDashboard = lazy(() => import('./pages/demoAdmin/DemoArtistDashboard').then((m) => ({ default: m.DemoArtistDashboard })));
const TangyWorldCheckInPage = lazy(() => import('./admin/TangyWorldCheckInPage').then((m) => ({ default: m.TangyWorldCheckInPage })));
const PassportProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

// Artist Portal Migration Imports
const ArtistLayout = lazy(() => import('./artist/layouts/ArtistLayout').then((m) => ({ default: m.ArtistLayout })));
import { ArtistProtectedRoute } from './artist/components/ArtistProtectedRoute';
const LoginPage = lazy(() => import('./artist/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./artist/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./artist/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProfilePage = lazy(() => import('./artist/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const CalendarPage = lazy(() => import('./artist/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const ArtistsDirectoryPage = lazy(() => import('./artist/pages/ArtistsDirectoryPage').then((m) => ({ default: m.ArtistsDirectoryPage })));
const ArtistDetailsPage = lazy(() => import('./artist/pages/ArtistDetailsPage').then((m) => ({ default: m.ArtistDetailsPage })));
const MediaPage = lazy(() => import('./artist/pages/MediaPage').then((m) => ({ default: m.MediaPage })));
const SettingsPage = lazy(() => import('./artist/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

// Real, role-based account dashboards — backed by Supabase Auth
// (UserAuthContext) + RLS, gated by ProtectedRoute (not the removed mock
// account system).
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardRedirect } from './components/auth/DashboardRedirect';
const JoinPage = lazy(() => import('./pages/join/JoinPage').then((m) => ({ default: m.JoinPage })));
const JoinLoginPage = lazy(() => import('./pages/join/JoinLoginPage').then((m) => ({ default: m.JoinLoginPage })));
const VendorDashboard = lazy(() => import('./pages/dashboards/VendorDashboard').then((m) => ({ default: m.VendorDashboard })));
const CrewDashboard = lazy(() => import('./pages/dashboards/CrewDashboard').then((m) => ({ default: m.CrewDashboard })));
const VolunteerDashboard = lazy(() => import('./pages/dashboards/VolunteerDashboard').then((m) => ({ default: m.VolunteerDashboard })));
const SponsorDashboard = lazy(() => import('./pages/dashboards/SponsorDashboard').then((m) => ({ default: m.SponsorDashboard })));
const VenueDashboard = lazy(() => import('./pages/dashboards/VenueDashboard').then((m) => ({ default: m.VenueDashboard })));
const PrivateDashboard = lazy(() => import('./pages/dashboards/PrivateDashboard').then((m) => ({ default: m.PrivateDashboard })));

// Public Tangy AI assistant
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage').then((m) => ({ default: m.AIAssistantPage })));
import { TangyAssistantLauncher } from './components/ai/TangyAssistantLauncher';

// Announcement character overlay (admin-authored, publicly triggered)
import { AnnouncementCharacterOverlay } from './components/announcements/AnnouncementCharacterOverlay';
import { useAnnouncementTrigger } from './hooks/useAnnouncementTrigger';

// New dedicated subsection pages (reuse existing section components/content)
const WhyTangyPage = lazy(() => import('./pages/subsections/WhyTangyPage').then((m) => ({ default: m.WhyTangyPage })));
const ChronologyPage = lazy(() => import('./pages/subsections/ChronologyPage').then((m) => ({ default: m.ChronologyPage })));
const TeamPage = lazy(() => import('./pages/subsections/TeamPage').then((m) => ({ default: m.TeamPage })));
const FullStoryPage = lazy(() => import('./pages/subsections/FullStoryPage').then((m) => ({ default: m.FullStoryPage })));
const UpcomingSessionsPage = lazy(() => import('./pages/subsections/UpcomingSessionsPage').then((m) => ({ default: m.UpcomingSessionsPage })));
const ConcertCulturePage = lazy(() => import('./pages/subsections/ConcertCulturePage').then((m) => ({ default: m.ConcertCulturePage })));
const WaitlistPage = lazy(() => import('./pages/subsections/WaitlistPage').then((m) => ({ default: m.WaitlistPage })));
const SessionCalendarPage = lazy(() => import('./pages/SessionCalendarPage').then((m) => ({ default: m.SessionCalendarPage })));
const SessionArchivePage = lazy(() => import('./pages/subsections/SessionArchivePage').then((m) => ({ default: m.SessionArchivePage })));
const MuseumTimelinePage = lazy(() => import('./pages/subsections/MuseumTimelinePage').then((m) => ({ default: m.MuseumTimelinePage })));
const PastMemoriesPage = lazy(() => import('./pages/subsections/PastMemoriesPage').then((m) => ({ default: m.PastMemoriesPage })));
const ContactSheetsPage = lazy(() => import('./pages/subsections/ContactSheetsPage').then((m) => ({ default: m.ContactSheetsPage })));
const VolunteerOpportunitiesPage = lazy(() => import('./pages/subsections/VolunteerOpportunitiesPage').then((m) => ({ default: m.VolunteerOpportunitiesPage })));
const ProductionTeamPage = lazy(() => import('./pages/subsections/ProductionTeamPage').then((m) => ({ default: m.ProductionTeamPage })));
const StageOperationsPage = lazy(() => import('./pages/subsections/StageOperationsPage').then((m) => ({ default: m.StageOperationsPage })));
const CrewApplyPage = lazy(() => import('./pages/subsections/CrewApplyPage').then((m) => ({ default: m.CrewApplyPage })));
const VolunteerApplyPage = lazy(() => import('./pages/subsections/VolunteerApplyPage').then((m) => ({ default: m.VolunteerApplyPage })));
const CollaborateOpportunitiesPage = lazy(() => import('./pages/subsections/CollaborateOpportunitiesPage').then((m) => ({ default: m.CollaborateOpportunitiesPage })));
const PrivateGatheringsPage = lazy(() => import('./pages/subsections/PrivateGatheringsPage').then((m) => ({ default: m.PrivateGatheringsPage })));
const CorporateEventsPage = lazy(() => import('./pages/subsections/CorporateEventsPage').then((m) => ({ default: m.CorporateEventsPage })));
const WeddingsPage = lazy(() => import('./pages/subsections/WeddingsPage').then((m) => ({ default: m.WeddingsPage })));
const HeritageExperiencesPage = lazy(() => import('./pages/subsections/HeritageExperiencesPage').then((m) => ({ default: m.HeritageExperiencesPage })));
const MuseumJournalPage = lazy(() => import('./pages/subsections/MuseumJournalPage').then((m) => ({ default: m.MuseumJournalPage })));
const RecentStoriesPage = lazy(() => import('./pages/subsections/RecentStoriesPage').then((m) => ({ default: m.RecentStoriesPage })));
const BehindTheScenesPage = lazy(() => import('./pages/subsections/BehindTheScenesPage').then((m) => ({ default: m.BehindTheScenesPage })));
const LocationPage = lazy(() => import('./pages/subsections/LocationPage').then((m) => ({ default: m.LocationPage })));
const EmailDispatchPage = lazy(() => import('./pages/subsections/EmailDispatchPage').then((m) => ({ default: m.EmailDispatchPage })));
const InstagramPage = lazy(() => import('./pages/subsections/InstagramPage').then((m) => ({ default: m.InstagramPage })));

// Homepage Sections
import { Hero } from './components/sections/Hero';
import { Manifesto } from './components/sections/Manifesto';
import { Archive } from './components/sections/Archive';
import { TangyDiary } from './components/sections/TangyDiary';
import { UpcomingEvents } from './components/sections/UpcomingEvents';
import { Volunteer } from './components/sections/Volunteer';
import { PrivateSessions } from './components/sections/PrivateSessions';
import { Newsletter } from './components/sections/Newsletter';
import { Closing } from './components/sections/Closing';
import { Footer } from './components/layout/Footer';

function MainWorld() {
  const navigate = useNavigate();
  const [isProgrammeOpen, setIsProgrammeOpen] = useState(false);
  const [showUiControls, setShowUiControls] = useState(false);

  // Museum Modals State
  const [isSoundArchiveOpen, setIsSoundArchiveOpen] = useState(false);
  const [isVinylOpen, setIsVinylOpen] = useState(false);
  const [isProgrammeBoardOpen, setIsProgrammeBoardOpen] = useState(false);
  const [isArchiveSpreadOpen, setIsArchiveSpreadOpen] = useState(false);

  // Stable reference — CurtainOverlay's effect depends on `onComplete`; a new
  // function identity per render would restart its GSAP timeline mid-flight.
  const handleCurtainComplete = useCallback(() => setShowUiControls(true), []);

  const handleNavigateBooking = (evt) => {
    navigate(`/book/${evt.slug || evt.id}`);
  };

  const handleNavigateArtist = () => {
    navigate('/artist');
  };

  const handleNavigateCrew = () => {
    navigate('/crew');
  };

  const handleNavigatePrivate = () => {
    navigate('/private-sessions');
  };

  return (
    <>
      {/* MUSEUM INTERACTIVE MODALS */}
      <CassetteSoundArchiveModal 
        isOpen={isSoundArchiveOpen} 
        onClose={() => setIsSoundArchiveOpen(false)} 
      />

      <VinylRecordPlayerModal 
        isOpen={isVinylOpen} 
        onClose={() => setIsVinylOpen(false)} 
      />

      <ProgrammeBoardModal 
        isOpen={isProgrammeBoardOpen} 
        onClose={() => setIsProgrammeBoardOpen(false)} 
      />

      <ArchiveSpreadModal 
        isOpen={isArchiveSpreadOpen} 
        onClose={() => setIsArchiveSpreadOpen(false)} 
      />

      {/* UNIFIED SINGLE MASTER SITE EXPERIENCE FOR ALL SCREEN SIZES */}
      <>
        {/* Temporary Theatre Curtain Opening Overlay */}
        <CurtainOverlay onComplete={handleCurtainComplete} />

        {/* Fixed 1970s Printed Navbar */}
        {showUiControls && (
          <Navbar onOpenProgramme={() => setIsProgrammeOpen(true)} />
        )}

        {/* Vintage Concert Programme Overlay */}
        <Menu isOpen={isProgrammeOpen} onClose={() => setIsProgrammeOpen(false)} />

        {/* Right-side chapter rail — the microphone lives here now, as one
            purposeful navigation control instead of a free-floating object. */}
        {showUiControls && <MicNavRail />}

        <div className="tangy-world pt-0 overflow-x-hidden">
          <main>
            {/* 01 — LANDING PAGE (HERO) */}
            <Hero />

            {/* 02 — WHY TANGY */}
            <Manifesto />

            {/* 03 — SESSIONS */}
            <UpcomingEvents onSelectBooking={handleNavigateBooking} />

            {/* 04 — ARCHIVE */}
            <Archive />

            {/* 05 — JOIN THE CREW & 06 — LET'S BUILD THIS WORLD TOGETHER */}
            <Volunteer onApplyVolunteer={handleNavigateCrew} onApplyArtist={handleNavigateArtist} />

            {/* 07 — PRIVATE SESSIONS */}
            <PrivateSessions onRequestPrivate={handleNavigatePrivate} />

            {/* 08 — TANGY DIARY */}
            <TangyDiary />

            {/* 09 — INNER CIRCLE */}
            <Newsletter />

            {/* 10 — COME FIND US */}
            <Closing />
          </main>
          
          {/* 11 — FOOTER */}
          <Footer />
        </div>
      </>
    </>
  );
}

// Shown while a route's code chunk downloads (every page except the homepage
// is split out, so the homepage doesn't ship the portals/admin/QR scanner).
function RouteFallback() {
  return (
    <div className="min-h-[100svh] bg-family-ink flex items-center justify-center">
      <span className="t-label text-[#EFE2C0]/60">Loading…</span>
    </div>
  );
}

function GlobalOverlays() {
  const { announcement, show, dismiss } = useAnnouncementTrigger();
  return (
    <>
      <GlobalDock />
      <TangyAssistantLauncher />
      <AnnouncementCharacterOverlay
        announcement={announcement}
        character={announcement?.character}
        position="bottom-left"
        duration={6000}
        isOpen={show}
        onClose={dismiss}
      />
    </>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <UserAuthProvider>
        {/* DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note. */}
        <DemoAdminProvider>
        <LenisProvider>
          <CursorProvider>
            <CustomCursor />
            <BrowserRouter>
              <ScrollToTop />
              <GlobalOverlays />
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* PUBLIC WEBSITE HOMEPAGE */}
                <Route path="/" element={<MainWorld />} />

                {/* DEDICATED STANDALONE PAGES */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/about/*" element={<AboutPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/sessions/*" element={<SessionsPage />} />
                <Route path="/archive" element={<ArchivePage />} />
                <Route path="/archive/*" element={<ArchivePage />} />
                <Route path="/crew" element={<CrewPage />} />
                <Route path="/apply/crew" element={<CrewPage />} />
                <Route path="/volunteer" element={<CrewPage />} />
                <Route path="/collaborate" element={<CollaboratePage />} />
                <Route path="/apply/vendors" element={<VendorApplyPage />} />
                <Route path="/apply/sponsors" element={<SponsorApplyPage />} />
                <Route path="/apply/venue-host" element={<VenueHostApplyPage />} />
                <Route path="/apply/host" element={<VenueHostApplyPage />} />
                <Route path="/private-sessions" element={<PrivateSessionsPage />} />
                <Route path="/blogs" element={<BlogsPage />} />
                <Route path="/blogs/*" element={<BlogsPage />} />
                <Route path="/diary" element={<BlogsPage />} />
                <Route path="/inner-circle" element={<InnerCirclePage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/book/:sessionId" element={<BookingPage />} />

                {/* ADMIN DASHBOARD DEDICATED ROUTE */}
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/preview/artist/:id" element={<AdminArtistPreview />} />
                <Route path="/admin/preview/:role/:id" element={<AdminPortalPreview />} />
                <Route path="/admin/preview/:role" element={<AdminEntitySelector />} />

                {/* DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note. */}
                <Route path="/demo-admin" element={<DemoAdminLogin />} />
                <Route path="/demo-admin/control-room" element={<DemoControlRoom />} />
                {/* One click from any login page's "TEAM DEMO" link — straight into that
                    role's own demo dashboard, no admin detour. Also what the Control
                    Room's "VIEW PORTALS" grid links to in demo mode (see DemoControlRoom.jsx). */}
                <Route path="/demo/artist" element={<DemoArtistDashboard />} />
                <Route path="/demo/:role" element={<DemoRoleDashboard />} />

                {/* TANGY WORLD / EVENT CHECK-IN (STAFF ONLY) */}
                {/* Note: intentionally not "/tangy-world" — that collides with the
                    legacy static tangy-world.html at the project root, which Vite's
                    dev server resolves in preference to the SPA route. */}
                <Route path="/check-in" element={<TangyWorldCheckInPage />} />

                {/* ARTIST PORTAL ROUTE GROUP (/artist/*) */}
                <Route path="/artist" element={<ArtistLayout />}>
                  <Route index element={<ArtistsDirectoryPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="profile/:id" element={<ArtistDetailsPage />} />
                  <Route 
                    path="dashboard" 
                    element={
                      <ArtistProtectedRoute>
                        <DashboardPage />
                      </ArtistProtectedRoute>
                    } 
                  />
                  <Route 
                    path="profile" 
                    element={
                      <ArtistProtectedRoute>
                        <ProfilePage />
                      </ArtistProtectedRoute>
                    } 
                  />
                  <Route 
                    path="calendar" 
                    element={
                      <ArtistProtectedRoute>
                        <CalendarPage />
                      </ArtistProtectedRoute>
                    } 
                  />
                  <Route 
                    path="media" 
                    element={
                      <ArtistProtectedRoute>
                        <MediaPage />
                      </ArtistProtectedRoute>
                    } 
                  />
                  <Route 
                    path="settings" 
                    element={
                      <ArtistProtectedRoute>
                        <SettingsPage />
                      </ArtistProtectedRoute>
                    } 
                  />
                </Route>


                {/* ===================== REAL ROLE-BASED ACCOUNT DASHBOARDS ===================== */}
                {/* Supabase Auth (UserAuthContext) + RLS — see src/config/auth.js (AUTH_MODE). */}
                <Route path="/join" element={<JoinPage />} />
                <Route path="/join/login" element={<JoinLoginPage />} />

                {/* "/dashboard" is the universal post-login landing point — every
                    login/signup flow sends every role here, and DashboardRedirect
                    reads the authoritative profiles.role to send each role on to
                    its own dashboard (or render Patron's directly for role='user'). */}
                <Route path="/profile" element={<ProtectedRoute><PassportProfilePage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
                {/* No `allowedRoles` here, deliberately — these must stay reachable by a
                    still-role='user' PENDING applicant so they can see their own
                    application status (each dashboard's own isApproved gate handles
                    that; see e.g. VendorDashboard.jsx). Restricting by profiles.role
                    at the route level would bounce a pending applicant back to
                    /dashboard before ever showing their status. RLS (self-row only)
                    is the real security boundary — see ProtectedRoute.jsx's own note. */}
                <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
                <Route path="/crew/dashboard" element={<ProtectedRoute><CrewDashboard /></ProtectedRoute>} />
                <Route path="/volunteer/dashboard" element={<ProtectedRoute><VolunteerDashboard /></ProtectedRoute>} />
                <Route path="/sponsor/dashboard" element={<ProtectedRoute><SponsorDashboard /></ProtectedRoute>} />
                <Route path="/venue/dashboard" element={<ProtectedRoute><VenueDashboard /></ProtectedRoute>} />
                <Route path="/private/dashboard" element={<ProtectedRoute><PrivateDashboard /></ProtectedRoute>} />

                {/* Legacy/documented aliases from the removed mock account system. */}
                <Route path="/admin-mock" element={<Navigate to="/admin" replace />} />
                <Route path="/artist-mock/portal" element={<Navigate to="/artist/dashboard" replace />} />
                <Route path="/artist/portal" element={<Navigate to="/artist/dashboard" replace />} />
                <Route path="/crew-mock/dashboard" element={<Navigate to="/crew/dashboard" replace />} />

                {/* ===================== PUBLIC TANGY AI ASSISTANT ===================== */}
                <Route path="/ai" element={<AIAssistantPage />} />

                {/* ===================== DEDICATED SUBSECTION ROUTES ===================== */}
                {/* About */}
                <Route path="/about/why-tangy" element={<WhyTangyPage />} />
                <Route path="/about/chronology" element={<ChronologyPage />} />
                <Route path="/about/team" element={<TeamPage />} />
                <Route path="/about/full-story" element={<FullStoryPage />} />

                {/* Sessions */}
                <Route path="/sessions/upcoming" element={<UpcomingSessionsPage />} />
                <Route path="/sessions/concert-culture" element={<ConcertCulturePage />} />
                <Route path="/sessions/calendar" element={<SessionCalendarPage />} />
                <Route path="/sessions/waitlist" element={<WaitlistPage />} />

                {/* Archive */}
                <Route path="/archive/session-archive" element={<SessionArchivePage />} />
                <Route path="/archive/museum-timeline" element={<MuseumTimelinePage />} />
                <Route path="/archive/past-memories" element={<PastMemoriesPage />} />
                <Route path="/archive/contact-sheets" element={<ContactSheetsPage />} />

                {/* Artists (plural) — real system lives at /artist/*, these are just aliases */}
                <Route path="/artists" element={<Navigate to="/artist" replace />} />
                <Route path="/artists/apply" element={<Navigate to="/artist/register" replace />} />
                <Route path="/artists/login" element={<Navigate to="/artist/login" replace />} />
                <Route path="/artists/portal" element={<Navigate to="/artist/dashboard" replace />} />

                {/* Crew */}
                <Route path="/crew/volunteer" element={<VolunteerOpportunitiesPage />} />
                <Route path="/crew/production" element={<ProductionTeamPage />} />
                <Route path="/crew/stage-operations" element={<StageOperationsPage />} />
                <Route path="/crew/apply" element={<CrewApplyPage />} />
                <Route path="/volunteer/apply" element={<VolunteerApplyPage />} />

                {/* Collaborate */}
                <Route path="/collaborate/vendors" element={<Navigate to="/apply/vendors" replace />} />
                <Route path="/collaborate/sponsors" element={<Navigate to="/apply/sponsors" replace />} />
                <Route path="/collaborate/venue-host" element={<Navigate to="/apply/venue-host" replace />} />
                <Route path="/collaborate/opportunities" element={<CollaborateOpportunitiesPage />} />

                {/* Private */}
                <Route path="/private/gatherings" element={<PrivateGatheringsPage />} />
                <Route path="/private/corporate" element={<CorporateEventsPage />} />
                <Route path="/private/weddings" element={<WeddingsPage />} />
                <Route path="/private/heritage" element={<HeritageExperiencesPage />} />

                {/* Diary */}
                <Route path="/diary/journal" element={<MuseumJournalPage />} />
                <Route path="/diary/stories" element={<RecentStoriesPage />} />
                <Route path="/diary/behind-the-scenes" element={<BehindTheScenesPage />} />

                {/* Contact */}
                <Route path="/contact/location" element={<LocationPage />} />
                <Route path="/contact/email" element={<EmailDispatchPage />} />
                <Route path="/contact/instagram" element={<InstagramPage />} />

                {/* FALLBACK REDIRECT */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </Suspense>
            </BrowserRouter>
          </CursorProvider>
        </LenisProvider>
        </DemoAdminProvider>
      </UserAuthProvider>
    </AudioProvider>
  );
}
