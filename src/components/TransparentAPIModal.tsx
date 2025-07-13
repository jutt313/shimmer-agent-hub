
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface APICallDetails {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
  error?: string;
  timestamp: string;
}

interface TransparentAPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformName: string;
  apiCall?: APICallDetails;
  testResult?: {
    success: boolean;
    message: string;
    details?: any;
  };
  isLoading?: boolean;
}

const TransparentAPIModal = ({ 
  isOpen, 
  onClose, 
  platformName, 
  apiCall, 
  testResult,
  isLoading = false 
}: TransparentAPIModalProps) => {

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatJSON = (obj: any) => {
    if (!obj) return 'null';
    if (typeof obj === 'string') return obj;
    return JSON.stringify(obj, null, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            🔍 API Call Transparency - {platformName}
            {testResult && (
              testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )
            )}
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <div className="space-y-6 p-1">
            
            {/* Test Status */}
            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Test Result</h3>
                  {testResult.success ? (
                    <span className="text-green-600 text-sm font-medium">✅ Success</span>
                  ) : (
                    <span className="text-red-600 text-sm font-medium">❌ Failed</span>
                  )}
                </div>
                <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.message}
                </p>
                {testResult.details?.troubleshooting && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Troubleshooting:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                      {testResult.details.troubleshooting.map((tip: string, index: number) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <span className="ml-3 text-gray-600">Testing API connection...</span>
              </div>
            )}

            {/* API Request Details */}
            {apiCall && (
              <>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm text-blue-900">API Request</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(
                          `${apiCall.method} ${apiCall.url}`,
                          'Request details'
                        )}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-blue-800">Method & URL:</span>
                        <div className="bg-white p-2 rounded border font-mono text-sm">
                          <span className="text-blue-600 font-bold">{apiCall.method}</span> {apiCall.url}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-blue-800">Headers:</span>
                        <div className="bg-white p-3 rounded border">
                          <pre className="text-xs font-mono whitespace-pre-wrap">
                            {formatJSON(apiCall.headers)}
                          </pre>
                        </div>
                      </div>

                      {apiCall.body && (
                        <div>
                          <span className="text-xs font-semibold text-blue-800">Request Body:</span>
                          <div className="bg-white p-3 rounded border">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                              {formatJSON(apiCall.body)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* API Response Details */}
                  {apiCall.response && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm text-gray-900">API Response</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            apiCall.response.status >= 200 && apiCall.response.status < 300 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {apiCall.response.status}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(
                              formatJSON(apiCall.response?.body),
                              'Response body'
                            )}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs font-semibold text-gray-800">Response Headers:</span>
                          <div className="bg-white p-3 rounded border">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                              {formatJSON(apiCall.response.headers)}
                            </pre>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-gray-800">Response Body:</span>
                          <div className="bg-white p-3 rounded border max-h-64 overflow-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap">
                              {formatJSON(apiCall.response.body)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Details */}
                  {apiCall.error && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h3 className="font-semibold text-sm text-red-900 mb-2">Error Details</h3>
                      <div className="bg-white p-3 rounded border">
                        <pre className="text-xs font-mono whitespace-pre-wrap text-red-800">
                          {apiCall.error}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 text-center">
                    Tested at: {new Date(apiCall.timestamp).toLocaleString()}
                  </div>
                </div>
              </>
            )}

            {/* AI Configuration Details */}
            {testResult?.details?.dynamic_config && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-sm text-purple-900 mb-2">🤖 AI-Generated Configuration</h3>
                <div className="text-xs text-purple-800 space-y-1">
                  <p>✅ Configuration Source: {testResult.details.config_source}</p>
                  <p>✅ Dynamic Testing: Enabled</p>
                  <p>✅ AI-Powered Integration: Active</p>
                </div>
              </div>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TransparentAPIModal;
