
/**
 * Platform Persistence Manager - Handles saving and loading platform data across page refreshes
 * This solves the "Unknown Platform" issue by persisting ChatAI platform data
 */

interface PlatformData {
  name: string;
  credentials: any[];
  testConfig?: any;
  test_payloads?: any[];
  chatai_data?: any;
  timestamp: number;
  automationId: string;
}

const STORAGE_PREFIX = 'yusrai_platform_';
const STORAGE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export class PlatformPersistenceManager {
  /**
   * Save platform data to localStorage
   */
  static savePlatformData(automationId: string, platformName: string, platformData: any) {
    try {
      const storageKey = `${STORAGE_PREFIX}${automationId}_${platformName}`;
      const dataToStore: PlatformData = {
        name: platformName,
        credentials: platformData.credentials || [],
        testConfig: platformData.testConfig,
        test_payloads: platformData.test_payloads,
        chatai_data: platformData.chatai_data,
        timestamp: Date.now(),
        automationId
      };

      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      console.log(`✅ Platform data saved for ${platformName}:`, dataToStore);
    } catch (error) {
      console.error('Failed to save platform data:', error);
    }
  }

  /**
   * Load platform data from localStorage
   */
  static loadPlatformData(automationId: string, platformName: string): any | null {
    try {
      const storageKey = `${STORAGE_PREFIX}${automationId}_${platformName}`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) {
        console.log(`No stored data found for ${platformName}`);
        return null;
      }

      const parsed: PlatformData = JSON.parse(stored);
      
      // Check if data has expired
      if (Date.now() - parsed.timestamp > STORAGE_EXPIRY) {
        console.log(`Stored data for ${platformName} has expired, removing`);
        localStorage.removeItem(storageKey);
        return null;
      }

      console.log(`✅ Platform data loaded for ${platformName}:`, parsed);
      return {
        name: parsed.name,
        credentials: parsed.credentials,
        testConfig: parsed.testConfig,
        test_payloads: parsed.test_payloads,
        chatai_data: parsed.chatai_data
      };
    } catch (error) {
      console.error('Failed to load platform data:', error);
      return null;
    }
  }

  /**
   * Save all platforms data for an automation
   */
  static saveAllPlatformsData(automationId: string, platforms: any[]) {
    platforms.forEach(platform => {
      if (platform.name) {
        this.savePlatformData(automationId, platform.name, platform);
      }
    });
  }

  /**
   * Load all platforms data for an automation
   */
  static loadAllPlatformsData(automationId: string): any[] {
    const platforms: any[] = [];
    
    // Get all keys that match our pattern
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_PREFIX}${automationId}_`)) {
        const platformName = key.replace(`${STORAGE_PREFIX}${automationId}_`, '');
        const platformData = this.loadPlatformData(automationId, platformName);
        if (platformData) {
          platforms.push(platformData);
        }
      }
    }

    console.log(`✅ Loaded ${platforms.length} platforms for automation ${automationId}`);
    return platforms;
  }

  /**
   * Clear expired data
   */
  static clearExpiredData() {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed: PlatformData = JSON.parse(stored);
            if (Date.now() - parsed.timestamp > STORAGE_EXPIRY) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // Invalid data, remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared ${keysToRemove.length} expired platform data entries`);
  }

  /**
   * Clear all data for an automation
   */
  static clearAutomationData(automationId: string) {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_PREFIX}${automationId}_`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared platform data for automation ${automationId}`);
  }
}

// Auto-cleanup expired data on module load
PlatformPersistenceManager.clearExpiredData();
