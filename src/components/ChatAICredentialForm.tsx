
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { 
  Bot, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Code,
  Zap,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

interface ChatAICredentialFormProps {
  platform: Platform;
  automationId: string;
  onClose: () => void;
  onCredentialSaved: (platformName: string) => void;
}

const ChatAICredentialForm: React.FC<ChatAICredentialFormProps> = ({
  platform,
  automationId,
  onClose,
  onCredentialSaved
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [chatInput, setChatInput] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadExistingCredentials();
    }
  }, [user, platform.name, automationId]);

  const loadExistingCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .select('credentials')
        .eq('automation_id', automationId)
        .eq('platform_name', platform.name)
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .single();

      if (data?.credentials) {
        const existingCreds = JSON.parse(data.credentials);
        setCredentials(existingCreds);
        generateInitialScript(existingCreds);
      }
    } catch (error) {
      console.log('No existing credentials found');
    } finally {
      setIsLoading(false);
    }
  };

  const generateInitialScript = async (creds?: Record<string, string>) => {
    const currentCreds = creds || credentials;
    if (Object.keys(currentCreds).length === 0) return;

    setChatInput(`Generate test script for ${platform.name} with these credentials`);
    await handleChatAIGeneration(`Generate test script for ${platform.name} with these credentials`, currentCreds);
  };

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate script when credentials change
      if (value && Object.keys(updated).length > 0) {
        const suggestion = `Test ${platform.name} API with ${field}`;
        setChatInput(suggestion);
      }
      
      return updated;
    });
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChatAIGeneration = async (prompt: string, currentCreds?: Record<string, string>) => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    const credsToUse = currentCreds || credentials;

    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate a test script for ${platform.name} API using these credentials: ${JSON.stringify(Object.keys(credsToUse))}. 
          Platform: ${platform.name}
          Prompt: ${prompt}
          
          Create a complete curl command or test script that shows:
          1. The exact API endpoint to test
          2. Required headers with credential placeholders
          3. Sample request body if needed
          4. Expected response format
          5. Common error scenarios
          
          Make it ready to execute with real credentials.`,
          context: {
            platform: platform.name,
            automation_id: automationId,
            credential_fields: Object.keys(credsToUse)
          }
        }
      });

      if (error) throw error;

      setGeneratedScript(data.response || 'Failed to generate script');
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate test script",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToAI = () => {
    if (!chatInput.trim()) return;
    handleChatAIGeneration(chatInput);
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
    try {
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platformName: platform.name,
          credentials,
          automationId,
          userId: user!.id,
          generatedScript
        }
      });

      if (error) throw error;

      setTestResponse(data);
      
      if (data.success) {
        toast({
          title: "✅ Test Successful",
          description: `${platform.name} credentials are working correctly!`,
        });
      } else {
        toast({
          title: "❌ Test Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Test Error",
        description: error.message || "Failed to test credentials",
        variant: "destructive",
      });
      setTestResponse({
        success: false,
        message: error.message,
        error_type: 'connection_error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (Object.keys(credentials).length === 0) {
      toast({
        title: "Missing Credentials",
        description: "Please enter your credentials before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('automation_platform_credentials')
        .upsert({
          automation_id: automationId,
          platform_name: platform.name,
          user_id: user!.id,
          credentials: JSON.stringify(credentials),
          is_active: true,
          is_tested: testResponse?.success || false,
          test_status: testResponse?.success ? 'success' : 'pending',
          test_message: testResponse?.message || 'Awaiting test',
          credential_type: 'chat_ai_generated'
        }, {
          onConflict: 'automation_id,platform_name,user_id'
        });

      if (error) throw error;

      toast({
        title: "✅ Credentials Saved",
        description: `${platform.name} credentials saved successfully!`,
      });

      onCredentialSaved(platform.name);
      setTimeout(() => onClose(), 1000);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save credentials",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInputType = (field: string) => {
    const lowerField = field.toLowerCase();
    return lowerField.includes('password') || 
           lowerField.includes('secret') || 
           lowerField.includes('key') ||
           lowerField.includes('token') ? 'password' : 'text';
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Bot className="h-6 w-6 text-primary" />
            {platform.name} - Chat AI Credential Setup
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 h-[70vh]">
          {/* Left Side - Credential Input */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Enter Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
                {platform.credentials.map((cred, index) => {
                  const inputType = getInputType(cred.field);
                  const showPassword = showPasswords[cred.field];
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">{cred.field}</Label>
                        {cred.link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(cred.link, '_blank')}
                            className="text-primary h-auto p-1"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Get Key
                          </Button>
                        )}
                      </div>
                      
                      <div className="relative">
                        <Input
                          type={inputType === 'password' && !showPassword ? 'password' : 'text'}
                          placeholder={cred.placeholder}
                          value={credentials[cred.field] || ''}
                          onChange={(e) => handleCredentialChange(cred.field, e.target.value)}
                          className="pr-10"
                        />
                        
                        {inputType === 'password' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => togglePasswordVisibility(cred.field)}
                          >
                            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">{cred.why_needed}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Chat AI Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Chat AI - Generate Test Script
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={`Ask AI to generate test script for ${platform.name}...`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 min-h-[60px]"
                  />
                  <Button
                    onClick={handleSendToAI}
                    disabled={!chatInput.trim() || isGenerating}
                    size="sm"
                    className="self-end"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Generated Script & Response */}
          <div className="space-y-4">
            {/* Generated Script */}
            <Card className="h-[45%]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  AI Generated Test Script
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] w-full">
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                    {generatedScript || 'Chat with AI to generate test script...'}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Test Response */}
            <Card className="h-[45%]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {testResponse?.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : testResponse && !testResponse.success ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Zap className="h-5 w-5" />
                  )}
                  Test Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] w-full">
                  {testResponse ? (
                    <div className="space-y-2">
                      <div className={`p-3 rounded-lg text-sm ${
                        testResponse.success 
                          ? 'bg-green-50 text-green-800 border border-green-200' 
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        <strong>Status:</strong> {testResponse.success ? 'Success ✅' : 'Failed ❌'}
                        <br />
                        <strong>Message:</strong> {testResponse.message}
                      </div>
                      
                      {testResponse.details && (
                        <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                          {JSON.stringify(testResponse.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Click "Test Credentials" to see response...</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleTestCredentials}
            disabled={isTesting || Object.keys(credentials).length === 0}
            variant="outline"
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Test Credentials
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSaveCredentials}
            disabled={isSaving || Object.keys(credentials).length === 0}
            className="flex-1"
          >
            {isSaving ? (
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

export default ChatAICredentialForm;
