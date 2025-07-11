
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AutomationDashboard from "@/components/AutomationDashboard";
import SettingsDropdown from "@/components/SettingsDropdown";
import NotificationDropdown from "@/components/NotificationDropdown";
import ErrorIndicator from "@/components/ErrorIndicator";
import NotificationSystemStatus from "@/components/NotificationSystemStatus";
import { useAuth } from "@/contexts/AuthContext";
import PlatformButtons from "@/components/PlatformButtons";

const Automations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPlatformSelection, setShowPlatformSelection] = useState(false);

  const handleCreateAutomation = () => {
    setShowPlatformSelection(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/app")}
            className="rounded-2xl p-3 hover:bg-white/60 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Automations
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage your automation workflows
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <NotificationDropdown />
          <SettingsDropdown />
          <Button
            onClick={handleCreateAutomation}
            className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 border-0"
            style={{
              boxShadow: '0 0 30px rgba(92, 142, 246, 0.3)'
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Automation
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {showPlatformSelection ? (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-blue-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Select Platform to Connect
              </h2>
              <Button
                variant="ghost"
                onClick={() => setShowPlatformSelection(false)}
                className="rounded-2xl"
              >
                ← Back to Dashboard
              </Button>
            </div>
            <PlatformButtons />
          </div>
        ) : (
          <AutomationDashboard />
        )}
      </div>

      {/* Error Indicator for comprehensive error detection */}
      <ErrorIndicator />
      
      {/* System Status Indicator */}
      <NotificationSystemStatus />
    </div>
  );
};

export default Automations;
