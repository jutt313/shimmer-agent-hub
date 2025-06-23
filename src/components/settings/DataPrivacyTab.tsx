
import { useState } from 'react';
import { Shield, Download, Trash2, Calendar, Database, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
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

const DataPrivacyTab = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    automationLogsRetention: '90',
    chatHistoryRetention: '365',
    notificationRetention: '30',
    errorLogsRetention: '180',
    autoDeleteInactiveData: true,
    allowDataExport: true,
    allowDataDeletion: true,
  });

  const handleExportData = () => {
    toast({
      title: "Data Export Started",
      description: "Your data export will be ready shortly. You'll receive a download link via email.",
    });
  };

  const handleDeleteAllData = () => {
    toast({
      title: "Account Deletion",
      description: "This feature requires additional verification. Please contact support.",
      variant: "destructive",
    });
  };

  const dataTypes = [
    {
      name: 'Automation Run Logs',
      description: 'Execution history and performance data',
      retention: settings.automationLogsRetention,
      key: 'automationLogsRetention'
    },
    {
      name: 'Chat History',
      description: 'AI conversations and message history',
      retention: settings.chatHistoryRetention,
      key: 'chatHistoryRetention'
    },
    {
      name: 'Notifications',
      description: 'System and automation notifications',
      retention: settings.notificationRetention,
      key: 'notificationRetention'
    },
    {
      name: 'Error Logs',
      description: 'System errors and debugging information',
      retention: settings.errorLogsRetention,
      key: 'errorLogsRetention'
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Data Retention Policies
          </CardTitle>
          <CardDescription>
            Configure how long different types of data are stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dataTypes.map((dataType) => (
            <div key={dataType.key} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{dataType.name}</h4>
                <p className="text-sm text-gray-600">{dataType.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Keep for:</Label>
                <Select
                  value={dataType.retention}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, [dataType.key]: value }))}
                >
                  <SelectTrigger className="w-32 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          
          <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border">
            <div>
              <Label htmlFor="autoDelete" className="font-medium text-gray-900">
                Automatic Data Cleanup
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Automatically delete data based on retention policies
              </p>
            </div>
            <Switch
              id="autoDelete"
              checked={settings.autoDeleteInactiveData}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoDeleteInactiveData: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export or delete your account data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Export Your Data</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Download all your data including automations, chat history, and settings in a portable format.
                </p>
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="mt-3 rounded-xl border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900">Delete Account</h4>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="mt-3 rounded-xl border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-900">Delete Account</AlertDialogTitle>
                      <AlertDialogDescription className="text-red-700">
                        This will permanently delete your account and all associated data including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>All automations and their configurations</li>
                          <li>Chat history and AI conversations</li>
                          <li>Platform credentials and API keys</li>
                          <li>Notifications and system logs</li>
                        </ul>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAllData}
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

      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Data Usage Summary
          </CardTitle>
          <CardDescription>
            Overview of your current data usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border text-center">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-600">Automations</div>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm border text-center">
              <div className="text-2xl font-bold text-green-600">847</div>
              <div className="text-sm text-gray-600">Chat Messages</div>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm border text-center">
              <div className="text-2xl font-bold text-purple-600">23</div>
              <div className="text-sm text-gray-600">Notifications</div>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm border text-center">
              <div className="text-2xl font-bold text-orange-600">5.2 MB</div>
              <div className="text-sm text-gray-600">Total Data</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataPrivacyTab;
