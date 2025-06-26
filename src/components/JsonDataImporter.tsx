
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileJson } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface JsonDataImporterProps {
  onImport: (data: any[]) => void;
  onExport: () => any[];
}

const JsonDataImporter = ({ onImport, onExport }: JsonDataImporterProps) => {
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState('');

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonInput);
      const dataArray = Array.isArray(data) ? data : [data];
      
      // Validate data structure
      const validData = dataArray.filter(item => 
        item.platform_name && item.summary && item.credential_fields
      );

      if (validData.length === 0) {
        throw new Error('No valid platform data found. Each item must have platform_name, summary, and credential_fields.');
      }

      onImport(validData);
      setJsonInput('');
      
      toast({
        title: "Import Successful",
        description: `Imported ${validData.length} platform entries`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const data = onExport();
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'platform-knowledge-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Platform data exported successfully",
    });
  };

  const sampleData = {
    platform_name: "Example Platform",
    summary: "Brief description of the platform",
    platform_description: "Detailed description",
    credential_fields: [
      {
        field: "api_key",
        description: "API key for authentication",
        required: true,
        type: "string"
      }
    ],
    use_cases: ["automation", "integration"]
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            JSON Data Import/Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Current Data
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Import JSON Data (Array of platform objects)
            </label>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`Paste your JSON data here...\n\nExample format:\n${JSON.stringify([sampleData], null, 2)}`}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <Button onClick={handleImport} disabled={!jsonInput.trim()}>
            <Upload className="h-4 w-4 mr-2" />
            Import JSON Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default JsonDataImporter;
