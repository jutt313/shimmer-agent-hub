
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Brain, 
  Database, 
  MessageSquare, 
  Plus, 
  Settings, 
  BookOpen,
  Bot
} from "lucide-react";
import AIAgentTrainingTab from "@/components/admin/AIAgentTrainingTab";

const KnowledgeAdmin = () => {
  const { isAdmin, loading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("agent-training");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You need administrator privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Knowledge Admin Panel
          </h1>
          <p className="text-gray-600">
            Manage the AI knowledge base and agent training
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/50 rounded-2xl p-1">
          <TabsTrigger 
            value="agent-training" 
            className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Bot className="w-4 h-4" />
            AI Agent Training
          </TabsTrigger>
          <TabsTrigger 
            value="knowledge-base" 
            className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Database className="w-4 h-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger 
            value="documentation" 
            className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            Documentation
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent-training" className="mt-6">
          <AIAgentTrainingTab />
        </TabsContent>

        <TabsContent value="knowledge-base" className="mt-6">
          <Card className="rounded-3xl border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Knowledge Base Management
              </CardTitle>
              <CardDescription>
                Manage the universal knowledge store that powers the AI system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Knowledge base management tools coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="mt-6">
          <Card className="rounded-3xl border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Documentation Management
              </CardTitle>
              <CardDescription>
                Manage system documentation and help articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Documentation management tools coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card className="rounded-3xl border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>System settings coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeAdmin;
