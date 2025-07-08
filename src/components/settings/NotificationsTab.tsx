
import { Bell, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const NotificationsTab = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Simple Notification Status */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <Bell className="w-5 h-5 text-blue-600" />
            Notification Status
          </CardTitle>
          <CardDescription>
            All notifications are currently enabled for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white/70 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">All Notifications Active</p>
                <p className="text-sm text-gray-600">You'll receive notifications for all automation activities, errors, completions, and system updates</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            <Settings className="w-5 h-5 text-green-600" />
            Notification Types
          </CardTitle>
          <CardDescription>
            You'll be notified about these important events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white/70 rounded-xl p-3">
              <p className="font-medium text-gray-900">Automation Events</p>
              <p className="text-sm text-gray-600">Created, Started, Completed, Failed, Stopped</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3">
              <p className="font-medium text-gray-900">Error Alerts</p>
              <p className="text-sm text-gray-600">Critical errors and issues</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3">
              <p className="font-medium text-gray-900">Platform Connections</p>
              <p className="text-sm text-gray-600">Connection success and failures</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3">
              <p className="font-medium text-gray-900">System Updates</p>
              <p className="text-sm text-gray-600">Feature updates and maintenance notices</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;
