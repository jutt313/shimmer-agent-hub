
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Play, Settings, Activity, Code, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AutomationDiagramDisplay from '@/components/AutomationDiagramDisplay';
import AutomationExecutionPanel from '@/components/AutomationExecutionPanel';
import PlatformCredentialManager from '@/components/PlatformCredentialManager';
import ExecutionBlueprintVisualizer from '@/components/ExecutionBlueprintVisualizer';
import { parseYusrAIStructuredResponse } from '@/utils/jsonParser';

const AutomationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [automation, setAutomation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executionBlueprint, setExecutionBlueprint] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!id) {
      setError('Automation ID is required.');
      setLoading(false);
      return;
    }

    const fetchAutomation = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('automations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setAutomation(data);
          // Check if automation_blueprint contains the structured response
          if (data.automation_blueprint) {
            try {
              const parsedResponse = parseYusrAIStructuredResponse(JSON.stringify(data.automation_blueprint));
              setExecutionBlueprint(parsedResponse.structuredData?.execution_blueprint);
            } catch (parseError: any) {
              console.error("Error parsing automation blueprint:", parseError);
              toast({
                title: "Error",
                description: "Failed to parse automation blueprint. Please check the data format.",
                variant: "destructive",
              });
            }
          }
        } else {
          setError('Automation not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch automation.');
        toast({
          title: "Error",
          description: err.message || 'Failed to fetch automation.',
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAutomation();
  }, [id, toast]);

  if (loading) {
    return <div className="text-center py-8">Loading automation details...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  if (!automation) {
    return <div className="text-center py-8">Automation not found.</div>;
  }

  return (
    <div className="container mx-auto mt-8">
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">{automation.name}</CardTitle>
            <Button variant="ghost" onClick={() => navigate('/automations')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Automations
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Badge variant="secondary">ID: {automation.id}</Badge>
            <Badge variant="outline">Status: {automation.status}</Badge>
            {automation.created_at && (
              <Badge>Created: {new Date(automation.created_at).toLocaleDateString()}</Badge>
            )}
          </div>
          <p className="text-gray-600">{automation.description || 'No description provided.'}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="diagram" className="w-full">
        <TabsList>
          <TabsTrigger value="diagram">
            <Activity className="mr-2 h-4 w-4" />
            Diagram
          </TabsTrigger>
          <TabsTrigger value="blueprint">
            <Code className="mr-2 h-4 w-4" />
            Blueprint
          </TabsTrigger>
          <TabsTrigger value="credentials">
            <Users className="mr-2 h-4 w-4" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="execution">
            <Play className="mr-2 h-4 w-4" />
            Execution
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="diagram">
          <Card>
            <CardHeader>
              <CardTitle>Automation Diagram</CardTitle>
              <p className="text-sm text-gray-500">Visual representation of the automation workflow.</p>
            </CardHeader>
            <CardContent>
              <AutomationDiagramDisplay automation={automation} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="blueprint">
          <Card>
            <CardHeader>
              <CardTitle>Execution Blueprint</CardTitle>
              <p className="text-sm text-gray-500">AI-generated execution plan for the automation.</p>
            </CardHeader>
            <CardContent>
              <ExecutionBlueprintVisualizer blueprint={executionBlueprint} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle>Platform Credentials</CardTitle>
              <p className="text-sm text-gray-500">Manage and configure platform credentials for this automation.</p>
            </CardHeader>
            <CardContent>
              <PlatformCredentialManager 
                onSave={(data) => console.log('Saved platform data:', data)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="execution">
          <Card>
            <CardHeader>
              <CardTitle>Automation Execution</CardTitle>
              <p className="text-sm text-gray-500">Execute and monitor the automation in real-time.</p>
            </CardHeader>
            <CardContent>
              <AutomationExecutionPanel 
                automationId={id || ''} 
                blueprint={executionBlueprint}
                title={automation.name}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <p className="text-sm text-gray-500">Configure advanced settings for the automation.</p>
            </CardHeader>
            <CardContent>
              <div>
                <p>More settings coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomationDetail;
