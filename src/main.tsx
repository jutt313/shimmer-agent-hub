
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
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/knowledge-admin" element={<KnowledgeAdmin />} />
            <Route 
              path="/automations" 
              element={
                <ProtectedRoute>
                  <Automations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/automation/:id" 
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
  </StrictMode>
);
