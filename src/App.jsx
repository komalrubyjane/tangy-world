import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
import { RouteLoader } from './components/ui/RouteLoader';

// Museum Interactive Modals & Dock
import { CassetteSoundArchiveModal } from './components/museum/CassetteSoundArchiveModal';
import { VinylRecordPlayerModal } from './components/museum/VinylRecordPlayerModal';
import { ProgrammeBoardModal } from './components/museum/ProgrammeBoardModal';
import { ArchiveSpreadModal } from './components/museum/ArchiveSpreadModal';
import { MerchShopModal } from './components/museum/MerchShopModal';
import { DigitalPassportModal } from './components/museum/DigitalPassportModal';
import { PostcardContactModal } from './components/museum/PostcardContactModal';
import { MuseumQuickDock } from './components/museum/MuseumQuickDock';

// Lazy Loaded Route Pages for Clean Route-Based Code Splitting
const Home = lazy(() => import('./pages/Home'));
const ManifestoPage = lazy(() => import('./pages/Manifesto'));
const SessionsPage = lazy(() => import('./pages/Sessions'));
const SessionDetailsPage = lazy(() => import('./pages/Sessions/SessionDetails'));
const ArtistsPage = lazy(() => import('./pages/Artists'));
const ArtistProfilePage = lazy(() => import('./pages/Artists/ArtistProfile'));
const ArchivePage = lazy(() => import('./pages/Archive'));
const ArchiveItemPage = lazy(() => import('./pages/Archive/ArchiveItem'));
const VinylPage = lazy(() => import('./pages/Vinyl'));
const HeritagePage = lazy(() => import('./pages/Heritage'));
const VenueDetailsPage = lazy(() => import('./pages/Heritage/VenueDetails'));
const DiaryPage = lazy(() => import('./pages/Diary'));
const DiaryPostPage = lazy(() => import('./pages/Diary/DiaryPost'));
const CrewPage = lazy(() => import('./pages/Crew'));
const FoundersPage = lazy(() => import('./pages/Founders'));
const PrivateSessionsPage = lazy(() => import('./pages/PrivateSessions'));
const GalleryPage = lazy(() => import('./pages/Gallery'));
const ProgrammePage = lazy(() => import('./pages/Programme'));
const VolunteerPage = lazy(() => import('./pages/Volunteer'));
const ContactPage = lazy(() => import('./pages/Contact'));

// Lazy Loaded Admin Pages
const AdminLogin = lazy(() => import('./pages/Admin/Login'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminEvents = lazy(() => import('./pages/Admin/Events'));
const AdminBookings = lazy(() => import('./pages/Admin/Bookings'));
const AdminArtists = lazy(() => import('./pages/Admin/ArtistsAdmin'));
const AdminGallery = lazy(() => import('./pages/Admin/GalleryAdmin'));
const AdminCrew = lazy(() => import('./pages/Admin/CrewAdmin'));
const AdminFounders = lazy(() => import('./pages/Admin/FoundersAdmin'));
const AdminPrivate = lazy(() => import('./pages/Admin/PrivateAdmin'));
const AdminPayments = lazy(() => import('./pages/Admin/PaymentsAdmin'));
const AdminUsers = lazy(() => import('./pages/Admin/UsersAdmin'));
const AdminSettings = lazy(() => import('./pages/Admin/SettingsAdmin'));
const AdminCheckin = lazy(() => import('./pages/Admin/CheckinAdmin'));

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
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

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
        {!isMobile && !isAdminRoute && <CustomCursor />}
        
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

        {/* FLOATING QUICK DOCK TOOLBAR (Hidden on Admin routes) */}
        {!isAdminRoute && (
          <MuseumQuickDock 
            onOpenSoundArchive={() => setIsSoundArchiveOpen(true)}
            onOpenVinyl={() => setIsVinylOpen(true)}
            onOpenProgramme={() => setIsProgrammeBoardOpen(true)}
            onOpenArchive={() => setIsArchiveSpreadOpen(true)}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenPassport={() => setIsPassportOpen(true)}
            onOpenPostcard={() => setIsPostcardOpen(true)}
          />
        )}

        {/* DEDICATED HANDCRAFTED MOBILE LAYOUT (<1024px) */}
        {isMobile && !isAdminRoute ? (
          <MobileLayout 
            onSelectBooking={(evt) => setSelectedEvent(evt)}
            onArtistSubmit={() => navigate('/crew')}
            onRequestPrivate={() => navigate('/private-sessions')}
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
            {!isAdminRoute && <CurtainOverlay onComplete={() => setShowUiControls(true)} />}

            {/* Global Continuous Hanging Microphone Experience */}
            {!isAdminRoute && <GlobalMicrophoneJourney active={showUiControls} />}

            {/* Cinematic Deep Space Intro */}
            {isIntroActive && !isAdminRoute && (
              <TangySpaceIntro onComplete={() => setIsIntroActive(false)} />
            )}

            {/* Floating Retro Sound Control */}
            {showUiControls && !isAdminRoute && <SoundControl />}
            
            {/* Fixed 1970s Printed Navbar */}
            {showUiControls && !isAdminRoute && (
              <Navbar onOpenProgramme={() => setIsProgrammeOpen(true)} />
            )}
            
            {/* Vintage Concert Programme Overlay */}
            {!isAdminRoute && <Menu isOpen={isProgrammeOpen} onClose={() => setIsProgrammeOpen(false)} />}
            
            {/* Lightweight Grain Texture */}
            {!isAdminRoute && <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />}
            
            {/* Vignette */}
            {!isAdminRoute && <div className="fixed inset-0 pointer-events-none z-[80] shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />}

            <div className="tangy-world">
              <main>
                <Suspense fallback={<RouteLoader />}>
                  <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                      {/* USER ROUTES */}
                      <Route path="/" element={<Home />} />
                      <Route path="/manifesto" element={<ManifestoPage />} />
                      <Route path="/sessions" element={<SessionsPage onSelectBooking={(evt) => setSelectedEvent(evt)} />} />
                      <Route path="/sessions/:slug" element={<SessionDetailsPage onSelectBooking={(evt) => setSelectedEvent(evt)} />} />
                      <Route path="/artists" element={<ArtistsPage />} />
                      <Route path="/artists/:slug" element={<ArtistProfilePage />} />
                      <Route path="/crew" element={<CrewPage />} />
                      <Route path="/founders" element={<FoundersPage />} />
                      <Route path="/private-sessions" element={<PrivateSessionsPage onRequestPrivate={() => setIsPostcardOpen(true)} />} />
                      <Route path="/gallery" element={<GalleryPage />} />
                      <Route path="/archive" element={<ArchivePage onOpenArchiveSpread={() => setIsArchiveSpreadOpen(true)} />} />
                      <Route path="/archive/:slug" element={<ArchiveItemPage />} />
                      <Route path="/vinyl" element={<VinylPage onOpenVinylPlayer={() => setIsVinylOpen(true)} />} />
                      <Route path="/heritage" element={<HeritagePage />} />
                      <Route path="/venues/:slug" element={<VenueDetailsPage />} />
                      <Route path="/diary" element={<DiaryPage />} />
                      <Route path="/diary/:slug" element={<DiaryPostPage />} />
                      <Route path="/programme" element={<ProgrammePage />} />
                      <Route path="/volunteer" element={<VolunteerPage />} />
                      <Route path="/contact" element={<ContactPage />} />

                      {/* ADMIN ROUTES */}
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/events" element={<AdminEvents />} />
                      <Route path="/admin/bookings" element={<AdminBookings />} />
                      <Route path="/admin/artists" element={<AdminArtists />} />
                      <Route path="/admin/gallery" element={<AdminGallery />} />
                      <Route path="/admin/crew" element={<AdminCrew />} />
                      <Route path="/admin/founders" element={<AdminFounders />} />
                      <Route path="/admin/private" element={<AdminPrivate />} />
                      <Route path="/admin/payments" element={<AdminPayments />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/settings" element={<AdminSettings />} />
                      <Route path="/admin/checkin" element={<AdminCheckin />} />
                    </Routes>
                  </AnimatePresence>
                </Suspense>
              </main>
              
              {!isAdminRoute && <Footer />}
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
