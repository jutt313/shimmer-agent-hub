
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertCircle, 
  RefreshCw, 
  Wrench, 
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DiagramErrorRecoveryProps {
  error: string;
  onRetry: () => void;
  onFallbackDiagram: () => void;
  isRetrying: boolean;
}

const DiagramErrorRecovery: React.FC<DiagramErrorRecoveryProps> = ({
  error,
  onRetry,
  onFallbackDiagram,
  isRetrying
}) => {
  const getDiagnosticInfo = (errorMessage: string) => {
    const diagnostics = [];
    
    if (errorMessage.includes('OpenAI API key')) {
      diagnostics.push({
        issue: '🔑 API Key Missing',
        description: 'OpenAI API key not configured in Supabase',
        severity: 'critical',
        solution: 'Add OPENAI_API_KEY to Supabase Edge Function Secrets'
      });
    }
    
    if (errorMessage.includes('non-2xx status code')) {
      diagnostics.push({
        issue: '📡 API Call Failed',
        description: 'OpenAI API returned an error status',
        severity: 'high',
        solution: 'Check API key validity and rate limits'
      });
    }
    
    if (errorMessage.includes('JSON')) {
      diagnostics.push({
        issue: '📋 Data Format Error',
        description: 'Invalid response format from AI service',
        severity: 'medium',
        solution: 'Try regenerating with simpler automation'
      });
    }
    
    if (errorMessage.includes('timeout')) {
      diagnostics.push({
        issue: '⏱️ Timeout Error',
        description: 'AI service took too long to respond',
        severity: 'medium',
        solution: 'Retry with smaller automation blueprint'
      });
    }
    
    return diagnostics;
  };

  const diagnostics = getDiagnosticInfo(error);

  return (
    <Card className="max-w-2xl mx-auto shadow-xl border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div>
            <CardTitle className="text-red-800">Diagram Generation Failed</CardTitle>
            <p className="text-sm text-red-600 mt-1">
              Don't worry! We have multiple recovery options available.
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Error Details */}
        <div className="bg-white/80 rounded-lg p-4 border border-red-200">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            Error Details
          </h4>
          <p className="text-sm text-gray-700 font-mono bg-gray-100 p-2 rounded">
            {error}
          </p>
        </div>

        {/* Diagnostics */}
        {diagnostics.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-500" />
              Diagnostic Information
            </h4>
            {diagnostics.map((diagnostic, index) => (
              <div key={index} className="bg-white/80 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">{diagnostic.issue}</span>
                      <Badge 
                        variant={diagnostic.severity === 'critical' ? 'destructive' : 
                               diagnostic.severity === 'high' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {diagnostic.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{diagnostic.description}</p>
                    <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      💡 Solution: {diagnostic.solution}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recovery Options */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Recovery Options
          </h4>
          
          <div className="grid gap-3">
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying Enhanced Generation...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry with Enhanced AI (Recommended)
                </>
              )}
            </Button>
            
            <Button
              onClick={onFallbackDiagram}
              variant="outline"
              className="w-full border-green-300 text-green-700 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Generate Basic Diagram (Fallback)
            </Button>
          </div>
        </div>

        {/* Help Links */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h5 className="font-medium text-blue-800 mb-2">Need More Help?</h5>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="link" 
              size="sm" 
              className="text-blue-600 p-0 h-auto"
              onClick={() => window.open('https://supabase.com/dashboard/project/88f2719b-24d4-47d3-894f-bfc63d22f07b/settings/functions', '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Supabase Secrets
            </Button>
            <Button 
              variant="link" 
              size="sm" 
              className="text-blue-600 p-0 h-auto"
              onClick={() => window.open('https://supabase.com/dashboard/project/88f2719b-24d4-47d3-894f-bfc63d22f07b/functions/diagram-generator/logs', '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Function Logs
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiagramErrorRecovery;
