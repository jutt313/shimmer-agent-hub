
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Automation title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'draft']).default('draft'),
});

const Automations = () => {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { 
    notifyAutomationCreated, 
    notifyAutomationUpdated, 
    notifySystemError 
  } = require('@/utils/globalNotificationTriggers');

  const [open, setOpen] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: 'draft',
    },
  })

  useEffect(() => {
    const fetchAutomations = async () => {
      setLoading(true);
      try {
        if (!user) return;
        const { data, error } = await supabase
          .from('automations')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching automations:', error);
          toast({
            title: "Error",
            description: "Failed to load automations",
            variant: "destructive",
          });
          return;
        }

        setAutomations(data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchAutomations();
  }, [user, toast]);

  const handleCreateAutomation = async (automationData: any) => {
    try {
      if (!user?.id) {
        console.error('User ID is missing.');
        toast({
          title: "Error",
          description: "User ID is missing. Please log in again.",
          variant: "destructive",
        });
        return;
      }
  
      const { data, error } = await supabase
        .from('automations')
        .insert([
          { 
            ...automationData, 
            user_id: user.id,
          }
        ])
        .select()
        .single();
  
      if (error) {
        console.error('Error creating automation:', error);
        notifySystemError('Failed to create automation', { error: error.message });
        toast({
          title: "Error",
          description: "Failed to create automation. Check notifications for details.",
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }
  
      setAutomations(prevAutomations => [...prevAutomations, data]);
      setOpen(false);
      form.reset();
      
      if (data) {
        notifyAutomationCreated(data.id, data.title || 'New Automation');
        toast({
          title: "Success",
          description: "Automation created successfully!",
        });
      }
      
      return { success: true, data: data };
    } catch (error: any) {
      console.error('Error creating automation:', error);
      notifySystemError('Failed to create automation', { error: error.message });
      toast({
        title: "Error",
        description: "Failed to create automation. Check notifications for details.",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  const handleUpdateAutomation = async (automationId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('automations')
        .update(updates)
        .eq('id', automationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating automation:', error);
        notifySystemError('Failed to update automation', { error: error.message });
        toast({
          title: "Error", 
          description: "Failed to update automation. Check notifications for details.",
          variant: "destructive"
        });
        return;
      }

      setAutomations(prevAutomations =>
        prevAutomations.map(automation =>
          automation.id === automationId ? { ...automation, ...updates } : automation
        )
      );
      notifyAutomationUpdated(automationId, updates.title || 'Automation');
      toast({
        title: "Success",
        description: "Automation updated successfully!",
      });
    } catch (error: any) {
      console.error('Error updating automation:', error);
      notifySystemError('Failed to update automation', { error: error.message });
      toast({
        title: "Error", 
        description: "Failed to update automation. Check notifications for details.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAutomation = async (automationId: string) => {
    try {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', automationId);

      if (error) {
        console.error('Error deleting automation:', error);
        toast({
          title: "Error",
          description: "Failed to delete automation",
          variant: "destructive",
        });
        return;
      }

      setAutomations(prevAutomations =>
        prevAutomations.filter(automation => automation.id !== automationId)
      );
      toast({
        title: "Success",
        description: "Automation deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting automation:', error);
      toast({
        title: "Error",
        description: "Failed to delete automation",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Automations</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Automation</DialogTitle>
              <DialogDescription>
                Create a new automation to streamline your workflows.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(async (values) => {
                await handleCreateAutomation(values);
              })} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Automation Title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your automation"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p>Loading automations...</p>
      ) : automations.length === 0 ? (
        <p>No automations created yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((automation) => (
                <TableRow key={automation.id}>
                  <TableCell className="font-medium">{automation.title}</TableCell>
                  <TableCell>{automation.description}</TableCell>
                  <TableCell>{automation.status}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/automations/${automation.id}`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteAutomation(automation.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Automations;
