
import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Monitor, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface NotificationPreferences {
  automation_error: boolean;
  automation_failed: boolean;
  automation_created: boolean;
  automation_started: boolean;
  automation_stopped: boolean;
  automation_completed: boolean;
  platform_connection_failed: boolean;
  platform_connection_success: boolean;
  weekly_summary: boolean;
  security_alerts: boolean;
  feature_updates: boolean;
  maintenance_notices: boolean;
}

const NotificationsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    automation_error: true,
    automation_failed: true,
    automation_created: true,
    automation_started: false,
    automation_stopped: false,
    automation_completed: true,
    platform_connection_failed: true,
    platform_connection_success: false,
    weekly_summary: true,
    security_alerts: true,
    feature_updates: true,
    maintenance_notices: true,
  });

  useEffect(() => {
    fetchNotificationPreferences();
  }, [user]);

  const fetchNotificationPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_preferences')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.notification_preferences) {
        setPreferences(prev => ({
          ...prev,
          ...data.notification_preferences
        }));
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const updateNotificationPreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return;

    setLoading(true);
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notification_preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setPreferences(updatedPreferences);
      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newValue = !preferences[key];
    updateNotificationPreferences({ [key]: newValue });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Automation Notifications */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <Bell className="w-5 h-5 text-blue-600" />
            Automation Notifications
          </CardTitle>
          <CardDescription>
            Get notified about your automation activities and status changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <div>
                <Label className="font-medium text-gray-900">Automation Errors</Label>
                <p className="text-sm text-gray-600">Critical issues requiring attention</p>
              </div>
              <Switch
                checked={preferences.automation_error}
                onCheckedChange={() => handleToggle('automation_error')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <div>
                <Label className="font-medium text-gray-900">Automation Failed</Label>
                <p className="text-sm text-gray-600">When automations fail to complete</p>
              </div>
              <Switch
                checked={preferences.automation_failed}
                onCheckedChange={() => handleToggle('automation_failed')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <div>
                <Label className="font-medium text-gray-900">Automation Created</Label>
                <p className="text-sm text-gray-600">New automation confirmations</p>
              </div>
              <Switch
                checked={preferences.automation_created}
                onCheckedChange={() => handleToggle('automation_created')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <div>
                <Label className="font-medium text-gray-900">Automation Completed</Label>
                <p className="text-sm text-gray-600">Successful completion alerts</p>
              </div>
              <Switch
                checked={preferences.automation_completed}
                onCheckedChange={() => handleToggle('automation_completed')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <div>
                <Label className="font-medium text-gray-900">Automation Started</Label>
                <p className="text-sm text-gray-600">When automations begin execution</p>
              </div>
              <Switch
                checked={preferences.automation_started}
                onCheckedChange={() => handleToggle('automation_started')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <div>
                <Label className="font-medium text-gray-900">Automation Stopped</Label>
                <p className="text-sm text-gray-600">When automations are stopped</p>
              </div>
              <Switch
                checked={preferences.automation_stopped}
                onCheckedChange={() => handleToggle('automation_stopped')}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Notifications */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            <Settings className="w-5 h-5 text-green-600" />
            Platform & Security
          </CardTitle>
          <CardDescription>
            Notifications about platform connections and security events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <div>
                <Label className="font-medium text-gray-900">Connection Failed</Label>
                <p className="text-sm text-gray-600">Platform connection issues</p>
              </div>
              <Switch
                checked={preferences.platform_connection_failed}
                onCheckedChange={() => handleToggle('platform_connection_failed')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <div>
                <Label className="font-medium text-gray-900">Connection Success</Label>
                <p className="text-sm text-gray-600">Successful platform connections</p>
              </div>
              <Switch
                checked={preferences.platform_connection_success}
                onCheckedChange={() => handleToggle('platform_connection_success')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <div>
                <Label className="font-medium text-gray-900">Security Alerts</Label>
                <p className="text-sm text-gray-600">Important security notifications</p>
              </div>
              <Switch
                checked={preferences.security_alerts}
                onCheckedChange={() => handleToggle('security_alerts')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <div>
                <Label className="font-medium text-gray-900">Weekly Summary</Label>
                <p className="text-sm text-gray-600">Weekly automation reports</p>
              </div>
              <Switch
                checked={preferences.weekly_summary}
                onCheckedChange={() => handleToggle('weekly_summary')}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Notifications */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <Monitor className="w-5 h-5 text-purple-600" />
            System Updates
          </CardTitle>
          <CardDescription>
            Stay informed about new features and system maintenance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <div>
                <Label className="font-medium text-gray-900">Feature Updates</Label>
                <p className="text-sm text-gray-600">New features and improvements</p>
              </div>
              <Switch
                checked={preferences.feature_updates}
                onCheckedChange={() => handleToggle('feature_updates')}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl">
              <div>
                <Label className="font-medium text-gray-900">Maintenance Notices</Label>
                <p className="text-sm text-gray-600">Scheduled maintenance alerts</p>
              </div>
              <Switch
                checked={preferences.maintenance_notices}
                onCheckedChange={() => handleToggle('maintenance_notices')}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Methods */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            <Mail className="w-5 h-5 text-yellow-600" />
            Delivery Methods
          </CardTitle>
          <CardDescription>
            Choose how you'd like to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white/70 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <Label className="font-medium text-gray-900">Email Notifications</Label>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Receive notifications via email at {user?.email}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full">
                ✓ Active
              </span>
              <span className="text-xs text-gray-500">
                Primary notification method
              </span>
            </div>
          </div>

          <div className="bg-white/70 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Bell className="w-5 h-5 text-purple-600" />
              <Label className="font-medium text-gray-900">In-App Notifications</Label>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Real-time notifications within the YusrAI platform
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full">
                ✓ Active
              </span>
              <span className="text-xs text-gray-500">
                Instant notifications
              </span>
            </div>
          </div>

          <div className="bg-white/70 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Smartphone className="w-5 h-5 text-gray-400" />
              <Label className="font-medium text-gray-900">Push Notifications</Label>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Mobile and desktop push notifications
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
                🚀 Coming Soon
              </span>
              <span className="text-xs text-gray-500">
                Mobile app notifications
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;
