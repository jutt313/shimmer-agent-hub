import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Plus, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Target,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react';

interface BudgetLimit {
  id: string;
  budget_name: string;
  budget_amount: number;
  budget_period: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date: string | null;
  current_spend: number;
  is_active: boolean;
  project_id: string | null;
}

interface Project {
  id: string;
  project_name: string;
}

const LimitsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLimit, setEditingLimit] = useState<BudgetLimit | null>(null);
  
  // Form state
  const [budgetName, setBudgetName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState(100);
  const [budgetPeriod, setBudgetPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedProject, setSelectedProject] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchBudgetLimits();
      fetchProjects();
    }
  }, [user]);

  const fetchBudgetLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('budget_limits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to ensure budget_period matches our type
      const transformedData = (data || []).map(item => ({
        ...item,
        budget_period: item.budget_period as 'daily' | 'weekly' | 'monthly'
      }));
      
      setBudgetLimits(transformedData);
    } catch (error) {
      console.error('Error fetching budget limits:', error);
      toast({
        title: "Error",
        description: "Failed to load budget limits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('developer_projects')
        .select('id, project_name')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const createBudgetLimit = async () => {
    try {
      const { error } = await supabase
        .from('budget_limits')
        .insert({
          user_id: user?.id,
          project_id: selectedProject || null,
          budget_name: budgetName,
          budget_amount: budgetAmount,
          budget_period: budgetPeriod,
          start_date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Budget limit created successfully",
      });

      setShowCreateDialog(false);
      resetForm();
      fetchBudgetLimits();
    } catch (error) {
      console.error('Error creating budget limit:', error);
      toast({
        title: "Error",
        description: "Failed to create budget limit",
        variant: "destructive",
      });
    }
  };

  const updateBudgetLimit = async () => {
    if (!editingLimit) return;

    try {
      const { error } = await supabase
        .from('budget_limits')
        .update({
          budget_name: budgetName,
          budget_amount: budgetAmount,
          budget_period: budgetPeriod,
          project_id: selectedProject || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingLimit.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Budget limit updated successfully",
      });

      setEditingLimit(null);
      resetForm();
      fetchBudgetLimits();
    } catch (error) {
      console.error('Error updating budget limit:', error);
      toast({
        title: "Error",
        description: "Failed to update budget limit",
        variant: "destructive",
      });
    }
  };

  const deleteBudgetLimit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budget_limits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Budget limit deleted successfully",
      });

      fetchBudgetLimits();
    } catch (error) {
      console.error('Error deleting budget limit:', error);
      toast({
        title: "Error",
        description: "Failed to delete budget limit",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setBudgetName('');
    setBudgetAmount(100);
    setBudgetPeriod('monthly');
    setSelectedProject('');
  };

  const startEdit = (limit: BudgetLimit) => {
    setEditingLimit(limit);
    setBudgetName(limit.budget_name);
    setBudgetAmount(limit.budget_amount);
    setBudgetPeriod(limit.budget_period);
    setSelectedProject(limit.project_id || '');
  };

  const getUsagePercentage = (limit: BudgetLimit) => {
    return (limit.current_spend / limit.budget_amount) * 100;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (percentage >= 75) return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading budget limits...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Limits</h2>
          <p className="text-gray-600">Set spending limits to control your API costs</p>
        </div>
        
        <Dialog 
          open={showCreateDialog || !!editingLimit} 
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setEditingLimit(null);
              resetForm();
            } else if (!editingLimit) {
              setShowCreateDialog(true);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Create Budget Limit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLimit ? 'Edit Budget Limit' : 'Create Budget Limit'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Budget Name</label>
                <Input
                  placeholder="Monthly API Budget"
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Amount (USD)</label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 100)}
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Period</label>
                <Select value={budgetPeriod} onValueChange={(value: any) => setBudgetPeriod(value)}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Project (Optional)</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={editingLimit ? updateBudgetLimit : createBudgetLimit}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
                disabled={!budgetName.trim() || budgetAmount <= 0}
              >
                {editingLimit ? 'Update Budget Limit' : 'Create Budget Limit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Limits List */}
      <div className="grid gap-4">
        {budgetLimits.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Limits</h3>
              <p className="text-gray-600 mb-4">Create budget limits to monitor and control your API spending</p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Budget Limit
              </Button>
            </CardContent>
          </Card>
        ) : (
          budgetLimits.map((limit) => {
            const usagePercentage = getUsagePercentage(limit);
            const project = projects.find(p => p.id === limit.project_id);
            
            return (
              <Card key={limit.id} className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {limit.budget_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="capitalize">
                            {limit.budget_period}
                          </Badge>
                          {project && (
                            <Badge variant="secondary">
                              {project.project_name}
                            </Badge>
                          )}
                          <Badge variant={limit.is_active ? "default" : "secondary"}>
                            {limit.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(limit)}
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-xl"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBudgetLimit(limit.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Budget Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Usage</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(usagePercentage)}
                        <span className={`text-sm font-medium ${getStatusColor(usagePercentage)}`}>
                          ${limit.current_spend.toFixed(2)} / ${limit.budget_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(usagePercentage, 100)} 
                      className="h-3"
                    />
                    <p className="text-xs text-gray-500">
                      {usagePercentage.toFixed(1)}% of budget used
                    </p>
                  </div>

                  {/* Status Indicators */}
                  {usagePercentage >= 90 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <p className="text-sm text-red-800 font-medium">
                          Budget Almost Exceeded
                        </p>
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        Consider increasing your budget or reviewing your usage
                      </p>
                    </div>
                  )}

                  {usagePercentage >= 75 && usagePercentage < 90 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <p className="text-sm text-orange-800 font-medium">
                          Approaching Budget Limit
                        </p>
                      </div>
                      <p className="text-xs text-orange-700 mt-1">
                        Monitor your usage to avoid exceeding the budget
                      </p>
                    </div>
                  )}

                  {/* Period Info */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Started {new Date(limit.start_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      ${((limit.current_spend / limit.budget_amount) * 100).toFixed(0)}% used
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LimitsTab;
