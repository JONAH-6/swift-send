import { NotificationService } from '../notificationService';
import { EventBus } from '../../../core/eventBus';

describe('NotificationService - Enriched List', () => {
  let service: NotificationService;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    service = new NotificationService(eventBus);
  });

  describe('listByUserIdEnriched', () => {
    it('should return enriched notification list with priority metadata', async () => {
      const userId = 'user123';

      // Create notifications with different priorities
      await service.notifyFraudFlagged({
        userId,
        transferId: 'transfer1',
        score: 85,
        flags: ['unusual_pattern'],
      });

      await service.notifyTransferSettled({
        userId,
        transferId: 'transfer2',
        amount: 100,
        recipientName: 'Alice',
      });

      const result = service.listByUserIdEnriched(userId);

      expect(result.items).toBeDefined();
      expect(result.groups).toBeDefined();
      expect(result.unreadCounts).toBeDefined();

      // Check that items have priority metadata
      expect(result.items.length).toBeGreaterThan(0);
      const firstItem = result.items[0];
      expect(firstItem).toHaveProperty('priority');
      expect(firstItem).toHaveProperty('priorityColor');
      expect(firstItem).toHaveProperty('isCritical');
    });

    it('should calculate unread counts correctly', async () => {
      const userId = 'user456';

      // Create 2 critical, 1 medium notification
      await service.notifyFraudFlagged({
        userId,
        transferId: 'transfer1',
        score: 90,
        flags: ['fraud'],
      });

      await service.notifyTransferFailed({
        userId,
        transferId: 'transfer2',
        amount: 50,
        recipientName: 'Bob',
      });

      await service.notifyTransferSettled({
        userId,
        transferId: 'transfer3',
        amount: 75,
        recipientName: 'Charlie',
      });

      const result = service.listByUserIdEnriched(userId);

      expect(result.unreadCounts.total).toBe(3);
      expect(result.unreadCounts.critical).toBe(2);
      expect(result.unreadCounts.high).toBe(0);
      expect(result.unreadCounts.medium).toBe(1);
      expect(result.unreadCounts.low).toBe(0);
    });

    it('should sort notifications by priority then timestamp', async () => {
      const userId = 'user789';

      // Create in order: medium, critical, medium
      await service.notifyTransferSettled({
        userId,
        transferId: 'transfer1',
        amount: 100,
        recipientName: 'Alice',
      });

      await service.notifyFraudFlagged({
        userId,
        transferId: 'transfer2',
        score: 95,
        flags: ['fraud'],
      });

      await service.notifyTransferSettled({
        userId,
        transferId: 'transfer3',
        amount: 200,
        recipientName: 'Bob',
      });

      const result = service.listByUserIdEnriched(userId);

      // Critical should be first, then medium notifications by timestamp
      expect(result.items[0].priority).toBe('critical');
      expect(result.items[1].priority).toBe('medium');
      expect(result.items[2].priority).toBe('medium');
    });

    it('should apply limit to ungrouped items', async () => {
      const userId = 'user999';

      // Create 5 notifications
      for (let i = 0; i < 5; i++) {
        await service.notifyTransferSettled({
          userId,
          transferId: `transfer${i}`,
          amount: 100 + i,
          recipientName: `User${i}`,
        });
      }

      const result = service.listByUserIdEnriched(userId, 3);

      // Should only return 3 items (or less if some are grouped)
      expect(result.items.length).toBeLessThanOrEqual(3);
    });

    it('should group notifications by transferId', async () => {
      const userId = 'user111';

      // Create multiple notifications for same transfer
      await service.notifyTransferSettled({
        userId,
        transferId: 'transfer1',
        amount: 100,
        recipientName: 'Alice',
      });

      await service.notifyTransferFailed({
        userId,
        transferId: 'transfer1',
        amount: 100,
        recipientName: 'Alice',
      });

      const result = service.listByUserIdEnriched(userId);

      // Should have at least one group
      expect(result.groups.length).toBeGreaterThan(0);
      const group = result.groups[0];
      expect(group.type).toBe('transfer');
      expect(group.count).toBe(2);
      expect(group.notifications.length).toBe(2);
      expect(group).toHaveProperty('representative');
      expect(group).toHaveProperty('priority');
    });

    it('should update unread counts when notification is marked as read', async () => {
      const userId = 'user222';

      const notification = await service.notifyFraudFlagged({
        userId,
        transferId: 'transfer1',
        score: 90,
        flags: ['fraud'],
      });

      const beforeRead = service.listByUserIdEnriched(userId);
      expect(beforeRead.unreadCounts.critical).toBe(1);
      expect(beforeRead.unreadCounts.total).toBe(1);

      service.markAsRead(userId, notification.id);

      const afterRead = service.listByUserIdEnriched(userId);
      expect(afterRead.unreadCounts.critical).toBe(0);
      expect(afterRead.unreadCounts.total).toBe(0);
    });
  });
});
