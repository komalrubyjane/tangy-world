import { useState, useEffect } from 'react';
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

export default function App() {
  const [progress, setProgress] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isProgrammeOpen, setIsProgrammeOpen] = useState(false);
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [showUiControls, setShowUiControls] = useState(false);

  useEffect(() => {
    const alreadyPlayed = sessionStorage.getItem('tangyIntroPlayed');
    if (alreadyPlayed) {
      setIsIntroActive(false);
    }
  }, []);

  const handleArtistSubmit = () => {
    document.querySelector('#volunteer')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRequestPrivate = () => {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AudioProvider>
      <LenisProvider>
        <CursorProvider>
          <CustomCursor />
          
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
          
          {/* Booking Ticket Stub Modal */}
          {selectedEvent && (
            <BookingModal 
              event={selectedEvent} 
              onClose={() => setSelectedEvent(null)} 
            />
          )}
          
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
              <Artists onArtistSubmit={handleArtistSubmit} />
              <Founders />
              <UpcomingEvents onSelectBooking={(evt) => setSelectedEvent(evt)} />
              <Volunteer onApplyVolunteer={handleArtistSubmit} onApplyArtist={handleArtistSubmit} />
              <PrivateSessions onRequestPrivate={handleRequestPrivate} />
              <Newsletter />
              <Closing />
            </main>
            
            <Footer />
          </div>
        </CursorProvider>
      </LenisProvider>
    </AudioProvider>
  );
}
