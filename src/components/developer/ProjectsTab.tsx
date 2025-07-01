
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FolderOpen, 
  Plus, 
  Calendar, 
  Edit,
  Trash2,
  Code
} from 'lucide-react';

interface Project {
  id: string;
  project_name: string;
  project_description: string | null;
  use_case: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ProjectsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Form state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [useCase, setUseCase] = useState('');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('developer_projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const { error } = await supabase
        .from('developer_projects')
        .insert({
          user_id: user?.id,
          project_name: projectName,
          project_description: projectDescription || null,
          use_case: useCase || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      setShowCreateDialog(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const updateProject = async () => {
    if (!editingProject) return;

    try {
      const { error } = await supabase
        .from('developer_projects')
        .update({
          project_name: projectName,
          project_description: projectDescription || null,
          use_case: useCase || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProject.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project updated successfully",
      });

      setEditingProject(null);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('developer_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setProjectName('');
    setProjectDescription('');
    setUseCase('');
  };

  const startEdit = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.project_name);
    setProjectDescription(project.project_description || '');
    setUseCase(project.use_case || '');
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-600">Organize your API usage by project</p>
        </div>
        
        <Dialog 
          open={showCreateDialog || !!editingProject} 
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setEditingProject(null);
              resetForm();
            } else if (!editingProject) {
              setShowCreateDialog(true);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Project Name</label>
                <Input
                  placeholder="My Awesome Project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea
                  placeholder="What does this project do?"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="mt-1 rounded-xl"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Use Case</label>
                <Input
                  placeholder="e.g., Mobile app, Web dashboard, API integration"
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>

              <Button 
                onClick={editingProject ? updateProject : createProject}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
                disabled={!projectName.trim()}
              >
                {editingProject ? 'Update Project' : 'Create Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects List */}
      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
            <CardContent className="p-8 text-center">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects</h3>
              <p className="text-gray-600 mb-4">Create your first project to organize your API usage</p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Code className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {project.project_name}
                        </CardTitle>
                        <Badge variant={project.is_active ? "default" : "secondary"} className="mt-1">
                          {project.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(project)}
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-xl"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProject(project.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.project_description && (
                    <p className="text-sm text-gray-600">{project.project_description}</p>
                  )}
                  
                  {project.use_case && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">USE CASE</p>
                      <Badge variant="outline" className="text-xs">
                        {project.use_case}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsTab;
