
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Navigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, loading, adminData } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <div className="text-lg text-gray-600">Verifying admin access...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-red-50 to-orange-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Lock className="h-24 w-24 text-red-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-red-700 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-6">
            You don't have the required administrator privileges to access this area.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
