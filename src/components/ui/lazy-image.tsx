import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}

export const LazyImage = ({ 
  src, 
  alt, 
  className, 
  placeholderClassName,
  ...props 
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px" }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      {!isLoaded && (
        <div 
          className={cn(
            "absolute inset-0 bg-muted animate-pulse rounded",
            placeholderClassName
          )}
        />
      )}
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </div>
  );
};
