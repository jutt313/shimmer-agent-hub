
import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Permission {
  key: string;
  label: string;
  description: string;
}

interface PermissionsDropdownProps {
  permissions: any;
  onPermissionChange: (key: string, checked: boolean) => void;
  credentialType: 'personal' | 'project' | 'service';
}

const PermissionsDropdown = ({ permissions, onPermissionChange, credentialType }: PermissionsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getAvailablePermissions = (): Permission[] => {
    const basePermissions: Permission[] = [
      { key: 'read', label: 'Read Access', description: 'View automations, agents, and data' },
      { key: 'write', label: 'Write Access', description: 'Create and modify resources' },
      { key: 'automations', label: 'Automations', description: 'Create, run, and manage automations' },
      { key: 'webhooks', label: 'Webhooks', description: 'Create and manage webhook endpoints' },
      { key: 'ai_agents', label: 'AI Agents', description: 'Create and interact with AI agents' },
      { key: 'dashboard', label: 'Dashboard', description: 'Access dashboard and analytics' },
      { key: 'chat_ai', label: 'Chat AI', description: 'Use AI chat functionality' },
      { key: 'notifications', label: 'Notifications', description: 'Receive and manage notifications' },
      { key: 'credentials', label: 'Credentials', description: 'Manage platform credentials' },
      { key: 'diagrams', label: 'Diagrams', description: 'View and edit automation diagrams' }
    ];

    // Filter permissions based on credential type
    if (credentialType === 'personal') {
      return basePermissions; // Personal gets all permissions
    } else if (credentialType === 'project') {
      return basePermissions.filter(p => 
        ['read', 'write', 'automations', 'ai_agents', 'dashboard', 'diagrams'].includes(p.key)
      );
    } else { // service
      return basePermissions.filter(p => 
        ['read', 'write', 'automations', 'webhooks'].includes(p.key)
      );
    }
  };

  const availablePermissions = getAvailablePermissions();
  const selectedCount = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Permissions
      </label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between rounded-xl bg-white border-gray-300 hover:border-blue-400"
          >
            {selectedCount > 0 ? (
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full bg-blue-100 text-blue-700">
                  {selectedCount} selected
                </Badge>
                {selectedCount === 1 && availablePermissions.find(p => permissions[p.key])?.label}
              </span>
            ) : (
              "Select permissions..."
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-96 p-0 rounded-xl bg-white border shadow-lg z-50" 
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}>
            {availablePermissions.map((permission) => (
              <div key={permission.key} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  id={permission.key}
                  checked={permissions[permission.key] || false}
                  onCheckedChange={(checked) => onPermissionChange(permission.key, checked as boolean)}
                  className="mt-1 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <label 
                    htmlFor={permission.key} 
                    className="text-sm font-medium text-gray-700 cursor-pointer block"
                  >
                    {permission.label}
                  </label>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{permission.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-3 bg-gray-50 rounded-b-xl">
            <p className="text-xs text-gray-600 text-center">
              {selectedCount} of {availablePermissions.length} permissions selected
            </p>
          </div>
        </PopoverContent>
      </Popover>
      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {availablePermissions
            .filter(p => permissions[p.key])
            .map(p => (
              <Badge key={p.key} variant="outline" className="text-xs rounded-full border-blue-200 text-blue-700 bg-blue-50">
                {p.label}
              </Badge>
            ))}
        </div>
      )}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background-color: #f3f4f6;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 0.375rem;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default PermissionsDropdown;
