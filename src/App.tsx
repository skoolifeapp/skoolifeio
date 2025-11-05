import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MobileNav } from "@/components/layout/MobileNav";
import Index from "./pages/Index";
import Import from "./pages/Import";
import Exams from "./pages/Exams";
import AddExamOrConstraint from "./pages/AddExamOrConstraint";
import Planning from "./pages/Planning";
import Profile from "./pages/Profile";
import DayDetail from "./pages/DayDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="relative">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/import" element={<Import />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/exams/add" element={<AddExamOrConstraint />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/planning/day/:day" element={<DayDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <MobileNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
