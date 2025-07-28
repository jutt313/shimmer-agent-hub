
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { SecureCredentials } from '@/utils/secureCredentials';
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, TestTube } from "lucide-react";

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

interface SimpleCredentialFormProps {
  automationId?: string;
  platform: Platform;
  onCredentialSaved?: () => void;
}

const SimpleCredentialForm: React.FC<SimpleCredentialFormProps> = ({
  automationId,
  platform,
  onCredentialSaved
}) => {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadExistingCredentials();
  }, [platform.name, automationId, user?.id]);

  const loadExistingCredentials = async () => {
    if (!automationId || !user?.id) return;
    
    try {
      const existingCredentials = await SecureCredentials.getCredentials(
        platform.name,
        user.id,
        automationId
      );
      
      if (existingCredentials) {
        setCredentials(existingCredentials);
        console.log('✅ Loaded existing credentials for', platform.name);
      }
    } catch (error) {
      console.error('❌ Error loading existing credentials:', error);
    }
  };

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!automationId || !user?.id) {
      toast({
        title: "Error",
        description: "Missing user or automation information",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await SecureCredentials.saveCredentials(
        platform.name,
        credentials,
        user.id,
        automationId
      );

      if (success) {
        toast({
          title: "✅ Credentials Saved",
          description: `${platform.name} credentials saved securely`,
        });
        onCredentialSaved?.();
      } else {
        toast({
          title: "❌ Save Failed",
          description: `Failed to save ${platform.name} credentials`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!automationId || !user?.id) {
      toast({
        title: "Error",
        description: "Missing user or automation information",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platform: platform.name,
          credentials: credentials,
          automationId: automationId
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: data.success ? "✅ Test Successful" : "❌ Test Failed",
        description: data.message || `Test completed for ${platform.name}`,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: "Test Error",
        description: `Failed to test ${platform.name} credentials: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {platform.credentials.map((cred, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={cred.field} className="font-medium">
                {cred.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
              {cred.link && cred.link !== '#' && (
                <a 
                  href={cred.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            
            <Input
              id={cred.field}
              type={cred.field.includes('secret') || cred.field.includes('key') || cred.field.includes('password') ? 'password' : 'text'}
              placeholder={cred.placeholder}
              value={credentials[cred.field] || ''}
              onChange={(e) => handleCredentialChange(cred.field, e.target.value)}
            />
            
            <p className="text-xs text-gray-600">
              <strong>Why needed:</strong> {cred.why_needed}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Saving...' : 'Save Credentials'}
        </Button>
        
        <Button 
          onClick={handleTest} 
          disabled={isTesting || isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <TestTube className="w-4 h-4" />
          {isTesting ? 'Testing...' : 'Test'}
        </Button>
      </div>
    </div>
  );
};

export default SimpleCredentialForm;
