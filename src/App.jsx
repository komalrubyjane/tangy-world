import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { LenisProvider } from './components/layout/LenisProvider';
import { CursorProvider } from './hooks/useCursor';
import { AudioProvider } from './audio/AudioContext';
import { CustomCursor } from './components/ui/CustomCursor';
import { Navbar } from './components/layout/Navbar';
import { Menu } from './components/sections/Menu';
import { BookingModal } from './components/ui/BookingModal';
import { TangySpaceIntro } from './components/ui/TangySpaceIntro';
import { SoundControl } from './components/ui/SoundControl';
import { CurtainOverlay } from './components/ui/CurtainOverlay';
import { GlobalMicrophoneJourney } from './components/ui/GlobalMicrophoneJourney';
import { MobileLayout } from './components/mobile/MobileLayout';
import { Footer } from './components/layout/Footer';

// Museum Interactive Modals & Dock
import { CassetteSoundArchiveModal } from './components/museum/CassetteSoundArchiveModal';
import { VinylRecordPlayerModal } from './components/museum/VinylRecordPlayerModal';
import { ProgrammeBoardModal } from './components/museum/ProgrammeBoardModal';
import { ArchiveSpreadModal } from './components/museum/ArchiveSpreadModal';
import { MerchShopModal } from './components/museum/MerchShopModal';
import { DigitalPassportModal } from './components/museum/DigitalPassportModal';
import { PostcardContactModal } from './components/museum/PostcardContactModal';
import { MuseumQuickDock } from './components/museum/MuseumQuickDock';

// Dedicated Route Pages
import { Home } from './pages/Home';
import { ManifestoPage } from './pages/Manifesto';
import { SessionsPage } from './pages/Sessions';
import { SessionDetailsPage } from './pages/Sessions/SessionDetails';
import { ArtistsPage } from './pages/Artists';
import { ArtistProfilePage } from './pages/Artists/ArtistProfile';
import { ArchivePage } from './pages/Archive';
import { ArchiveItemPage } from './pages/Archive/ArchiveItem';
import { VinylPage } from './pages/Vinyl';
import { HeritagePage } from './pages/Heritage';
import { VenueDetailsPage } from './pages/Heritage/VenueDetails';
import { DiaryPage } from './pages/Diary';
import { DiaryPostPage } from './pages/Diary/DiaryPost';
import { CrewPage } from './pages/Crew';
import { FoundersPage } from './pages/Founders';
import { PrivatePage } from './pages/PrivateSessions';
import { ContactPage } from './pages/Contact';

function AppContent() {
  const [selectedEvent, setSelectedEvent] = useState(null);
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

  const navigate = useNavigate();

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

  return (
    <LenisProvider>
      <CursorProvider>
        {/* Custom Cursor active on fine-pointer devices */}
        {!isMobile && <CustomCursor />}
        
        {/* Booking Ticket Stub Modal */}
        {selectedEvent && (
          <BookingModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)} 
          />
        )}

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
            onSelectBooking={(evt) => setSelectedEvent(evt)}
            onArtistSubmit={() => navigate('/crew')}
            onRequestPrivate={() => navigate('/private')}
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

            <div className="tangy-world">
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/manifesto" element={<ManifestoPage />} />
                  <Route path="/sessions" element={<SessionsPage onSelectBooking={(evt) => setSelectedEvent(evt)} />} />
                  <Route path="/sessions/:slug" element={<SessionDetailsPage onSelectBooking={(evt) => setSelectedEvent(evt)} />} />
                  <Route path="/artists" element={<ArtistsPage />} />
                  <Route path="/artists/:slug" element={<ArtistProfilePage />} />
                  <Route path="/archive" element={<ArchivePage onOpenArchiveSpread={() => setIsArchiveSpreadOpen(true)} />} />
                  <Route path="/archive/:slug" element={<ArchiveItemPage />} />
                  <Route path="/vinyl" element={<VinylPage onOpenVinylPlayer={() => setIsVinylOpen(true)} />} />
                  <Route path="/heritage" element={<HeritagePage />} />
                  <Route path="/venues/:slug" element={<VenueDetailsPage />} />
                  <Route path="/diary" element={<DiaryPage />} />
                  <Route path="/diary/:slug" element={<DiaryPostPage />} />
                  <Route path="/crew" element={<CrewPage />} />
                  <Route path="/founders" element={<FoundersPage />} />
                  <Route path="/private" element={<PrivatePage onRequestPrivate={() => setIsPostcardOpen(true)} />} />
                  <Route path="/contact" element={<ContactPage />} />
                </Routes>
              </main>
              
              <Footer />
            </div>
          </>
        )}
      </CursorProvider>
    </LenisProvider>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AudioProvider>
  );
}
