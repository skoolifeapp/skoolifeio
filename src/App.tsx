import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MobileNav } from "@/components/layout/MobileNav";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ScrollReset } from "@/components/layout/ScrollReset";
import { useMigrateLocalStorageToSupabase } from "@/hooks/useMigrateLocalStorageToSupabase";
import Index from "./pages/Index";
import Exams from "./pages/Exams";
import AddExamOrConstraint from "./pages/AddExamOrConstraint";
import Planning from "./pages/Planning";
import Profile from "./pages/Profile";
import DayDetail from "./pages/DayDetail";
import Constraints from "./pages/Constraints";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user } = useAuth();
  
  // Automatically migrate localStorage data to Supabase on first load
  useMigrateLocalStorageToSupabase();
  
  return (
    <div className="relative">
      <ScrollReset />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute><Exams /></ProtectedRoute>} />
        <Route path="/add-exam-or-constraint" element={<ProtectedRoute><AddExamOrConstraint /></ProtectedRoute>} />
        <Route path="/constraints" element={<ProtectedRoute><Constraints /></ProtectedRoute>} />
        <Route path="/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
        <Route path="/planning/day/:day" element={<ProtectedRoute><DayDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <MobileNav />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
