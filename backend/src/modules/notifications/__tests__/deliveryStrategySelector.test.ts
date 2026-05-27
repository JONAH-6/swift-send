import { DeliveryStrategySelector } from '../deliveryStrategySelector';
import type { PriorityLevel } from '../priorityCalculator';
import * as sessionStore from '../../../auth/sessionStore';

// Mock the sessionStore module
jest.mock('../../../auth/sessionStore');

describe('DeliveryStrategySelector', () => {
  let selector: DeliveryStrategySelector;

  beforeEach(() => {
    selector = new DeliveryStrategySelector();
    jest.clearAllMocks();
  });

  describe('selectStrategy', () => {
    it('should select all channels for critical priority with bypass and immediate flags', () => {
      const strategy = selector.selectStrategy('critical');

      expect(strategy.channels).toEqual(['email', 'sms', 'in_app', 'push']);
      expect(strategy.bypassRateLimiting).toBe(true);
      expect(strategy.immediateDelivery).toBe(true);
    });

    it('should select in_app, email, push for high priority without bypass flags', () => {
      const strategy = selector.selectStrategy('high');

      expect(strategy.channels).toEqual(['in_app', 'email', 'push']);
      expect(strategy.bypassRateLimiting).toBe(false);
      expect(strategy.immediateDelivery).toBe(false);
    });

    it('should select in_app, push for medium priority without bypass flags', () => {
      const strategy = selector.selectStrategy('medium');

      expect(strategy.channels).toEqual(['in_app', 'push']);
      expect(strategy.bypassRateLimiting).toBe(false);
      expect(strategy.immediateDelivery).toBe(false);
    });

    it('should select in_app, push for low priority without bypass flags', () => {
      const strategy = selector.selectStrategy('low');

      expect(strategy.channels).toEqual(['in_app', 'push']);
      expect(strategy.bypassRateLimiting).toBe(false);
      expect(strategy.immediateDelivery).toBe(false);
    });

    it('should return consistent strategy for the same priority level', () => {
      const strategy1 = selector.selectStrategy('critical');
      const strategy2 = selector.selectStrategy('critical');

      expect(strategy1).toEqual(strategy2);
    });
  });

  describe('buildDeliveries', () => {
    const timestamp = '2024-01-15T10:30:00Z';

    it('should include in_app delivery when in strategy channels', () => {
      const mockGetSession = jest.mocked(sessionStore.getSession);
      mockGetSession.mockReturnValue(undefined);

      const strategy = {
        channels: ['in_app' as const],
        bypassRateLimiting: false,
        immediateDelivery: false,
      };

      const deliveries = selector.buildDeliveries('user_1', strategy, timestamp);

      expect(deliveries).toHaveLength(1);
      expect(deliveries[0]).toEqual({
        channel: 'in_app',
        status: 'sent',
        sentAt: timestamp,
      });
    });

    it('should include email delivery when user has email on file', () => {
      const mockGetSession = jest.mocked(sessionStore.getSession);
      mockGetSession.mockReturnValue({
        id: 'user_1',
        email: 'user@example.com',
        verified: true,
        hasWallet: true,
        onboardingCompleted: true,
        role: 'user',
        metadata: {
          createdAt: Date.now(),
          lastActivityAt: Date.now(),
          trustedIps: [],
        },
        expiresAt: Date.now() + 3600000,
      });

      const strategy = {
        channels: ['in_app' as const, 'email' as const],
        bypassRateLimiting: false,
        immediateDelivery: false,
      };

      const deliveries = selector.buildDeliveries('user_1', strategy, timestamp);

      expect(deliveries).toHaveLength(2);
      expect(deliveries[1]).toEqual({
        channel: 'email',
        status: 'sent',
        sentAt: timestamp,
        target: 'user@example.com',
      });
    });

    it('should skip email delivery when user has no email on file', () => {
      const mockGetSession = jest.mocked(sessionStore.getSession);
      mockGetSession.mockReturnValue({
        id: 'user_1',
        verified: true,
        hasWallet: true,
        onboardingCompleted: true,
        role: 'user',
        metadata: {
          createdAt: Date.now(),
          lastActivityAt: Date.now(),
          trustedIps: [],
        },
        expiresAt: Date.now() + 3600000,
      });

      const strategy = {
        channels: ['in_app' as const, 'email' as const],
        bypassRateLimiting: false,
        immediateDelivery: false,
      };

      const deliveries = selector.buildDeliveries('user_1', strategy, timestamp);

      expect(deliveries).toHaveLength(2);
      expect(deliveries[1]).toEqual({
        channel: 'email',
        status: 'skipped',
        reason: 'No email on file',
      });
    });

    it('should include SMS delivery when user has phone on file', () => {
      const mockGetSession = jest.mocked(sessionStore.getSession);
      mockGetSession.mockReturnValue({
        id: 'user_1',
        phone: '+1234567890',
        verified: true,
        hasWallet: true,
        onboardingCompleted: true,
        role: 'user',
        metadata: {
          createdAt: Date.now(),
          lastActivityAt: Date.now(),
          trustedIps: [],
        },
        expiresAt: Date.now() + 3600000,
      });

      const strategy = {
        channels: ['in_app' as const, 'sms' as const],
        bypassRateLimiting: false,
        immediateDelivery: false,
      };

      const deliveries = selector.buildDeliveries('user_1', strategy, timestamp);

      expect(deliveries).toHaveLength(2);
      expect(deliveries[1]).toEqual({
        channel: 'sms',
        status: 'sent',
        sentAt: timestamp,
        target: '+1234567890',
      });
    });

    it('should skip SMS delivery when user has no phone on file', () => {
      const mockGetSession = jest.mocked(sessionStore.getSession);
      mockGetSession.mockReturnValue({
        id: 'user_1',
        verified: true,
        hasWallet: true,
        onboardingCompleted: true,
        role: 'user',
        metadata: {
          createdAt: Date.now(),
          lastActivityAt: Date.now(),
          trustedIps: [],
        },
        expiresAt: Date.now() + 3600000,
      });

      const strategy = {
        channels: ['in_app' as const, 'sms' as const],
        bypassRateLimiting: false,
        immediateDelivery: false,
      };

      const deliveries = selector.buildDeliveries('user_1', strategy, timestamp);

      expect(deliveries).toHaveLength(2);
      expect(deliveries[1]).toEqual({
        channel: 'sms',
        status: 'skipped',
        reason: 'No phone number on file',
      });
    });

    it('should build all deliveries for critical priority with complete user session', () => {
      const mockGetSession = jest.mocked(sessionStore.getSession);
      mockGetSession.mockReturnValue({
        id: 'user_1',
        email: 'user@example.com',
        phone: '+1234567890',
        verified: true,
        hasWallet: true,
        onboardingCompleted: true,
        role: 'user',
        metadata: {
          createdAt: Date.now(),
          lastActivityAt: Date.now(),
          trustedIps: [],
        },
        expiresAt: Date.now() + 3600000,
      });

      const strategy = {
        channels: ['email' as const, 'sms' as const, 'in_app' as const, 'push' as const],
        bypassRateLimiting: true,
        immediateDelivery: true,
      };

      const deliveries = selector.buildDeliveries('user_1', strategy, timestamp);

      expect(deliveries).toHaveLength(3);
      expect(deliveries).toContainEqual({
        channel: 'in_app',
        status: 'sent',
        sentAt: timestamp,
      });
      expect(deliveries).toContainEqual({
        channel: 'email',
        status: 'sent',
        sentAt: timestamp,
        target: 'user@example.com',
      });
      expect(deliveries).toContainEqual({
        channel: 'sms',
        status: 'sent',
        sentAt: timestamp,
        target: '+1234567890',
      });
    });

    it('should handle user with no session', () => {
      const mockGetSession = jest.mocked(sessionStore.getSession);
      mockGetSession.mockReturnValue(undefined);

      const strategy = {
        channels: ['in_app' as const, 'email' as const, 'sms' as const],
        bypassRateLimiting: false,
        immediateDelivery: false,
      };

      const deliveries = selector.buildDeliveries('user_1', strategy, timestamp);

      expect(deliveries).toHaveLength(3);
      expect(deliveries[0]).toEqual({
        channel: 'in_app',
        status: 'sent',
        sentAt: timestamp,
      });
      expect(deliveries[1]).toEqual({
        channel: 'email',
        status: 'skipped',
        reason: 'No email on file',
      });
      expect(deliveries[2]).toEqual({
        channel: 'sms',
        status: 'skipped',
        reason: 'No phone number on file',
      });
    });

    it('should only include channels specified in strategy', () => {
      const mockGetSession = jest.mocked(sessionStore.getSession);
      mockGetSession.mockReturnValue({
        id: 'user_1',
        email: 'user@example.com',
        phone: '+1234567890',
        verified: true,
        hasWallet: true,
        onboardingCompleted: true,
        role: 'user',
        metadata: {
          createdAt: Date.now(),
          lastActivityAt: Date.now(),
          trustedIps: [],
        },
        expiresAt: Date.now() + 3600000,
      });

      const strategy = {
        channels: ['in_app' as const, 'push' as const],
        bypassRateLimiting: false,
        immediateDelivery: false,
      };

      const deliveries = selector.buildDeliveries('user_1', strategy, timestamp);

      expect(deliveries).toHaveLength(1);
      expect(deliveries[0].channel).toBe('in_app');
      expect(deliveries.find((d) => d.channel === 'email')).toBeUndefined();
      expect(deliveries.find((d) => d.channel === 'sms')).toBeUndefined();
    });
  });

  describe('integration with priority levels', () => {
    const timestamp = '2024-01-15T10:30:00Z';

    it('should build correct deliveries for critical priority', () => {
      const mockGetSession = jest.mocked(sessionStore.getSession);
      mockGetSession.mockReturnValue({
        id: 'user_1',
        email: 'user@example.com',
        phone: '+1234567890',
        verified: true,
        hasWallet: true,
        onboardingCompleted: true,
        role: 'user',
        metadata: {
          createdAt: Date.now(),
          lastActivityAt: Date.now(),
          trustedIps: [],
        },
        expiresAt: Date.now() + 3600000,
      });

      const strategy = selector.selectStrategy('critical');
      const deliveries = selector.buildDeliveries('user_1', strategy, timestamp);

      expect(deliveries.length).toBeGreaterThanOrEqual(3);
      expect(deliveries.some((d) => d.channel === 'in_app')).toBe(true);
      expect(deliveries.some((d) => d.channel === 'email')).toBe(true);
      expect(deliveries.some((d) => d.channel === 'sms')).toBe(true);
    });

    it('should build correct deliveries for high priority', () => {
      const mockGetSession = jest.mocked(sessionStore.getSession);
      mockGetSession.mockReturnValue({
        id: 'user_1',
        email: 'user@example.com',
        verified: true,
        hasWallet: true,
        onboardingCompleted: true,
        role: 'user',
        metadata: {
          createdAt: Date.now(),
          lastActivityAt: Date.now(),
          trustedIps: [],
        },
        expiresAt: Date.now() + 3600000,
      });

      const strategy = selector.selectStrategy('high');
      const deliveries = selector.buildDeliveries('user_1', strategy, timestamp);

      expect(deliveries.length).toBeGreaterThanOrEqual(2);
      expect(deliveries.some((d) => d.channel === 'in_app')).toBe(true);
      expect(deliveries.some((d) => d.channel === 'email')).toBe(true);
      expect(deliveries.some((d) => d.channel === 'sms')).toBe(false);
    });

    it('should build correct deliveries for medium priority', () => {
      const mockGetSession = jest.mocked(sessionStore.getSession);
      mockGetSession.mockReturnValue({
        id: 'user_1',
        verified: true,
        hasWallet: true,
        onboardingCompleted: true,
        role: 'user',
        metadata: {
          createdAt: Date.now(),
          lastActivityAt: Date.now(),
          trustedIps: [],
        },
        expiresAt: Date.now() + 3600000,
      });

      const strategy = selector.selectStrategy('medium');
      const deliveries = selector.buildDeliveries('user_1', strategy, timestamp);

      expect(deliveries).toHaveLength(1);
      expect(deliveries[0].channel).toBe('in_app');
      expect(deliveries.some((d) => d.channel === 'email')).toBe(false);
      expect(deliveries.some((d) => d.channel === 'sms')).toBe(false);
    });

    it('should build correct deliveries for low priority', () => {
      const mockGetSession = jest.mocked(sessionStore.getSession);
      mockGetSession.mockReturnValue({
        id: 'user_1',
        verified: true,
        hasWallet: true,
        onboardingCompleted: true,
        role: 'user',
        metadata: {
          createdAt: Date.now(),
          lastActivityAt: Date.now(),
          trustedIps: [],
        },
        expiresAt: Date.now() + 3600000,
      });

      const strategy = selector.selectStrategy('low');
      const deliveries = selector.buildDeliveries('user_1', strategy, timestamp);

      expect(deliveries).toHaveLength(1);
      expect(deliveries[0].channel).toBe('in_app');
      expect(deliveries.some((d) => d.channel === 'email')).toBe(false);
      expect(deliveries.some((d) => d.channel === 'sms')).toBe(false);
    });
  });
});
