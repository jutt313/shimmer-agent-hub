
import { useState } from 'react';
import { Zap, Key, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const AIAgentSettingsTab = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    defaultProvider: 'openai',
    defaultModel: 'gpt-4',
    memoryRetention: '30',
    enableMemoryPersistence: true,
    defaultTemperature: '0.7',
    maxTokens: '2000',
  });

  const [apiKeys, setApiKeys] = useState([
    { id: '1', provider: 'OpenAI', key: 'sk-...', isActive: true },
    { id: '2', provider: 'Anthropic', key: 'sk-...', isActive: false },
  ]);

  const handleSaveSettings = () => {
    toast({
      title: "Success",
      description: "AI Agent settings saved successfully",
    });
  };

  const handleDeleteApiKey = (keyId: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== keyId));
    toast({
      title: "Success",
      description: "API key deleted successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Default AI Settings
          </CardTitle>
          <CardDescription>
            Configure default settings for new AI agents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultProvider">Default LLM Provider</Label>
              <Select
                value={settings.defaultProvider}
                onValueChange={(value) => setSettings(prev => ({ ...prev, defaultProvider: value }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="google">Google (Gemini)</SelectItem>
                  <SelectItem value="local">Local Model</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="defaultModel">Default Model</Label>
              <Select
                value={settings.defaultModel}
                onValueChange={(value) => setSettings(prev => ({ ...prev, defaultModel: value }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="defaultTemperature">Temperature</Label>
              <Input
                id="defaultTemperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.defaultTemperature}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultTemperature: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                value={settings.maxTokens}
                onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="memoryRetention">Memory Retention (days)</Label>
              <Input
                id="memoryRetention"
                type="number"
                value={settings.memoryRetention}
                onChange={(e) => setSettings(prev => ({ ...prev, memoryRetention: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enableMemoryPersistence"
              checked={settings.enableMemoryPersistence}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableMemoryPersistence: checked }))}
            />
            <Label htmlFor="enableMemoryPersistence">Enable agent memory persistence across sessions</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-green-600" />
            API Key Management
          </CardTitle>
          <CardDescription>
            Manage API keys for different LLM providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{apiKey.provider}</h4>
                  <p className="text-sm text-gray-600 font-mono">{apiKey.key}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                    apiKey.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {apiKey.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteApiKey(apiKey.id)}
                  className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          
          <Button
            variant="outline"
            className="w-full mt-4 rounded-xl"
            onClick={() => {
              toast({
                title: "Add API Key",
                description: "API key management feature coming soon",
              });
            }}
          >
            <Key className="w-4 h-4 mr-2" />
            Add New API Key
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default AIAgentSettingsTab;
