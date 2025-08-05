import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const AutomationDetail = () => {
  const { id } = useParams();

  const [automation, setAutomation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchAutomation = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching automation with ID:', id);
        
        // Fetch automation from Supabase
        const { data, error: supabaseError } = await supabase
          .from('automations')
          .select('*')
          .eq('id', id)
          .single();

        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          throw new Error(`Failed to fetch automation: ${supabaseError.message}`);
        }

        if (!data) {
          throw new Error('No automation found with this ID');
        }

        console.log('Fetched automation data:', data);
        
        // Transform data to match expected format
        const transformedData = {
          id: data.id,
          name: data.title,
          description: data.description,
          isActive: data.status === 'active',
          triggers: data.automation_blueprint?.triggers || [],
          actions: data.automation_blueprint?.actions || [],
          variables: data.automation_blueprint?.variables || {},
          lastRun: data.updated_at,
          runCount: 0, // This would need to be calculated from automation_runs table
          errorCount: 0, // This would need to be calculated from error logs
        };

        setAutomation(transformedData);
      } catch (err: any) {
        console.error('Error fetching automation:', err);
        setError(err.message || 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAutomation();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading automation details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 text-lg">No automation found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{automation.name}</h1>
          <p className="text-gray-600 mt-2">{automation.description}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Main Content */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Details</CardTitle>
                <CardDescription>Overview and configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="automation-name">Name</Label>
                    <Input id="automation-name" value={automation.name} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="automation-description">Description</Label>
                    <Textarea id="automation-description" value={automation.description} readOnly />
                  </div>
                  <div>
                    <Label>Active</Label>
                    <Switch checked={automation.isActive} disabled />
                  </div>
                  <div>
                    <Label>Triggers</Label>
                    <ul className="list-disc list-inside">
                      {automation.triggers?.map((trigger: any, idx: number) => (
                        <li key={idx}>{trigger.type} - {trigger.detail}</li>
                      )) || <li>No triggers configured</li>}
                    </ul>
                  </div>
                  <div>
                    <Label>Actions</Label>
                    <ul className="list-disc list-inside">
                      {automation.actions?.map((action: any, idx: number) => (
                        <li key={idx}>{action.type} - {action.detail}</li>
                      )) || <li>No actions configured</li>}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Variables</CardTitle>
                <CardDescription>Automation variables and parameters</CardDescription>
              </CardHeader>
              <CardContent>
                {automation.variables && Object.keys(automation.variables).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(automation.variables).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell>{key}</TableCell>
                          <TableCell>{String(value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-600">No variables defined.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Current automation status and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Badge variant={automation.isActive ? "secondary" : "destructive"}>
                      {automation.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <Label>Last Run</Label>
                    <p>{automation.lastRun ? new Date(automation.lastRun).toLocaleString() : "Never run"}</p>
                  </div>
                  <div>
                    <Label>Total Runs</Label>
                    <p>{automation.runCount || 0}</p>
                  </div>
                  <div>
                    <Label>Errors</Label>
                    <p>{automation.errorCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Manual controls for this automation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <Button onClick={() => alert('Edit automation feature coming soon')} variant="outline">
                    Edit Automation
                  </Button>
                  <Button onClick={() => alert('Run automation feature coming soon')} variant="default">
                    Run Now
                  </Button>
                  <Button onClick={() => alert('Delete automation feature coming soon')} variant="destructive">
                    Delete Automation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationDetail;
