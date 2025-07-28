
import { SecureCredentials } from './secureCredentials';

// Backwards compatibility wrapper
export class SecureCredentialManager {
  static async storeCredentials(
    userId: string,
    platformName: string,
    credentials: Record<string, string>,
    automationId: string = 'temp-automation-id'
  ): Promise<boolean> {
    return SecureCredentials.saveCredentials(platformName, credentials, userId, automationId);
  }

  static async getCredentials(
    userId: string,
    platformName: string,
    automationId: string = 'temp-automation-id'
  ): Promise<Record<string, string> | null> {
    return SecureCredentials.getCredentials(platformName, userId, automationId);
  }
}
