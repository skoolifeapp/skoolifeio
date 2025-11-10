import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const scrollPositions = new Map<string, number>();

export const ScrollReset = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const saveScrollPosition = () => {
      scrollPositions.set(location.pathname, window.scrollY);
    };

    if (isFirstRender.current) {
      isFirstRender.current = false;
      const savedPosition = scrollPositions.get(location.pathname);
      if (savedPosition !== undefined) {
        window.scrollTo(0, savedPosition);
      }
    }

    window.addEventListener('scroll', saveScrollPosition);

    return () => {
      saveScrollPosition();
      window.removeEventListener('scroll', saveScrollPosition);
    };
  }, [location.pathname]);

  return null;
};
