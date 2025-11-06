import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
  direction?: "left" | "right";
}

const pageOrder = ["/", "/import", "/exams", "/planning", "/profile"];

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  
  // Determine direction based on page order
  const getDirection = () => {
    const currentIndex = pageOrder.indexOf(location.pathname);
    const previousPath = sessionStorage.getItem("previousPath");
    const previousIndex = pageOrder.indexOf(previousPath || "");
    
    sessionStorage.setItem("previousPath", location.pathname);
    
    if (currentIndex > previousIndex) return 1; // Swipe left (next page)
    if (currentIndex < previousIndex) return -1; // Swipe right (previous page)
    return 0;
  };

  const direction = getDirection();

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : direction < 0 ? "-100%" : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : direction < 0 ? "100%" : 0,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={location.pathname}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
