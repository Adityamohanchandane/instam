// Security Dashboard for Instam
// Monitor and manage security settings

import React, { useState, useEffect } from 'react';
import { SecurityService } from '../lib/security';

interface SecurityStatus {
  isSecureEnvironment: boolean;
  encryptionEnabled: boolean;
  defaultKeyWarning: boolean;
  passwordStrength: {
    score: number;
    suggestions: string[];
  };
}

export const SecurityDashboard: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    isSecureEnvironment: false,
    encryptionEnabled: false,
    defaultKeyWarning: false,
    passwordStrength: { score: 0, suggestions: [] }
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordAnalysis, setPasswordAnalysis] = useState({
    isValid: false,
    score: 0,
    suggestions: [] as string[]
  });

  useEffect(() => {
    checkSecurityStatus();
  }, []);

  const checkSecurityStatus = () => {
    // Browser environment - check import.meta.env
    const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;
    
    const status: SecurityStatus = {
      isSecureEnvironment: SecurityService.isSecureEnvironment(),
      encryptionEnabled: encryptionKey !== 'default-key-change-in-production',
      defaultKeyWarning: encryptionKey === 'default-key-change-in-production',
      passwordStrength: SecurityService.validatePasswordStrength('')
    };

    setSecurityStatus(status);
  };

  const handlePasswordAnalysis = (password: string) => {
    const analysis = SecurityService.validatePasswordStrength(password);
    setPasswordAnalysis(analysis);
  };

  const generateSecurePassword = () => {
    const password = SecurityService.generateSecureToken(16);
    setNewPassword(password);
    handlePasswordAnalysis(password);
  };

  const clearSensitiveData = () => {
    if (window.confirm('Are you sure you want to clear all sensitive data? This action cannot be undone.')) {
      SecurityService.clearSensitiveData();
      alert('All sensitive data has been cleared.');
    }
  };

  const getSecurityLevel = () => {
    let score = 0;
    if (securityStatus.isSecureEnvironment) score += 3;
    if (securityStatus.encryptionEnabled) score += 4;
    if (!securityStatus.defaultKeyWarning) score += 3;

    if (score >= 9) return { level: 'HIGH', color: 'text-green-600', icon: '🔒' };
    if (score >= 6) return { level: 'MEDIUM', color: 'text-yellow-600', icon: '🔓' };
    return { level: 'LOW', color: 'text-red-600', icon: '⚠️' };
  };

  const securityLevel = getSecurityLevel();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">🔒 Security Dashboard</h1>
            <div className={`flex items-center space-x-2 ${securityLevel.color}`}>
              <span className="text-2xl">{securityLevel.icon}</span>
              <span className="font-semibold">{securityLevel.level} SECURITY</span>
            </div>
          </div>

          {/* Security Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className={`p-4 rounded-lg ${securityStatus.isSecureEnvironment ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{securityStatus.isSecureEnvironment ? '🛡️' : '⚠️'}</span>
                <div>
                  <h3 className="font-semibold">Environment</h3>
                  <p className="text-sm">{securityStatus.isSecureEnvironment ? 'Secure (HTTPS)' : 'Insecure (HTTP)'}</p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${securityStatus.encryptionEnabled ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border`}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{securityStatus.encryptionEnabled ? '🔐' : '🔓'}</span>
                <div>
                  <h3 className="font-semibold">Encryption</h3>
                  <p className="text-sm">{securityStatus.encryptionEnabled ? 'Enabled' : 'Default Key'}</p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${!securityStatus.defaultKeyWarning ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{!securityStatus.defaultKeyWarning ? '✅' : '⚠️'}</span>
                <div>
                  <h3 className="font-semibold">Configuration</h3>
                  <p className="text-sm">{!securityStatus.defaultKeyWarning ? 'Secure' : 'Using Defaults'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Password Generator */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🔑 Password Generator</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generate Secure Password
                </label>
                <div className="flex space-x-2">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      handlePasswordAnalysis(e.target.value);
                    }}
                    placeholder="Enter password or generate one..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    {showSecrets ? '👁️' : '🙈'}
                  </button>
                  <button
                    onClick={generateSecurePassword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    🎲 Generate
                  </button>
                </div>
              </div>

              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Password Strength:</span>
                    <span className={`font-semibold ${
                      passwordAnalysis.score >= 8 ? 'text-green-600' :
                      passwordAnalysis.score >= 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {passwordAnalysis.score}/10
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        passwordAnalysis.score >= 8 ? 'bg-green-600' :
                        passwordAnalysis.score >= 5 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${passwordAnalysis.score * 10}%` }}
                    />
                  </div>

                  {passwordAnalysis.suggestions.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Suggestions:</p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {passwordAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Security Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🛡️ Security Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={checkSecurityStatus}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh Security Status</span>
              </button>

              <button
                onClick={clearSensitiveData}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
              >
                <span>🗑️</span>
                <span>Clear Sensitive Data</span>
              </button>
            </div>
          </div>

          {/* Security Recommendations */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">🔒 Security Recommendations</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use HTTPS in production environment</li>
              <li>• Set custom VITE_ENCRYPTION_KEY in production</li>
              <li>• Use strong, unique passwords for all services</li>
              <li>• Regularly update API keys and passwords</li>
              <li>• Never commit .env files to version control</li>
              <li>• Use environment-specific configurations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
