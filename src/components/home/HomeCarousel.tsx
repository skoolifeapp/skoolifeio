import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";

export const HomeCarousel = () => {
  return (
    <div className="relative w-full h-[calc(100vh-80px)]">
      <Carousel 
        className="w-full h-full"
        opts={{
          align: "start",
          loop: false,
        }}
      >
        <CarouselContent className="h-full">
          <CarouselItem className="h-full flex items-center">
            <HeroSection />
          </CarouselItem>
          <CarouselItem className="h-full flex items-start overflow-y-auto">
            <FeaturesSection />
          </CarouselItem>
        </CarouselContent>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          <CarouselPrevious className="relative left-0 translate-y-0" />
          <CarouselNext className="relative right-0 translate-y-0" />
        </div>
      </Carousel>
    </div>
  );
};
