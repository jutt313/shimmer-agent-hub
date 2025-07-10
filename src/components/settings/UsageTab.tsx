
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { Crown, Zap, Bot, Database, Workflow, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UsageTab = () => {
  const { limits, loading } = useUsageLimits();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!limits) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load usage information</p>
      </div>
    );
  }

  const getUsagePercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50';
    if (percentage >= 75) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const planColors = {
    starter: 'bg-blue-500',
    professional: 'bg-purple-500',
    business: 'bg-green-500',
    enterprise: 'bg-gray-800',
    special: 'bg-gradient-to-r from-yellow-400 to-orange-500'
  };

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${planColors[limits.planType as keyof typeof planColors] || 'bg-gray-500'}`}>
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="capitalize text-2xl">{limits.planType} Plan</CardTitle>
                {limits.isTrialActive && (
                  <Badge variant="secondary" className="mt-1">
                    Trial Active until {new Date(limits.trialEndsAt!).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              onClick={() => navigate('/')} 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Upgrade Plan
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Automations */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Active Automations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-900">
                  {limits.currentUsage.automations}
                </span>
                <span className="text-sm text-gray-600">
                  of {limits.maxAutomations}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(limits.currentUsage.automations, limits.maxAutomations)} 
                className="h-3"
              />
              <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(getUsagePercentage(limits.currentUsage.automations, limits.maxAutomations))}`}>
                {getUsagePercentage(limits.currentUsage.automations, limits.maxAutomations).toFixed(1)}% used
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Runs */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Total Runs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-900">
                  {limits.currentUsage.totalRuns.toLocaleString()}
                </span>
                <span className="text-sm text-gray-600">
                  of {limits.maxTotalRuns.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(limits.currentUsage.totalRuns, limits.maxTotalRuns)} 
                className="h-3"
              />
              <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(getUsagePercentage(limits.currentUsage.totalRuns, limits.maxTotalRuns))}`}>
                {getUsagePercentage(limits.currentUsage.totalRuns, limits.maxTotalRuns).toFixed(1)}% used
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Runs */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">Step Runs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-900">
                  {limits.currentUsage.stepRuns.toLocaleString()}
                </span>
                <span className="text-sm text-gray-600">
                  of {limits.maxStepRuns.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(limits.currentUsage.stepRuns, limits.maxStepRuns)} 
                className="h-3"
              />
              <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(getUsagePercentage(limits.currentUsage.stepRuns, limits.maxStepRuns))}`}>
                {getUsagePercentage(limits.currentUsage.stepRuns, limits.maxStepRuns).toFixed(1)}% used
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Agents */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">AI Agents</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-900">
                  {limits.currentUsage.aiAgents}
                </span>
                <span className="text-sm text-gray-600">
                  of {limits.maxAiAgents}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(limits.currentUsage.aiAgents, limits.maxAiAgents)} 
                className="h-3"
              />
              <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(getUsagePercentage(limits.currentUsage.aiAgents, limits.maxAiAgents))}`}>
                {getUsagePercentage(limits.currentUsage.aiAgents, limits.maxAiAgents).toFixed(1)}% used
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Integrations */}
        <Card className="rounded-2xl shadow-lg md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              <CardTitle className="text-lg">Platform Integrations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-900">
                  {limits.currentUsage.platformIntegrations}
                </span>
                <span className="text-sm text-gray-600">
                  of {limits.maxPlatformIntegrations} platforms
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(limits.currentUsage.platformIntegrations, limits.maxPlatformIntegrations)} 
                className="h-3"
              />
              <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(getUsagePercentage(limits.currentUsage.platformIntegrations, limits.maxPlatformIntegrations))}`}>
                {getUsagePercentage(limits.currentUsage.platformIntegrations, limits.maxPlatformIntegrations).toFixed(1)}% used
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Comparison */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Need More Resources?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-blue-600">Starter</h4>
              <p className="text-sm text-gray-600">15 automations • 50K steps</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-purple-600">Professional</h4>
              <p className="text-sm text-gray-600">25 automations • 100K steps</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-green-600">Business</h4>
              <p className="text-sm text-gray-600">75 automations • 300K steps</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-800">Enterprise</h4>
              <p className="text-sm text-gray-600">150 automations • 1M steps</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Button 
              onClick={() => navigate('/')} 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Upgrade Your Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageTab;
