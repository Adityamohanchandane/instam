// Security and Encryption Service for Instam
// Protects sensitive data and passwords

import CryptoJS from 'crypto-js';

export class SecurityService {
  private static readonly ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production';
  
  // Encrypt sensitive data
  static encrypt(text: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, this.ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      return text; // Fallback to plain text (development only)
    }
  }

  // Decrypt sensitive data
  static decrypt(encryptedText: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, this.ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      return encryptedText; // Fallback to plain text (development only)
    }
  }

  // Hash passwords for storage
  static hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  // Verify password against hash
  static verifyPassword(password: string, hash: string): boolean {
    const hashedPassword = this.hashPassword(password);
    return hashedPassword === hash;
  }

  // Generate secure random string
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Validate password strength
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 12) {
      score += 2;
    } else if (password.length >= 8) {
      score += 1;
    } else {
      suggestions.push('Use at least 8 characters (12+ recommended)');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      suggestions.push('Include uppercase letters');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      suggestions.push('Include lowercase letters');
    }

    // Numbers check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      suggestions.push('Include numbers');
    }

    // Special characters check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 2;
    } else {
      suggestions.push('Include special characters (!@#$%^&*)');
    }

    // Common patterns check
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      suggestions.push('Avoid repeating characters');
    }

    const isValid = score >= 6;

    return {
      isValid,
      score: Math.max(0, Math.min(10, score)),
      suggestions
    };
  }

  // Secure API key storage
  static secureAPIKey(apiKey: string, serviceName: string): void {
    const encrypted = this.encrypt(apiKey);
    localStorage.setItem(`secure_${serviceName}_api_key`, encrypted);
  }

  // Retrieve API key securely
  static getAPIKey(serviceName: string): string | null {
    const encrypted = localStorage.getItem(`secure_${serviceName}_api_key`);
    if (!encrypted) return null;
    
    try {
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('❌ Failed to decrypt API key:', error);
      return null;
    }
  }

  // Clear sensitive data
  static clearSensitiveData(): void {
    // Clear all secure storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    });

    // Clear session storage
    sessionStorage.clear();
  }

  // Check if running in secure environment
  static isSecureEnvironment(): boolean {
    return (
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }

  // Security warnings
  static showSecurityWarnings(): void {
    if (!this.isSecureEnvironment()) {
      console.warn('⚠️ Warning: Not running in secure environment (HTTPS)');
    }

    if (this.ENCRYPTION_KEY === 'default-key-change-in-production') {
      console.warn('⚠️ Warning: Using default encryption key. Change VITE_ENCRYPTION_KEY in production!');
    }
  }
}

// Initialize security warnings
SecurityService.showSecurityWarnings();
