
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AutomationBlueprint } from '@/types/automation';
import { ArrowLeft, Bot, Settings, Network, MessageCircle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlatformCredentialManager from '@/components/PlatformCredentialManager';
import AutomationDiagramDisplay from '@/components/AutomationDiagramDisplay';
import ChatCard from '@/components/ChatCard';
import AutomationRunsMonitor from '@/components/AutomationRunsMonitor';
import ReadyForExecutionButton from '@/components/ReadyForExecutionButton';

interface Automation {
  id: string;
  title: string;
  description: string;
  automation_blueprint: any; // Changed from AutomationBlueprint to any to handle Json type
  created_at: string;
  updated_at: string;
  user_id: string;
}

const AutomationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAutomation = async () => {
      if (!id) {
        console.error("No automation ID provided.");
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('automations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error("Error fetching automation:", error);
        } else {
          setAutomation(data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAutomation();
  }, [id]);

  if (loading) {
    return <div>Loading automation details...</div>;
  }

  if (!automation) {
    return <div>Automation not found.</div>;
  }

  // Type cast the automation_blueprint when we need to use it as AutomationBlueprint
  const blueprint = automation.automation_blueprint as AutomationBlueprint;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="mb-8">
        <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Automations
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{automation.title}</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Description</h2>
          <p className="text-gray-700">{automation.description}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Blueprint</h2>
          <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
            {JSON.stringify(automation.automation_blueprint, null, 2)}
          </pre>
        </div>

        {automation.automation_blueprint && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Platform Credentials</h2>
            </div>
            <PlatformCredentialManager 
              onSave={(data) => console.log('Platform data saved:', data)}
            />
          </div>
        )}

        {automation.automation_blueprint && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Network className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Automation Flow</h2>
            </div>
            <AutomationDiagramDisplay />
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Chat with AI</h2>
          </div>
          <ChatCard 
            automationId={id!} 
            messages={[]}
          />
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Execution History</h2>
          </div>
          <AutomationRunsMonitor automationId={id!} />
        </div>
      </div>

      {automation.automation_blueprint && (
        <ReadyForExecutionButton
          automationId={id!}
          blueprint={blueprint}
          title={automation.title}
        />
      )}
    </div>
  );
};

export default AutomationDetail;
