import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hero } from '../components/sections/Hero';
import { Manifesto } from '../components/sections/Manifesto';
import { History } from '../components/sections/History';
import { UpcomingEvents } from '../components/sections/UpcomingEvents';
import { Spaces } from '../components/sections/Spaces';
import { TangyDiary } from '../components/sections/TangyDiary';
import { Newsletter } from '../components/sections/Newsletter';
import { Closing } from '../components/sections/Closing';
import { MobileLayout } from '../components/mobile/MobileLayout';
import { CurtainOverlay } from '../components/ui/CurtainOverlay';
import { TangySpaceIntro } from '../components/ui/TangySpaceIntro';
import { SoundControl } from '../components/ui/SoundControl';
import { GlobalMicrophoneJourney } from '../components/ui/GlobalMicrophoneJourney';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const HomePage = () => {
  const navigate = useNavigate();
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [showUiControls, setShowUiControls] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const handleSelectBooking = (evt) => {
    navigate(`/book/${evt.slug || evt.id}`);
  };

  const handleArtistSubmit = () => {
    navigate('/crew');
  };

  const handleRequestPrivate = () => {
    navigate('/private-sessions');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-[#3c0f0e] text-[#ecdcaf]"
    >
      {isMobile ? (
        <MobileLayout 
          onSelectBooking={handleSelectBooking}
          onArtistSubmit={handleArtistSubmit}
          onRequestPrivate={handleRequestPrivate}
          onOpenSoundArchive={() => navigate('/vinyl')}
          onOpenVinyl={() => navigate('/vinyl')}
          onOpenProgramme={() => navigate('/programme')}
          onOpenArchive={() => navigate('/archive')}
          onOpenShop={() => navigate('/store')}
          onOpenPassport={() => navigate('/about')}
          onOpenPostcard={() => navigate('/contact')}
        />
      ) : (
        <>
          <CurtainOverlay onComplete={() => setShowUiControls(true)} />
          <GlobalMicrophoneJourney active={showUiControls} />

          {isIntroActive && (
            <TangySpaceIntro onComplete={() => setIsIntroActive(false)} />
          )}

          {showUiControls && <SoundControl />}
          {showUiControls && <Navbar onOpenProgramme={() => navigate('/programme')} />}

          <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
          <div className="fixed inset-0 pointer-events-none z-[80] shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />

          <div className="tangy-world pt-12">
            <main>
              <Hero />
              <Manifesto />
              <History />
              <UpcomingEvents onSelectBooking={handleSelectBooking} />
              <Spaces />
              <TangyDiary />
              <Newsletter />
              <Closing />
            </main>
            <Footer />
          </div>
        </>
      )}
    </motion.div>
  );
};
