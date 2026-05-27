export interface ComplianceTier {
  id: string;
  name: string;
  dailyLimit: number;
  monthlyLimit: number;
  yearlyLimit: number;
  singleTransactionLimit: number;
  description: string;
  requirements: string[];
  benefits: string[];
  upgradeRequirements?: string[];
}

export type Region = 
  | 'north_america'
  | 'europe'
  | 'asia_pacific'
  | 'latin_america'
  | 'middle_east'
  | 'africa'
  | 'unknown';

export interface RegionComplianceRules {
  region: Region;
  regionName: string;
  countries: string[];
  limits: {
    singleTransaction: number;
    daily: number;
    monthly: number;
  };
  requirements: string[];
  notices: string[];
  restrictions: string[];
  enhancedVerificationThreshold: number;
  reportingThreshold: number;
  processingTime: string;
}

export interface GeoComplianceCheck {
  region: Region;
  regionName: string;
  canProceed: boolean;
  regionSpecificWarnings: string[];
  regionSpecificRequirements: string[];
  notices: string[];
  restrictions: string[];
  enhancedVerificationRequired: boolean;
  reportingRequired: boolean;
  estimatedProcessingTime: string;
}

export interface ComplianceStatus {
  currentTier: string;
  dailySpent: number;
  monthlySpent: number;
  yearlySpent: number;
  dailyRemaining: number;
  monthlyRemaining: number;
  yearlyRemaining: number;
  canUpgrade: boolean;
  nextTier?: ComplianceTier;
  verificationLevel: 'basic' | 'enhanced' | 'full';
  riskScore: 'low' | 'medium' | 'high';
  lastAssessment: Date;
  flags: ComplianceFlag[];
}

export interface ComplianceFlag {
  id: string;
  type: 'info' | 'warning' | 'restriction';
  message: string;
  action?: 'verify_identity' | 'provide_documentation' | 'contact_support';
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ComplianceCheck {
  canProceed: boolean;
  warnings: string[];
  requirements: string[];
  suggestedActions: string[];
  upgradeIncentive?: string;
}

export interface IdentityVerification {
  level: 'basic' | 'enhanced' | 'full';
  documents: {
    governmentId: boolean;
    proofOfAddress: boolean;
    sourceOfFunds: boolean;
    biometric: boolean;
  };
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  completedAt?: Date;
  expiresAt?: Date;
  rejectionReasons?: string[];
}

export interface TransactionRiskAssessment {
  score: number;
  factors: {
    amount: 'low' | 'medium' | 'high';
    frequency: 'low' | 'medium' | 'high';
    destination: 'low' | 'medium' | 'high';
    pattern: 'normal' | 'unusual' | 'suspicious';
  };
  requiresReview: boolean;
  additionalChecks: string[];
}

// Country to region mapping
export const COUNTRY_TO_REGION: Record<string, Region> = {
  // North America
  'US': 'north_america',
  'CA': 'north_america',
  'MX': 'north_america',
  
  // Europe
  'GB': 'europe',
  'DE': 'europe',
  'FR': 'europe',
  'IT': 'europe',
  'ES': 'europe',
  'NL': 'europe',
  'BE': 'europe',
  'AT': 'europe',
  'CH': 'europe',
  'SE': 'europe',
  'NO': 'europe',
  'DK': 'europe',
  'FI': 'europe',
  'PL': 'europe',
  'CZ': 'europe',
  'GR': 'europe',
  'PT': 'europe',
  'IE': 'europe',
  
  // Asia Pacific
  'JP': 'asia_pacific',
  'CN': 'asia_pacific',
  'KR': 'asia_pacific',
  'SG': 'asia_pacific',
  'HK': 'asia_pacific',
  'AU': 'asia_pacific',
  'NZ': 'asia_pacific',
  'IN': 'asia_pacific',
  'PH': 'asia_pacific',
  'TH': 'asia_pacific',
  'VN': 'asia_pacific',
  'MY': 'asia_pacific',
  'ID': 'asia_pacific',
  
  // Latin America
  'BR': 'latin_america',
  'AR': 'latin_america',
  'CO': 'latin_america',
  'PE': 'latin_america',
  'CL': 'latin_america',
  'VE': 'latin_america',
  'EC': 'latin_america',
  'BO': 'latin_america',
  
  // Middle East
  'SA': 'middle_east',
  'AE': 'middle_east',
  'QA': 'middle_east',
  'KW': 'middle_east',
  'BH': 'middle_east',
  'OM': 'middle_east',
  'IL': 'middle_east',
  'JO': 'middle_east',
  'LB': 'middle_east',
  
  // Africa
  'ZA': 'africa',
  'NG': 'africa',
  'KE': 'africa',
  'EG': 'africa',
  'MA': 'africa',
  'GH': 'africa',
};

// Region-specific compliance rules
export const REGION_COMPLIANCE_RULES: Record<Region, RegionComplianceRules> = {
  north_america: {
    region: 'north_america',
    regionName: 'North America',
    countries: ['US', 'CA', 'MX'],
    limits: {
      singleTransaction: 50000,
      daily: 100000,
      monthly: 500000,
    },
    requirements: [
      'Standard identity verification',
      'OFAC screening for US destinations',
      'FATCA reporting for US tax residents'
    ],
    notices: [
      'Transfers to US may be subject to additional regulatory scrutiny',
      'Canadian transfers may require FINTRAC reporting for amounts over CAD 10,000',
      'Mexican transfers may require additional documentation for amounts over MXN 10,000'
    ],
    restrictions: [
      'No transfers to sanctioned individuals or entities'
    ],
    enhancedVerificationThreshold: 10000,
    reportingThreshold: 3000,
    processingTime: '1-2 business days'
  },
  
  europe: {
    region: 'europe',
    regionName: 'Europe',
    countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'GR', 'PT', 'IE'],
    limits: {
      singleTransaction: 75000,
      daily: 150000,
      monthly: 750000,
    },
    requirements: [
      'GDPR-compliant data processing',
      'AML/KYC verification per EU directives',
      'Sanctions screening (EU, UN, US)'
    ],
    notices: [
      'EU transfers may require additional documentation under PSD2',
      'UK transfers post-Brexit may have different requirements',
      'Swiss transfers may require additional compliance checks'
    ],
    restrictions: [
      'No transfers to sanctioned entities under EU/UK sanctions'
    ],
    enhancedVerificationThreshold: 15000,
    reportingThreshold: 10000,
    processingTime: '1-3 business days'
  },
  
  asia_pacific: {
    region: 'asia_pacific',
    regionName: 'Asia Pacific',
    countries: ['JP', 'CN', 'KR', 'SG', 'HK', 'AU', 'NZ', 'IN', 'PH', 'TH', 'VN', 'MY', 'ID'],
    limits: {
      singleTransaction: 25000,
      daily: 50000,
      monthly: 250000,
    },
    requirements: [
      'Regional AML/KYC verification',
      'Sanctions screening for specific countries',
      'Tax residency documentation for some jurisdictions'
    ],
    notices: [
      'Chinese transfers may require additional regulatory approval',
      'Japanese transfers may require JFSA reporting for large amounts',
      'Australian transfers may require AUSTRAC reporting',
      'Singaporean transfers may require MAS compliance'
    ],
    restrictions: [
      'No transfers to sanctioned entities in the region',
      'Some countries may have capital controls'
    ],
    enhancedVerificationThreshold: 5000,
    reportingThreshold: 5000,
    processingTime: '2-4 business days'
  },
  
  latin_america: {
    region: 'latin_america',
    regionName: 'Latin America',
    countries: ['BR', 'AR', 'CO', 'PE', 'CL', 'VE', 'EC', 'BO'],
    limits: {
      singleTransaction: 15000,
      daily: 30000,
      monthly: 150000,
    },
    requirements: [
      'Enhanced due diligence for high-risk jurisdictions',
      'Additional documentation for certain countries',
      'Local regulatory compliance'
    ],
    notices: [
      'Brazilian transfers may require Central Bank authorization',
      'Argentine transfers may be subject to currency controls',
      'Colombian transfers may require additional reporting',
      'Venezuelan transfers may have significant restrictions'
    ],
    restrictions: [
      'No transfers to sanctioned entities',
      'Some countries may have strict capital controls',
      'Venezuelan transfers may be blocked due to sanctions'
    ],
    enhancedVerificationThreshold: 3000,
    reportingThreshold: 1000,
    processingTime: '3-5 business days'
  },
  
  middle_east: {
    region: 'middle_east',
    regionName: 'Middle East',
    countries: ['SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'IL', 'JO', 'LB'],
    limits: {
      singleTransaction: 20000,
      daily: 40000,
      monthly: 200000,
    },
    requirements: [
      'Enhanced due diligence for the region',
      'Sanctions screening (US, EU, UN, regional)',
      'Additional documentation for certain jurisdictions'
    ],
    notices: [
      'UAE transfers may require Central Bank approval for large amounts',
      'Saudi transfers may require SAMA compliance',
      'Israeli transfers may have specific requirements',
      'Some transfers may be subject to additional scrutiny'
    ],
    restrictions: [
      'No transfers to sanctioned entities',
      'Certain jurisdictions may have additional restrictions',
      'Transfers to/from Iran are prohibited'
    ],
    enhancedVerificationThreshold: 5000,
    reportingThreshold: 2000,
    processingTime: '2-4 business days'
  },
  
  africa: {
    region: 'africa',
    regionName: 'Africa',
    countries: ['ZA', 'NG', 'KE', 'EG', 'MA', 'GH'],
    limits: {
      singleTransaction: 10000,
      daily: 20000,
      monthly: 100000,
    },
    requirements: [
      'Enhanced due diligence for high-risk jurisdictions',
      'Additional documentation for certain countries',
      'Local regulatory compliance'
    ],
    notices: [
      'South African transfers may require SARS reporting',
      'Nigerian transfers may require CBN approval',
      'Kenyan transfers may require Central Bank documentation',
      'Egyptian transfers may have specific requirements'
    ],
    restrictions: [
      'No transfers to sanctioned entities',
      'Some countries may have strict foreign exchange controls'
    ],
    enhancedVerificationThreshold: 2500,
    reportingThreshold: 1000,
    processingTime: '3-5 business days'
  },
  
  unknown: {
    region: 'unknown',
    regionName: 'Unknown Region',
    countries: [],
    limits: {
      singleTransaction: 5000,
      daily: 10000,
      monthly: 50000,
    },
    requirements: [
      'Enhanced due diligence required',
      'Additional documentation',
      'Manual review for all transfers'
    ],
    notices: [
      'Destination country not recognized',
      'Additional verification required',
      'Processing may take longer'
    ],
    restrictions: [
      'May be restricted based on risk assessment',
      'Requires manual review'
    ],
    enhancedVerificationThreshold: 1000,
    reportingThreshold: 500,
    processingTime: '5-7 business days'
  }
};

export const COMPLIANCE_TIERS: Record<string, ComplianceTier> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    dailyLimit: 500,
    monthlyLimit: 2000,
    yearlyLimit: 10000,
    singleTransactionLimit: 250,
    description: 'Perfect for getting started with small transfers',
    requirements: ['Valid email or phone', 'Basic profile information'],
    benefits: [
      'Instant transfers up to $250',
      'Access to all destination countries',
      'Real-time tracking',
      'Customer support'
    ],
    upgradeRequirements: ['Government ID verification', 'Proof of address']
  },
  verified: {
    id: 'verified',
    name: 'Verified',
    dailyLimit: 2500,
    monthlyLimit: 10000,
    yearlyLimit: 50000,
    singleTransactionLimit: 1000,
    description: 'Increased limits with identity verification',
    requirements: [
      'Government-issued photo ID',
      'Proof of address',
      'Phone number verification'
    ],
    benefits: [
      'Transfer up to $1,000 per transaction',
      'Higher monthly limits',
      'Priority customer support',
      'Access to business features'
    ],
    upgradeRequirements: ['Enhanced due diligence', 'Source of funds documentation']
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    dailyLimit: 10000,
    monthlyLimit: 50000,
    yearlyLimit: 250000,
    singleTransactionLimit: 5000,
    description: 'Maximum limits for frequent users and businesses',
    requirements: [
      'Enhanced identity verification',
      'Source of funds documentation',
      'Regular activity review'
    ],
    benefits: [
      'Transfer up to $5,000 per transaction',
      'Highest available limits',
      'Dedicated account manager',
      'Custom compliance solutions',
      'Reduced fees for high volume'
    ]
  }
};