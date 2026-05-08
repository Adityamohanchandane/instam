// Security Monitoring and Alert System
// Monitors security threats and alerts user

import { SecurityService } from './security';

export interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private alerts: SecurityAlert[] = [];
  private monitoring = false;

  private constructor() {}

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  // Start security monitoring
  startMonitoring(): void {
    if (this.monitoring) return;
    
    this.monitoring = true;
    console.log('🔒 Security monitoring started');

    // Monitor environment changes
    this.monitorEnvironment();
    
    // Monitor API calls
    this.monitorAPICalls();
    
    // Monitor storage changes
    this.monitorStorage();
    
    // Monitor network security
    this.monitorNetworkSecurity();
  }

  // Stop security monitoring
  stopMonitoring(): void {
    this.monitoring = false;
    console.log('🔒 Security monitoring stopped');
  }

  // Add security alert
  addAlert(type: SecurityAlert['type'], message: string): void {
    const alert: SecurityAlert = {
      id: SecurityService.generateSecureToken(8),
      type,
      message,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);
    this.logAlert(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  // Get all alerts
  getAlerts(): SecurityAlert[] {
    return [...this.alerts];
  }

  // Get unresolved alerts
  getUnresolvedAlerts(): SecurityAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  // Resolve alert
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`✅ Resolved alert: ${alert.message}`);
    }
  }

  // Monitor environment security
  private monitorEnvironment(): void {
    // Check for HTTPS (but allow localhost for development)
    if (!SecurityService.isSecureEnvironment() && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      this.addAlert('error', 'Application running on insecure HTTP connection - data may not be safe');
    }

    // Check for default encryption key (browser environment)
    const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;
    if (encryptionKey === 'default-key-change-in-production') {
      this.addAlert('error', 'CRITICAL: Using default encryption key! Change VITE_ENCRYPTION_KEY immediately');
    }

    // Check for development mode in production
    if (import.meta.env.MODE === 'production' && window.location.hostname !== 'localhost') {
      // Additional production checks
      if (!encryptionKey || encryptionKey.length < 32) {
        this.addAlert('error', 'Encryption key is too weak for production use');
      }
    }

    // Monitor for console access in production (browser environment)
    const nodeEnv = import.meta.env.MODE;
    if (nodeEnv === 'production') {
      const originalLog = console.log;
      console.log = (...args) => {
        if (args.some(arg => typeof arg === 'string' && 
          (arg.includes('password') || arg.includes('secret') || arg.includes('key') || arg.includes('token')))) {
          this.addAlert('error', 'SENSITIVE DATA EXPOSED: Password/secret detected in console logs');
        }
        originalLog.apply(console, args);
      };
    }
  }

  // Monitor API calls for security
  private monitorAPICalls(): void {
    // Monitor fetch calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      
      // Check for sensitive data in URLs
      if (typeof url === 'string') {
        if (url.includes('password') || url.includes('secret') || url.includes('key')) {
          this.addAlert('warning', 'Sensitive data detected in API URL');
        }
      }

      // Check for proper headers
      if (options && options.headers) {
        const headers = options.headers as Record<string, string>;
        if (headers['Authorization'] && !headers['Authorization'].startsWith('Bearer ')) {
          this.addAlert('warning', 'Non-standard authorization header detected');
        }
      }

      return originalFetch.apply(window, args);
    };
  }

  // Monitor localStorage for security
  private monitorStorage(): void {
    // Monitor localStorage changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key: string, value: string) => {
      // Check for sensitive data
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('secret') || 
          key.toLowerCase().includes('key')) {
        this.addAlert('warning', `Sensitive data stored in localStorage: ${key}`);
      }

      // Check for unencrypted sensitive data
      if (value.includes('password') || value.includes('secret')) {
        this.addAlert('error', 'Unencrypted sensitive data detected in localStorage');
      }

      return originalSetItem.apply(localStorage, [key, value]);
    };
  }

  // Monitor network security
  private monitorNetworkSecurity(): void {
    // Check for mixed content
    if (window.location.protocol === 'https:') {
      const images = document.getElementsByTagName('img');
      for (let i = 0; i < images.length; i++) {
        const img = images[i] as HTMLImageElement;
        if (img.src && img.src.startsWith('http://')) {
          this.addAlert('warning', 'Mixed content detected: HTTP resource on HTTPS page');
        }
      }
    }

    // Monitor for XSS attempts
    const originalCreateElement = document.createElement;
    document.createElement = (tagName: string) => {
      if (tagName.toLowerCase() === 'script') {
        this.addAlert('info', 'Script element created - potential XSS');
      }
      return originalCreateElement.apply(document, [tagName]);
    };
  }

  // Log alert to console
  private logAlert(alert: SecurityAlert): void {
    const emoji = alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} Security Alert [${alert.type.toUpperCase()}]: ${alert.message}`);
  }

  // Generate security report
  generateSecurityReport(): {
    totalAlerts: number;
    unresolvedAlerts: number;
    alertsByType: Record<string, number>;
    recentAlerts: SecurityAlert[];
  } {
    const unresolvedAlerts = this.getUnresolvedAlerts();
    const alertsByType = this.alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAlerts: this.alerts.length,
      unresolvedAlerts: unresolvedAlerts.length,
      alertsByType,
      recentAlerts: this.alerts.slice(-10)
    };
  }

  // Clear all alerts
  clearAlerts(): void {
    this.alerts = [];
    console.log('🗑️ All security alerts cleared');
  }

  // Export alerts for analysis
  exportAlerts(): string {
    return JSON.stringify(this.alerts, null, 2);
  }

  // Check for common vulnerabilities
  checkVulnerabilities(): {
    vulnerabilities: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    const vulnerabilities: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check for common issues
    if (!SecurityService.isSecureEnvironment()) {
      vulnerabilities.push('Insecure HTTP connection');
      severity = 'high';
    }

    const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;
    if (encryptionKey === 'default-key-change-in-production') {
      vulnerabilities.push('Default encryption key in use');
      severity = 'medium';
    }

    // Check for exposed API keys in localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('api_key') || key.includes('secret')) {
        vulnerabilities.push(`Exposed API key in localStorage: ${key}`);
        severity = 'critical';
      }
    });

    return { vulnerabilities, severity };
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();
