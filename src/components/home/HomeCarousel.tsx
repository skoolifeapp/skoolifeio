import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const HomeCarousel = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-background via-background to-accent/5">
      <Carousel 
        className="w-full h-full"
        opts={{
          align: "start",
          loop: false,
        }}
      >
        <CarouselContent className="h-full">
          <CarouselItem className="h-full flex items-center justify-center">
            <HeroSection />
          </CarouselItem>
          <CarouselItem className="h-full flex items-start overflow-y-auto">
            <FeaturesSection />
          </CarouselItem>
        </CarouselContent>
        
        {/* Navigation buttons with modern styling */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          <CarouselPrevious className="relative left-0 translate-y-0 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl hover:scale-110 transition-all">
            <ChevronLeft className="h-6 w-6" />
          </CarouselPrevious>
          <CarouselNext className="relative right-0 translate-y-0 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl hover:scale-110 transition-all">
            <ChevronRight className="h-6 w-6" />
          </CarouselNext>
        </div>
      </Carousel>
    </div>
  );
};
