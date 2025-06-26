
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CredentialField {
  field: string;
  description: string;
  required: boolean;
  type: string;
}

interface PlatformData {
  platform_name: string;
  platform_description: string;
  credential_fields: CredentialField[];
  use_cases: string[];
  summary: string;
}

interface PlatformCredentialManagerProps {
  onSave: (data: PlatformData) => void;
  initialData?: PlatformData;
}

const PlatformCredentialManager = ({ onSave, initialData }: PlatformCredentialManagerProps) => {
  const { toast } = useToast();
  const [platformData, setPlatformData] = useState<PlatformData>(
    initialData || {
      platform_name: '',
      platform_description: '',
      credential_fields: [],
      use_cases: [],
      summary: ''
    }
  );

  const addCredentialField = () => {
    setPlatformData(prev => ({
      ...prev,
      credential_fields: [
        ...prev.credential_fields,
        { field: '', description: '', required: true, type: 'string' }
      ]
    }));
  };

  const updateCredentialField = (index: number, field: Partial<CredentialField>) => {
    setPlatformData(prev => ({
      ...prev,
      credential_fields: prev.credential_fields.map((item, i) => 
        i === index ? { ...item, ...field } : item
      )
    }));
  };

  const removeCredentialField = (index: number) => {
    setPlatformData(prev => ({
      ...prev,
      credential_fields: prev.credential_fields.filter((_, i) => i !== index)
    }));
  };

  const addUseCase = (useCase: string) => {
    if (useCase.trim() && !platformData.use_cases.includes(useCase.trim())) {
      setPlatformData(prev => ({
        ...prev,
        use_cases: [...prev.use_cases, useCase.trim()]
      }));
    }
  };

  const removeUseCase = (index: number) => {
    setPlatformData(prev => ({
      ...prev,
      use_cases: prev.use_cases.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!platformData.platform_name || !platformData.summary) {
      toast({
        title: "Missing Information",
        description: "Platform name and summary are required",
        variant: "destructive",
      });
      return;
    }

    onSave(platformData);
    toast({
      title: "Success",
      description: "Platform data saved successfully",
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Platform Credential Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Platform Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Platform Name</label>
            <Input
              value={platformData.platform_name}
              onChange={(e) => setPlatformData(prev => ({...prev, platform_name: e.target.value}))}
              placeholder="e.g., Google Sheets, Slack, Gmail"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Summary</label>
            <Input
              value={platformData.summary}
              onChange={(e) => setPlatformData(prev => ({...prev, summary: e.target.value}))}
              placeholder="Brief description of the platform"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Platform Description</label>
          <Textarea
            value={platformData.platform_description}
            onChange={(e) => setPlatformData(prev => ({...prev, platform_description: e.target.value}))}
            placeholder="Detailed description of what this platform does"
            rows={3}
          />
        </div>

        {/* Credential Fields */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Credential Fields</h3>
            <Button onClick={addCredentialField} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>

          <div className="space-y-4">
            {platformData.credential_fields.map((field, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Field Name</label>
                    <Input
                      value={field.field}
                      onChange={(e) => updateCredentialField(index, { field: e.target.value })}
                      placeholder="e.g., api_key, bot_token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      value={field.type}
                      onChange={(e) => updateCredentialField(index, { type: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="string">String</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                      <option value="json">JSON</option>
                      <option value="number">Number</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateCredentialField(index, { required: e.target.checked })}
                      id={`required-${index}`}
                    />
                    <label htmlFor={`required-${index}`} className="text-sm">Required</label>
                  </div>
                  <div className="flex items-center">
                    <Button
                      onClick={() => removeCredentialField(index)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={field.description}
                    onChange={(e) => updateCredentialField(index, { description: e.target.value })}
                    placeholder="What is this field used for?"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Use Cases</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {platformData.use_cases.map((useCase, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2">
                {useCase}
                <button
                  onClick={() => removeUseCase(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add use case (e.g., notifications, data_entry)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addUseCase(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                addUseCase(input.value);
                input.value = '';
              }}
            >
              Add
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Platform Data
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlatformCredentialManager;
