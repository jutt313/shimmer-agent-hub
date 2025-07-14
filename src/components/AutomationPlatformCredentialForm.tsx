
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, TestTube, Save, CheckCircle, XCircle, Loader2, ExternalLink, Info, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PlatformCredentialFormProps {
  automationId: string;
  platform: {
    name: string;
    credentials: Array<{
      field: string;
      placeholder: string;
      link: string;
      why_needed: string;
    }>;
  };
  onCredentialSaved?: () => void;
}

const AutomationPlatformCredentialForm = ({ 
  automationId, 
  platform, 
  onCredentialSaved 
}: PlatformCredentialFormProps) => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [canSave, setCanSave] = useState(false);
  
  // ENHANCED: Phase 5 transparency features
  const [showEnhancedDetails, setShowEnhancedDetails] = useState(false);
  const [realTimeTestData, setRealTimeTestData] = useState<any>(null);

  useEffect(() => {
    if (user && automationId && platform.name) {
      loadExistingCredentials();
    }
  }, [user, automationId, platform.name]);

  const loadExistingCredentials = async () => {
    if (!user) return;

    try {
      const existingCredentials = await AutomationCredentialManager.getCredentials(
        automationId,
        platform.name,
        user.id
      );

      if (existingCredentials) {
        setCredentials(existingCredentials);
        setCanSave(true);
        setTestResult({ success: true, message: 'Credentials already tested and saved with enhanced system' });
      }
    } catch (error) {
      console.error('Failed to load existing credentials:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    setTestResult(null);
    setCanSave(false);
    setRealTimeTestData(null);
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const hasAllCredentials = platform.credentials.every(cred => 
    credentials[cred.field] && credentials[cred.field].trim() !== ''
  );

  const handleTest = async () => {
    if (!user || !hasAllCredentials) return;

    setIsTesting(true);
    setTestResult(null);
    setRealTimeTestData(null);
    
    try {
      console.log(`🌟 ENHANCED TESTING: ${platform.name} with all 5 phases implemented`);
      
      const result = await AutomationCredentialManager.testCredentials(
        user.id,
        automationId,
        platform.name,
        credentials
      );

      // PHASE 5: Store real-time testing data for transparency
      setRealTimeTestData(result.details);
      setTestResult(result);
      
      if (result.success) {
        setCanSave(true);
        toast.success(`✅ ${platform.name} credentials verified with enhanced 5-phase system!`);
      } else {
        setCanSave(false);
        toast.error(`❌ Enhanced test failed: ${result.message}`);
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
      setCanSave(false);
      toast.error(`💥 Enhanced testing system error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!user || !canSave) return;

    setIsSaving(true);
    try {
      const result = await AutomationCredentialManager.saveCredentials(
        automationId,
        platform.name,
        credentials,
        user.id
      );

      if (result.success) {
        toast.success(`✅ ${platform.name} credentials saved with enhanced validation!`);
        onCredentialSaved?.();
      } else {
        toast.error(`❌ Failed to save credentials: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`💥 Error saving credentials: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-600">Loading enhanced system...</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{platform.name} Credentials</h3>
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <Zap className="h-3 w-3" />
            Enhanced 5-Phase System
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEnhancedDetails(!showEnhancedDetails)}
          className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
        >
          <Info className="h-4 w-4" />
          <span className="ml-1 text-xs">Enhanced Details</span>
          {showEnhancedDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>
      </div>

      <div className="space-y-4">
        {platform.credentials.map((cred) => (
          <div key={cred.field} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">{cred.field}</label>
              {cred.link && (
                <a
                  href={cred.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-purple-600 hover:text-purple-800"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Get Key
                </a>
              )}
            </div>

            <div className="relative">
              <Input
                type={showPasswords[cred.field] ? "text" : "password"}
                placeholder={cred.placeholder}
                value={credentials[cred.field] || ''}
                onChange={(e) => handleCredentialChange(cred.field, e.target.value)}
                className="rounded-xl border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-purple-100"
                onClick={() => togglePasswordVisibility(cred.field)}
              >
                {showPasswords[cred.field] ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-600">{cred.why_needed}</p>
          </div>
        ))}

        {/* PHASE 5: Enhanced Real-time Testing Details */}
        {showEnhancedDetails && (
          <div className="mt-6 p-4 bg-white/70 rounded-xl border border-purple-200">
            <h4 className="text-md font-semibold text-purple-600 mb-3">🌟 Enhanced 5-Phase System Details</h4>
            
            {/* Phase Implementation Status */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[
                { phase: 'Phase 1', name: 'Communication', status: 'FIXED' },
                { phase: 'Phase 2', name: 'Knowledge Store', status: 'ACTIVE' },
                { phase: 'Phase 3', name: 'Enhanced Auth', status: 'IMPLEMENTED' },
                { phase: 'Phase 4', name: 'Error Diagnosis', status: 'ENHANCED' },
                { phase: 'Phase 5', name: 'Transparency', status: 'ACTIVE' }
              ].map((phase) => (
                <div key={phase.phase} className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs font-medium text-green-800">{phase.phase}</div>
                  <div className="text-xs text-green-600">{phase.name}</div>
                  <div className="text-xs font-bold text-green-700">{phase.status}</div>
                </div>
              ))}
            </div>

            {/* Real-time Test Data */}
            {realTimeTestData && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-gray-700">📊 Real-time Test Results</h5>
                
                {realTimeTestData.platform_config && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Configuration Source</label>
                      <p className="text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded">
                        {realTimeTestData.platform_config.source}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Auth Method</label>
                      <p className="text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded">
                        {realTimeTestData.platform_config.auth_method}
                      </p>
                    </div>
                  </div>
                )}

                {realTimeTestData.performance_metrics && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">Performance Metrics</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <div className="text-xs bg-blue-100 px-2 py-1 rounded text-center">
                        <div className="font-medium">Config Load</div>
                        <div>{realTimeTestData.performance_metrics.config_load_time}</div>
                      </div>
                      <div className="text-xs bg-green-100 px-2 py-1 rounded text-center">
                        <div className="font-medium">API Request</div>
                        <div>{realTimeTestData.performance_metrics.api_request_time}</div>
                      </div>
                      <div className="text-xs bg-purple-100 px-2 py-1 rounded text-center">
                        <div className="font-medium">Total Time</div>
                        <div>{realTimeTestData.performance_metrics.total_processing_time}</div>
                      </div>
                    </div>
                  </div>
                )}

                {realTimeTestData.endpoint_tested && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">Tested Endpoint</label>
                    <p className="text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded break-all">
                      {realTimeTestData.method_used} {realTimeTestData.endpoint_tested}
                    </p>
                  </div>
                )}

                {realTimeTestData.phase_markers && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">Phase Status</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {Object.entries(realTimeTestData.phase_markers).map(([phase, status]: [string, any]) => (
                        <div key={phase} className="text-xs bg-green-50 px-2 py-1 rounded">
                          <span className="font-medium">{phase.replace('phase_', 'Phase ').replace('_', ' ')}</span>
                          <span className="ml-2 text-green-600">{status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!realTimeTestData && (
              <p className="text-xs text-gray-500 italic">Click "Test Credentials" to see enhanced real-time testing data</p>
            )}
          </div>
        )}

        {testResult && (
          <div className={`p-3 rounded-xl border ${
            testResult.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{testResult.message}</span>
            </div>
            {testResult.details?.enhanced_testing && (
              <div className="mt-2 text-xs">
                🌟 Enhanced 5-phase system with real-time transparency active
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleTest}
            disabled={!hasAllCredentials || isTesting}
            className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enhanced Testing...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Test with Enhanced System
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={!canSave || isSaving || isTesting}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Enhanced Credentials
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 pt-2">
          🌟 Enhanced 5-phase system: Fixed communication, Universal Knowledge integration, Advanced authentication, Enhanced error diagnosis, Real-time transparency
        </p>
      </div>
    </div>
  );
};

export default AutomationPlatformCredentialForm;
