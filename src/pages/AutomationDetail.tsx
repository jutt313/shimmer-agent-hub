import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Copy, Edit, Plus, Trash2, ChevronDown, CheckCircle, AlertTriangle, Loader2, Play } from "lucide-react"
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { AutomationBlueprint, Automation } from '@/types/automation';
import { ActionStepForm } from '@/components/ActionStepForm';
import { AIStepForm } from '@/components/AIStepForm';
import { DelayStepForm } from '@/components/DelayStepForm';
import { ConditionStepForm } from '@/components/ConditionStepForm';
import { AutomationStep } from '@/types/automation';
import { arrayMove } from '@dnd-kit/sortable';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '@/components/SortableItem';
import { SimpleExecuteButton } from '@/components/SimpleExecuteButton';
import { AutomationExecutionValidator } from '@/utils/automationExecutionValidator';
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';
import { AutomationAgentManager } from '@/utils/automationAgentManager';
import { agentStateManager } from '@/utils/agentStateManager';
import { AgentDecision } from '@/utils/automationAgentManager';
import { AgentCard } from '@/components/AgentCard';
import { CreateAgentDialog } from '@/components/CreateAgentDialog';

const AutomationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const [automation, setAutomation] = useState<Automation | null>(null);
  const [blueprint, setBlueprint] = useState<AutomationBlueprint>({ steps: [] });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [testResults, setTestResults] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [agentDecisions, setAgentDecisions] = useState<AgentDecision[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  useEffect(() => {
    if (id) {
      fetchAutomation(id);
      fetchAgentDecisions(id);
      agentStateManager.setAutomationId(id);
    }
  }, [id]);

  useEffect(() => {
    const checkReadiness = async () => {
      if (!automation?.id || !user?.id) {
        setIsReady(false);
        return;
      }

      try {
        // Use existing validation logic from AutomationExecutionValidator
        const validation = await AutomationExecutionValidator.validateAutomation(
          automation.id,
          automation.blueprint,
          user.id
        );
        
        setIsReady(validation.canExecute);
      } catch (error) {
        console.error('Failed to validate automation readiness:', error);
        setIsReady(false);
      }
    };

    checkReadiness();
  }, [automation?.id, automation?.blueprint, user?.id]);

  const fetchAutomation = async (automationId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .single();

      if (error) {
        console.error('Error fetching automation:', error);
        toast({
          title: "Error",
          description: "Failed to load automation details.",
          variant: "destructive",
        });
        return;
      }

      setAutomation(data);
      setBlueprint(JSON.parse(data.blueprint));
      setName(data.name);
      setDescription(data.description);
      setIsPublic(data.is_public);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgentDecisions = async (automationId: string) => {
    if (!user?.id) return;

    try {
      const decisions = await AutomationAgentManager.getAgentDecisions(automationId, user.id);
      setAgentDecisions(decisions);
    } catch (error) {
      console.error('Failed to fetch agent decisions:', error);
      toast({
        title: "Error",
        description: "Failed to load agent decisions.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "You must be signed in to save automations.",
        variant: "destructive",
      });
      return;
    }

    if (!name) {
      toast({
        title: "Missing Name",
        description: "Please provide a name for the automation.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('automations')
        .update({
          name: name,
          description: description,
          blueprint: JSON.stringify(blueprint),
          is_public: isPublic,
          updated_at: new Date(),
          user_id: user.id
        })
        .eq('id', id);

      if (error) {
        console.error('Error saving automation:', error);
        toast({
          title: "Error",
          description: "Failed to save automation.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Automation saved successfully.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "You must be signed in to delete automations.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting automation:', error);
        toast({
          title: "Error",
          description: "Failed to delete automation.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Automation deleted successfully.",
      });
      navigate('/automations');
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const handleAddStep = (type: AutomationStep['type']) => {
    let newStep: AutomationStep;

    switch (type) {
      case 'action':
        newStep = {
          id: crypto.randomUUID(),
          type: 'action',
          action: {
            integration: '',
            operation: '',
            parameters: {}
          }
        };
        break;
      case 'ai_agent_call':
        newStep = {
          id: crypto.randomUUID(),
          type: 'ai_agent_call',
          ai_agent_call: {
            prompt: '',
            agent_id: null
          }
        };
        break;
      case 'delay':
        newStep = {
          id: crypto.randomUUID(),
          type: 'delay',
          delay: {
            duration: 5
          }
        };
        break;
      case 'condition':
        newStep = {
          id: crypto.randomUUID(),
          type: 'condition',
          condition: {
            left: '',
            operator: 'eq',
            right: ''
          }
        };
        break;
      default:
        console.warn('Unknown step type:', type);
        return;
    }

    setBlueprint(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep]
    }));
  };

  const handleStepChange = (stepId: string, updatedStep: AutomationStep) => {
    setBlueprint(prev => ({
      ...prev,
      steps: (prev.steps || []).map(step =>
        step.id === stepId ? updatedStep : step
      )
    }));
  };

  const handleStepDelete = (stepId: string) => {
    setBlueprint(prev => ({
      ...prev,
      steps: (prev.steps || []).filter(step => step.id !== stepId)
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      setBlueprint(prev => {
        if (!prev.steps) return prev;
        const oldIndex = prev.steps.findIndex(step => step.id === active.id);
        const newIndex = prev.steps.findIndex(step => step.id === over.id);

        const newSteps = arrayMove(prev.steps, oldIndex, newIndex);

        return {
          ...prev,
          steps: newSteps,
        };
      });
    }
  };

  const renderStepForm = (step: AutomationStep) => {
    switch (step.type) {
      case 'action':
        return (
          <ActionStepForm
            step={step}
            onChange={(updatedStep) => handleStepChange(step.id, updatedStep)}
            onDelete={() => handleStepDelete(step.id)}
          />
        );
      case 'ai_agent_call':
        return (
          <AIStepForm
            step={step}
            onChange={(updatedStep) => handleStepChange(step.id, updatedStep)}
            onDelete={() => handleStepDelete(step.id)}
            automationId={id || ''}
            onAgentDecision={(agentName: string, decision: 'added' | 'dismissed') => {
              if (!user?.id) return;
              AutomationAgentManager.updateAgentDecision(id || '', agentName, decision, user.id)
                .then(() => {
                  fetchAgentDecisions(id || '');
                  agentStateManager.clearDecisions();
                  toast({
                    title: "Agent Decision Updated",
                    description: `Agent ${agentName} ${decision}.`,
                  });
                })
                .catch(error => {
                  console.error('Failed to update agent decision:', error);
                  toast({
                    title: "Error",
                    description: "Failed to update agent decision.",
                    variant: "destructive",
                  });
                });
            }}
          />
        );
      case 'delay':
        return (
          <DelayStepForm
            step={step}
            onChange={(updatedStep) => handleStepChange(step.id, updatedStep)}
            onDelete={() => handleStepDelete(step.id)}
          />
        );
      case 'condition':
        return (
          <ConditionStepForm
            step={step}
            onChange={(updatedStep) => handleStepChange(step.id, updatedStep)}
            onDelete={() => handleStepDelete(step.id)}
          />
        );
      default:
        return <div>Unknown step type</div>;
    }
  };

  const handleTestCredentials = async () => {
    if (!user?.id || !automation?.id) {
      toast({
        title: "Error",
        description: "User or automation ID not found.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingCredentials(true);
    try {
      const requiredPlatforms = AutomationExecutionValidator.extractRequiredPlatforms(blueprint);
      const allCredentials = await AutomationCredentialManager.getAllCredentials(automation.id, user.id);

      const testPromises = requiredPlatforms.map(async (platform) => {
        const credential = allCredentials.find(c => c.platform_name.toLowerCase() === platform.toLowerCase());
        if (credential) {
          const credentials = JSON.parse(credential.credentials);
          return AutomationCredentialManager.testCredentials(user.id, automation.id, platform, credentials);
        } else {
          return { success: false, message: `No credentials found for ${platform}` };
        }
      });

      const results = await Promise.all(testPromises);
      setTestResults(results);

      const allSuccessful = results.every(result => result.success);
      if (allSuccessful) {
        toast({
          title: "Credentials Tested Successfully",
          description: "All credentials passed the test.",
        });
      } else {
        toast({
          title: "Credential Test Failed",
          description: "Some credentials failed the test. Check details below.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error("Credential testing error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to test credentials.",
        variant: "destructive",
      });
    } finally {
      setIsTestingCredentials(false);
    }
  };

  const renderTestResults = () => {
    if (!testResults) return null;

    return (
      <div>
        <h3>Test Results:</h3>
        {testResults.map((result: any, index: number) => (
          <Card key={index} className="mb-4">
            <CardHeader>
              <CardTitle>{result.details?.platform || 'Platform'}</CardTitle>
              <CardDescription>
                {result.success ? (
                  <div className="text-green-500 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Success
                  </div>
                ) : (
                  <div className="text-red-500 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Failed
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Message: {result.message}</p>
              {result.details && (
                <details>
                  <summary>Details</summary>
                  <pre>{JSON.stringify(result.details, null, 2)}</pre>
                </details>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (!automation) {
    return <div className="text-center mt-8">Automation not found.</div>;
  }

  return (
    <div className="container mx-auto mt-8">
      <div className="mb-4 flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate('/automations')}>
          ← Back to Automations
        </Button>
        <div>
          <Button
            variant="secondary"
            onClick={handleTestCredentials}
            disabled={isTestingCredentials}
            className="mr-2"
          >
            {isTestingCredentials ? (
              <>
                Testing...
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                Test Credentials
              </>
            )}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                Saving...
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Save Automation"
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automation Details</CardTitle>
          <CardDescription>Manage your automation settings.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked)}
            />
            <Label htmlFor="isPublic">Public</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Execution</CardTitle>
          <CardDescription>Execute and manage credentials.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SimpleExecuteButton
            automationId={automation.id}
            isReady={isReady}
            onExecutionStart={() => {
              // Optional: Add any execution start logic
              console.log('Automation execution started');
            }}
            onExecutionComplete={(success) => {
              // Optional: Add any execution completion logic
              console.log('Automation execution completed:', success);
            }}
          />
          {renderTestResults()}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Steps Blueprint</CardTitle>
          <CardDescription>Define the steps for your automation.</CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blueprint.steps?.map(step => step.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4">
                {blueprint.steps?.map((step) => (
                  <SortableItem key={step.id} id={step.id}>
                    {renderStepForm(step)}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-4 flex justify-around">
            <Button variant="outline" onClick={() => handleAddStep('action')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Action Step
            </Button>
            <Button variant="outline" onClick={() => handleAddStep('ai_agent_call')}>
              <Plus className="w-4 h-4 mr-2" />
              Add AI Agent Step
            </Button>
            <Button variant="outline" onClick={() => handleAddStep('delay')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Delay Step
            </Button>
            <Button variant="outline" onClick={() => handleAddStep('condition')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Condition Step
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>AI Agent Management</CardTitle>
          <CardDescription>Manage AI agent decisions for this automation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {agentDecisions.length === 0 ? (
            <div className="text-center">No agent decisions yet.</div>
          ) : (
            <div className="grid gap-4">
              {agentDecisions.map(agent => (
                <AgentCard
                  key={agent.agent_name}
                  agent={agent}
                  onDecisionChange={(decision: 'added' | 'dismissed') => {
                    if (!user?.id) return;
                    AutomationAgentManager.updateAgentDecision(id || '', agent.agent_name, decision, user.id)
                      .then(() => {
                        fetchAgentDecisions(id || '');
                        toast({
                          title: "Agent Decision Updated",
                          description: `Agent ${agent.agent_name} ${decision}.`,
                        });
                      })
                      .catch(error => {
                        console.error('Failed to update agent decision:', error);
                        toast({
                          title: "Error",
                          description: "Failed to update agent decision.",
                          variant: "destructive",
                        });
                      });
                  }}
                />
              ))}
            </div>
          )}
          <CreateAgentDialog automationId={id || ''} />
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the automation and all related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  Deleting...
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mt-8 text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Automation</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the automation and all related data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AutomationDetail;
