import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { LenisProvider } from './components/layout/LenisProvider';
import { CursorProvider } from './hooks/useCursor';
import { AudioProvider } from './audio/AudioContext';
import { CustomCursor } from './components/ui/CustomCursor';
import { Navbar } from './components/layout/Navbar';
import { Menu } from './components/sections/Menu';
import { TangySpaceIntro } from './components/ui/TangySpaceIntro';
import { SoundControl } from './components/ui/SoundControl';
import { CurtainOverlay } from './components/ui/CurtainOverlay';
import { GlobalMicrophoneJourney } from './components/ui/GlobalMicrophoneJourney';
import { MobileLayout } from './components/mobile/MobileLayout';

// Museum Interactive Modals & Dock
import { CassetteSoundArchiveModal } from './components/museum/CassetteSoundArchiveModal';
import { VinylRecordPlayerModal } from './components/museum/VinylRecordPlayerModal';
import { ProgrammeBoardModal } from './components/museum/ProgrammeBoardModal';
import { ArchiveSpreadModal } from './components/museum/ArchiveSpreadModal';
import { MerchShopModal } from './components/museum/MerchShopModal';
import { DigitalPassportModal } from './components/museum/DigitalPassportModal';
import { PostcardContactModal } from './components/museum/PostcardContactModal';
import { MuseumQuickDock } from './components/museum/MuseumQuickDock';

// Pages
import { BookingPage } from './pages/BookingPage';
import { CrewPage } from './pages/CrewPage';
import { PrivateSessionsPage } from './pages/PrivateSessionsPage';

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

import { Hero } from './components/sections/Hero';
import { Manifesto } from './components/sections/Manifesto';
import { History } from './components/sections/History';
import { Archive } from './components/sections/Archive';
import { Spaces } from './components/sections/Spaces';
import { FrontCamera } from './components/sections/FrontCamera';
import { TangyDiary } from './components/sections/TangyDiary';
import { Artists } from './components/sections/Artists';
import { Founders } from './components/sections/Founders';
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

      {/* DEDICATED HANDCRAFTED MOBILE LAYOUT (<1024px) */}
      {isMobile ? (
        <MobileLayout 
          onSelectBooking={handleNavigateBooking}
          onArtistSubmit={handleNavigateCrew}
          onRequestPrivate={handleNavigatePrivate}
          onOpenSoundArchive={() => setIsSoundArchiveOpen(true)}
          onOpenVinyl={() => setIsVinylOpen(true)}
          onOpenProgramme={() => setIsProgrammeBoardOpen(true)}
          onOpenArchive={() => setIsArchiveSpreadOpen(true)}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenPassport={() => setIsPassportOpen(true)}
          onOpenPostcard={() => setIsPostcardOpen(true)}
        />
      ) : (
        /* 100% UNTOUCHED PERFECT DESKTOP EXPERIENCE (>=1024px) */
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

          <div className="tangy-world pt-12">
            <main>
              <Hero />
              <Manifesto />
              <History />
              <Archive />
              <Spaces />
              <FrontCamera />
              <TangyDiary />
              <Artists onArtistSubmit={handleNavigateArtist} />
              <Founders />
              <UpcomingEvents onSelectBooking={handleNavigateBooking} />
              <Volunteer onApplyVolunteer={handleNavigateCrew} onApplyArtist={handleNavigateArtist} />
              <PrivateSessions onRequestPrivate={handleNavigatePrivate} />
              <Newsletter />
              <Closing />
            </main>
            
            <Footer />
          </div>
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <LenisProvider>
        <CursorProvider>
          <CustomCursor />
          <BrowserRouter>
            <Routes>
              {/* PUBLIC WEBSITE ROUTES */}
              <Route path="/" element={<MainWorld />} />
              <Route path="/book/:sessionId" element={<BookingPage />} />
              <Route path="/crew" element={<CrewPage />} />
              <Route path="/volunteer" element={<CrewPage />} />
              <Route path="/private-sessions" element={<PrivateSessionsPage />} />

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
              </Route>
            </Routes>
          </BrowserRouter>
        </CursorProvider>
      </LenisProvider>
    </AudioProvider>
  );
}
