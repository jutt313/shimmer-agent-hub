
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
  availablePermissions: Permission[];
}

const PermissionsDropdown = ({ permissions, onPermissionChange, availablePermissions }: PermissionsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

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
            className="w-full justify-between rounded-xl"
          >
            {selectedCount > 0 ? (
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
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
        <PopoverContent className="w-80 p-0 rounded-xl" align="start">
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {availablePermissions.map((permission) => (
              <div key={permission.key} className="flex items-start space-x-3">
                <Checkbox
                  id={permission.key}
                  checked={permissions[permission.key] || false}
                  onCheckedChange={(checked) => onPermissionChange(permission.key, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label 
                    htmlFor={permission.key} 
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {permission.label}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {availablePermissions
            .filter(p => permissions[p.key])
            .map(p => (
              <Badge key={p.key} variant="outline" className="text-xs rounded-full">
                {p.label}
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
};

export default PermissionsDropdown;
