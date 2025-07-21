
/**
 * PHASE 1: Flag Propagation Logger
 * Comprehensive logging system to track yusrai_powered and seven_sections_validated flags
 */

export interface FlagState {
  yusrai_powered: boolean;
  seven_sections_validated: boolean;
  timestamp: string;
  location: string;
  hasStructuredData: boolean;
  structuredDataSections?: string[];
}

export class FlagPropagationLogger {
  private static logs: FlagState[] = [];

  static logFlagState(
    yusrai_powered: boolean,
    seven_sections_validated: boolean,
    location: string,
    hasStructuredData: boolean = false,
    structuredDataSections?: string[]
  ) {
    const flagState: FlagState = {
      yusrai_powered,
      seven_sections_validated,
      timestamp: new Date().toISOString(),
      location,
      hasStructuredData,
      structuredDataSections
    };

    this.logs.push(flagState);
    
    console.log(`🚩 FLAG TRACKING [${location}]:`, {
      yusrai_powered,
      seven_sections_validated,
      hasStructuredData,
      structuredDataSections: structuredDataSections?.length || 0
    });
  }

  static getFullFlagHistory() {
    return this.logs;
  }

  static getLatestFlagState() {
    return this.logs[this.logs.length - 1];
  }

  static clearLogs() {
    this.logs = [];
  }
}
