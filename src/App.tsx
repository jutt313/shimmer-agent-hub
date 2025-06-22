
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Automations from "@/pages/Automations";
import AutomationDetail from "@/pages/AutomationDetail";
import KnowledgeAdmin from "@/pages/KnowledgeAdmin";
import ErrorBoundary from "@/components/ErrorBoundary";
import ErrorIndicator from "@/components/ErrorIndicator";

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <Toaster />
          <ErrorIndicator />
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/automations" element={<Automations />} />
              <Route path="/automations/:id" element={<AutomationDetail />} />
              <Route path="/knowledge" element={<KnowledgeAdmin />} />
            </Routes>
          </Router>
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
