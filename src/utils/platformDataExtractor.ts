
/**
 * Platform Data Extractor - Processes automation blueprints to extract platform credential requirements
 */

export interface PlatformCredential {
  field: string;
  placeholder: string;
  link: string;
  why_needed: string;
}

export interface ExtractedPlatform {
  name: string;
  credentials: PlatformCredential[];
}

/**
 * Extract platform credentials from automation blueprint
 * This fixes the missing function that was causing ChatCard crashes
 */
export function extractPlatformCredentials(automationBlueprint: any): ExtractedPlatform[] {
  console.log('🔍 Extracting platform credentials from blueprint:', automationBlueprint);
  
  if (!automationBlueprint || !automationBlueprint.steps) {
    console.warn('⚠️ Invalid automation blueprint structure');
    return [];
  }

  const platforms: ExtractedPlatform[] = [];
  const seenPlatforms = new Set<string>();

  // Extract platforms from blueprint steps
  automationBlueprint.steps.forEach((step: any, index: number) => {
    if (step.originalWorkflowData?.platform) {
      const platformData = step.originalWorkflowData.platform;
      const platformName = platformData.name || `Platform_${index}`;

      if (!seenPlatforms.has(platformName)) {
        seenPlatforms.add(platformName);
        
        platforms.push({
          name: platformName,
          credentials: platformData.credentials || [
            {
              field: "api_key",
              placeholder: `Enter ${platformName} API key`,
              link: `https://${platformName.toLowerCase()}.com/developers`,
              why_needed: `Required for ${platformName} API authentication`
            }
          ]
        });
      }
    }
  });

  console.log(`✅ Extracted ${platforms.length} platforms:`, platforms.map(p => p.name));
  return platforms;
}

/**
 * Extract platform names from automation blueprint
 */
export function extractPlatformNames(automationBlueprint: any): string[] {
  const platforms = extractPlatformCredentials(automationBlueprint);
  return platforms.map(p => p.name);
}

/**
 * Get credential requirements for a specific platform
 */
export function getPlatformCredentials(automationBlueprint: any, platformName: string): PlatformCredential[] {
  const platforms = extractPlatformCredentials(automationBlueprint);
  const platform = platforms.find(p => p.name.toLowerCase() === platformName.toLowerCase());
  return platform?.credentials || [];
}

console.log('✅ Platform Data Extractor loaded with missing extractPlatformCredentials function');
