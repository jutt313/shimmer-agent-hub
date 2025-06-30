
import { useState } from 'react';
import { testApiCall, convertToJson } from '@/services/personalApiService';
import { TestApiResult } from '@/types/personalApi';

interface TestForm {
  naturalLanguage: string;
  jsonPayload: string;
  method: string;
  endpoint: string;
  selectedToken: string;
}

export const useApiTesting = () => {
  const [testForm, setTestForm] = useState<TestForm>({
    naturalLanguage: '',
    jsonPayload: '',
    method: 'POST',
    endpoint: '/automations',
    selectedToken: ''
  });
  const [testResult, setTestResult] = useState<TestApiResult | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const handleNaturalLanguageChange = (value: string) => {
    setTestForm(prev => ({
      ...prev,
      naturalLanguage: value,
      jsonPayload: convertToJson(value)
    }));
  };

  const executeApiTest = async () => {
    setTestLoading(true);
    try {
      let payload = undefined;
      if (testForm.method !== 'GET' && testForm.jsonPayload) {
        payload = JSON.parse(testForm.jsonPayload);
      }

      const result = await testApiCall(
        testForm.endpoint,
        testForm.method,
        payload,
        testForm.selectedToken
      );
      
      setTestResult(result);
    } catch (error) {
      setTestResult({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setTestLoading(false);
    }
  };

  return {
    testForm,
    setTestForm,
    testResult,
    testLoading,
    handleNaturalLanguageChange,
    executeApiTest
  };
};
