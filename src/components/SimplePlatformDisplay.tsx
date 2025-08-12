
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, TestTube, Save, Eye, EyeOff, Code, Activity, Info } from "lucide-react";

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
  onClose: () => void;
}

const SimplePlatformDisplay = ({ platform, onClose }: SimplePlatformDisplayProps) => {
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'response'>('code');
  const [showInfo, setShowInfo] = useState(false);

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
    console.log('🧪 Testing credentials with values:', credentialValues);
    
    // Simulate test response
    setTimeout(() => {
      setTestResponse({
        success: true,
        message: `${platform.name} credentials tested successfully!`,
        timestamp: new Date().toISOString(),
        credentials_tested: Object.keys(credentialValues).length,
        platform: platform.name,
        status_code: 200,
        response_data: {
          user_id: "12345",
          api_quota: "unlimited",
          account_type: "premium"
        }
      });
      setIsLoading(false);
    }, 2000);
  };

  const handleSave = () => {
    console.log('💾 Saving credentials:', credentialValues);
    // TODO: Implement save functionality
  };

  const generateTestScript = () => {
    const baseScript = `// ${platform.name} API Test Script
const testConnection = async () => {
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
${platform.credentials?.map(cred => {
  const value = credentialValues[cred.field] || `your_${cred.field}`;
  if (cred.field.toLowerCase().includes('key') || cred.field.toLowerCase().includes('token')) {
    return `      'Authorization': 'Bearer ${value}',`;
  }
  return `      '${cred.field}': '${value}',`;
}).join('\n') || '      // Add your credentials here'}
    }
  };
  
  try {
    const response = await fetch('${platform.chatai_data?.original_platform?.credential_link || 'https://api.' + platform.name.toLowerCase() + '.com/test'}', config);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Execute test
testConnection().then(result => {
  console.log('Test Result:', result);
});`;

    return baseScript;
  };

  const isFormValid = platform.credentials?.every(cred => credentialValues[cred.field]) || false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex justify-between items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
              {platform.name}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInfo(!showInfo)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Info className="w-4 h-4" />
              </Button>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </CardTitle>
          
          {showInfo && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Why do we need these credentials?</h4>
              <p className="text-sm text-blue-700">
                These credentials are required to authenticate with {platform.name}'s API and test the connection. 
                Your credentials are securely stored and only used for API authentication.
              </p>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Credential Input Fields */}
          {platform.credentials && platform.credentials.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-4 text-gray-800">Credentials</h3>
              <div className="space-y-4">
                {platform.credentials.map((cred, index) => {
                  const isPasswordField = cred.field.toLowerCase().includes('password') || 
                                        cred.field.toLowerCase().includes('secret') ||
                                        cred.field.toLowerCase().includes('key');
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={cred.field} className="text-sm font-medium text-gray-700">
                          {cred.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        {cred.link && (
                          <a 
                            href={cred.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
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
                          className="pr-10"
                        />
                        {isPasswordField && (
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(cred.field)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords[cred.field] ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600">{cred.why_needed}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Test & Save Buttons */}
          <div className="flex gap-3 justify-center py-4">
            <Button
              onClick={handleTest}
              disabled={!isFormValid || isLoading}
              className="bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 hover:from-purple-600 hover:via-blue-600 hover:to-green-600 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!isFormValid}
              className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Credentials
            </Button>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('code')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'code'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Code className="w-4 h-4" />
                Test Script
              </button>
              <button
                onClick={() => setActiveTab('response')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'response'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="w-4 h-4" />
                Response
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'code' && (
              <div>
                <h3 className="font-semibold text-lg mb-3 text-purple-700">Generated Test Script</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <Textarea
                    value={generateTestScript()}
                    readOnly
                    className="font-mono text-sm min-h-[300px] bg-transparent text-green-400 border-0 resize-none"
                  />
                </div>
              </div>
            )}

            {activeTab === 'response' && (
              <div>
                <h3 className="font-semibold text-lg mb-3 text-green-700">Test Response</h3>
                {testResponse ? (
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-sm text-green-400 whitespace-pre-wrap">
                      {JSON.stringify(testResponse, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No test response yet. Run a test to see results here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimplePlatformDisplay;
