
import React from 'react';
import EnhancedCredentialForm from './EnhancedCredentialForm';

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
  return <EnhancedCredentialForm {...props} />;
};

export default AutomationPlatformCredentialForm;
