
import React from 'react';
import ModernCredentialForm from './ModernCredentialForm';

interface PlatformCredentialFormProps {
  automationId: string;
  platform: {
    name: string;
    credentials: Array<{
      field: string;
      placeholder: string;
      link: string;
      why_needed: string;
    }>;
  };
  onCredentialSaved?: () => void;
}

const AutomationPlatformCredentialForm = (props: PlatformCredentialFormProps) => {
  return <ModernCredentialForm {...props} isOpen={true} />;
};

export default AutomationPlatformCredentialForm;
