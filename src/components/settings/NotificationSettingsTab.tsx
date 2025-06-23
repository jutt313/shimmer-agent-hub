
import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const NotificationSettingsTab = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    automationCreated: true,
    automationStarted: true,
    automationCompleted: true,
    automationFailed: true,
    automationPaused: false,
    aiAgentResponses: true,
    platformIntegrations: true,
    knowledgeUpdates: false,
    criticalErrors: true,
    weeklyReports: true,
  });

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save notification preferences
    toast({
      title: "Success",
      description: "Notification preferences saved successfully",
    });
  };

  const notificationTypes = [
    {
      key: 'automationCreated' as keyof typeof settings,
      title: 'Automation Created',
      description: 'When a new automation is created',
      category: 'Automation Events'
    },
    {
      key: 'automationStarted' as keyof typeof settings,
      title: 'Automation Started',
      description: 'When an automation begins execution',
      category: 'Automation Events'
    },
    {
      key: 'automationCompleted' as keyof typeof settings,
      title: 'Automation Completed',
      description: 'When an automation finishes successfully',
      category: 'Automation Events'
    },
    {
      key: 'automationFailed' as keyof typeof settings,
      title: 'Automation Failed',
      description: 'When an automation encounters an error',
      category: 'Automation Events'
    },
    {
      key: 'automationPaused' as keyof typeof settings,
      title: 'Automation Paused',
      description: 'When an automation is paused or stopped',
      category: 'Automation Events'
    },
    {
      key: 'aiAgentResponses' as keyof typeof settings,
      title: 'AI Agent Responses',
      description: 'When AI agents generate important responses',
      category: 'AI & Agents'
    },
    {
      key: 'platformIntegrations' as keyof typeof settings,
      title: 'Platform Integration Updates',
      description: 'Updates about connected platforms and credentials',
      category: 'Platform & Integrations'
    },
    {
      key: 'knowledgeUpdates' as keyof typeof settings,
      title: 'Knowledge Base Updates',
      description: 'When new knowledge is added or updated',
      category: 'Knowledge System'
    },
    {
      key: 'criticalErrors' as keyof typeof settings,
      title: 'Critical System Errors',
      description: 'Important system-wide errors and issues',
      category: 'System Alerts'
    },
    {
      key: 'weeklyReports' as keyof typeof settings,
      title: 'Weekly Activity Reports',
      description: 'Summary of automation activity and performance',
      category: 'Reports'
    },
  ];

  const groupedNotifications = notificationTypes.reduce((acc, notification) => {
    const category = notification.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(notification);
    return acc;
  }, {} as Record<string, typeof notificationTypes>);

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([category, notifications]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">
                  {category}
                </h3>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.key}
                      className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border"
                    >
                      <div className="flex-1">
                        <Label htmlFor={notification.key} className="font-medium text-gray-900">
                          {notification.title}
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.description}
                        </p>
                      </div>
                      <Switch
                        id={notification.key}
                        checked={settings[notification.key]}
                        onCheckedChange={(checked) => handleSettingChange(notification.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Check className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettingsTab;
