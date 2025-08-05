
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface PlatformCredentialFormProps {
  onClose: () => void;
  onSubmit: (data: { 
    credential_name: string; 
    platform_name: string; 
    credentials: Record<string, string>;
    credential_type: string;
  }) => void;
}

const platforms = [
  "Gmail", "Slack", "Discord", "Twitter", "Facebook", "Instagram", 
  "LinkedIn", "GitHub", "Google Drive", "Dropbox", "Notion", "Trello"
];

const PlatformCredentialForm = ({ onClose, onSubmit }: PlatformCredentialFormProps) => {
  const [credentialName, setCredentialName] = useState("");
  const [platformName, setPlatformName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [credentialType, setCredentialType] = useState("api_key");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentialName.trim() && platformName && apiKey.trim()) {
      onSubmit({
        credential_name: credentialName.trim(),
        platform_name: platformName,
        credentials: { api_key: apiKey.trim() },
        credential_type: credentialType
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Add Platform Credential</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="credentialName">Credential Name</Label>
              <Input
                id="credentialName"
                value={credentialName}
                onChange={(e) => setCredentialName(e.target.value)}
                placeholder="My Gmail Credential"
                required
              />
            </div>
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={platformName} onValueChange={setPlatformName} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">Add Credential</Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformCredentialForm;
