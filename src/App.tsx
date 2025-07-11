import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { useGlobalNotificationHandler } from '@/hooks/useGlobalNotificationHandler';
import Home from './pages/Home';
import Automations from './pages/Automations';
import Integrations from './pages/Integrations';
import AccountSettings from './pages/AccountSettings';
import KnowledgeBase from './pages/KnowledgeBase';
import Support from './pages/Support';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import PublicLayout from '@/layouts/PublicLayout';
import PrivateLayout from '@/layouts/PrivateLayout';
import DiagramPage from '@/pages/DiagramPage';
import AIagents from '@/pages/AIagents';
import WebhooksPage from '@/pages/WebhooksPage';
import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { globalErrorLogger } from './utils/errorLogger';

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
                <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
                <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
                <Route path="/support" element={<PublicLayout><Support /></PublicLayout>} />
                <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
                <Route path="/signup" element={<PublicLayout><SignUp /></PublicLayout>} />
                <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
                <Route path="/reset-password" element={<PublicLayout><ResetPassword /></PublicLayout>} />

                {/* Private Routes */}
                <Route path="/automations" element={<PrivateLayout><Automations /></PrivateLayout>} />
                <Route path="/integrations" element={<PrivateLayout><Integrations /></PrivateLayout>} />
                <Route path="/account-settings" element={<PrivateLayout><AccountSettings /></PrivateLayout>} />
                <Route path="/knowledge-base" element={<PrivateLayout><KnowledgeBase /></PrivateLayout>} />
                <Route path="/diagram/:automationId" element={<PrivateLayout><DiagramPage /></PrivateLayout>} />
                <Route path="/ai-agents" element={<PrivateLayout><AIagents /></PrivateLayout>} />
                <Route path="/webhooks" element={<PrivateLayout><WebhooksPage /></PrivateLayout>} />

                {/* Not Found Route */}
                <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
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
