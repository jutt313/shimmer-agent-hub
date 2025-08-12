
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, TestTube, Save, Eye, EyeOff } from "lucide-react";

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
    console.log('🧪 Testing credentials with values:', credentialValues);
    
    // Simulate test response for now
    setTimeout(() => {
      setTestResponse({
        success: true,
        message: `${platform.name} credentials tested successfully!`,
        timestamp: new Date().toISOString(),
        credentials_tested: Object.keys(credentialValues).length,
        platform: platform.name
      });
      setIsLoading(false);
    }, 2000);
  };

  const handleSave = () => {
    console.log('💾 Saving credentials:', credentialValues);
    // TODO: Implement save functionality
  };

  const generateConnectionCode = () => {
    const codeTemplate = `
// ${platform.name} API Connection Code
const ${platform.name.toLowerCase()}Client = {
  baseURL: '${platform.chatai_data?.original_platform?.credential_link || 'https://api.' + platform.name.toLowerCase() + '.com'}',
  
  // Initialize with credentials
  init: (credentials) => {
${platform.credentials?.map(cred => `    const ${cred.field} = credentials.${cred.field};`).join('\n') || '    // No credentials defined'}
    
    return {
      headers: {
        'Content-Type': 'application/json',
${platform.credentials?.map(cred => {
  if (cred.field.toLowerCase().includes('key') || cred.field.toLowerCase().includes('token')) {
    return `        'Authorization': \`Bearer \${${cred.field}}\`,`;
  }
  return `        '${cred.field}': ${cred.field},`;
}).join('\n') || '        // Add headers based on credential fields'}
      }
    };
  },
  
  // Test connection
  async testConnection(config) {
    try {
      const response = await fetch(this.baseURL + '/test', {
        method: 'GET',
        headers: config.headers
      });
      return await response.json();
    } catch (error) {
      throw new Error('Connection failed: ' + error.message);
    }
  }
};

// Usage Example:
const credentials = {
${platform.credentials?.map(cred => `  ${cred.field}: 'your_${cred.field}_here'`).join(',\n') || '  // Add your credentials here'}
};

const client = ${platform.name.toLowerCase()}Client.init(credentials);
const result = await ${platform.name.toLowerCase()}Client.testConnection(client);
console.log('Test result:', result);`;

    return codeTemplate;
  };

  const isFormValid = platform.credentials?.every(cred => credentialValues[cred.field]) || false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
              Platform Setup: {platform.name}
            </span>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Platform Name */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-purple-700">Platform Name</h3>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
              <span className="text-lg font-medium">{platform.name}</span>
            </div>
          </div>

          {/* Interactive Credential Fields */}
          {platform.credentials && platform.credentials.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-4 text-blue-700">Credential Configuration</h3>
              <div className="space-y-4">
                {platform.credentials.map((cred, index) => {
                  const isPasswordField = cred.field.toLowerCase().includes('password') || 
                                        cred.field.toLowerCase().includes('secret') ||
                                        cred.field.toLowerCase().includes('key');
                  
                  return (
                    <div key={index} className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={cred.field} className="text-sm font-medium text-gray-700 mb-2 block">
                            {cred.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            <span className="text-red-500 ml-1">*</span>
                          </Label>
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
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Why needed:</span>
                            <p className="text-sm text-gray-700 bg-white p-2 rounded border">{cred.why_needed}</p>
                          </div>
                          {cred.link && (
                            <a 
                              href={cred.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Get your {cred.field}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
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

          {/* Connection Code Section */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-green-700">Generated Connection Code</h3>
            <div className="bg-gradient-to-r from-green-50 to-purple-50 p-4 rounded-lg border border-green-200">
              <Textarea
                value={generateConnectionCode()}
                readOnly
                className="font-mono text-sm min-h-[300px] bg-gray-900 text-green-400 border-0"
              />
            </div>
          </div>

          {/* Test Response Section */}
          {testResponse && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-purple-700">Test Response</h3>
              <div className="bg-gradient-to-r from-purple-50 to-green-50 p-4 rounded-lg border border-purple-200">
                <pre className="text-sm overflow-auto bg-gray-900 text-green-400 p-4 rounded">
                  {JSON.stringify(testResponse, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Raw ChatAI Data */}
          {platform.chatai_data && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-blue-700">Raw ChatAI Data</h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
                <pre className="text-sm overflow-auto bg-gray-900 text-blue-400 p-4 rounded max-h-40">
                  {JSON.stringify(platform.chatai_data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Complete Platform Object */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-700">Complete Platform Object</h3>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <pre className="text-sm overflow-auto bg-gray-900 text-gray-400 p-4 rounded max-h-40">
                {JSON.stringify(platform, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimplePlatformDisplay;
