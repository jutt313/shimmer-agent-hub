import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, TestTube, Save, Eye, EyeOff, Code, Activity, Info } from "lucide-react";
import { extractTestScript, injectCredentials } from "@/utils/platformTestScriptExtractor";
import { AutomationCredentialManager } from "@/utils/automationCredentialManager";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
  testConfig?: any;
  test_payloads?: any[];
  chatai_data?: any;
}

interface SimplePlatformDisplayProps {
  platform: Platform;
  automationId: string;
  userId: string;
  onCredentialChange?: () => void;
  onClose: () => void;
}

const SimplePlatformDisplay = ({ platform, automationId, userId, onCredentialChange, onClose }: SimplePlatformDisplayProps) => {
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'code' | 'response'>('credentials');
  const [showInfo, setShowInfo] = useState(false);
  const { toast } = useToast();

  console.log('🔍 SimplePlatformDisplay received platform data:', platform);

  const handleInputChange = (field: string, value: string) => {
    setCredentialValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleTest = async () => {
    setIsLoading(true);
    setActiveTab('response');
    console.log('🧪 Testing credentials with real ChatAI-powered API calls:', credentialValues);
    
    try {
      // Use the new real credential testing edge function
      const { data: result, error } = await supabase.functions.invoke('test-platform-credentials', {
        body: {
          platformName: platform.name,
          credentials: credentialValues,
          testConfig: platform.testConfig,
          chataiData: platform.chatai_data,
          userId: userId
        }
      });

      if (error) {
        throw error;
      }

      setTestResponse(result);
      toast({
        title: "Credentials tested successfully",
        description: `${platform.name} connection test completed`,
      });
      setIsLoading(false);
    } catch (error: any) {
      console.error('❌ Real ChatAI testing failed:', error);
      setTestResponse({
        success: false,
        message: `Real API test failed: ${error.message}`,
        details: { 
          error: error.message, 
          chatai_driven: true,
          real_api_testing: true,
          platform: platform.name
        }
      });
      toast({
        title: "Test failed",
        description: `Failed to test ${platform.name} credentials: ${error.message}`,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!automationId || !userId) {
      toast({
        title: "Save failed",
        description: "Missing automation ID or user ID",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    console.log('💾 Saving credentials for:', platform.name, credentialValues);
    
    try {
      const result = await AutomationCredentialManager.saveCredentials(
        automationId,
        platform.name,
        credentialValues,
        userId
      );

      if (result.success) {
        toast({
          title: "Credentials saved successfully",
          description: `${platform.name} credentials have been securely stored`,
        });
        
        // Call the callback to notify parent component
        if (onCredentialChange) {
          onCredentialChange();
        }
      } else {
        throw new Error(result.error || 'Failed to save credentials');
      }
    } catch (error: any) {
      console.error('❌ Failed to save credentials:', error);
      toast({
        title: "Save failed",
        description: `Failed to save ${platform.name} credentials: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateTestScript = () => {
    console.log('🤖 CRITICAL FIX: Using ChatAI-aware script extractor instead of hardcoded generation');
    
    // CRITICAL FIX: Use the existing platformTestScriptExtractor utility
    // This properly handles ChatAI's original_platform data, test_payloads, and testConfig
    const baseScript = extractTestScript(platform, credentialValues);
    
    // Inject actual credentials for display (masked)
    const scriptWithCredentials = injectCredentials(baseScript, credentialValues);
    
    return scriptWithCredentials;
  };

  const isFormValid = platform.credentials?.every(cred => credentialValues[cred.field]) || false;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden">
        <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 border-0 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-green-500/10 pointer-events-none"></div>
          <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(147,51,234,0.15)] pointer-events-none rounded-2xl"></div>
          
          {/* Compact Header */}
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="flex justify-between items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
                {platform.name}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInfo(!showInfo)}
                  className="h-8 w-8 p-0 rounded-full border-purple-200 hover:bg-purple-100/50 transition-all duration-300"
                >
                  <Info className="w-4 h-4 text-purple-600" />
                </Button>
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold transition-colors duration-200"
                >
                  ×
                </button>
              </div>
            </CardTitle>
            
            {showInfo && (
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50 backdrop-blur-sm">
                <p className="text-sm text-blue-700 font-medium">
                  These credentials authenticate with {platform.name}'s API. Your data is securely encrypted and only used for API connections.
                </p>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4 relative z-10 max-h-[calc(85vh-120px)] overflow-y-auto custom-scrollbar">
            {/* Navigation Tabs */}
            <div className="flex gap-1 p-1 bg-white/40 rounded-xl backdrop-blur-sm border border-white/30">
              <button
                onClick={() => setActiveTab('credentials')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'credentials'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <TestTube className="w-4 h-4" />
                Credentials
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'code'
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <Code className="w-4 h-4" />
                Test Script
              </button>
              <button
                onClick={() => setActiveTab('response')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'response'
                    ? 'bg-gradient-to-r from-green-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <Activity className="w-4 h-4" />
                Response
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'credentials' && (
              <div className="space-y-4">
                {platform.credentials && platform.credentials.length > 0 && (
                  <div className="space-y-4">
                    {platform.credentials.map((cred, index) => {
                      const isPasswordField = cred.field.toLowerCase().includes('password') || 
                                            cred.field.toLowerCase().includes('secret') ||
                                            cred.field.toLowerCase().includes('key');
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={cred.field} className="text-sm font-semibold text-gray-700">
                              {cred.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              <span className="text-red-500 ml-1">*</span>
                            </Label>
                            {cred.link && (
                              <a 
                                href={cred.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Get {cred.field}
                              </a>
                            )}
                          </div>
                          
                          <div className="relative">
                            <Input
                              id={cred.field}
                              type={isPasswordField && !showPasswords[cred.field] ? 'password' : 'text'}
                              placeholder={cred.placeholder}
                              value={credentialValues[cred.field] || ''}
                              onChange={(e) => handleInputChange(cred.field, e.target.value)}
                              className="pr-10 border-2 border-transparent bg-white/80 backdrop-blur-sm focus:border-purple-400 focus:bg-white focus:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all duration-300 rounded-xl"
                            />
                            {isPasswordField && (
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(cred.field)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              >
                                {showPasswords[cred.field] ? (
                                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                )}
                              </button>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-600 bg-white/50 p-2 rounded-lg">{cred.why_needed}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Test & Save Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/30">
                  <Button
                    onClick={handleTest}
                    disabled={!isFormValid || isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 hover:from-purple-600 hover:via-blue-600 hover:to-green-600 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {isLoading ? 'Testing...' : 'Test Connection'}
                  </Button>
                  
                  <Button
                    onClick={handleSave}
                    disabled={!isFormValid || isSaving}
                    className="flex-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Credentials'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-purple-200/30 shadow-lg">
                  <Textarea
                    value={generateTestScript()}
                    readOnly
                    className="font-mono text-sm min-h-[400px] bg-transparent text-green-400 border-0 resize-none focus:ring-0"
                  />
                </div>
              </div>
            )}

            {activeTab === 'response' && (
              <div>
                {testResponse ? (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-green-200/30 shadow-lg">
                    <pre className="text-sm text-green-400 whitespace-pre-wrap font-mono">
                      {JSON.stringify(testResponse, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 text-center border border-gray-200/50">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No test response yet. Run a test to see results here.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimplePlatformDisplay;
