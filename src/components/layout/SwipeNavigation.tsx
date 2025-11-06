import { useSwipeable } from "react-swipeable";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

interface SwipeNavigationProps {
  children: ReactNode;
}

const pageOrder = ["/", "/import", "/exams", "/planning", "/profile"];

export const SwipeNavigation = ({ children }: SwipeNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = pageOrder.indexOf(location.pathname);
      if (currentIndex !== -1 && currentIndex < pageOrder.length - 1) {
        navigate(pageOrder[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      const currentIndex = pageOrder.indexOf(location.pathname);
      if (currentIndex > 0) {
        navigate(pageOrder[currentIndex - 1]);
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: false,
    swipeDuration: 500,
  });

  return (
    <div {...handlers} className="h-full w-full">
      {children}
    </div>
  );
};
