
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Platform } from '@/types/platform';
import { TestConfigGenerator } from '@/utils/testConfigGenerator';
import { extractTestScript, injectCredentials } from '@/utils/platformTestScriptExtractor';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface ChatAICredentialFormProps {
  platform: Platform | null;
  onCredentialsSubmit: (credentials: Record<string, string>) => void;
  automationId?: string;
  onCredentialSaved?: (platformName: string) => void;
  onCredentialTested?: (platformName: string) => void;
  onClose?: () => void;
  isGeneratingToken?: boolean;
  isSubmitting?: boolean;
}

const credentialSchema = z.object({
  // Dynamically populated based on platform.credentials
});

type CredentialSchemaType = z.infer<typeof credentialSchema>;

const ChatAICredentialForm = ({ 
  platform, 
  onCredentialsSubmit, 
  automationId,
  onCredentialSaved,
  onCredentialTested,
  onClose,
  isGeneratingToken = false,
  isSubmitting = false
}: ChatAICredentialFormProps) => {
  const [testPayload, setTestPayload] = useState<string>("");
  const [isGeneratingPayload, setIsGeneratingPayload] = useState<boolean>(false);

  const form = useForm<Record<string, string>>({
    resolver: platform ? zodResolver(credentialSchema.extend(
      platform.credentials.reduce((acc, credential) => {
        acc[credential.field] = z.string().optional();
        return acc;
      }, {} as Record<string, z.ZodString>)
    )) : zodResolver(credentialSchema),
    defaultValues: {},
    mode: "onChange"
  });

  const { watch } = form;

  const onSubmit = (values: Record<string, string>) => {
    // Filter out undefined values and ensure all are strings
    const cleanValues = Object.entries(values)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>);
      
    onCredentialsSubmit(cleanValues);
    
    if (onCredentialSaved && platform) {
      onCredentialSaved(platform.name);
    }
  };

  const generateTestPayload = useCallback(async () => {
    if (!platform || !watch) return;

    try {
      setIsGeneratingPayload(true);
      const formData = watch();
      
      // Filter out empty credentials with proper type handling
      const validCredentials = Object.entries(formData)
        .filter(([_, value]) => {
          const stringValue = String(value || '');
          return stringValue && stringValue.trim() !== '';
        })
        .reduce((acc, [key, value]) => {
          acc[key] = String(value || '');
          return acc;
        }, {} as Record<string, string>);

      if (Object.keys(validCredentials).length === 0) {
        setTestPayload("No credentials provided for testing");
        return;
      }

      // Generate test configuration using TestConfigGenerator
      console.log('🔧 Generating test config for:', platform.name);
      const testConfig = await TestConfigGenerator.generateTestConfig(platform.name);
      console.log('📋 Generated test config:', testConfig);

      // Create platform object for extractTestScript
      const platformObj: Platform = {
        name: platform.name,
        testConfig: testConfig,
        credentials: platform.credentials
      };

      // Extract test script with UNIVERSAL authentication
      const script = await extractTestScript(platformObj, validCredentials);
      console.log('📜 Generated test script:', script);

      // Inject actual credentials for display
      const finalScript = injectCredentials(script, validCredentials);
      setTestPayload(finalScript);

      if (onCredentialTested && platform) {
        onCredentialTested(platform.name);
      }

    } catch (error) {
      console.error('❌ Error generating test payload:', error);
      setTestPayload(`Error generating test payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingPayload(false);
    }
  }, [platform, watch, onCredentialTested]);

  if (!platform) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Enter Credentials</CardTitle>
        <CardDescription>
          Provide the necessary credentials to connect to {platform.name}.
        </CardDescription>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2"
            onClick={onClose}
          >
            ✕
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {platform.credentials.map((credential) => (
              <FormField
                key={credential.field}
                control={form.control}
                name={credential.field}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{credential.field}</FormLabel>
                    <FormControl>
                      <Input placeholder={credential.placeholder} type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Verify Credentials"}
            </Button>
          </form>
        </Form>

        <Button
          variant="secondary"
          onClick={generateTestPayload}
          disabled={isGeneratingPayload}
        >
          {isGeneratingPayload ? "Generating Payload..." : "Generate Test Payload"}
        </Button>

        {testPayload && (
          <Accordion type="single" collapsible>
            <AccordionItem value="test-payload">
              <AccordionTrigger>View Test Payload</AccordionTrigger>
              <AccordionContent>
                <Textarea
                  className="mt-2"
                  value={testPayload}
                  readOnly
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      <CardFooter>
        {isGeneratingToken && <Badge variant="outline">Generating Token...</Badge>}
      </CardFooter>
    </Card>
  );
};

export default ChatAICredentialForm;
