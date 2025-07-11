
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { useGlobalNotificationHandler } from '@/hooks/useGlobalNotificationHandler';
import Home from '@/pages/Index';
import Automations from './pages/Automations';
import Integrations from '@/pages/Settings';
import AccountSettings from '@/pages/Settings';
import KnowledgeBase from '@/pages/DocumentationLibrary';
import Support from './pages/Support';
import Pricing from '@/pages/Landing';
import Login from '@/pages/Auth';
import SignUp from '@/pages/Auth';
import ForgotPassword from '@/pages/Auth';
import ResetPassword from '@/pages/Auth';
import NotFound from './pages/NotFound';
import PublicLayout from '@/pages/Landing';
import PrivateLayout from '@/pages/Settings';
import DiagramPage from '@/pages/AutomationDetail';
import AIagents from '@/pages/Settings';
import WebhooksPage from '@/pages/Settings';

const queryClient = new QueryClient();

// Global notification handler component
const GlobalNotificationHandler = ({ children }: { children: React.ReactNode }) => {
  useGlobalNotificationHandler();
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GlobalNotificationHandler>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/support" element={<Support />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Private Routes */}
                <Route path="/automations" element={<Automations />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/account-settings" element={<AccountSettings />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/diagram/:automationId" element={<DiagramPage />} />
                <Route path="/ai-agents" element={<AIagents />} />
                <Route path="/webhooks" element={<WebhooksPage />} />

                {/* Not Found Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </GlobalNotificationHandler>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
