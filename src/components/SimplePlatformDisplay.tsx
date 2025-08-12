
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  console.log('🔍 SimplePlatformDisplay received platform data:', platform);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Platform Data: {platform.name}</span>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Platform Name */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Platform Name</h3>
            <div className="bg-gray-50 p-3 rounded-lg">
              {platform.name}
            </div>
          </div>

          {/* Credentials Fields */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Credential Fields</h3>
            <div className="space-y-3">
              {platform.credentials?.map((cred, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div><strong>Field:</strong> {cred.field}</div>
                  <div><strong>Placeholder:</strong> {cred.placeholder}</div>
                  <div><strong>Link:</strong> {cred.link}</div>
                  <div><strong>Why Needed:</strong> {cred.why_needed}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Config */}
          {platform.testConfig && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Test Config from ChatAI</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(platform.testConfig, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Test Payloads */}
          {platform.test_payloads && platform.test_payloads.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Test Payloads from ChatAI</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(platform.test_payloads, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Raw ChatAI Data */}
          {platform.chatai_data && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Raw ChatAI Data</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(platform.chatai_data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Complete Platform Object */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Complete Platform Object</h3>
            <div className="bg-gray-50 p-3 rounded-lg">
              <pre className="text-sm overflow-auto">
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
