import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useUserRole } from "./hooks/useUserRole";
import Index from "./pages/Index.tsx";
import Admin from "./pages/Admin.tsx";
import HouseDetail from "./pages/HouseDetail.tsx";
import MyBookings from "./pages/MyBookings.tsx";
import AdminRoute from "./components/AdminRoute";
import PendingApproval from "./components/PendingApproval";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, profile, loading } = useAuth();
  const { hasAdminAccess, loading: roleLoading } = useUserRole();

  if (loading || roleLoading) return null;

  // Not logged in → always show Index (which has login screen)
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Index />} />
      </Routes>
    );
  }

  // Logged in but not approved and not admin/mod → show pending screen
  if (profile && !profile.approved && !hasAdminAccess) {
    return <PendingApproval />;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/house/:id" element={<HouseDetail />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <SpeedInsights />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
