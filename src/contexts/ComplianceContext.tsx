import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  ComplianceTier, 
  ComplianceStatus, 
  ComplianceCheck, 
  IdentityVerification,
  TransactionRiskAssessment,
  COMPLIANCE_TIERS,
  ComplianceFlag,
  GeoComplianceCheck
} from '@/types/compliance';
import { detectRegion, checkGeoCompliance } from '@/lib/compliance';

interface ComplianceContextType {
  status: ComplianceStatus | null;
  verification: IdentityVerification | null;
  checkTransactionCompliance: (amount: number, destination: string) => ComplianceCheck;
  assessTransactionRisk: (amount: number, destination: string) => TransactionRiskAssessment;
  checkGeoCompliance: (amount: number, destinationCountry: string) => GeoComplianceCheck;
  detectRegion: (countryCode: string) => string;
  upgradeToTier: (tierId: string) => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  resolveFlag: (flagId: string) => Promise<void>;
  startVerification: (level: 'enhanced' | 'full') => Promise<void>;
  isLoading: boolean;
}

const ComplianceContext = createContext<ComplianceContextType | undefined>(undefined);

export function ComplianceProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [verification, setVerification] = useState<IdentityVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize compliance status
  useEffect(() => {
    initializeCompliance();
  }, []);

  const initializeCompliance = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      const mockStatus: ComplianceStatus = {
        currentTier: 'starter',
        dailySpent: 150,
        monthlySpent: 800,
        yearlySpent: 2400,
        dailyRemaining: 350,
        monthlyRemaining: 1200,
        yearlyRemaining: 7600,
        canUpgrade: true,
        nextTier: COMPLIANCE_TIERS.verified,
        verificationLevel: 'basic',
        riskScore: 'low',
        lastAssessment: new Date(),
        flags: []
      };

      const mockVerification: IdentityVerification = {
        level: 'basic',
        documents: {
          governmentId: false,
          proofOfAddress: false,
          sourceOfFunds: false,
          biometric: false
        },
        status: 'pending'
      };

      setStatus(mockStatus);
      setVerification(mockVerification);
    } catch (error) {
      console.error('Failed to initialize compliance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkTransactionCompliance = (amount: number, destination: string): ComplianceCheck => {
    if (!status) {
      return {
        canProceed: false,
        warnings: ['Compliance status unavailable'],
        requirements: ['Please refresh and try again'],
        suggestedActions: []
      };
    }

    const currentTier = COMPLIANCE_TIERS[status.currentTier];
    const warnings: string[] = [];
    const requirements: string[] = [];
    const suggestedActions: string[] = [];
    let canProceed = true;
    let upgradeIncentive: string | undefined;

    // Check single transaction limit
    if (amount > currentTier.singleTransactionLimit) {
      canProceed = false;
      requirements.push(`Amount exceeds single transaction limit of $${currentTier.singleTransactionLimit.toLocaleString()}`);
      
      if (status.nextTier && amount <= status.nextTier.singleTransactionLimit) {
        upgradeIncentive = `Upgrade to ${status.nextTier.name} to send up to $${status.nextTier.singleTransactionLimit.toLocaleString()} per transfer`;
        suggestedActions.push('upgrade_account');
      }
    }

    // Check daily limit
    if (status.dailySpent + amount > currentTier.dailyLimit) {
      canProceed = false;
      requirements.push(`Would exceed daily limit of $${currentTier.dailyLimit.toLocaleString()}`);
      requirements.push(`Daily remaining: $${status.dailyRemaining.toLocaleString()}`);
    }

    // Check monthly limit
    if (status.monthlySpent + amount > currentTier.monthlyLimit) {
      canProceed = false;
      requirements.push(`Would exceed monthly limit of $${currentTier.monthlyLimit.toLocaleString()}`);
    }

    // Warnings for approaching limits
    if (amount > currentTier.singleTransactionLimit * 0.8) {
      warnings.push(`Large transaction: $${amount.toLocaleString()} (${((amount / currentTier.singleTransactionLimit) * 100).toFixed(0)}% of limit)`);
    }

    if (status.dailySpent + amount > currentTier.dailyLimit * 0.8) {
      warnings.push(`Approaching daily limit: ${(((status.dailySpent + amount) / currentTier.dailyLimit) * 100).toFixed(0)}% used`);
    }

    // Risk-based suggestions
    if (amount > 1000 && status.verificationLevel === 'basic') {
      suggestedActions.push('enhance_verification');
      warnings.push('Enhanced verification recommended for transfers over $1,000');
    }

    return {
      canProceed,
      warnings,
      requirements,
      suggestedActions,
      upgradeIncentive
    };
  };

  const assessTransactionRisk = (amount: number, destination: string): TransactionRiskAssessment => {
    // Simple risk scoring algorithm
    let score = 0;
    
    const amountRisk = amount > 2000 ? 'high' : amount > 500 ? 'medium' : 'low';
    const frequencyRisk = 'low'; // Would check recent transaction frequency
    const destinationRisk = ['MX', 'PH'].includes(destination) ? 'low' : 'medium';
    const pattern = 'normal'; // Would analyze transaction patterns

    if (amountRisk === 'high') score += 30;
    else if (amountRisk === 'medium') score += 15;

    if (frequencyRisk === 'high') score += 25;
    else if (frequencyRisk === 'medium') score += 10;

    if (destinationRisk === 'high') score += 20;
    else if (destinationRisk === 'medium') score += 10;

    return {
      score,
      factors: {
        amount: amountRisk,
        frequency: frequencyRisk,
        destination: destinationRisk,
        pattern
      },
      requiresReview: score > 60,
      additionalChecks: score > 40 ? ['Enhanced monitoring', 'Source of funds verification'] : []
    };
  };

  const upgradeToTier = async (tierId: string): Promise<boolean> => {
    try {
      // In a real app, this would initiate the upgrade process
      const targetTier = COMPLIANCE_TIERS[tierId];
      if (!targetTier) return false;

      // Simulate upgrade process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Upgrade failed:', error);
      return false;
    }
  };

  const refreshStatus = async () => {
    await initializeCompliance();
  };

  const resolveFlag = async (flagId: string) => {
    if (!status) return;

    setStatus({
      ...status,
      flags: status.flags.map(flag => 
        flag.id === flagId 
          ? { ...flag, resolvedAt: new Date() }
          : flag
      )
    });
  };

  const startVerification = async (level: 'enhanced' | 'full') => {
    if (!verification) return;

    setVerification({
      ...verification,
      level,
      status: 'pending'
    });

    // In a real app, this would start the verification flow
  };

  return (
    <ComplianceContext.Provider
      value={{
        status,
        verification,
        checkTransactionCompliance,
        assessTransactionRisk,
        checkGeoCompliance,
        detectRegion,
        upgradeToTier,
        refreshStatus,
        resolveFlag,
        startVerification,
        isLoading
      }}
    >
      {children}
    </ComplianceContext.Provider>
  );
}

export function useCompliance() {
  const context = useContext(ComplianceContext);
  if (context === undefined) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
}