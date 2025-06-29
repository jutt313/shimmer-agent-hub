
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AdminUser {
  id: string;
  email: string;
  is_admin: boolean;
}

export const useAdminAuth = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminData(null);
        setLoading(false);
        return;
      }

      try {
        // Check if user has admin role in profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setIsAdmin(false);
          setAdminData(null);
          setLoading(false);
          return;
        }

        // For now, check if user email is in admin list
        // In production, this should be a proper role-based system
        const adminEmails = [
          'chaffanjutt313@gmail.com', // Main admin
          'admin@yusrai.com',
          'support@yusrai.com'
        ];

        const userIsAdmin = adminEmails.includes(user.email || '');
        
        setIsAdmin(userIsAdmin);
        setAdminData(userIsAdmin ? {
          id: user.id,
          email: user.email || '',
          is_admin: true
        } : null);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setAdminData(null);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading, adminData };
};
