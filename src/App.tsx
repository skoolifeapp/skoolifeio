import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MobileNav } from "@/components/layout/MobileNav";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ScrollReset } from "@/components/layout/ScrollReset";
import { lazy, Suspense } from "react";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Import = lazy(() => import("./pages/Import"));
const Exams = lazy(() => import("./pages/Exams"));
const AddExamOrConstraint = lazy(() => import("./pages/AddExamOrConstraint"));
const Planning = lazy(() => import("./pages/Planning"));
const Profile = lazy(() => import("./pages/Profile"));
const DayDetail = lazy(() => import("./pages/DayDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const AppContent = () => {
  const { user } = useAuth();
  
  return (
    <div className="relative">
      <ScrollReset />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute><Import /></ProtectedRoute>} />
          <Route path="/exams" element={<ProtectedRoute><Exams /></ProtectedRoute>} />
          <Route path="/exams/add" element={<ProtectedRoute><AddExamOrConstraint /></ProtectedRoute>} />
          <Route path="/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
          <Route path="/planning/day/:day" element={<ProtectedRoute><DayDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
