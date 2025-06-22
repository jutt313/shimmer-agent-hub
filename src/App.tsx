import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/providers/AuthProvider";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Automations from "@/pages/Automations";
import AutomationDetail from "@/pages/AutomationDetail";
import KnowledgeAdmin from "@/pages/KnowledgeAdmin";
import AIAgentAdmin from "@/pages/AIAgentAdmin";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <Toaster />
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/automations" element={<Automations />} />
                <Route path="/automations/:id" element={<AutomationDetail />} />
                <Route path="/knowledge" element={<KnowledgeAdmin />} />
                <Route path="/agents" element={<AIAgentAdmin />} />
              </Routes>
            </Router>
          </AuthProvider>
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
