import { HomeCarousel } from "@/components/home/HomeCarousel";
import { HeaderStreak } from "@/components/layout/HeaderStreak";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderStreak />
      <div 
        className="flex-1 flex items-center justify-center"
        style={{ paddingBottom: `calc(5rem + env(safe-area-inset-bottom))` }}
      >
        <HomeCarousel />
      </div>
    </div>
  );
};

export default Index;
