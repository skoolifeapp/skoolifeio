import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DesktopLayout } from "@/components/layout/DesktopLayout";
import { ScrollReset } from "@/components/layout/ScrollReset";
import { useMigrateLocalStorageToSupabase } from "@/hooks/useMigrateLocalStorageToSupabase";
import Index from "./pages/Index";
import Exams from "./pages/Exams";
import Planning from "./pages/Planning";
import Profile from "./pages/Profile";
import Constraints from "./pages/Constraints";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - données considérées fraîches
      gcTime: 1000 * 60 * 30, // 30 minutes - garde en cache
      refetchOnWindowFocus: false, // Pas de refetch au focus
      refetchOnMount: false, // Utilise le cache si disponible
      retry: 1, // Une seule tentative en cas d'erreur
      networkMode: 'offlineFirst', // Utilise le cache en priorité
    },
  },
});

const AppContent = () => {
  const { user } = useAuth();
  
  useMigrateLocalStorageToSupabase();
  
  return (
    <div className="relative">
      <ScrollReset />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DesktopLayout>
                <Index />
              </DesktopLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams"
          element={
            <ProtectedRoute>
              <DesktopLayout>
                <Exams />
              </DesktopLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/constraints"
          element={
            <ProtectedRoute>
              <DesktopLayout>
                <Constraints />
              </DesktopLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/planning"
          element={
            <ProtectedRoute>
              <DesktopLayout>
                <Planning />
              </DesktopLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DesktopLayout>
                <Profile />
              </DesktopLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
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
          <DataProvider>
            <AppContent />
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
