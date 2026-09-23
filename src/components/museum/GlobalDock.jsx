import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MuseumQuickDock } from './MuseumQuickDock';
import { MerchShopModal } from './MerchShopModal';
import { DigitalPassportModal } from './DigitalPassportModal';
import { PostcardContactModal } from './PostcardContactModal';
import { TangyTVModal } from './TangyTVModal';
import { UserLoginModal } from './UserLoginModal';

// Staff tools keep their own chrome; the public dock stays out of them.
const DOCK_HIDDEN_PREFIXES = ['/admin', '/check-in', '/demo-admin'];

// The secondary navigation bar (PASSPORT · LOGIN · TV · KIRANA · POSTCARD)
// and the modals it opens, rendered ONCE for the whole app so the bar is
// available on every public page, not just the homepage. The login modal
// is global regardless of route, since other flows open it too.
export const GlobalDock = () => {
  const { pathname } = useLocation();
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isPostcardOpen, setIsPostcardOpen] = useState(false);
  const [isTVOpen, setIsTVOpen] = useState(false);

  const showDock = !DOCK_HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Flag the body so pages WITHOUT the shared Footer (which already pads for
  // the dock) get bottom padding — see `body[data-dock]` in globals.css.
  useEffect(() => {
    document.body.dataset.dock = showDock ? 'on' : 'off';
    return () => { delete document.body.dataset.dock; };
  }, [showDock]);

  return (
    <>
      <UserLoginModal />
      {showDock && (
        <>
          <MerchShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
          <DigitalPassportModal isOpen={isPassportOpen} onClose={() => setIsPassportOpen(false)} />
          <PostcardContactModal isOpen={isPostcardOpen} onClose={() => setIsPostcardOpen(false)} />
          <TangyTVModal isOpen={isTVOpen} onClose={() => setIsTVOpen(false)} />
          <MuseumQuickDock
            onOpenShop={() => setIsShopOpen(true)}
            onOpenPassport={() => setIsPassportOpen(true)}
            onOpenPostcard={() => setIsPostcardOpen(true)}
            onOpenTV={() => setIsTVOpen(true)}
          />
        </>
      )}
    </>
  );
};
