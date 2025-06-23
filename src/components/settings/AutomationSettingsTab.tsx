
import { useState, useEffect } from 'react';
import { Bot, Trash2, Edit, Eye, AlertTriangle, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import AutomationDetailsModal from './AutomationDetailsModal';

interface Automation {
  id: string;
  title: string;
  status: string;
  created_at: string;
  description?: string;
}

const AutomationSettingsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [settings, setSettings] = useState({
    defaultErrorHandling: 'stop',
    maxExecutionTime: '300',
    timezone: 'UTC',
    autoRetry: false,
    maxRetries: '3',
  });

  useEffect(() => {
    fetchAutomations();
  }, [user]);

  const fetchAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('id, title, status, created_at, description')
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

  const handleDeleteAutomation = async (automationId: string) => {
    try {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', automationId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setAutomations(prev => prev.filter(a => a.id !== automationId));
      toast({
        title: "Success",
        description: "Automation deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting automation:', error);
      toast({
        title: "Error",
        description: "Failed to delete automation",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            Default Automation Settings
          </CardTitle>
          <CardDescription>
            Configure default behavior for all your automations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="errorHandling">Default Error Handling</Label>
              <Select
                value={settings.defaultErrorHandling}
                onValueChange={(value) => setSettings(prev => ({ ...prev, defaultErrorHandling: value }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stop">Stop execution</SelectItem>
                  <SelectItem value="retry">Retry automatically</SelectItem>
                  <SelectItem value="continue">Continue with next step</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxExecutionTime">Max Execution Time (seconds)</Label>
              <Input
                id="maxExecutionTime"
                type="number"
                value={settings.maxExecutionTime}
                onChange={(e) => setSettings(prev => ({ ...prev, maxExecutionTime: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="maxRetries">Max Retry Attempts</Label>
              <Input
                id="maxRetries"
                type="number"
                value={settings.maxRetries}
                onChange={(e) => setSettings(prev => ({ ...prev, maxRetries: e.target.value }))}
                className="rounded-xl"
                disabled={!settings.autoRetry}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="autoRetry"
              checked={settings.autoRetry}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoRetry: checked }))}
            />
            <Label htmlFor="autoRetry">Enable automatic retry on failure</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            Your Automations ({automations.length})
          </CardTitle>
          <CardDescription>
            Manage all your automation workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading automations...</p>
            </div>
          ) : automations.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No automations created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {automations.map((automation) => (
                <div
                  key={automation.id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{automation.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(automation.status)}`}>
                        {automation.status}
                      </span>
                    </div>
                    {automation.description && (
                      <p className="text-sm text-gray-600 mt-1">{automation.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(automation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAutomation(automation);
                        setShowDetailsModal(true);
                      }}
                      className="rounded-xl"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAutomation(automation.id)}
                      className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAutomation && (
        <AutomationDetailsModal
          automation={selectedAutomation}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAutomation(null);
          }}
        />
      )}
    </div>
  );
};

export default AutomationSettingsTab;
