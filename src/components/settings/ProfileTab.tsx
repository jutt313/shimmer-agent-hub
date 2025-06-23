
import { useState, useEffect } from 'react';
import { User, Mail, Lock, Upload, Save, Calendar, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const ProfileTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: user?.email || '',
    avatar_url: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [notificationPreferences, setNotificationPreferences] = useState({
    automation_created: true,
    automation_started: true,
    automation_completed: true,
    automation_failed: true,
    automation_error: true,
    automation_stopped: true
  });

  useEffect(() => {
    fetchProfile();
    fetchNotificationPreferences();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(prev => ({
          ...prev,
          full_name: data.full_name || '',
          avatar_url: data.avatar_url || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchNotificationPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.notification_preferences) {
        setNotificationPreferences(data.notification_preferences);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
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
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationPreferences = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notification_preferences: notificationPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    }
  };

  const changePassword = async () => {
    if (profile.new_password !== profile.confirm_password) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: profile.new_password
      });

      if (error) throw error;

      setProfile(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Personal Information */}
      <Card className="bg-white/70 backdrop-blur-sm border border-blue-200/50 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your personal details and account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName" className="text-gray-700">Full Name</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                className="rounded-xl border-blue-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-700">Email Address</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="rounded-xl border-blue-200 bg-gray-50"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="avatar" className="text-gray-700">Profile Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="avatar"
                value={profile.avatar_url}
                onChange={(e) => setProfile(prev => ({ ...prev, avatar_url: e.target.value }))}
                placeholder="https://example.com/avatar.jpg"
                className="rounded-xl border-blue-200 focus:border-blue-400 focus:ring-blue-400"
              />
              <Button variant="outline" className="rounded-xl border-blue-200">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button 
            onClick={updateProfile}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="bg-white/70 backdrop-blur-sm border border-blue-200/50 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="newPassword" className="text-gray-700">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={profile.new_password}
              onChange={(e) => setProfile(prev => ({ ...prev, new_password: e.target.value }))}
              className="rounded-xl border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-gray-700">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={profile.confirm_password}
              onChange={(e) => setProfile(prev => ({ ...prev, confirm_password: e.target.value }))}
              className="rounded-xl border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>
          <Button 
            onClick={changePassword}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
          >
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Subscription Plan */}
      <Card className="bg-white/70 backdrop-blur-sm border border-blue-200/50 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Crown className="w-5 h-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>Your current plan and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <div>
              <h4 className="font-semibold text-blue-900">Free Plan</h4>
              <p className="text-sm text-blue-700">10 automations included</p>
            </div>
            <Button variant="outline" className="rounded-xl border-blue-300 text-blue-700 hover:bg-blue-100">
              Upgrade Plan
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-sm text-gray-600">Automations Used</div>
            </div>
            <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-blue-100">
              <div className="text-2xl font-bold text-purple-600">847</div>
              <div className="text-sm text-gray-600">Total Executions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-white/70 backdrop-blur-sm border border-blue-200/50 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Mail className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notificationPreferences).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-blue-100">
              <Label htmlFor={key} className="text-gray-700 capitalize">
                {key.replace(/_/g, ' ')}
              </Label>
              <Switch
                id={key}
                checked={value}
                onCheckedChange={(checked) => 
                  setNotificationPreferences(prev => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
          <Button 
            onClick={updateNotificationPreferences}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
          >
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;
