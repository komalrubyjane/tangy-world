import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { LenisProvider } from './components/layout/LenisProvider';
import { CursorProvider } from './hooks/useCursor';
import { AudioProvider } from './audio/AudioContext';
import { UserAuthProvider } from './context/UserAuthContext';
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
import { TangyWorldCheckInPage } from './admin/TangyWorldCheckInPage';

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
      />

      {/* UNIFIED SINGLE MASTER SITE EXPERIENCE FOR ALL SCREEN SIZES */}
      <>
        {/* Temporary Theatre Curtain Opening Overlay */}
        <CurtainOverlay onComplete={() => setShowUiControls(true)} />

        {/* Global Continuous Hanging Microphone Experience */}
        <GlobalMicrophoneJourney active={showUiControls} />

        {/* Cinematic Deep Space Intro */}
        {isIntroActive && (
          <TangySpaceIntro onComplete={() => setIsIntroActive(false)} />
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
        
        {/* Vignette */}
        <div className="fixed inset-0 pointer-events-none z-[80] shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />

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

export default function App() {
  return (
    <AudioProvider>
      <UserAuthProvider>
        <LenisProvider>
          <CursorProvider>
            <CustomCursor />
            <BrowserRouter>
              <ScrollToTop />
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

                {/* FALLBACK REDIRECT */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </CursorProvider>
        </LenisProvider>
      </UserAuthProvider>
    </AudioProvider>
  );
}
