
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatCard from "@/components/ChatCard";
import AutomationDashboard from "@/components/AutomationDashboard";
import AIAgentForm from "@/components/AIAgentForm";
import FixedPlatformButtons from "@/components/FixedPlatformButtons";
import BlueprintCard from "@/components/BlueprintCard";
import AutomationDiagramDisplay from "@/components/AutomationDiagramDisplay";
import AutomationExecutionPanel from "@/components/AutomationExecutionPanel";
import AutomationRunsMonitor from "@/components/AutomationRunsMonitor";
import { AutomationBlueprint } from "@/types/automation";

const AutomationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [automation, setAutomation] = useState<any>(null);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [blueprintCardVisible, setBlueprintCardVisible] = useState(false);

  const fetchAutomation = async () => {
    if (!id || !user) return;
    
    try {
      console.log('🔍 ENHANCED AutomationDetail: Fetching automation data...');
      
      const { data, error } = await supabase
        .from('automations')
        .select(`
          *,
          automation_responses(*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setAutomation(data);
      console.log('✅ ENHANCED: Automation data loaded:', data?.title);

      // Safely extract platforms from automation blueprint
      if (data?.automation_blueprint && typeof data.automation_blueprint === 'object') {
        const blueprint = data.automation_blueprint as any;
        if (blueprint.platforms && Array.isArray(blueprint.platforms)) {
          console.log('🚀 ENHANCED: Extracting platforms from blueprint:', blueprint.platforms);
          setPlatforms(blueprint.platforms);
        } else {
          console.log('⚠️ ENHANCED: No platforms found in blueprint');
          setPlatforms([]);
        }
      } else {
        console.log('⚠️ ENHANCED: No blueprint found');
        setPlatforms([]);
      }
      
    } catch (error: any) {
      console.error('❌ ENHANCED: Error fetching automation:', error);
      toast({
        title: "Error",
        description: "Failed to load automation details",
        variant: "destructive"
      });
      navigate('/automations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomation();
  }, [id, user]);

  const handleCredentialChange = () => {
    console.log('🔄 ENHANCED: Credential change detected, refreshing...');
    fetchAutomation();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">🚀 Loading Enhanced Automation Details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">❌ Automation not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper function to safely get blueprint
  const getBlueprint = (): AutomationBlueprint | null => {
    if (!automation.automation_blueprint) return null;
    if (typeof automation.automation_blueprint !== 'object') return null;
    
    const bp = automation.automation_blueprint as any;
    // Ensure minimum required fields are present
    if (!bp.trigger || !bp.steps || !bp.version) {
      // Create a minimal valid blueprint if structure is incomplete
      return {
        version: bp.version || "1.0",
        trigger: bp.trigger || { type: "manual" as const },
        steps: bp.steps || [],
        platforms: bp.platforms || [],
        ...bp
      } as AutomationBlueprint;
    }
    
    return bp as AutomationBlueprint;
  };

  const blueprint = getBlueprint();

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-purple-900 mb-2">🚀 {automation.title}</h1>
            {automation.description && (
              <p className="text-purple-700 text-lg">{automation.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-purple-600">
              <span className="bg-purple-200 px-3 py-1 rounded-full">
                📊 Status: {automation.status}
              </span>
              <span className="bg-blue-200 px-3 py-1 rounded-full">
                🤖 Enhanced System
              </span>
              <span className="bg-green-200 px-3 py-1 rounded-full">
                🔧 {platforms.length} Platforms
              </span>
            </div>
          </div>
          
          <div>
            <button
              onClick={() => setBlueprintCardVisible(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors"
            >
              View Blueprint
            </button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 lg:grid-cols-6 bg-white rounded-2xl p-2 border border-purple-200">
          <TabsTrigger value="chat" className="rounded-xl">💬 Chat</TabsTrigger>
          <TabsTrigger value="platforms" className="rounded-xl">🚀 Platforms</TabsTrigger>
          <TabsTrigger value="agents" className="rounded-xl">🤖 AI Agents</TabsTrigger>
          <TabsTrigger value="diagram" className="rounded-xl">📊 Diagram</TabsTrigger>
          <TabsTrigger value="execution" className="rounded-xl">⚡ Execute</TabsTrigger>
          <TabsTrigger value="monitoring" className="rounded-xl">📈 Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <ChatCard 
            automationId={id!} 
            messages={automation.automation_responses || []}
          />
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                🚀 Enhanced Platform Credentials Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FixedPlatformButtons
                platforms={platforms}
                automationId={id!}
                onCredentialChange={handleCredentialChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                🤖 AI Agents Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AIAgentForm 
                automationId={id!}
                onClose={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagram" className="space-y-6">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                📊 Enhanced Automation Diagram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AutomationDiagramDisplay
                automationBlueprint={blueprint}
                automationDiagramData={automation.automation_diagram_data}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="space-y-6">
          <AutomationExecutionPanel 
            automationId={id!}
            blueprint={blueprint || {
              version: "1.0",
              trigger: { type: "manual" as const },
              steps: []
            }}
            title={automation.title}
          />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AutomationDashboard 
              automationId={id!}
              automationTitle={automation.title}
              automationBlueprint={blueprint || {
                version: "1.0",
                trigger: { type: "manual" as const },
                steps: []
              }}
            />
            <AutomationRunsMonitor automationId={id!} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Blueprint Card - Slide-out Panel */}
      {blueprintCardVisible && blueprint && (
        <BlueprintCard
          blueprint={blueprint}
          onClose={() => setBlueprintCardVisible(false)}
        />
      )}
    </div>
  );
};

export default AutomationDetail;
