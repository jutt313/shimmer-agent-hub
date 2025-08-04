
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import FixedPlatformButtons from '@/components/FixedPlatformButtons';
import AutomationDashboard from '@/components/AutomationDashboard';
import ChatCard from '@/components/ChatCard';
import AutomationDiagramDisplay from '@/components/AutomationDiagramDisplay';
import AIAgentForm from '@/components/AIAgentForm';
import AutomationExecutionPanel from '@/components/AutomationExecutionPanel';
import { supabase } from '@/integrations/supabase/client';
import { AutomationBlueprint } from '@/types/automation';

const AutomationDetail = () => {
  const { automationId } = useParams();
  const { user } = useAuth();
  const [automation, setAutomation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAutomation();
  }, [automationId, user]);

  const fetchAutomation = async () => {
    if (!automationId || !user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        setError(error.message);
      } else if (data) {
        setAutomation(data);
      } else {
        setError('Automation not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch automation');
    } finally {
      setLoading(false);
    }
  };

  const getBlueprint = (): AutomationBlueprint => {
    if (!automation?.automation_blueprint) {
      return {
        version: '1.0',
        trigger: {
          type: 'manual' as const, // Fix: Use const assertion for union type
          platform: 'Generic'
        },
        steps: []
      };
    }

    const blueprint = typeof automation.automation_blueprint === 'string' 
      ? JSON.parse(automation.automation_blueprint)
      : automation.automation_blueprint;

    // Ensure trigger type is one of the allowed values
    const getTriggerType = (type: string): 'manual' | 'scheduled' | 'webhook' | 'platform' => {
      switch (type) {
        case 'scheduled':
          return 'scheduled';
        case 'webhook':
          return 'webhook';
        case 'platform':
          return 'platform';
        default:
          return 'manual';
      }
    };

    return {
      version: blueprint.version || '1.0',
      trigger: {
        type: getTriggerType(blueprint.trigger?.type || 'manual'),
        platform: blueprint.trigger?.platform,
        cron_expression: blueprint.trigger?.cron_expression,
        webhook_endpoint: blueprint.trigger?.webhook_endpoint,
        webhook_secret: blueprint.trigger?.webhook_secret,
        integration: blueprint.trigger?.integration
      },
      steps: blueprint.steps || [],
      variables: blueprint.variables,
      platforms: blueprint.platforms,
      test_payloads: blueprint.test_payloads
    };
  };

  const platforms = automation?.platforms_config ? 
    (typeof automation.platforms_config === 'string' ? 
      JSON.parse(automation.platforms_config) : 
      automation.platforms_config).platforms || [] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Automation not found</h3>
          <p className="text-gray-600">The requested automation could not be found.</p>
        </div>
      </div>
    );
  }

  const blueprint = getBlueprint();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{automation.title}</h1>
          <p className="text-muted-foreground mt-1">{automation.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={automation.status === 'active' ? 'default' : 'secondary'}>
            {automation.status}
          </Badge>
        </div>
      </div>

      {/* Platform Configuration Buttons */}
      {platforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Configuration</CardTitle>
            <CardDescription>
              Configure credentials for the platforms used in this automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FixedPlatformButtons 
              platforms={platforms}
              automationId={automationId!}
              onCredentialChange={() => {
                // Refresh automation data when credentials change
                fetchAutomation();
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="diagram">Diagram</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="execution">Execute</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AutomationDashboard 
            automationId={automationId!}
            automationTitle={automation.title}
            automationBlueprint={blueprint}
          />
        </TabsContent>

        <TabsContent value="chat">
          <ChatCard 
            automationId={automationId!}
            messages={automation.automation_responses || []}
          />
        </TabsContent>

        <TabsContent value="diagram">
          <AutomationDiagramDisplay 
            automationBlueprint={blueprint}
            automationDiagramData={automation.automation_diagram_data}
          />
        </TabsContent>

        <TabsContent value="agents">
          <AIAgentForm 
            automationId={automationId!}
            onClose={() => {}}
          />
        </TabsContent>

        <TabsContent value="execution">
          <AutomationExecutionPanel 
            automationId={automationId!}
            blueprint={blueprint}
            title={automation.title}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomationDetail;
