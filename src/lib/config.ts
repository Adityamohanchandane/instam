// Secure Configuration Manager
// Handles all sensitive configuration securely

import { SecurityService } from './security';

export interface SecureConfig {
  mongodbUri: string;
  encryptionKey: string;
  jwtSecret: string;
  apiKeys: {
    deezer?: string;
    youtube?: string;
    spotify?: string;
  };
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: SecureConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // Initialize secure configuration
  async initialize(): Promise<void> {
    try {
      // Load from environment variables (server-side)
      if (typeof window === 'undefined') {
        this.config = {
          mongodbUri: process.env.VITE_MONGODB_URI || '',
          encryptionKey: process.env.VITE_ENCRYPTION_KEY || '',
          jwtSecret: process.env.VITE_JWT_SECRET || '',
          apiKeys: {}
        };
      } else {
        // Load from secure storage (client-side)
        this.config = this.loadFromSecureStorage();
      }

      // Validate configuration
      this.validateConfig();
      
      console.log('✅ Secure configuration initialized');
    } catch (error) {
      console.error('❌ Failed to initialize secure configuration:', error);
      throw error;
    }
  }

  // Get configuration value
  get<T extends keyof SecureConfig>(key: T): SecureConfig[T] {
    if (!this.config) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    return this.config[key];
  }

  // Set configuration value securely
  set<T extends keyof SecureConfig>(key: T, value: SecureConfig[T]): void {
    if (!this.config) {
      this.config = {} as SecureConfig;
    }
    this.config[key] = value;
    this.saveToSecureStorage();
  }

  // Load from secure storage
  private loadFromSecureStorage(): SecureConfig {
    try {
      const encrypted = localStorage.getItem('secure_config');
      if (!encrypted) {
        return this.getDefaultConfig();
      }

      const decrypted = SecurityService.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('❌ Failed to load secure configuration:', error);
      return this.getDefaultConfig();
    }
  }

  // Save to secure storage
  private saveToSecureStorage(): void {
    if (!this.config || typeof window === 'undefined') return;

    try {
      const configString = JSON.stringify(this.config);
      const encrypted = SecurityService.encrypt(configString);
      localStorage.setItem('secure_config', encrypted);
    } catch (error) {
      console.error('❌ Failed to save secure configuration:', error);
    }
  }

  // Get default configuration
  private getDefaultConfig(): SecureConfig {
    return {
      mongodbUri: '',
      encryptionKey: 'default-key-change-in-production',
      jwtSecret: 'default-jwt-change-in-production',
      apiKeys: {}
    };
  }

  // Validate configuration
  private validateConfig(): void {
    if (!this.config) return;

    const requiredFields: (keyof SecureConfig)[] = ['mongodbUri', 'encryptionKey', 'jwtSecret'];
    
    for (const field of requiredFields) {
      if (!this.config[field]) {
        console.warn(`⚠️ Warning: ${field} is not configured`);
      }
    }

    // Check for default values in production
    if (window.location.hostname !== 'localhost') {
      if (this.config.encryptionKey === 'default-key-change-in-production') {
        throw new Error('Default encryption key detected in production. Please set VITE_ENCRYPTION_KEY.');
      }
      
      if (this.config.jwtSecret === 'default-jwt-change-in-production') {
        throw new Error('Default JWT secret detected in production. Please set VITE_JWT_SECRET.');
      }
    }
  }

  // Reset configuration (development only)
  reset(): void {
    if (window.location.hostname !== 'localhost') {
      throw new Error('Configuration reset is only allowed in development environment.');
    }

    this.config = this.getDefaultConfig();
    localStorage.removeItem('secure_config');
    SecurityService.clearSensitiveData();
    console.log('🔄 Configuration reset to defaults');
  }

  // Export configuration (development only)
  export(): string {
    if (window.location.hostname !== 'localhost') {
      throw new Error('Configuration export is only allowed in development environment.');
    }

    if (!this.config) {
      throw new Error('No configuration to export');
    }

    return JSON.stringify(this.config, null, 2);
  }

  // Import configuration (development only)
  import(configJson: string): void {
    if (window.location.hostname !== 'localhost') {
      throw new Error('Configuration import is only allowed in development environment.');
    }

    try {
      const imported = JSON.parse(configJson);
      this.config = { ...this.getDefaultConfig(), ...imported };
      this.saveToSecureStorage();
      console.log('✅ Configuration imported successfully');
    } catch (error) {
      console.error('❌ Failed to import configuration:', error);
      throw new Error('Invalid configuration format');
    }
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance();
