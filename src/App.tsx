
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Automations from "@/pages/Automations";
import AutomationDetail from "@/pages/AutomationDetail";
import KnowledgeAdmin from "@/pages/KnowledgeAdmin";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsConditions from "@/pages/TermsConditions";
import CookiePolicy from "@/pages/CookiePolicy";
import Disclaimer from "@/pages/Disclaimer";
import Support from "@/pages/Support";
import ErrorBoundary from "@/components/ErrorBoundary";
import ErrorIndicator from "@/components/ErrorIndicator";
import PerformanceMonitor from "@/components/PerformanceMonitor";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <Toaster />
          <ErrorIndicator />
          <PerformanceMonitor />
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/automations" element={<Automations />} />
              <Route path="/automations/:id" element={<AutomationDetail />} />
              <Route path="/knowledge" element={<KnowledgeAdmin />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/support" element={<Support />} />
            </Routes>
          </Router>
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
