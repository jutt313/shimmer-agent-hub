
import { useState } from "react";
import { Settings, User, Shield, Key, Code2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import PersonalApiDashboard from "./PersonalApiDashboard";
import DeveloperPortalDashboard from "./DeveloperPortalDashboard";
import SettingsTabs from "./settings/SettingsTabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const SettingsDropdown = () => {
  const { signOut } = useAuth();
  const [showPersonalApi, setShowPersonalApi] = useState(false);
  const [showDeveloperPortal, setShowDeveloperPortal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="rounded-full p-2">
            <Settings className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white border shadow-lg">
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <User className="w-4 h-4 mr-2" />
            Profile & Settings
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowPersonalApi(true)}>
            <Key className="w-4 h-4 mr-2" />
            Personal API Keys
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowDeveloperPortal(true)}>
            <Code2 className="w-4 h-4 mr-2" />
            Dev Portal
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Personal API Dashboard */}
      <PersonalApiDashboard 
        isOpen={showPersonalApi} 
        onClose={() => setShowPersonalApi(false)} 
      />

      {/* Developer Portal Dashboard */}
      <DeveloperPortalDashboard 
        isOpen={showDeveloperPortal} 
        onClose={() => setShowDeveloperPortal(false)} 
      />

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <SettingsTabs />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsDropdown;
