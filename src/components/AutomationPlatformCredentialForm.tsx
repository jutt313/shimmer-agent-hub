
import React from 'react';
import SimpleCredentialForm from './SimpleCredentialForm';

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
  return <SimpleCredentialForm {...props} />;
};

export default AutomationPlatformCredentialForm;
