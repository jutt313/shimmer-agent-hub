
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { globalSecurityAuditor, SecurityVulnerability } from '@/utils/securityAudit';
import { useToast } from '@/hooks/use-toast';

interface SecurityReport {
  summary: { total: number; critical: number; high: number; medium: number; low: number };
  vulnerabilities: SecurityVulnerability[];
  recommendations: string[];
}

export function SecurityDashboard() {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const runSecurityAudit = async () => {
    setIsLoading(true);
    try {
      const auditReport = globalSecurityAuditor.generateSecurityReport();
      setReport(auditReport);
      
      toast({
        title: "Security Audit Complete",
        description: `Found ${auditReport.summary.total} potential issues`,
        variant: auditReport.summary.critical > 0 ? "destructive" : "default"
      });
    } catch (error) {
      toast({
        title: "Audit Failed",
        description: "Unable to complete security audit",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSecurityScore = () => {
    if (!report) return 0;
    const { summary } = report;
    const totalPossibleIssues = 100; // Baseline
    const weightedScore = (summary.critical * 10) + (summary.high * 5) + (summary.medium * 2) + (summary.low * 1);
    return Math.max(0, Math.min(100, 100 - (weightedScore / totalPossibleIssues * 100)));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {report && (
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${getSecurityScore() >= 80 ? 'bg-green-500' : getSecurityScore() >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <span className="font-semibold">Security Score: {getSecurityScore().toFixed(0)}%</span>
                </div>
              )}
            </div>
            <Button 
              onClick={runSecurityAudit} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {isLoading ? 'Running Audit...' : 'Run Security Audit'}
            </Button>
          </div>

          {report && (
            <div className="grid grid-cols-5 gap-4 mb-6">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold">{report.summary.total}</div>
                <div className="text-sm text-gray-600">Total Issues</div>
              </Card>
              <Card className="p-4 text-center border-red-200">
                <div className="text-2xl font-bold text-red-600">{report.summary.critical}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </Card>
              <Card className="p-4 text-center border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{report.summary.high}</div>
                <div className="text-sm text-gray-600">High</div>
              </Card>
              <Card className="p-4 text-center border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{report.summary.medium}</div>
                <div className="text-sm text-gray-600">Medium</div>
              </Card>
              <Card className="p-4 text-center border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{report.summary.low}</div>
                <div className="text-sm text-gray-600">Low</div>
              </Card>
            </div>
          )}

          {report && report.vulnerabilities.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Security Issues</h3>
              {report.vulnerabilities.map((vuln, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(vuln.severity)}>
                          {vuln.severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{vuln.category}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{vuln.description}</p>
                      <p className="text-sm text-gray-500 mb-2">Location: {vuln.location}</p>
                      <p className="text-sm text-blue-600">Recommendation: {vuln.recommendation}</p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {report && report.recommendations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Security Recommendations</h3>
              <div className="space-y-2">
                {report.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report && report.summary.total === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700">All Clear!</h3>
              <p className="text-gray-600">No security issues detected in the current audit.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
