
import { useState, useEffect } from 'react';
import { User, Settings, Camera, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface NotificationPreferences {
  automation_created: boolean;
  automation_started: boolean;
  automation_completed: boolean;
  automation_failed: boolean;
  automation_error: boolean;
  automation_stopped: boolean;
}

const ProfileTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: ''
  });
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    automation_created: true,
    automation_started: true,
    automation_completed: true,
    automation_failed: true,
    automation_error: true,
    automation_stopped: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchNotificationPreferences();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchNotificationPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.notification_preferences) {
        const prefs = data.notification_preferences as any;
        setNotificationPreferences({
          automation_created: prefs.automation_created ?? true,
          automation_started: prefs.automation_started ?? true,
          automation_completed: prefs.automation_completed ?? true,
          automation_failed: prefs.automation_failed ?? true,
          automation_error: prefs.automation_error ?? true,
          automation_stopped: prefs.automation_stopped ?? true
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const updateNotificationPreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...notificationPreferences, [key]: value };
    setNotificationPreferences(newPrefs);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          notification_preferences: newPrefs
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Personal Information */}
      <Card className="bg-white/80 backdrop-blur-sm border border-blue-100 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your personal details and account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Camera className="w-4 h-4 mr-2" />
              Change Photo
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="rounded-xl bg-gray-50"
              />
            </div>
          </div>

          <Button onClick={updateProfile} className="rounded-xl bg-blue-600 hover:bg-blue-700">
            Update Profile
          </Button>
        </CardContent>
      </Card>

      {/* Subscription Plan */}
      <Card className="bg-white/80 backdrop-blur-sm border border-blue-100 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Subscription Plan
          </CardTitle>
          <CardDescription>Current plan and usage information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Free Plan</h4>
              <p className="text-sm text-gray-600">Basic automation features</p>
            </div>
            <Badge variant="secondary">Current Plan</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-600">Automations Used</p>
              <p className="text-2xl font-bold text-blue-600">5 / 10</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <p className="text-sm text-gray-600">Monthly Runs</p>
              <p className="text-2xl font-bold text-purple-600">150 / 1000</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-white/80 backdrop-blur-sm border border-blue-100 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-600" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Configure when you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notificationPreferences).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="flex-1 cursor-pointer">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
              <Switch
                id={key}
                checked={value}
                onCheckedChange={(checked) => updateNotificationPreference(key as keyof NotificationPreferences, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;
