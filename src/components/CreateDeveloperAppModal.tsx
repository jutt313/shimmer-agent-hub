
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";

interface CreateDeveloperAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appData: any) => Promise<any>;
}

const CreateDeveloperAppModal = ({ isOpen, onClose, onSuccess }: CreateDeveloperAppModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    app_name: '',
    app_description: '',
    homepage_url: '',
    privacy_policy_url: '',
    terms_of_service_url: '',
    redirect_uris: [''],
    webhook_url: '',
    use_cases: [] as string[],
    supported_events: {
      user_auth: false,
      automations: false,
      webhooks: false,
      notifications: false
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanedData = {
        ...formData,
        redirect_uris: formData.redirect_uris.filter(uri => uri.trim()),
        use_cases: formData.use_cases.filter(uc => uc.trim())
      };
      
      await onSuccess(cleanedData);
      onClose();
      setFormData({
        app_name: '',
        app_description: '',
        homepage_url: '',
        privacy_policy_url: '',
        terms_of_service_url: '',
        redirect_uris: [''],
        webhook_url: '',
        use_cases: [],
        supported_events: {
          user_auth: false,
          automations: false,
          webhooks: false,
          notifications: false
        }
      });
    } catch (error) {
      console.error('Error creating app:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRedirectUri = () => {
    setFormData(prev => ({
      ...prev,
      redirect_uris: [...prev.redirect_uris, '']
    }));
  };

  const removeRedirectUri = (index: number) => {
    setFormData(prev => ({
      ...prev,
      redirect_uris: prev.redirect_uris.filter((_, i) => i !== index)
    }));
  };

  const updateRedirectUri = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      redirect_uris: prev.redirect_uris.map((uri, i) => i === index ? value : uri)
    }));
  };

  const addUseCase = () => {
    setFormData(prev => ({
      ...prev,
      use_cases: [...prev.use_cases, '']
    }));
  };

  const removeUseCase = (index: number) => {
    setFormData(prev => ({
      ...prev,
      use_cases: prev.use_cases.filter((_, i) => i !== index)
    }));
  };

  const updateUseCase = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      use_cases: prev.use_cases.map((uc, i) => i === index ? value : uc)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Developer Application</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="app_name">Application Name *</Label>
              <Input
                id="app_name"
                value={formData.app_name}
                onChange={(e) => setFormData(prev => ({ ...prev, app_name: e.target.value }))}
                placeholder="My YusrAI Integration"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app_description">Description</Label>
              <Textarea
                id="app_description"
                value={formData.app_description}
                onChange={(e) => setFormData(prev => ({ ...prev, app_description: e.target.value }))}
                placeholder="Describe what your application does..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homepage_url">Homepage URL</Label>
              <Input
                id="homepage_url"
                type="url"
                value={formData.homepage_url}
                onChange={(e) => setFormData(prev => ({ ...prev, homepage_url: e.target.value }))}
                placeholder="https://yourapp.com"
              />
            </div>
          </div>

          <Separator />

          {/* OAuth Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold">OAuth Configuration</h3>
            
            <div className="space-y-2">
              <Label>Redirect URIs *</Label>
              <p className="text-sm text-gray-600 mb-2">
                Where users will be redirected after authorization
              </p>
              {formData.redirect_uris.map((uri, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={uri}
                    onChange={(e) => updateRedirectUri(index, e.target.value)}
                    placeholder="https://yourapp.com/callback"
                    required={index === 0}
                  />
                  {formData.redirect_uris.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRedirectUri(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRedirectUri}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Redirect URI
              </Button>
            </div>
          </div>

          <Separator />

          {/* Webhooks */}
          <div className="space-y-4">
            <h3 className="font-semibold">Webhooks (Optional)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <Input
                id="webhook_url"
                type="url"
                value={formData.webhook_url}
                onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                placeholder="https://yourapp.com/webhooks/yusrai"
              />
              <p className="text-sm text-gray-600">
                Receive real-time notifications about user events
              </p>
            </div>
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="font-semibold">Permissions</h3>
            <p className="text-sm text-gray-600">
              What parts of YusrAI will your app access?
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="user_auth"
                  checked={formData.supported_events.user_auth}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      supported_events: { ...prev.supported_events, user_auth: !!checked }
                    }))
                  }
                />
                <Label htmlFor="user_auth" className="text-sm">
                  User Authentication
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="automations"
                  checked={formData.supported_events.automations}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      supported_events: { ...prev.supported_events, automations: !!checked }
                    }))
                  }
                />
                <Label htmlFor="automations" className="text-sm">
                  Automations
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="webhooks"
                  checked={formData.supported_events.webhooks}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      supported_events: { ...prev.supported_events, webhooks: !!checked }
                    }))
                  }
                />
                <Label htmlFor="webhooks" className="text-sm">
                  Webhook Events
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifications"
                  checked={formData.supported_events.notifications}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      supported_events: { ...prev.supported_events, notifications: !!checked }
                    }))
                  }
                />
                <Label htmlFor="notifications" className="text-sm">
                  Notifications
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Legal URLs */}
          <div className="space-y-4">
            <h3 className="font-semibold">Legal & Compliance</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
                <Input
                  id="privacy_policy_url"
                  type="url"
                  value={formData.privacy_policy_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, privacy_policy_url: e.target.value }))}
                  placeholder="https://yourapp.com/privacy"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="terms_of_service_url">Terms of Service URL</Label>
                <Input
                  id="terms_of_service_url"
                  type="url"
                  value={formData.terms_of_service_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms_of_service_url: e.target.value }))}
                  placeholder="https://yourapp.com/terms"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDeveloperAppModal;
