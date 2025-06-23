
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Bot, Calendar, LogOut, MessageCircle, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "@/components/NotificationDropdown";
import SeedNotificationsButton from "@/components/SeedNotificationsButton";
import SettingsModal from "@/components/SettingsModal";
import { createNotification, notificationTemplates } from "@/utils/notificationHelpers";

interface Automation {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  automation_blueprint?: any;
  platforms_config?: any;
}

const Automations = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAutomations();
  }, [user, navigate]);

  const fetchAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAutomations(data || []);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast({
        title: "Error",
        description: "Failed to load automations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAutomation = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your automation",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setCreateLoading(true);
    try {
      console.log('Creating automation with user_id:', user.id);
      
      const { data, error } = await supabase
        .from('automations')
        .insert([
          {
            user_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            status: 'draft',
            platforms_config: null
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Automation created successfully:', data);
      
      // Create notification for successful automation creation
      try {
        const template = notificationTemplates.automationCreated(data.title);
        await createNotification(
          user.id,
          template.title,
          template.message,
          template.type,
          template.category,
          { automation_id: data.id, automation_title: data.title }
        );
        console.log('Creation notification sent successfully');
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't throw here - automation was created successfully
      }

      setAutomations([data, ...automations]);
      setTitle("");
      setDescription("");
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Automation created successfully!",
      });

      // Navigate to the new automation's chat
      navigate(`/automation/${data.id}`);
    } catch (error) {
      console.error('Error creating automation:', error);
      
      // Create notification for automation creation failure
      try {
        const errorTemplate = notificationTemplates.criticalError(`Failed to create automation: ${title}`);
        await createNotification(
          user.id,
          errorTemplate.title,
          errorTemplate.message,
          errorTemplate.type,
          errorTemplate.category,
          { attempted_title: title, error: error instanceof Error ? error.message : 'Unknown error' }
        );
      } catch (notifError) {
        console.error('Failed to create error notification:', notifError);
      }
      
      toast({
        title: "Error",
        description: "Failed to create automation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Automations
              </h1>
              <p className="text-gray-600 mt-2">Create and manage your AI automations</p>
            </div>
            <div className="flex gap-4">
              <NotificationDropdown />
              <SeedNotificationsButton />
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="rounded-xl border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Create New Automation */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Card 
                className="mb-8 cursor-pointer hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-md border-0 rounded-3xl"
                style={{
                  boxShadow: '0 0 30px rgba(92, 142, 246, 0.2)'
                }}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Create New Automation
                  </h3>
                  <p className="text-gray-600 mt-2">Click to start building your automation</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="rounded-3xl bg-white/90 backdrop-blur-md border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Create New Automation
                </DialogTitle>
                <DialogDescription>
                  Give your automation a name and description to get started.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Automation Name *
                  </label>
                  <Input
                    placeholder="e.g., Lead Qualification Flow"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-xl bg-white/80 backdrop-blur-sm border-0 shadow-lg focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Description (Optional)
                  </label>
                  <Textarea
                    placeholder="Describe what this automation will do..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-xl bg-white/80 backdrop-blur-sm border-0 shadow-lg focus:ring-2 focus:ring-blue-500/50 min-h-[100px]"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setIsDialogOpen(false)}
                    variant="outline"
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createAutomation}
                    disabled={createLoading}
                    className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {createLoading ? "Creating..." : "Create Automation"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Automations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {automations.map((automation) => (
              <Card 
                key={automation.id}
                onClick={() => navigate(`/automation/${automation.id}`)}
                className="hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-md border-0 rounded-3xl cursor-pointer"
                style={{
                  boxShadow: '0 0 25px rgba(154, 94, 255, 0.15)'
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(automation.status)}`}>
                      {automation.status}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-800 mt-4">
                    {automation.title}
                  </CardTitle>
                  {automation.description && (
                    <CardDescription className="text-gray-600 line-clamp-2">
                      {automation.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(automation.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-blue-600">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {automations.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Bot className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No automations yet</h3>
              <p className="text-gray-600 mb-6">Create your first automation to get started with AI-powered workflows.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Automations;
