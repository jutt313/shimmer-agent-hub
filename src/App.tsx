
import { StrictMode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Automations from "./pages/Automations";
import AutomationDetail from "./pages/AutomationDetail";
import KnowledgeAdmin from "./pages/KnowledgeAdmin";
import DeveloperPortal from "./pages/DeveloperPortal";
import Documentation from "./pages/Documentation";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import CookiePolicy from "./pages/CookiePolicy";
import Disclaimer from "./pages/Disclaimer";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Settings from "./pages/Settings";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

// Set favicon
const favicon = (document.querySelector("link[rel*='icon']") as HTMLLinkElement) || document.createElement('link');
favicon.type = 'image/png';
favicon.rel = 'shortcut icon';
favicon.href = '/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png';
document.getElementsByTagName('head')[0].appendChild(favicon);

function App() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-conditions" element={<TermsConditions />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/support" element={<Support />} />
                <Route 
                  path="/admin/knowledge" 
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <KnowledgeAdmin />
                      </AdminRoute>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/automations" 
                  element={
                    <ProtectedRoute>
                      <Automations />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/automations/:id" 
                  element={
                    <ProtectedRoute>
                      <AutomationDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/developer" 
                  element={
                    <ProtectedRoute>
                      <DeveloperPortal />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <SonnerToaster />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

export default App;
