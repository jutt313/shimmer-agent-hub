
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  X, 
  Activity, 
  FileText, 
  AlertTriangle, 
  Code, 
  Copy, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Plus,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePersonalApiDashboard } from '@/hooks/usePersonalApiDashboard';

interface PersonalApiDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const PersonalApiDashboard = ({ isOpen, onClose }: PersonalApiDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Use the refactored hook
  const {
    stats,
    usageData,
    apiLogs,
    apiErrors,
    tokens,
    realtimeWebhookUrl,
    loading,
    createToken,
    testForm,
    setTestForm,
    testResult,
    testLoading,
    handleNaturalLanguageChange,
    executeApiTest
  } = usePersonalApiDashboard();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [showTokens, setShowTokens] = useState<{[key: string]: boolean}>({});
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [tokenForm, setTokenForm] = useState({
    name: '',
    description: '',
    purpose: '',
    permissions: {
      read: true,
      write: false,
      webhook: false,
      notifications: false,
      full_control: false,
      platform_connections: false,
    }
  });

  const handleCreateToken = async () => {
    const token = await createToken(tokenForm);
    if (token) {
      setShowTokenForm(false);
      setTokenForm({
        name: '',
        description: '',
        purpose: '',
        permissions: {
          read: true,
          write: false,
          webhook: false,
          notifications: false,
          full_control: false,
          platform_connections: false,
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-blue-600">Personal API Dashboard</h2>
            <p className="text-gray-600">Control your account from external services</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="errors" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Errors
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Test
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* No Tokens Setup */}
                {tokens.length === 0 && !showTokenForm && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Settings className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Get Started with Your Personal API</h3>
                    <p className="text-gray-600 mb-6">Create your first API token to start connecting external services</p>
                    <Button onClick={() => setShowTokenForm(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create API Token
                    </Button>
                  </div>
                )}

                {/* Token Creation Form */}
                {showTokenForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Create New API Token</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="token-name">Token Name</Label>
                          <Input
                            id="token-name"
                            value={tokenForm.name}
                            onChange={(e) => setTokenForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="My External Service"
                          />
                        </div>
                        <div>
                          <Label htmlFor="token-purpose">Connection Purpose</Label>
                          <Input
                            id="token-purpose"
                            value={tokenForm.purpose}
                            onChange={(e) => setTokenForm(prev => ({ ...prev, purpose: e.target.value }))}
                            placeholder="Zapier Integration"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="token-description">Description</Label>
                        <Textarea
                          id="token-description"
                          value={tokenForm.description}
                          onChange={(e) => setTokenForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe what this token will be used for..."
                        />
                      </div>
                      <div>
                        <Label>Permissions</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {Object.entries(tokenForm.permissions).map(([key, value]) => (
                            <label key={key} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => setTokenForm(prev => ({
                                  ...prev,
                                  permissions: { ...prev.permissions, [key]: e.target.checked }
                                }))}
                              />
                              <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCreateToken} className="bg-blue-600 hover:bg-blue-700">
                          Create Token
                        </Button>
                        <Button variant="outline" onClick={() => setShowTokenForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Stats Overview */}
                {tokens.length > 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-6">
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-600 font-medium">Total API Calls</p>
                              <p className="text-3xl font-bold text-blue-700">{stats.totalCalls}</p>
                            </div>
                            <Activity className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-600 font-medium">Real-time Webhook</p>
                              <p className="text-3xl font-bold text-purple-700">{stats.activeWebhooks}</p>
                            </div>
                            <Zap className="h-8 w-8 text-purple-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-600 font-medium">Success Rate</p>
                              <p className="text-3xl font-bold text-green-700">{stats.successRate}%</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* API Credentials */}
                    <Card className="bg-orange-50 border-orange-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                          <Settings className="h-5 w-5" />
                          Your API Credentials
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-gray-700 font-medium">Personal API Token:</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-white p-3 rounded border font-mono text-sm">
                              {tokens[0] && showTokens[tokens[0].id] 
                                ? `YUSR_${tokens[0].id.slice(0, 8)}...${tokens[0].id.slice(-8)}`
                                : 'YUSR_••••••••••••••••••••••••••••••••'
                              }
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => tokens[0] && setShowTokens(prev => ({ ...prev, [tokens[0].id]: !prev[tokens[0].id] }))}
                            >
                              {tokens[0] && showTokens[tokens[0].id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                if (tokens[0]) {
                                  navigator.clipboard.writeText(`YUSR_${tokens[0].id}`);
                                  toast({ title: "Copied!", description: "API token copied to clipboard" });
                                }
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-gray-700 font-medium">Real-time Webhook URL:</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-white p-3 rounded border font-mono text-sm break-all">
                              {realtimeWebhookUrl}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(realtimeWebhookUrl);
                                toast({ title: "Copied!", description: "Webhook URL copied to clipboard" });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Usage Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>API Usage Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={usageData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} />
                              <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} />
                              <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="logs" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent API Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {apiLogs.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No API calls yet</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {apiLogs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center gap-4">
                              <Badge variant={log.status_code < 300 ? "default" : "destructive"}>
                                {log.method}
                              </Badge>
                              <span className="font-mono text-sm">{log.endpoint}</span>
                              <Badge variant="outline">{log.status_code}</Badge>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <p>{log.response_time_ms}ms</p>
                              <p>{new Date(log.created_at).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="errors" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {apiErrors.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No errors - great job! 🎉</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {apiErrors.map((error) => (
                          <div key={error.id} className="p-4 bg-red-50 border border-red-200 rounded">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="destructive">{error.severity}</Badge>
                                  <Badge variant="outline">{error.error_type}</Badge>
                                </div>
                                <p className="text-sm text-gray-700 mb-1">{error.error_message}</p>
                                {error.endpoint && (
                                  <p className="text-xs text-gray-500">Endpoint: {error.endpoint}</p>
                                )}
                                <div className="mt-2 text-xs text-gray-600">
                                  <p>Common solutions:</p>
                                  <ul className="list-disc list-inside ml-2 mt-1">
                                    {error.error_type === 'VALIDATION_ERROR' && <li>Check your request format and required fields</li>}
                                    {error.error_type === 'AUTHENTICATION_ERROR' && <li>Verify your API token is correct and active</li>}
                                    {error.error_type === 'AUTHORIZATION_ERROR' && <li>Ensure your token has the required permissions</li>}
                                    {error.error_type === 'NOT_FOUND_ERROR' && <li>Verify the resource ID and endpoint URL</li>}
                                    {error.error_type === 'RATE_LIMIT_ERROR' && <li>Reduce request frequency and implement backoff</li>}
                                  </ul>
                                </div>
                              </div>
                              <div className="text-right text-xs text-gray-500">
                                {new Date(error.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="test" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Test Your API</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="test-token">API Token</Label>
                        <Select value={testForm.selectedToken} onValueChange={(value) => setTestForm(prev => ({ ...prev, selectedToken: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your API token" />
                          </SelectTrigger>
                          <SelectContent>
                            {tokens.map((token) => (
                              <SelectItem key={token.id} value={`YUSR_${token.id}`}>
                                {token.token_name} (YUSR_{token.id.slice(0, 8)}...)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="test-method">HTTP Method</Label>
                          <Select value={testForm.method} onValueChange={(value) => setTestForm(prev => ({ ...prev, method: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="test-endpoint">Endpoint</Label>
                          <Select value={testForm.endpoint} onValueChange={(value) => setTestForm(prev => ({ ...prev, endpoint: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="/automations">List Automations</SelectItem>
                              <SelectItem value="/automations">Create Automation</SelectItem>
                              <SelectItem value="/webhooks">List Webhooks</SelectItem>
                              <SelectItem value="/events">List Events</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="natural-language">What do you want to do? (Natural Language)</Label>
                        <Textarea
                          id="natural-language"
                          value={testForm.naturalLanguage}
                          onChange={(e) => handleNaturalLanguageChange(e.target.value)}
                          placeholder="Create an automation called 'Email Notification' that sends alerts when a user signs up"
                          className="min-h-20"
                        />
                      </div>

                      <div>
                        <Label htmlFor="test-payload">Request Payload (JSON)</Label>
                        <Textarea
                          id="test-payload"
                          value={testForm.jsonPayload}
                          onChange={(e) => setTestForm(prev => ({ ...prev, jsonPayload: e.target.value }))}
                          placeholder="Auto-generated from your natural language input above"
                          className="min-h-32 font-mono text-sm"
                        />
                      </div>

                      <Button 
                        onClick={executeApiTest} 
                        disabled={testLoading || !testForm.selectedToken}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        {testLoading ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Testing API Call...
                          </>
                        ) : (
                          <>
                            <Code className="h-4 w-4 mr-2" />
                            Test API Call
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {testResult ? (
                        <div className="space-y-4">
                          {testResult.error ? (
                            <div className="p-4 bg-red-50 border border-red-200 rounded">
                              <div className="flex items-center gap-2 mb-2">
                                <XCircle className="h-5 w-5 text-red-500" />
                                <span className="font-medium text-red-700">Request Failed</span>
                              </div>
                              <p className="text-sm text-red-600">{testResult.error}</p>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-4">
                                <Badge variant={testResult.status && testResult.status < 300 ? "default" : "destructive"}>
                                  {testResult.status}
                                </Badge>
                                <span className="text-sm text-gray-600">{testResult.responseTime}ms</span>
                              </div>
                              
                              <div>
                                <Label>Response Data:</Label>
                                <div className="mt-2 max-h-64 overflow-y-auto">
                                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(testResult.data, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Run a test to see the response here</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PersonalApiDashboard;
