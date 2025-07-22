
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Play, TestTube, Database, Brain } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder?: string;
    link?: string;
    why_needed: string;
    models?: string[];
    system_prompt?: boolean;
  }>;
}

interface TestPayload {
  base_url: string;
  test_endpoint: {
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: any;
  };
  expected_success_indicators: string[];
  expected_error_indicators: string[];
  validation_rules?: Record<string, any>;
}

interface EnhancedCredentialFormWithPlaygroundProps {
  platform: Platform;
  testPayload?: TestPayload;
  onCredentialSave?: (platformName: string, credentials: Record<string, string>) => void;
  onTestRun?: (platformName: string, testPayload: TestPayload, credentials: Record<string, string>) => Promise<any>;
}

const EnhancedCredentialFormWithPlayground: React.FC<EnhancedCredentialFormWithPlaygroundProps> = ({
  platform,
  testPayload,
  onCredentialSave,
  onTestRun
}) => {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const { toast } = useToast();

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveCredentials = () => {
    const allCredentials = {
      ...credentials,
      ...(selectedModel && { model: selectedModel }),
      ...(systemPrompt && { system_prompt: systemPrompt })
    };

    if (onCredentialSave) {
      onCredentialSave(platform.name, allCredentials);
    }

    toast({
      title: "✅ Credentials Saved",
      description: `${platform.name} credentials have been saved successfully`,
    });
  };

  const handleTestCredentials = async () => {
    if (!testPayload) {
      toast({
        title: "No Test Available",
        description: "Test payload not configured for this platform",
        variant: "destructive",
      });
      return;
    }

    setIsTestingCredentials(true);
    try {
      const allCredentials = {
        ...credentials,
        ...(selectedModel && { model: selectedModel }),
        ...(systemPrompt && { system_prompt: systemPrompt })
      };

      const response = await onTestRun?.(platform.name, testPayload, allCredentials);
      setTestResponse(response);

      toast({
        title: response?.success ? "✅ Test Successful" : "❌ Test Failed",
        description: response?.message || `Test completed for ${platform.name}`,
        variant: response?.success ? "default" : "destructive",
      });
    } catch (error: any) {
      setTestResponse({ success: false, error: error.message });
      toast({
        title: "Test Error",
        description: `Failed to test ${platform.name} credentials`,
        variant: "destructive",
      });
    } finally {
      setIsTestingCredentials(false);
    }
  };

  // Check if platform is AI/LLM platform
  const isAIPlatform = platform.credentials.some(cred => 
    cred.models || cred.system_prompt
  );

  const aiCredential = platform.credentials.find(cred => cred.models);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Configure {platform.name}
            {isAIPlatform && <Badge variant="secondary"><Brain className="w-3 h-3 mr-1" />AI Platform</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="test" disabled={!testPayload}>
                <TestTube className="w-4 h-4 mr-1" />
                Test Playground
              </TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4">
              {platform.credentials.map((cred, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={cred.field} className="font-medium">
                      {cred.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    {cred.link && (
                      <a 
                        href={cred.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Info className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  
                  <Input
                    id={cred.field}
                    type={cred.field.includes('secret') || cred.field.includes('key') ? 'password' : 'text'}
                    placeholder={cred.placeholder || `Enter your ${cred.field}`}
                    value={credentials[cred.field] || ''}
                    onChange={(e) => handleCredentialChange(cred.field, e.target.value)}
                  />
                  
                  <p className="text-xs text-gray-600 flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span><strong>Why needed:</strong> {cred.why_needed}</span>
                  </p>

                  {/* AI Platform Model Selection */}
                  {cred.models && (
                    <div className="mt-3 space-y-2">
                      <Label htmlFor="model-select" className="font-medium">Select Model</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose AI model..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cred.models.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* AI Platform System Prompt */}
                  {cred.system_prompt && (
                    <div className="mt-3 space-y-2">
                      <Label htmlFor="system-prompt" className="font-medium">System Prompt</Label>
                      <Textarea
                        id="system-prompt"
                        placeholder="Define how the AI should behave in your automation..."
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        rows={4}
                      />
                      <p className="text-xs text-gray-600">
                        This prompt will guide the AI's behavior throughout your automation workflow.
                      </p>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveCredentials} className="flex-1">
                  Save Credentials
                </Button>
                {testPayload && (
                  <Button 
                    onClick={handleTestCredentials} 
                    variant="outline" 
                    disabled={isTestingCredentials}
                    className="flex-1"
                  >
                    {isTestingCredentials ? (
                      <>Testing...</>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Test Now
                      </>
                    )}
                  </Button>
                )}
              </div>
            </TabsContent>

            {testPayload && (
              <TabsContent value="test" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Test Configuration</h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                      <div><strong>Endpoint:</strong> {testPayload.test_endpoint.method} {testPayload.base_url}{testPayload.test_endpoint.path}</div>
                      <div><strong>Expected Success:</strong> {testPayload.expected_success_indicators.join(', ')}</div>
                      <div><strong>Expected Errors:</strong> {testPayload.expected_error_indicators.join(', ')}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Test Payload</h4>
                    <ScrollArea className="h-32 w-full border rounded-lg p-3 bg-gray-50">
                      <pre className="text-xs">
                        {JSON.stringify(testPayload, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>

                  <Button 
                    onClick={handleTestCredentials} 
                    disabled={isTestingCredentials}
                    className="w-full"
                  >
                    {isTestingCredentials ? (
                      <>Testing Credentials...</>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Run Test
                      </>
                    )}
                  </Button>

                  {testResponse && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Test Response</h4>
                      <ScrollArea className="h-40 w-full border rounded-lg p-3">
                        <pre className={`text-xs ${testResponse.success ? 'text-green-700' : 'text-red-700'}`}>
                          {JSON.stringify(testResponse, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedCredentialFormWithPlayground;
