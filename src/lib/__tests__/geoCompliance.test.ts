import { describe, it, expect } from '@jest/globals';
import { detectRegion, checkGeoCompliance, checkFullCompliance } from '../compliance';
import { COUNTRY_TO_REGION, REGION_COMPLIANCE_RULES } from '@/types/compliance';

describe('Geo-Aware Compliance', () => {
  describe('Region Detection', () => {
    it('should detect North America correctly', () => {
      expect(detectRegion('US')).toBe('north_america');
      expect(detectRegion('CA')).toBe('north_america');
      expect(detectRegion('MX')).toBe('north_america');
    });

    it('should detect Europe correctly', () => {
      expect(detectRegion('GB')).toBe('europe');
      expect(detectRegion('DE')).toBe('europe');
      expect(detectRegion('FR')).toBe('europe');
    });

    it('should detect Asia Pacific correctly', () => {
      expect(detectRegion('JP')).toBe('asia_pacific');
      expect(detectRegion('CN')).toBe('asia_pacific');
      expect(detectRegion('SG')).toBe('asia_pacific');
    });

    it('should detect Latin America correctly', () => {
      expect(detectRegion('BR')).toBe('latin_america');
      expect(detectRegion('AR')).toBe('latin_america');
      expect(detectRegion('CO')).toBe('latin_america');
    });

    it('should detect Middle East correctly', () => {
      expect(detectRegion('SA')).toBe('middle_east');
      expect(detectRegion('AE')).toBe('middle_east');
      expect(detectRegion('IL')).toBe('middle_east');
    });

    it('should detect Africa correctly', () => {
      expect(detectRegion('ZA')).toBe('africa');
      expect(detectRegion('NG')).toBe('africa');
      expect(detectRegion('KE')).toBe('africa');
    });

    it('should return unknown for unrecognized countries', () => {
      expect(detectRegion('XX')).toBe('unknown');
      expect(detectRegion('ZZ')).toBe('unknown');
    });

    it('should handle case-insensitive country codes', () => {
      expect(detectRegion('us')).toBe('north_america');
      expect(detectRegion('Us')).toBe('north_america');
      expect(detectRegion('US')).toBe('north_america');
    });
  });

  describe('Geo Compliance Check', () => {
    it('should check compliance for North America transfer', () => {
      const result = checkGeoCompliance(5000, 'US');
      expect(result.region).toBe('north_america');
      expect(result.regionName).toBe('North America');
      expect(result.canProceed).toBe(true);
      expect(result.estimatedProcessingTime).toBe('1-2 business days');
    });

    it('should check compliance for Europe transfer', () => {
      const result = checkGeoCompliance(10000, 'GB');
      expect(result.region).toBe('europe');
      expect(result.regionName).toBe('Europe');
      expect(result.canProceed).toBe(true);
      expect(result.estimatedProcessingTime).toBe('1-3 business days');
    });

    it('should check compliance for Asia Pacific transfer', () => {
      const result = checkGeoCompliance(3000, 'JP');
      expect(result.region).toBe('asia_pacific');
      expect(result.regionName).toBe('Asia Pacific');
      expect(result.canProceed).toBe(true);
      expect(result.estimatedProcessingTime).toBe('2-4 business days');
    });

    it('should check compliance for Latin America transfer', () => {
      const result = checkGeoCompliance(2000, 'BR');
      expect(result.region).toBe('latin_america');
      expect(result.regionName).toBe('Latin America');
      expect(result.canProceed).toBe(true);
      expect(result.estimatedProcessingTime).toBe('3-5 business days');
    });

    it('should check compliance for Middle East transfer', () => {
      const result = checkGeoCompliance(4000, 'SA');
      expect(result.region).toBe('middle_east');
      expect(result.regionName).toBe('Middle East');
      expect(result.canProceed).toBe(true);
      expect(result.estimatedProcessingTime).toBe('2-4 business days');
    });

    it('should check compliance for Africa transfer', () => {
      const result = checkGeoCompliance(1500, 'ZA');
      expect(result.region).toBe('africa');
      expect(result.regionName).toBe('Africa');
      expect(result.canProceed).toBe(true);
      expect(result.estimatedProcessingTime).toBe('3-5 business days');
    });

    it('should check compliance for unknown region', () => {
      const result = checkGeoCompliance(1000, 'XX');
      expect(result.region).toBe('unknown');
      expect(result.regionName).toBe('Unknown Region');
      expect(result.canProceed).toBe(true);
      expect(result.estimatedProcessingTime).toBe('5-7 business days');
    });

    it('should block transfers exceeding regional limits', () => {
      const result = checkGeoCompliance(100000, 'US');
      expect(result.canProceed).toBe(false);
      expect(result.regionSpecificRequirements).toContain(
        expect.stringContaining('exceeds regional single transaction limit')
      );
    });

    it('should require enhanced verification for large amounts', () => {
      const result = checkGeoCompliance(15000, 'US');
      expect(result.enhancedVerificationRequired).toBe(true);
      expect(result.regionSpecificWarnings).toContain(
        expect.stringContaining('Enhanced verification required')
      );
    });

    it('should require reporting for amounts above threshold', () => {
      const result = checkGeoCompliance(5000, 'US');
      expect(result.reportingRequired).toBe(true);
      expect(result.notices).toContain(
        expect.stringContaining('regulatory reporting')
      );
    });

    it('should include region-specific requirements', () => {
      const result = checkGeoCompliance(1000, 'US');
      expect(result.regionSpecificRequirements).toContain(
        'Standard identity verification'
      );
      expect(result.regionSpecificRequirements).toContain(
        'OFAC screening for US destinations'
      );
    });

    it('should include region-specific notices', () => {
      const result = checkGeoCompliance(1000, 'US');
      expect(result.notices).toContain(
        expect.stringContaining('US may be subject to additional regulatory scrutiny')
      );
    });

    it('should include region-specific restrictions', () => {
      const result = checkGeoCompliance(1000, 'US');
      expect(result.restrictions).toContain(
        'No transfers to sanctioned individuals or entities'
      );
    });
  });

  describe('Full Compliance Check', () => {
    it('should combine tier and geo compliance checks', () => {
      const user = {
        id: '1',
        tier: 'starter' as const,
        monthlySpent: 100,
        dailySpent: 50,
        yearlySpent: 500,
      };

      const result = checkFullCompliance(user, 500, 'US');
      expect(result.tierResult).toBeDefined();
      expect(result.geoResult).toBeDefined();
      expect(result.canProceed).toBe(true);
      expect(result.allWarnings).toEqual(expect.any(Array));
      expect(result.allRequirements).toEqual(expect.any(Array));
    });

    it('should block if tier check fails', () => {
      const user = {
        id: '1',
        tier: 'starter' as const,
        monthlySpent: 10000,
        dailySpent: 5000,
        yearlySpent: 50000,
      };

      const result = checkFullCompliance(user, 500, 'US');
      expect(result.canProceed).toBe(false);
      expect(result.tierResult.allowed).toBe(false);
    });

    it('should block if geo check fails', () => {
      const user = {
        id: '1',
        tier: 'premium' as const,
        monthlySpent: 100,
        dailySpent: 50,
        yearlySpent: 500,
      };

      const result = checkFullCompliance(user, 100000, 'US');
      expect(result.canProceed).toBe(false);
      expect(result.geoResult.canProceed).toBe(false);
    });
  });

  describe('Region Compliance Rules', () => {
    it('should have rules for all regions', () => {
      const regions = ['north_america', 'europe', 'asia_pacific', 'latin_america', 'middle_east', 'africa', 'unknown'];
      regions.forEach(region => {
        expect(REGION_COMPLIANCE_RULES[region]).toBeDefined();
        expect(REGION_COMPLIANCE_RULES[region].region).toBe(region);
      });
    });

    it('should have proper structure for each region', () => {
      Object.values(REGION_COMPLIANCE_RULES).forEach(rule => {
        expect(rule).toHaveProperty('region');
        expect(rule).toHaveProperty('regionName');
        expect(rule).toHaveProperty('countries');
        expect(rule).toHaveProperty('limits');
        expect(rule).toHaveProperty('requirements');
        expect(rule).toHaveProperty('notices');
        expect(rule).toHaveProperty('restrictions');
        expect(rule).toHaveProperty('enhancedVerificationThreshold');
        expect(rule).toHaveProperty('reportingThreshold');
        expect(rule).toHaveProperty('processingTime');
      });
    });

    it('should have country to region mapping', () => {
      expect(COUNTRY_TO_REGION['US']).toBe('north_america');
      expect(COUNTRY_TO_REGION['GB']).toBe('europe');
      expect(COUNTRY_TO_REGION['JP']).toBe('asia_pacific');
      expect(COUNTRY_TO_REGION['BR']).toBe('latin_america');
      expect(COUNTRY_TO_REGION['SA']).toBe('middle_east');
      expect(COUNTRY_TO_REGION['ZA']).toBe('africa');
    });
  });
});
