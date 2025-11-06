import { HomeCarousel } from "@/components/home/HomeCarousel";

const Index = () => {
  return (
    <div className="h-[100dvh] flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] pt-safe overflow-y-auto scroll-smooth">
      <HomeCarousel />
    </div>
  );
};

export default Index;
