import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Automations from "./pages/Automations";
import AutomationDetail from "./pages/AutomationDetail";
import KnowledgeAdmin from "./pages/KnowledgeAdmin";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import CookiePolicy from "./pages/CookiePolicy";
import Disclaimer from "./pages/Disclaimer";
import Support from "./pages/Support";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

// Set favicon
const favicon = (document.querySelector("link[rel*='icon']") as HTMLLinkElement) || document.createElement('link');
favicon.type = 'image/png';
favicon.rel = 'shortcut icon';
favicon.href = '/lovable-uploads/6b9580a6-e2cd-4056-95a9-7f730cbf6025.png';
document.getElementsByTagName('head')[0].appendChild(favicon);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
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
            </Routes>
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
