import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { TrustedDevice, PhishingWarning, SecurityContext as SecurityContextType, RedirectCheckResult } from '@/types';

interface SecurityContextProps extends SecurityContextType {
  addTrustedDevice: (device: Omit<TrustedDevice, 'id' | 'trustedAt'>) => void;
  removeTrustedDevice: (deviceId: string) => void;
  addPhishingWarning: (warning: Omit<PhishingWarning, 'id' | 'timestamp' | 'acknowledged'>) => void;
  acknowledgeWarning: (warningId: string) => void;
  checkRedirectSafety: (url: string) => RedirectCheckResult;
  getCurrentDevice: () => TrustedDevice | null;
}

const SecurityContext = createContext<SecurityContextProps | undefined>(undefined);

const SUSPICIOUS_DOMAINS = [
  'swift-send-secure.com',
  'swiftsend-login.com',
  'swiftsend-verify.com',
  'swiftsend-wallet.com',
];

const SUSPICIOUS_PATTERNS = [
  /swift-send-\d+\.com/,
  /swiftsend-\d+\.com/,
  /swift-send-[a-z]{2,5}\.com/,
  /swiftsend-[a-z]{2,5}\.com/,
];

function generateDeviceId(): string {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const screenInfo = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const combined = `${userAgent}|${platform}|${language}|${screenInfo}|${timezone}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `device_${Math.abs(hash).toString(16)}`;
}

function detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  const userAgent = navigator.userAgent;
  if (/mobile|android|iphone|ipod/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function detectBrowser(): string {
  const userAgent = navigator.userAgent;
  if (/chrome/i.test(userAgent) && !/edge|opr/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/edge/i.test(userAgent)) return 'Edge';
  if (/opr/i.test(userAgent)) return 'Opera';
  return 'Unknown';
}

function detectOS(): string {
  const userAgent = navigator.userAgent;
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac|os x/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  return 'Unknown';
}

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [phishingWarnings, setPhishingWarnings] = useState<PhishingWarning[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | undefined>();

  useEffect(() => {
    const deviceId = generateDeviceId();
    setCurrentDeviceId(deviceId);

    // Load from localStorage
    const savedDevices = localStorage.getItem('trusted_devices');
    const savedWarnings = localStorage.getItem('phishing_warnings');

    if (savedDevices) {
      try {
        const devices = JSON.parse(savedDevices);
        setTrustedDevices(devices.map((d: any) => ({
          ...d,
          lastUsedAt: new Date(d.lastUsedAt),
          trustedAt: new Date(d.trustedAt),
        })));
      } catch (e) {
        console.error('Failed to load trusted devices:', e);
      }
    }

    if (savedWarnings) {
      try {
        const warnings = JSON.parse(savedWarnings);
        setPhishingWarnings(warnings.map((w: any) => ({
          ...w,
          timestamp: new Date(w.timestamp),
        })));
      } catch (e) {
        console.error('Failed to load phishing warnings:', e);
      }
    }

    // Auto-register current device if not already trusted
    if (savedDevices) {
      const devices = JSON.parse(savedDevices);
      const currentDeviceExists = devices.some((d: any) => d.id === deviceId);
      if (!currentDeviceExists) {
        const newDevice: TrustedDevice = {
          id: deviceId,
          deviceName: `${detectBrowser()} on ${detectOS()}`,
          deviceType: detectDeviceType(),
          browser: detectBrowser(),
          os: detectOS(),
          lastUsedAt: new Date(),
          isCurrentDevice: true,
          trustedAt: new Date(),
        };
        const updatedDevices = [...devices, newDevice];
        localStorage.setItem('trusted_devices', JSON.stringify(updatedDevices));
        setTrustedDevices(updatedDevices.map((d: any) => ({
          ...d,
          lastUsedAt: new Date(d.lastUsedAt),
          trustedAt: new Date(d.trustedAt),
        })));
      }
    }
  }, []);

  const addTrustedDevice = (device: Omit<TrustedDevice, 'id' | 'trustedAt'>) => {
    const newDevice: TrustedDevice = {
      ...device,
      id: generateDeviceId(),
      trustedAt: new Date(),
    };
    const updatedDevices = [...trustedDevices, newDevice];
    setTrustedDevices(updatedDevices);
    localStorage.setItem('trusted_devices', JSON.stringify(updatedDevices));
  };

  const removeTrustedDevice = (deviceId: string) => {
    const updatedDevices = trustedDevices.filter(d => d.id !== deviceId);
    setTrustedDevices(updatedDevices);
    localStorage.setItem('trusted_devices', JSON.stringify(updatedDevices));
  };

  const addPhishingWarning = (warning: Omit<PhishingWarning, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newWarning: PhishingWarning = {
      ...warning,
      id: `warning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
    };
    const updatedWarnings = [...phishingWarnings, newWarning];
    setPhishingWarnings(updatedWarnings);
    localStorage.setItem('phishing_warnings', JSON.stringify(updatedWarnings));
  };

  const acknowledgeWarning = (warningId: string) => {
    const updatedWarnings = phishingWarnings.map(w =>
      w.id === warningId ? { ...w, acknowledged: true } : w
    );
    setPhishingWarnings(updatedWarnings);
    localStorage.setItem('phishing_warnings', JSON.stringify(updatedWarnings));
  };

  const checkRedirectSafety = (url: string): RedirectCheckResult => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      // Check against known suspicious domains
      if (SUSPICIOUS_DOMAINS.some(d => domain.includes(d))) {
        return {
          isSuspicious: true,
          reason: 'Domain matches known phishing patterns',
          confidence: 0.9,
          suggestedAction: 'block',
        };
      }

      // Check against suspicious patterns
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(domain)) {
          return {
            isSuspicious: true,
            reason: 'Domain matches suspicious naming pattern',
            confidence: 0.8,
            suggestedAction: 'warn',
          };
        }
      }

      // Check for lookalike characters
      if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(domain)) {
        return {
          isSuspicious: true,
          reason: 'Domain contains non-ASCII characters which may be used for spoofing',
          confidence: 0.7,
          suggestedAction: 'warn',
        };
      }

      // Check for excessive subdomains
      const subdomainCount = domain.split('.').length - 2;
      if (subdomainCount > 3) {
        return {
          isSuspicious: true,
          reason: 'Domain has excessive subdomains',
          confidence: 0.5,
          suggestedAction: 'warn',
        };
      }

      return {
        isSuspicious: false,
        confidence: 0.95,
        suggestedAction: 'allow',
      };
    } catch (e) {
      return {
        isSuspicious: true,
        reason: 'Invalid URL format',
        confidence: 0.6,
        suggestedAction: 'warn',
      };
    }
  };

  const getCurrentDevice = (): TrustedDevice | null => {
    if (!currentDeviceId) return null;
    return trustedDevices.find(d => d.id === currentDeviceId) || null;
  };

  const hasUnacknowledgedWarnings = phishingWarnings.some(w => !w.acknowledged);

  return (
    <SecurityContext.Provider
      value={{
        trustedDevices,
        phishingWarnings,
        currentDeviceId,
        hasUnacknowledgedWarnings,
        addTrustedDevice,
        removeTrustedDevice,
        addPhishingWarning,
        acknowledgeWarning,
        checkRedirectSafety,
        getCurrentDevice,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
