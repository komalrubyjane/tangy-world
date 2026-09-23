import { useState, useEffect, useCallback } from 'react';
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
import { TangySpaceIntro } from './components/ui/TangySpaceIntro';
import { SoundControl } from './components/ui/SoundControl';
import { CurtainOverlay } from './components/ui/CurtainOverlay';
import { GlobalMicrophoneJourney } from './components/ui/GlobalMicrophoneJourney';

// Museum Interactive Modals & Dock
import { CassetteSoundArchiveModal } from './components/museum/CassetteSoundArchiveModal';
import { VinylRecordPlayerModal } from './components/museum/VinylRecordPlayerModal';
import { ProgrammeBoardModal } from './components/museum/ProgrammeBoardModal';
import { ArchiveSpreadModal } from './components/museum/ArchiveSpreadModal';
import { MerchShopModal } from './components/museum/MerchShopModal';
import { DigitalPassportModal } from './components/museum/DigitalPassportModal';
import { PostcardContactModal } from './components/museum/PostcardContactModal';
import { TangyTVModal } from './components/museum/TangyTVModal';
import { UserLoginModal } from './components/museum/UserLoginModal';
import { MuseumQuickDock } from './components/museum/MuseumQuickDock';

// Dedicated Standalone Pages
import { CollaboratePage } from './pages/CollaboratePage';
import { BookingPage } from './pages/BookingPage';
import { CrewPage } from './pages/CrewPage';
import { PrivateSessionsPage } from './pages/PrivateSessionsPage';
import { AboutPage } from './pages/AboutPage';
import { SessionsPage } from './pages/SessionsPage';
import { ArchivePage } from './pages/ArchivePage';
import { VendorApplyPage } from './pages/VendorApplyPage';
import { SponsorApplyPage } from './pages/SponsorApplyPage';
import { VenueHostApplyPage } from './pages/VenueHostApplyPage';
import { BlogsPage } from './pages/BlogsPage';
import { InnerCirclePage } from './pages/InnerCirclePage';
import { ContactPage } from './pages/ContactPage';
import { AdminPage } from './pages/AdminPage';
import { AdminEntitySelector } from './pages/admin/AdminEntitySelector';
import { AdminPortalPreview } from './pages/admin/AdminPortalPreview';
import { AdminArtistPreview } from './pages/admin/AdminArtistPreview';

// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
import { DemoAdminLogin } from './pages/demoAdmin/DemoAdminLogin';
import { DemoControlRoom } from './pages/demoAdmin/DemoControlRoom';
import { DemoRoleDashboard } from './pages/demoAdmin/DemoRoleDashboard';
import { DemoArtistDashboard } from './pages/demoAdmin/DemoArtistDashboard';
import { TangyWorldCheckInPage } from './admin/TangyWorldCheckInPage';
import { ProfilePage as PassportProfilePage } from './pages/ProfilePage';

// Artist Portal Migration Imports
import { ArtistLayout } from './artist/layouts/ArtistLayout';
import { ArtistProtectedRoute } from './artist/components/ArtistProtectedRoute';
import { LoginPage } from './artist/pages/LoginPage';
import { RegisterPage } from './artist/pages/RegisterPage';
import { DashboardPage } from './artist/pages/DashboardPage';
import { ProfilePage } from './artist/pages/ProfilePage';
import { CalendarPage } from './artist/pages/CalendarPage';
import { ArtistsDirectoryPage } from './artist/pages/ArtistsDirectoryPage';
import { ArtistDetailsPage } from './artist/pages/ArtistDetailsPage';
import { MediaPage } from './artist/pages/MediaPage';
import { SettingsPage } from './artist/pages/SettingsPage';

// Real, role-based account dashboards — backed by Supabase Auth
// (UserAuthContext) + RLS, gated by ProtectedRoute (not the removed mock
// account system).
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardRedirect } from './components/auth/DashboardRedirect';
import { JoinPage } from './pages/join/JoinPage';
import { JoinLoginPage } from './pages/join/JoinLoginPage';
import { VendorDashboard } from './pages/dashboards/VendorDashboard';
import { CrewDashboard } from './pages/dashboards/CrewDashboard';
import { VolunteerDashboard } from './pages/dashboards/VolunteerDashboard';
import { SponsorDashboard } from './pages/dashboards/SponsorDashboard';
import { VenueDashboard } from './pages/dashboards/VenueDashboard';
import { PrivateDashboard } from './pages/dashboards/PrivateDashboard';

// Public Tangy AI assistant
import { AIAssistantPage } from './pages/AIAssistantPage';
import { TangyAssistantLauncher } from './components/ai/TangyAssistantLauncher';

// Announcement character overlay (admin-authored, publicly triggered)
import { AnnouncementCharacterOverlay } from './components/announcements/AnnouncementCharacterOverlay';
import { useAnnouncementTrigger } from './hooks/useAnnouncementTrigger';

// New dedicated subsection pages (reuse existing section components/content)
import { WhyTangyPage } from './pages/subsections/WhyTangyPage';
import { ChronologyPage } from './pages/subsections/ChronologyPage';
import { TeamPage } from './pages/subsections/TeamPage';
import { FullStoryPage } from './pages/subsections/FullStoryPage';
import { UpcomingSessionsPage } from './pages/subsections/UpcomingSessionsPage';
import { ConcertCulturePage } from './pages/subsections/ConcertCulturePage';
import { WaitlistPage } from './pages/subsections/WaitlistPage';
import { SessionCalendarPage } from './pages/SessionCalendarPage';
import { SessionArchivePage } from './pages/subsections/SessionArchivePage';
import { MuseumTimelinePage } from './pages/subsections/MuseumTimelinePage';
import { PastMemoriesPage } from './pages/subsections/PastMemoriesPage';
import { ContactSheetsPage } from './pages/subsections/ContactSheetsPage';
import { VolunteerOpportunitiesPage } from './pages/subsections/VolunteerOpportunitiesPage';
import { ProductionTeamPage } from './pages/subsections/ProductionTeamPage';
import { StageOperationsPage } from './pages/subsections/StageOperationsPage';
import { CrewApplyPage } from './pages/subsections/CrewApplyPage';
import { VolunteerApplyPage } from './pages/subsections/VolunteerApplyPage';
import { CollaborateOpportunitiesPage } from './pages/subsections/CollaborateOpportunitiesPage';
import { PrivateGatheringsPage } from './pages/subsections/PrivateGatheringsPage';
import { CorporateEventsPage } from './pages/subsections/CorporateEventsPage';
import { WeddingsPage } from './pages/subsections/WeddingsPage';
import { HeritageExperiencesPage } from './pages/subsections/HeritageExperiencesPage';
import { MuseumJournalPage } from './pages/subsections/MuseumJournalPage';
import { RecentStoriesPage } from './pages/subsections/RecentStoriesPage';
import { BehindTheScenesPage } from './pages/subsections/BehindTheScenesPage';
import { LocationPage } from './pages/subsections/LocationPage';
import { EmailDispatchPage } from './pages/subsections/EmailDispatchPage';
import { InstagramPage } from './pages/subsections/InstagramPage';

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
  const [progress, setProgress] = useState(0);
  const [isProgrammeOpen, setIsProgrammeOpen] = useState(false);
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [showUiControls, setShowUiControls] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Museum Modals State
  const [isSoundArchiveOpen, setIsSoundArchiveOpen] = useState(false);
  const [isVinylOpen, setIsVinylOpen] = useState(false);
  const [isProgrammeBoardOpen, setIsProgrammeBoardOpen] = useState(false);
  const [isArchiveSpreadOpen, setIsArchiveSpreadOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isPostcardOpen, setIsPostcardOpen] = useState(false);
  const [isTVOpen, setIsTVOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const alreadyPlayed = sessionStorage.getItem('tangyIntroPlayed');
    if (alreadyPlayed) {
      setIsIntroActive(false);
    }
  }, []);

  // Stable references — CurtainOverlay/TangySpaceIntro's own effects depend
  // on `onComplete` (see those files). Passed as an inline arrow function
  // here before, every one of those was a NEW function identity on every
  // MainWorld re-render (e.g. the resize listener above firing on mobile
  // viewport changes — address bar show/hide, keyboard open, rotation —
  // which happens often during the first few seconds of a real page load).
  // Each new identity re-ran that effect, which starts by calling
  // `tl.kill()` on the in-flight GSAP timeline and building a fresh one —
  // so a resize mid-animation could restart the curtain/intro before its
  // own `onComplete` ever fired, leaving that fixed, high-z-index, colored
  // overlay stuck on screen instead of cleanly finishing and unmounting.
  const handleCurtainComplete = useCallback(() => setShowUiControls(true), []);
  const handleIntroComplete = useCallback(() => setIsIntroActive(false), []);

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

      <MerchShopModal 
        isOpen={isShopOpen} 
        onClose={() => setIsShopOpen(false)} 
      />

      <DigitalPassportModal 
        isOpen={isPassportOpen} 
        onClose={() => setIsPassportOpen(false)} 
      />

      <PostcardContactModal
        isOpen={isPostcardOpen}
        onClose={() => setIsPostcardOpen(false)}
      />

      <TangyTVModal
        isOpen={isTVOpen}
        onClose={() => setIsTVOpen(false)}
      />

      {/* USER LOGIN MODAL (CUSTOMER/PATRON AUTH) */}
      <UserLoginModal />

      {/* FLOATING QUICK DOCK TOOLBAR */}
      <MuseumQuickDock
        onOpenSoundArchive={() => setIsSoundArchiveOpen(true)}
        onOpenVinyl={() => setIsVinylOpen(true)}
        onOpenProgramme={() => setIsProgrammeBoardOpen(true)}
        onOpenArchive={() => setIsArchiveSpreadOpen(true)}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenPassport={() => setIsPassportOpen(true)}
        onOpenPostcard={() => setIsPostcardOpen(true)}
        onOpenTV={() => setIsTVOpen(true)}
      />

      {/* UNIFIED SINGLE MASTER SITE EXPERIENCE FOR ALL SCREEN SIZES */}
      <>
        {/* Temporary Theatre Curtain Opening Overlay */}
        <CurtainOverlay onComplete={handleCurtainComplete} />

        {/* Global Continuous Hanging Microphone Experience */}
        <GlobalMicrophoneJourney active={showUiControls} />

        {/* Cinematic Deep Space Intro */}
        {isIntroActive && (
          <TangySpaceIntro onComplete={handleIntroComplete} />
        )}

        {/* Floating Retro Sound Control */}
        {showUiControls && <SoundControl />}
        
        {/* Fixed 1970s Printed Navbar */}
        {showUiControls && (
          <Navbar onOpenProgramme={() => setIsProgrammeOpen(true)} />
        )}
        
        {/* Vintage Concert Programme Overlay */}
        <Menu isOpen={isProgrammeOpen} onClose={() => setIsProgrammeOpen(false)} />
        

        {/* Lightweight Grain Texture */}
        <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
        
        {/* Vignette — kept subtle deliberately: this sits `fixed`/`inset-0` above
            EVERY section on the site at all times (z-[80]), so its strength affects
            every background/photo, not just whichever section is in view. It was
            previously 0.85 alpha at a 140px spread, which is heavy enough to
            visibly wash out a full-bleed photo section (e.g. the Spaces/"Where
            Heritage Meets Music" background) even after that section's own local
            overlay was already fixed — this was the actual remaining source. */}
        <div className="fixed inset-0 pointer-events-none z-[80] shadow-[inset_0_0_90px_rgba(0,0,0,0.3)]" />

        {/* Scroll Progress Rail */}
        <div className="fixed right-0 top-0 w-1 h-[100vh] bg-[rgba(231,213,164,0.05)] z-[110] hidden md:block pointer-events-none">
           <div 
             className="w-full bg-tangy-mustard"
             style={{ height: `${progress}%` }}
           />
        </div>

        <div className="tangy-world pt-0 md:pt-12 overflow-x-hidden">
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

function GlobalOverlays() {
  const { announcement, show, dismiss } = useAnnouncementTrigger();
  return (
    <>
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
            </BrowserRouter>
          </CursorProvider>
        </LenisProvider>
        </DemoAdminProvider>
      </UserAuthProvider>
    </AudioProvider>
  );
}
