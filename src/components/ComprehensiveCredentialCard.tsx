
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Info, Play, TestTube } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { useAuth } from '@/contexts/AuthContext';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

interface ComprehensiveCredentialCardProps {
  automationId: string;
  platform: Platform;
  onCredentialSaved: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const ComprehensiveCredentialCard: React.FC<ComprehensiveCredentialCardProps> = ({
  automationId,
  platform,
  onCredentialSaved,
  onClose,
  isOpen
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testPayload, setTestPayload] = useState<string>('');
  const [testResponse, setTestResponse] = useState<any>(null);

  useEffect(() => {
    if (isOpen && platform) {
      loadExistingCredentials();
      generateTestPayload();
    }
  }, [isOpen, platform, automationId]);

  const loadExistingCredentials = async () => {
    try {
      const existingCreds = await AutomationCredentialManager.getCredentials(
        automationId,
        platform.name,
        user?.id || ''
      );
      
      if (existingCreds) {
        setCredentials(existingCreds);
      }
    } catch (error) {
      console.error('Failed to load existing credentials:', error);
    }
  };

  const generateTestPayload = () => {
    const payload = {
      platform: platform.name,
      test_action: `Test ${platform.name} connection`,
      timestamp: new Date().toISOString(),
      credentials_fields: platform.credentials.map(c => c.field)
    };
    setTestPayload(JSON.stringify(payload, null, 2));
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestCredentials = async () => {
    if (Object.keys(credentials).length === 0) {
      toast({
        title: "Missing Credentials",
        description: "Please enter your credentials before testing.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    const startTime = Date.now();

    try {
      console.log('🧪 Testing credentials with AI system for:', platform.name);
      
      const result = await AutomationCredentialManager.testCredentials(
        user?.id || '',
        automationId,
        platform.name,
        credentials
      );

      const endTime = Date.now();
      const testDuration = endTime - startTime;

      const response = {
        success: result.success,
        message: result.message,
        duration_ms: testDuration,
        timestamp: new Date().toISOString(),
        details: result.details
      };

      setTestResult(result);
      setTestResponse(response);

      if (result.success) {
        toast({
          title: "✅ Credentials Verified",
          description: `${platform.name} credentials are working correctly!`,
        });
      } else {
        toast({
          title: "❌ Test Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Test failed:', error);
      const errorResponse = {
        success: false,
        message: `Test failed: ${error.message}`,
        error_type: 'connection_error',
        timestamp: new Date().toISOString()
      };
      
      setTestResult(errorResponse);
      setTestResponse(errorResponse);
      
      toast({
        title: "Test Error",
        description: "Failed to test credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (Object.keys(credentials).length === 0) {
      toast({
        title: "Missing Credentials",
        description: "Please enter your credentials before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await AutomationCredentialManager.saveCredentials(
        automationId,
        platform.name,
        credentials,
        user?.id || ''
      );

      if (result.success) {
        toast({
          title: "✅ Credentials Saved",
          description: `${platform.name} credentials saved successfully!`,
        });
        onCredentialSaved();
      } else {
        throw new Error(result.error || 'Failed to save credentials');
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      toast({
        title: "Save Error",
        description: error.message || "Failed to save credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl border-purple-500/30"
        style={{
          boxShadow: '0 0 50px rgba(147, 51, 234, 0.4), inset 0 0 20px rgba(147, 51, 234, 0.1)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{platform.name} Configuration</h3>
              <p className="text-sm text-purple-200 font-normal">Complete credential setup with testing</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="credentials" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="credentials" className="text-white data-[state=active]:bg-purple-600">
              Credentials
            </TabsTrigger>
            <TabsTrigger value="test" className="text-white data-[state=active]:bg-purple-600">
              <TestTube className="w-4 h-4 mr-1" />
              Test
            </TabsTrigger>
            <TabsTrigger value="response" className="text-white data-[state=active]:bg-purple-600">
              Response
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="space-y-4 mt-6">
            {platform.credentials.map((credField, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={credField.field} className="text-sm font-medium text-white flex items-center gap-2">
                    {credField.field.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                    <Info className="w-4 h-4 text-purple-300" />
                  </Label>
                  {credField.link && credField.link !== '#' && (
                    <a
                      href={credField.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1 transition-colors"
                    >
                      Get Key <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <Input
                  id={credField.field}
                  type={credField.field.toLowerCase().includes('password') || 
                        credField.field.toLowerCase().includes('secret') || 
                        credField.field.toLowerCase().includes('token') || 
                        credField.field.toLowerCase().includes('key') ? 'password' : 'text'}
                  placeholder={credField.placeholder}
                  value={credentials[credField.field] || ''}
                  onChange={(e) => handleInputChange(credField.field, e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50 backdrop-blur-sm"
                />
                <div className="bg-purple-900/30 p-3 rounded-lg border border-purple-500/20">
                  <p className="text-xs text-purple-200 flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-400" />
                    <span><strong>Why needed:</strong> {credField.why_needed}</span>
                  </p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="test" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-white font-medium mb-2 block">AI Test Payload</Label>
                <Textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50 backdrop-blur-sm font-mono text-sm"
                  rows={8}
                />
              </div>
              <Button
                onClick={handleTestCredentials}
                disabled={isTesting || Object.keys(credentials).length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl shadow-lg"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing Credentials...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run AI Test
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="response" className="space-y-4 mt-6">
            {testResponse ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${
                  testResponse.success 
                    ? 'bg-green-900/30 border-green-500/30' 
                    : 'bg-red-900/30 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResponse.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-white font-medium">
                      {testResponse.success ? 'Test Successful' : 'Test Failed'}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 mb-3">{testResponse.message}</p>
                </div>
                
                <div>
                  <Label className="text-white font-medium mb-2 block">Full Response</Label>
                  <pre className="bg-black/30 p-4 rounded-xl text-xs text-green-300 overflow-auto max-h-60 border border-white/10">
                    {JSON.stringify(testResponse, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TestTube className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
                <p className="text-white/60">No test results yet. Run a test to see the response here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-6 border-t border-white/20">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || Object.keys(credentials).length === 0}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Credentials'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComprehensiveCredentialCard;
