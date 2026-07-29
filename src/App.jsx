import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LenisProvider } from './components/layout/LenisProvider';
import { CursorProvider } from './hooks/useCursor';
import { AudioProvider } from './audio/AudioContext';
import { CustomCursor } from './components/ui/CustomCursor';

// Multi-Page Routes
import { HomePage } from './pages/HomePage';
import { SessionsPage } from './pages/SessionsPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { BookingPage } from './pages/BookingPage';
import { ArtistPortalPage } from './pages/ArtistPortalPage';
import { VolunteerPage } from './pages/VolunteerPage';
import { PrivateSessionsPage } from './pages/PrivateSessionsPage';
import { ArchivePage } from './pages/ArchivePage';
import { ProgrammePage } from './pages/ProgrammePage';
import { VinylPage } from './pages/VinylPage';
import { DiaryPage } from './pages/DiaryPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { StorePage } from './pages/StorePage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  return (
    <AudioProvider>
      <LenisProvider>
        <CursorProvider>
          <CustomCursor />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/sessions/:slug" element={<SessionDetailPage />} />
              <Route path="/book/:sessionId" element={<BookingPage />} />
              <Route path="/artists" element={<ArtistPortalPage />} />
              <Route path="/crew" element={<VolunteerPage />} />
              <Route path="/private-sessions" element={<PrivateSessionsPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/programme" element={<ProgrammePage />} />
              <Route path="/vinyl" element={<VinylPage />} />
              <Route path="/diary" element={<DiaryPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/store" element={<StorePage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </BrowserRouter>
        </CursorProvider>
      </LenisProvider>
    </AudioProvider>
  );
}
