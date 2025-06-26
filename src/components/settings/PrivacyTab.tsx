
import { useState, useEffect } from 'react';
import { Shield, Trash2, AlertTriangle, Download, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DataSummary {
  automations: number;
  chatMessages: number;
  aiAgents: number;
  totalDataMB: string;
}

const PrivacyTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [dataSummary, setDataSummary] = useState<DataSummary>({
    automations: 0,
    chatMessages: 0,
    aiAgents: 0,
    totalDataMB: '0.0'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataSummary();
  }, [user]);

  const fetchDataSummary = async () => {
    try {
      // Get automations count
      const { data: automations, error: automationsError } = await supabase
        .from('automations')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id);

      if (automationsError) throw automationsError;

      // Get automation IDs for chat messages
      const automationIds = automations?.map(a => a.id) || [];
      
      // Get chat messages count
      let chatCount = 0;
      if (automationIds.length > 0) {
        const { count, error: chatError } = await supabase
          .from('automation_chats')
          .select('*', { count: 'exact', head: true })
          .in('automation_id', automationIds);

        if (chatError) throw chatError;
        chatCount = count || 0;
      }

      // Get AI agents count
      let agentsCount = 0;
      if (automationIds.length > 0) {
        const { count, error: agentsError } = await supabase
          .from('ai_agents')
          .select('*', { count: 'exact', head: true })
          .in('automation_id', automationIds);

        if (agentsError) throw agentsError;
        agentsCount = count || 0;
      }

      // Calculate estimated data size (rough estimate)
      const estimatedSizeKB = (automations?.length || 0) * 2 + chatCount * 0.5 + agentsCount * 1;
      const estimatedSizeMB = (estimatedSizeKB / 1024).toFixed(1);

      setDataSummary({
        automations: automations?.length || 0,
        chatMessages: chatCount,
        aiAgents: agentsCount,
        totalDataMB: estimatedSizeMB
      });
    } catch (error) {
      console.error('Error fetching data summary:', error);
      toast({
        title: "Error",
        description: "Failed to load data summary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      // Fetch all user data
      const [automationsResult, chatsResult, agentsResult, credentialsResult] = await Promise.all([
        supabase.from('automations').select('*').eq('user_id', user?.id),
        supabase.from('automation_chats').select('*').in('automation_id', 
          (await supabase.from('automations').select('id').eq('user_id', user?.id)).data?.map(a => a.id) || []
        ),
        supabase.from('ai_agents').select('*').in('automation_id',
          (await supabase.from('automations').select('id').eq('user_id', user?.id)).data?.map(a => a.id) || []
        ),
        supabase.from('platform_credentials').select('platform_name, credential_type, is_active').eq('user_id', user?.id)
      ]);

      const userData = {
        profile: { email: user?.email },
        automations: automationsResult.data || [],
        chats: chatsResult.data || [],
        agents: agentsResult.data || [],
        credentials: credentialsResult.data || [],
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Your data has been exported successfully",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChats = async () => {
    setIsDeleting(true);
    try {
      // Get automation IDs first
      const { data: automations } = await supabase
        .from('automations')
        .select('id')
        .eq('user_id', user?.id);

      const automationIds = automations?.map(a => a.id) || [];

      if (automationIds.length > 0) {
        const { error } = await supabase
          .from('automation_chats')
          .delete()
          .in('automation_id', automationIds);

        if (error) throw error;
      }

      await fetchDataSummary(); // Refresh data

      toast({
        title: "Success",
        description: "All chats deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting chats:', error);
      toast({
        title: "Error",
        description: "Failed to delete chats",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAutomations = async () => {
    setIsDeleting(true);
    try {
      // Delete in correct order due to foreign key constraints
      const { data: automations } = await supabase
        .from('automations')
        .select('id')
        .eq('user_id', user?.id);

      const automationIds = automations?.map(a => a.id) || [];

      if (automationIds.length > 0) {
        // Delete chats first
        await supabase
          .from('automation_chats')
          .delete()
          .in('automation_id', automationIds);

        // Delete agents
        await supabase
          .from('ai_agents')
          .delete()
          .in('automation_id', automationIds);

        // Delete automation runs
        await supabase
          .from('automation_runs')
          .delete()
          .in('automation_id', automationIds);

        // Delete automation diagrams
        await supabase
          .from('automation_diagrams')
          .delete()
          .in('automation_id', automationIds);

        // Finally delete automations
        const { error } = await supabase
          .from('automations')
          .delete()
          .eq('user_id', user?.id);

        if (error) throw error;
      }

      await fetchDataSummary(); // Refresh data

      toast({
        title: "Success",
        description: "All automations deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting automations:', error);
      toast({
        title: "Error",
        description: "Failed to delete automations",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Get automation IDs first
      const { data: automations } = await supabase
        .from('automations')
        .select('id')
        .eq('user_id', user?.id);

      const automationIds = automations?.map(a => a.id) || [];

      // Delete all user data in correct order
      if (automationIds.length > 0) {
        await Promise.all([
          supabase.from('automation_chats').delete().in('automation_id', automationIds),
          supabase.from('ai_agents').delete().in('automation_id', automationIds),
          supabase.from('automation_runs').delete().in('automation_id', automationIds),
          supabase.from('automation_diagrams').delete().in('automation_id', automationIds),
        ]);

        await supabase.from('automations').delete().eq('user_id', user?.id);
      }

      await Promise.all([
        supabase.from('platform_credentials').delete().eq('user_id', user?.id),
        supabase.from('notifications').delete().eq('user_id', user?.id),
        supabase.from('user_preferences').delete().eq('user_id', user?.id),
        supabase.from('profiles').delete().eq('id', user?.id)
      ]);

      // Sign out the user
      await supabase.auth.signOut();

      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted",
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading privacy settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Export Data */}
      <Card className="bg-white/70 backdrop-blur-sm border border-blue-200/50 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Download className="w-5 h-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download all your data in a portable format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-700 mb-4">
              Export includes automations, chat history, AI agents, and settings. Credentials are exported without sensitive data.
            </p>
            <Button
              onClick={handleExportData}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Specific Data */}
      <Card className="bg-white/70 backdrop-blur-sm border border-blue-200/50 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Database className="w-5 h-5" />
            Delete Specific Data
          </CardTitle>
          <CardDescription>
            Remove specific types of data while keeping your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <h4 className="font-medium text-orange-900 mb-2">Delete All Chats</h4>
              <p className="text-sm text-orange-700 mb-3">Remove all conversation history</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isDeleting}
                    className="rounded-xl border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Chats
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Chats</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your chat history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteChats}
                      className="rounded-xl bg-orange-600 hover:bg-orange-700"
                    >
                      Delete Chats
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">Delete All Automations</h4>
              <p className="text-sm text-red-700 mb-3">Remove all automations and their data</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isDeleting}
                    className="rounded-xl border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Automations
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Automations</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your automations, AI agents, and related data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAutomations}
                      className="rounded-xl bg-red-600 hover:bg-red-700"
                    >
                      Delete Automations
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="bg-white/70 backdrop-blur-sm border border-red-200/50 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your entire account and all data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900">Permanent Account Deletion</h4>
                <p className="text-sm text-red-700 mt-1 mb-4">
                  This will permanently delete your account and all associated data including:
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1 mb-4">
                  <li>All automations and their configurations</li>
                  <li>Chat history and AI conversations</li>
                  <li>Platform credentials and API keys</li>
                  <li>Notifications and system logs</li>
                  <li>Profile and account settings</li>
                </ul>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={isDeleting}
                      className="rounded-xl border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-900">Delete Account</AlertDialogTitle>
                      <AlertDialogDescription className="text-red-700">
                        This will permanently delete your account and all associated data. This action cannot be undone.
                        Are you absolutely sure you want to continue?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="rounded-xl bg-red-600 hover:bg-red-700"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real Data Usage Summary */}
      <Card className="bg-white/70 backdrop-blur-sm border border-blue-200/50 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Shield className="w-5 h-5" />
            Data Usage Summary
          </CardTitle>
          <CardDescription>Overview of your current data usage (live data)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100 text-center">
              <div className="text-2xl font-bold text-blue-600">{dataSummary.automations}</div>
              <div className="text-sm text-gray-600">Automations</div>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100 text-center">
              <div className="text-2xl font-bold text-purple-600">{dataSummary.chatMessages}</div>
              <div className="text-sm text-gray-600">Chat Messages</div>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100 text-center">
              <div className="text-2xl font-bold text-green-600">{dataSummary.aiAgents}</div>
              <div className="text-sm text-gray-600">AI Agents</div>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100 text-center">
              <div className="text-2xl font-bold text-orange-600">{dataSummary.totalDataMB} MB</div>
              <div className="text-sm text-gray-600">Total Data</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyTab;
