
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

const SettingsDropdown = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState("");

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDocumentationClick = () => {
    navigate('/documentation');
  };

  const handleComingSoonClick = (feature: string) => {
    setComingSoonFeature(feature);
    setShowComingSoon(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="rounded-full p-2 hover:bg-gray-100">
            <Settings className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white border shadow-lg z-50">
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <User className="w-4 h-4 mr-2" />
            Profile & Settings
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleDocumentationClick}>
            <BookOpen className="w-4 h-4 mr-2" />
            Documentation Library
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleComingSoonClick("Developer API")} className="flex items-center justify-between">
            <div className="flex items-center">
              <Code className="w-4 h-4 mr-2" />
              Developer API
            </div>
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleComingSoonClick("API Playground")} className="flex items-center justify-between">
            <div className="flex items-center">
              <PlayCircle className="w-4 h-4 mr-2" />
              API Playground
            </div>
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
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

      {/* Coming Soon Modal */}
      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {comingSoonFeature}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-center space-y-3 pt-4">
              <div className="text-4xl">🚀</div>
              <p className="text-lg font-medium">We're working hard to bring you this feature!</p>
              <p>Our {comingSoonFeature} is currently in development and will be available very soon to help you build amazing automations.</p>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mt-4">
                <p className="text-sm text-blue-800 font-medium">✨ Get ready for:</p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Powerful API access</li>
                  <li>• Advanced automation tools</li>
                  <li>• Seamless integrations</li>
                  <li>• Professional workflows</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 mt-4">Thank you for your patience as we perfect this experience for you! 💙</p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsDropdown;
