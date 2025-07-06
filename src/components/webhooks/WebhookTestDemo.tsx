import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { TestTube, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

interface WebhookTestResult {
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
  userMessage?: string;
  details?: any;
}

const WebhookTestDemo = () => {
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  // Test webhook URL from database
  const testWebhookUrl = "https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/webhook-trigger/fbfbcb31-6a14-44ce-8975-01bf81c31209?automation_id=cb30e5a2-f9bd-4852-b722-dbf2d8c7aa34";
  const testSecret = "bd817f44-e897-4a55-92f5-7bbf09112acf";

  const runWebhookTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      console.log('🧪 TESTING WEBHOOK SYSTEM - COMPLETE FLOW');
      console.log('📡 URL:', testWebhookUrl);
      
      const startTime = Date.now();
      
      // Call test-webhook function
      const { data, error } = await supabase.functions.invoke('test-webhook', {
        body: { 
          webhookUrl: testWebhookUrl,
          secret: testSecret 
        }
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      if (error) {
        console.error('❌ Test webhook function error:', error);
        setTestResult({
          success: false,
          error: `Function error: ${error.message}`,
          responseTime: totalTime,
          userMessage: 'Unable to connect to webhook testing service'
        });
        toast({
          title: "❌ Test Failed",
          description: "Unable to connect to webhook testing service",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ WEBHOOK TEST COMPLETE:', data);
      
      const result: WebhookTestResult = {
        success: data.success,
        statusCode: data.statusCode,
        responseTime: data.responseTime || totalTime,
        error: data.error,
        userMessage: data.userMessage,
        details: data.details
      };
      
      setTestResult(result);
      
      if (data.success) {
        toast({
          title: "✅ Webhook Test Successful!",
          description: `Complete webhook flow working! (${result.responseTime}ms)`,
        });
      } else {
        toast({
          title: "❌ Webhook Test Failed",
          description: data.userMessage || data.error || 'Unknown error',
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      console.error('💥 Webhook test error:', error);
      setTestResult({
        success: false,
        error: `Unexpected error: ${error.message}`,
        responseTime: 0,
        userMessage: 'Unexpected error occurred during testing'
      });
      toast({
        title: "💥 Test Failed",
        description: "Unexpected error occurred during testing",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (result: WebhookTestResult) => {
    if (result.success) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (result.statusCode === 0) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else if (result.statusCode && result.statusCode >= 400) {
      return <Activity className="w-5 h-5 text-orange-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (result: WebhookTestResult) => {
    if (result.success) return 'bg-green-100 text-green-800 border-green-200';
    if (result.statusCode === 0) return 'bg-red-100 text-red-800 border-red-200';
    if (result.statusCode && result.statusCode >= 400) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <Card className="max-w-2xl mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <TestTube className="w-6 h-6 text-white" />
          </div>
          Complete Webhook System Test
        </CardTitle>
        <p className="text-gray-600">
          Test the complete webhook flow: Frontend → test-webhook function → webhook-trigger function → Database
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test URL Display */}
        <div className="p-4 bg-gray-50 rounded-2xl border">
          <h4 className="font-semibold text-gray-900 mb-2">Test Webhook URL:</h4>
          <code className="text-sm bg-white p-2 rounded-lg border block break-all">
            {testWebhookUrl}
          </code>
        </div>

        {/* Test Button */}
        <div className="text-center">
          <Button
            onClick={runWebhookTest}
            disabled={testing}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl px-8 py-3"
          >
            {testing ? (
              <>
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Testing Complete Flow...
              </>
            ) : (
              <>
                <TestTube className="w-5 h-5 mr-2" />
                Test Webhook System
              </>
            )}
          </Button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="space-y-4">
            <div className="p-4 border rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResult)}
                  <h4 className="font-semibold">Test Results</h4>
                </div>
                <Badge className={getStatusColor(testResult)}>
                  {testResult.success ? 'SUCCESS' : 'FAILED'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">
                    {testResult.statusCode || 0}
                  </div>
                  <div className="text-xs text-gray-600">Status Code</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">
                    {testResult.responseTime}ms
                  </div>
                  <div className="text-xs text-gray-600">Response Time</div>
                </div>
              </div>

              {testResult.userMessage && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <h5 className="font-medium text-gray-900 mb-1">Message:</h5>
                  <p className="text-gray-700 text-sm">{testResult.userMessage}</p>
                </div>
              )}

              {testResult.error && (
                <div className="p-3 bg-red-50 rounded-xl mt-3">
                  <h5 className="font-medium text-red-900 mb-1">Error:</h5>
                  <p className="text-red-700 text-sm">{testResult.error}</p>
                </div>
              )}

              {testResult.details && (
                <div className="p-3 bg-yellow-50 rounded-xl mt-3">
                  <h5 className="font-medium text-yellow-900 mb-1">Details:</h5>
                  <pre className="text-yellow-700 text-xs overflow-x-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flow Explanation */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-2">🔄 Complete Test Flow:</h4>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Frontend calls <code>test-webhook</code> function</li>
            <li>Test function sends POST request to webhook URL</li>
            <li><code>webhook-trigger</code> function receives request</li>
            <li>Webhook function looks up automation in database</li>
            <li>Creates automation run and logs delivery</li>
            <li>Returns success/failure response</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebhookTestDemo;