
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Database, 
  Zap,
  Shield,
  Copy,
  Download
} from 'lucide-react';

interface JsonDataImporterProps {
  onImportSuccess: (count: number) => void;
}

const JsonDataImporter = ({ onImportSuccess }: JsonDataImporterProps) => {
  const [jsonData, setJsonData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    duplicates: number;
    errors: number;
    details: string[];
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  // Sample JSON template for user reference
  const sampleJsonTemplate = `[
  {
    "platform_name": "Gmail",
    "platform_description": "Google's email service for sending and receiving emails",
    "credential_fields": [
      {
        "field": "client_id",
        "type": "string",
        "required": true,
        "description": "OAuth 2.0 Client ID from Google Console"
      },
      {
        "field": "client_secret",
        "type": "string",
        "required": true,
        "description": "OAuth 2.0 Client Secret from Google Console"
      }
    ],
    "use_cases": ["email automation", "notification sending", "email parsing"]
  }
]`;

  const validateJsonStructure = (data: any[]): string[] => {
    const errors: string[] = [];
    
    if (!Array.isArray(data)) {
      errors.push('Data must be an array of platform objects');
      return errors;
    }

    data.forEach((item, index) => {
      if (!item.platform_name) {
        errors.push(`Item ${index + 1}: Missing required field 'platform_name'`);
      }
      
      if (item.credential_fields && !Array.isArray(item.credential_fields)) {
        errors.push(`Item ${index + 1}: 'credential_fields' must be an array`);
      }
      
      if (item.credential_fields) {
        item.credential_fields.forEach((field: any, fieldIndex: number) => {
          if (!field.field) {
            errors.push(`Item ${index + 1}, Credential ${fieldIndex + 1}: Missing 'field' name`);
          }
        });
      }
    });

    return errors;
  };

  const checkForDuplicates = async (platformData: any[]): Promise<string[]> => {
    const existingPlatforms = new Set();
    
    // Get existing platform names from database
    const { data: existing, error } = await supabase
      .from('universal_knowledge_store')
      .select('platform_name')
      .eq('category', 'platform_knowledge')
      .not('platform_name', 'is', null);

    if (error) {
      console.error('Error checking duplicates:', error);
      return [];
    }

    if (existing) {
      existing.forEach(item => {
        if (item.platform_name) {
          existingPlatforms.add(item.platform_name.toLowerCase());
        }
      });
    }

    return platformData
      .filter(item => existingPlatforms.has(item.platform_name.toLowerCase()))
      .map(item => item.platform_name);
  };

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste JSON data to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setValidationErrors([]);
    setImportResults(null);

    try {
      console.log('🔄 Starting JSON import process...');
      
      // Parse JSON
      let parsedData;
      try {
        parsedData = JSON.parse(jsonData);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please check your JSON syntax.');
      }

      // Validate structure
      const structureErrors = validateJsonStructure(parsedData);
      if (structureErrors.length > 0) {
        setValidationErrors(structureErrors);
        return;
      }

      console.log(`📊 Parsed ${parsedData.length} platform entries`);

      // Check for duplicates
      const duplicatePlatforms = await checkForDuplicates(parsedData);
      console.log(`🔍 Found ${duplicatePlatforms.length} potential duplicates`);

      // Filter out duplicates for import
      const newPlatforms = parsedData.filter(item => 
        !duplicatePlatforms.includes(item.platform_name)
      );

      console.log(`✅ Will import ${newPlatforms.length} new platforms`);

      // Prepare data for database insertion
      const knowledgeEntries = newPlatforms.map(platform => ({
        category: 'platform_knowledge',
        title: `${platform.platform_name} Integration`,
        summary: platform.platform_description || `${platform.platform_name} platform integration for automation`,
        platform_name: platform.platform_name,
        credential_fields: platform.credential_fields || [],
        platform_description: platform.platform_description || `${platform.platform_name} platform integration`,
        use_cases: platform.use_cases || ['automation', 'integration'],
        details: {
          credential_count: platform.credential_fields?.length || 0,
          integration_type: 'API',
          imported_via: 'json_import',
          imported_at: new Date().toISOString(),
          original_data: platform
        },
        tags: [
          platform.platform_name.toLowerCase().replace(/\s+/g, '-'), 
          'platform', 
          'integration',
          'json-imported'
        ],
        priority: 4,
        source_type: 'json_import'
      }));

      // Batch insert to database
      let successCount = 0;
      let errorCount = 0;
      const errorDetails: string[] = [];

      if (knowledgeEntries.length > 0) {
        console.log(`📤 Inserting ${knowledgeEntries.length} entries into database...`);
        
        const { data, error } = await supabase
          .from('universal_knowledge_store')
          .insert(knowledgeEntries)
          .select('id, title');

        if (error) {
          console.error('❌ Database insertion error:', error);
          errorCount = knowledgeEntries.length;
          errorDetails.push(`Database error: ${error.message}`);
        } else {
          successCount = data?.length || knowledgeEntries.length;
          console.log(`✅ Successfully inserted ${successCount} entries`);
        }
      }

      // Set detailed results
      const results = {
        success: successCount,
        duplicates: duplicatePlatforms.length,
        errors: errorCount,
        details: [
          `${successCount} platforms imported successfully`,
          `${duplicatePlatforms.length} duplicates skipped`,
          ...errorDetails
        ]
      };

      setImportResults(results);

      // Show success notification
      if (successCount > 0) {
        toast({
          title: "Import Successful!",
          description: `Successfully imported ${successCount} platforms to your knowledge base`,
        });
        
        // Trigger parent component refresh
        onImportSuccess(successCount);
      }

      // Clear the input on successful import
      if (successCount > 0 && errorCount === 0) {
        setJsonData('');
      }

    } catch (error: any) {
      console.error('💥 Import error:', error);
      setValidationErrors([error.message || 'An unexpected error occurred during import']);
      toast({
        title: "Import Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(sampleJsonTemplate);
    toast({
      title: "Template Copied",
      description: "Sample JSON template copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                JSON Platform Importer
              </h2>
              <p className="text-gray-600 font-normal">
                Import platform credentials in bulk using JSON format
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Import Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - JSON Input */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                JSON Data Input
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyTemplate}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Template
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder="Paste your JSON array of platform objects here..."
              className="min-h-80 font-mono text-sm"
              disabled={isImporting}
            />
            
            <Button 
              onClick={handleImport}
              disabled={isImporting || !jsonData.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Platform Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right Column - Template & Results */}
        <div className="space-y-6">
          {/* Template Example */}
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                JSON Template Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto border">
                <code>{sampleJsonTemplate}</code>
              </pre>
            </CardContent>
          </Card>

          {/* Import Results */}
          {importResults && (
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                    <div className="text-sm text-green-700">Imported</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{importResults.duplicates}</div>
                    <div className="text-sm text-yellow-700">Duplicates</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{importResults.errors}</div>
                    <div className="text-sm text-red-700">Errors</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {importResults.details.map((detail, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {detail}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-semibold mb-2">Validation Errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card className="rounded-2xl shadow-lg border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Import Guidelines</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• JSON must be an array of platform objects</li>
                <li>• Each platform must have a unique "platform_name"</li>
                <li>• Credential fields should specify type and requirements</li>
                <li>• Duplicates will be automatically skipped</li>
                <li>• All imported data will be tagged as "json-imported"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JsonDataImporter;
