import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const cleanHash = hash.replace('#', '');
      setTimeout(() => {
        try {
          const element = document.getElementById(cleanHash) || document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        } catch (e) {
          const element = document.getElementById(cleanHash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  return null;
};
