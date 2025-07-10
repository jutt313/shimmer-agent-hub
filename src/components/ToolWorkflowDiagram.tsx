
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  User, 
  MessageSquare, 
  Bot, 
  Zap, 
  Database, 
  CheckCircle, 
  ArrowRight,
  ArrowDown,
  Settings,
  Play,
  Monitor
} from 'lucide-react';

const ToolWorkflowDiagram = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg">
          <Monitor className="w-4 h-4 mr-2" />
          View How The Tool Works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            YusrAI Tool Workflow - Complete System Architecture
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 p-4">
          {/* Phase 1: User Input & AI Processing */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              User Input & AI Processing
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-sm">User Describes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-xs">
                  <p>User types natural language description of desired automation</p>
                  <p className="text-blue-600 font-medium mt-1">Example: "When someone fills Typeform, send email via Gmail"</p>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-sm">AI Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-xs">
                  <p>OpenAI processes request and identifies required platforms, actions, and workflow steps</p>
                  <p className="text-purple-600 font-medium mt-1">Platforms: Typeform + Gmail</p>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-sm">Blueprint Created</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-xs">
                  <p>AI generates structured automation blueprint with steps, conditions, and platform connections</p>
                  <p className="text-green-600 font-medium mt-1">JSON Blueprint Ready</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-6 h-6 text-gray-400" />
          </div>

          {/* Phase 2: Platform Detection & Configuration */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Dynamic Platform Detection & Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-orange-600" />
                    <CardTitle className="text-sm">Knowledge Lookup</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <p>System checks Universal Knowledge Store for platform configurations</p>
                  <div className="bg-orange-200 p-2 rounded text-orange-800">
                    <p className="font-medium">Dynamic Discovery:</p>
                    <p>• API endpoint detection</p>
                    <p>• Authentication methods</p>
                    <p>• Required parameters</p>
                    <p>• Response formats</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-teal-600" />
                    <CardTitle className="text-sm">Auto-Configuration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <p>Universal Integrator automatically configures platform connections</p>
                  <div className="bg-teal-200 p-2 rounded text-teal-800">
                    <p className="font-medium">Smart Config:</p>
                    <p>• OpenAPI spec parsing</p>
                    <p>• Auth pattern detection</p>
                    <p>• Endpoint mapping</p>
                    <p>• Error handling setup</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-pink-600" />
                    <CardTitle className="text-sm">Platform Ready</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <p>Platforms become available for user connection with proper credential forms</p>
                  <div className="bg-pink-200 p-2 rounded text-pink-800">
                    <p className="font-medium">Ready Features:</p>
                    <p>• Custom auth forms</p>
                    <p>• Test connections</p>
                    <p>• Credential validation</p>
                    <p>• API endpoint testing</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-6 h-6 text-gray-400" />
          </div>

          {/* Phase 3: User Credential Setup */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
              User Credential Setup & Platform Connection
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    User Action Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <div className="space-y-2">
                    <p className="font-medium text-indigo-800">Step 1: Platform Selection</p>
                    <p>User sees detected platforms as connection buttons</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-indigo-800">Step 2: Credential Entry</p>
                    <p>User provides API keys, OAuth tokens, or login credentials</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-indigo-800">Step 3: Connection Test</p>
                    <p>System validates credentials with real API calls</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-cyan-600" />
                    System Validation
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <div className="bg-cyan-200 p-3 rounded text-cyan-800">
                    <p className="font-medium mb-2">Automatic Validation Process:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Credential format verification</li>
                      <li>• Live API connection testing</li>
                      <li>• Permission scope validation</li>
                      <li>• Error handling configuration</li>
                      <li>• Rate limit detection</li>
                      <li>• Data format compatibility check</li>
                    </ul>
                  </div>
                  <p className="text-green-600 font-medium">✅ Platforms become "Connected"</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-6 h-6 text-gray-400" />
          </div>

          {/* Phase 4: Automation Execution */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
              Dynamic Automation Execution
            </h3>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-red-600" />
                  Universal Execution Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium text-red-800">Trigger Detection</p>
                    <div className="bg-red-200 p-2 rounded text-red-700">
                      <p>• Webhook endpoints</p>
                      <p>• Scheduled triggers</p>
                      <p>• Manual execution</p>
                      <p>• API-based triggers</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-medium text-red-800">Dynamic API Calls</p>
                    <div className="bg-red-200 p-2 rounded text-red-700">
                      <p>• Zero hardcoded logic</p>
                      <p>• Universal API adapter</p>
                      <p>• Real-time parameter mapping</p>
                      <p>• Response processing</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-medium text-red-800">Error Handling</p>
                    <div className="bg-red-200 p-2 rounded text-red-700">
                      <p>• Automatic retry logic</p>
                      <p>• Fallback mechanisms</p>
                      <p>• Detailed error logging</p>
                      <p>• User notifications</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-4 rounded-lg">
                  <p className="font-bold text-center text-lg">🚀 CRITICAL: 100% Dynamic Execution</p>
                  <p className="text-center mt-2">No platform-specific code • Universal API integration • AI-powered workflow execution</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Architecture Summary */}
          <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border">
            <h3 className="text-xl font-bold text-gray-800 mb-4">System Architecture Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-bold text-gray-700 mb-2">Core Components:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Universal Knowledge Store (Platform configs)</li>
                  <li>• Dynamic Platform Integrator</li>
                  <li>• AI Blueprint Generator (OpenAI)</li>
                  <li>• Universal Execution Engine</li>
                  <li>• Credential Management System</li>
                  <li>• Real-time Monitoring & Logging</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-700 mb-2">Key Features:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Zero hardcoded platform logic</li>
                  <li>• OpenAPI specification parsing</li>
                  <li>• Dynamic authentication handling</li>
                  <li>• Real-time error handling</li>
                  <li>• Usage tracking & limitations</li>
                  <li>• Multi-tenant architecture</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ToolWorkflowDiagram;
