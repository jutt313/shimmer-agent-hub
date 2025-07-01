
import { useState } from "react";
import { Settings, User, LogOut, Code, PlayCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import SettingsTabs from "./settings/SettingsTabs";
import DeveloperPortal from "./developer/DeveloperPortal";
import PlaygroundConsole from "./developer/PlaygroundConsole";
import DocumentationModal from "./documentation/DocumentationModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const SettingsDropdown = () => {
  const { signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showDeveloperPortal, setShowDeveloperPortal] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);

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
        <DropdownMenuContent align="end" className="w-56 bg-white border shadow-lg z-50">
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <User className="w-4 h-4 mr-2" />
            Profile & Settings
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowDocumentation(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Documentation
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowDeveloperPortal(true)}>
            <Code className="w-4 h-4 mr-2" />
            Developer API
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowPlayground(true)}>
            <PlayCircle className="w-4 h-4 mr-2" />
            API Playground
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <SettingsTabs />
        </DialogContent>
      </Dialog>

      {/* Documentation Modal */}
      <Dialog open={showDocumentation} onOpenChange={setShowDocumentation}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
          <DocumentationModal />
        </DialogContent>
      </Dialog>

      {/* Developer Portal Modal */}
      <Dialog open={showDeveloperPortal} onOpenChange={setShowDeveloperPortal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DeveloperPortal />
        </DialogContent>
      </Dialog>

      {/* API Playground Modal */}
      <Dialog open={showPlayground} onOpenChange={setShowPlayground}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <PlaygroundConsole />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsDropdown;
