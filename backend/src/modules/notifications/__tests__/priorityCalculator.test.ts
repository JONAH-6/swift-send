import { PriorityCalculator } from '../priorityCalculator';
import type { UserNotification } from '../notificationService';

describe('PriorityCalculator', () => {
  let calculator: PriorityCalculator;

  beforeEach(() => {
    calculator = new PriorityCalculator();
  });

  describe('calculatePriority', () => {
    it('should assign critical priority to fraud_flagged notifications', () => {
      const notification: UserNotification = {
        id: 'notif_1',
        userId: 'user_1',
        type: 'warning',
        title: 'Fraud Alert',
        message: 'Suspicious activity detected',
        createdAt: new Date().toISOString(),
        metadata: { kind: 'fraud_flagged' },
        deliveries: [],
      };

      const priority = calculator.calculatePriority(notification);
      expect(priority).toBe('critical');
    });

    it('should assign critical priority to error type with transfer_failed metadata', () => {
      const notification: UserNotification = {
        id: 'notif_2',
        userId: 'user_1',
        type: 'error',
        title: 'Transfer Failed',
        message: 'Transfer could not be completed',
        createdAt: new Date().toISOString(),
        metadata: { kind: 'transfer_failed' },
        deliveries: [],
      };

      const priority = calculator.calculatePriority(notification);
      expect(priority).toBe('critical');
    });

    it('should assign high priority to warning type notifications', () => {
      const notification: UserNotification = {
        id: 'notif_3',
        userId: 'user_1',
        type: 'warning',
        title: 'Warning',
        message: 'Something needs attention',
        createdAt: new Date().toISOString(),
        deliveries: [],
      };

      const priority = calculator.calculatePriority(notification);
      expect(priority).toBe('high');
    });

    it('should assign medium priority to success type with transfer_settled metadata', () => {
      const notification: UserNotification = {
        id: 'notif_4',
        userId: 'user_1',
        type: 'success',
        title: 'Transfer Confirmed',
        message: 'Transfer completed successfully',
        createdAt: new Date().toISOString(),
        metadata: { kind: 'transfer_settled' },
        deliveries: [],
      };

      const priority = calculator.calculatePriority(notification);
      expect(priority).toBe('medium');
    });

    it('should assign low priority to info type notifications', () => {
      const notification: UserNotification = {
        id: 'notif_5',
        userId: 'user_1',
        type: 'info',
        title: 'Information',
        message: 'Here is some information',
        createdAt: new Date().toISOString(),
        deliveries: [],
      };

      const priority = calculator.calculatePriority(notification);
      expect(priority).toBe('low');
    });

    it('should assign medium priority as default for unmatched notifications', () => {
      const notification: UserNotification = {
        id: 'notif_6',
        userId: 'user_1',
        type: 'success',
        title: 'Success',
        message: 'Something succeeded',
        createdAt: new Date().toISOString(),
        deliveries: [],
      };

      const priority = calculator.calculatePriority(notification);
      expect(priority).toBe('medium');
    });

    it('should assign medium priority to error type without transfer_failed metadata', () => {
      const notification: UserNotification = {
        id: 'notif_7',
        userId: 'user_1',
        type: 'error',
        title: 'Error',
        message: 'Some error occurred',
        createdAt: new Date().toISOString(),
        metadata: { kind: 'other_error' },
        deliveries: [],
      };

      const priority = calculator.calculatePriority(notification);
      expect(priority).toBe('medium');
    });

    it('should be idempotent - calculating priority multiple times produces same result', () => {
      const notification: UserNotification = {
        id: 'notif_8',
        userId: 'user_1',
        type: 'warning',
        title: 'Warning',
        message: 'Test warning',
        createdAt: new Date().toISOString(),
        deliveries: [],
      };

      const priority1 = calculator.calculatePriority(notification);
      const priority2 = calculator.calculatePriority(notification);
      const priority3 = calculator.calculatePriority(notification);

      expect(priority1).toBe(priority2);
      expect(priority2).toBe(priority3);
      expect(priority1).toBe('high');
    });
  });

  describe('enrichWithPriority', () => {
    it('should add priority metadata to notification', () => {
      const notification: UserNotification = {
        id: 'notif_9',
        userId: 'user_1',
        type: 'error',
        title: 'Transfer Failed',
        message: 'Transfer could not be completed',
        createdAt: new Date().toISOString(),
        metadata: { kind: 'transfer_failed' },
        deliveries: [],
      };

      const enriched = calculator.enrichWithPriority(notification);

      expect(enriched.priority).toBe('critical');
      expect(enriched.priorityColor).toBe('red');
      expect(enriched.isCritical).toBe(true);
      expect(enriched.id).toBe(notification.id);
      expect(enriched.userId).toBe(notification.userId);
    });

    it('should set correct color for critical priority', () => {
      const notification: UserNotification = {
        id: 'notif_10',
        userId: 'user_1',
        type: 'warning',
        title: 'Fraud Alert',
        message: 'Suspicious activity',
        createdAt: new Date().toISOString(),
        metadata: { kind: 'fraud_flagged' },
        deliveries: [],
      };

      const enriched = calculator.enrichWithPriority(notification);

      expect(enriched.priority).toBe('critical');
      expect(enriched.priorityColor).toBe('red');
      expect(enriched.isCritical).toBe(true);
    });

    it('should set correct color for high priority', () => {
      const notification: UserNotification = {
        id: 'notif_11',
        userId: 'user_1',
        type: 'warning',
        title: 'Warning',
        message: 'Warning message',
        createdAt: new Date().toISOString(),
        deliveries: [],
      };

      const enriched = calculator.enrichWithPriority(notification);

      expect(enriched.priority).toBe('high');
      expect(enriched.priorityColor).toBe('orange');
      expect(enriched.isCritical).toBe(false);
    });

    it('should set correct color for medium priority', () => {
      const notification: UserNotification = {
        id: 'notif_12',
        userId: 'user_1',
        type: 'success',
        title: 'Transfer Confirmed',
        message: 'Transfer completed',
        createdAt: new Date().toISOString(),
        metadata: { kind: 'transfer_settled' },
        deliveries: [],
      };

      const enriched = calculator.enrichWithPriority(notification);

      expect(enriched.priority).toBe('medium');
      expect(enriched.priorityColor).toBe('blue');
      expect(enriched.isCritical).toBe(false);
    });

    it('should set correct color for low priority', () => {
      const notification: UserNotification = {
        id: 'notif_13',
        userId: 'user_1',
        type: 'info',
        title: 'Information',
        message: 'Info message',
        createdAt: new Date().toISOString(),
        deliveries: [],
      };

      const enriched = calculator.enrichWithPriority(notification);

      expect(enriched.priority).toBe('low');
      expect(enriched.priorityColor).toBe('gray');
      expect(enriched.isCritical).toBe(false);
    });

    it('should preserve all original notification fields', () => {
      const notification: UserNotification = {
        id: 'notif_14',
        userId: 'user_1',
        type: 'success',
        title: 'Transfer Confirmed',
        message: 'Transfer completed',
        createdAt: '2024-01-15T10:30:00Z',
        readAt: '2024-01-15T10:35:00Z',
        transferId: 'transfer_123',
        metadata: { kind: 'transfer_settled', amount: 100 },
        deliveries: [
          { channel: 'in_app', status: 'sent', sentAt: '2024-01-15T10:30:00Z' },
        ],
      };

      const enriched = calculator.enrichWithPriority(notification);

      expect(enriched.id).toBe(notification.id);
      expect(enriched.userId).toBe(notification.userId);
      expect(enriched.type).toBe(notification.type);
      expect(enriched.title).toBe(notification.title);
      expect(enriched.message).toBe(notification.message);
      expect(enriched.createdAt).toBe(notification.createdAt);
      expect(enriched.readAt).toBe(notification.readAt);
      expect(enriched.transferId).toBe(notification.transferId);
      expect(enriched.metadata).toEqual(notification.metadata);
      expect(enriched.deliveries).toEqual(notification.deliveries);
    });
  });

  describe('edge cases', () => {
    it('should handle notification without metadata', () => {
      const notification: UserNotification = {
        id: 'notif_15',
        userId: 'user_1',
        type: 'success',
        title: 'Success',
        message: 'Success message',
        createdAt: new Date().toISOString(),
        deliveries: [],
      };

      const priority = calculator.calculatePriority(notification);
      expect(priority).toBe('medium');
    });

    it('should handle notification with empty metadata', () => {
      const notification: UserNotification = {
        id: 'notif_16',
        userId: 'user_1',
        type: 'success',
        title: 'Success',
        message: 'Success message',
        createdAt: new Date().toISOString(),
        metadata: {},
        deliveries: [],
      };

      const priority = calculator.calculatePriority(notification);
      expect(priority).toBe('medium');
    });

    it('should handle notification with metadata but no kind field', () => {
      const notification: UserNotification = {
        id: 'notif_17',
        userId: 'user_1',
        type: 'error',
        title: 'Error',
        message: 'Error message',
        createdAt: new Date().toISOString(),
        metadata: { someOtherField: 'value' },
        deliveries: [],
      };

      const priority = calculator.calculatePriority(notification);
      expect(priority).toBe('medium');
    });
  });
});
