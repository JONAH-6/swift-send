import type { UserNotification } from './notificationService';
import type { PriorityLevel, PriorityMetadata } from './priorityCalculator';

export type EnrichedNotification = UserNotification & PriorityMetadata;

export interface NotificationGroup {
  id: string;
  type: 'transfer' | 'time_window';
  notifications: EnrichedNotification[];
  representative: EnrichedNotification;
  count: number;
  hasUnread: boolean;
  createdAt: string;
  priority: PriorityLevel;
}

export class NotificationGrouper {
  private readonly TIME_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Group notifications by transfer ID and time window.
   * Returns both grouped and ungrouped notifications.
   */
  groupNotifications(
    notifications: EnrichedNotification[],
  ): {
    groups: NotificationGroup[];
    ungrouped: EnrichedNotification[];
  } {
    const transferGroups = this.groupByTransfer(notifications);
    const remainingNotifications = notifications.filter(
      (n) => !n.transferId || !this.isInTransferGroup(n, transferGroups),
    );
    
    const timeWindowGroups = this.groupByTimeWindow(remainingNotifications);
    const ungrouped = remainingNotifications.filter(
      (n) => !this.isInTimeWindowGroup(n, timeWindowGroups),
    );

    return {
      groups: [...transferGroups, ...timeWindowGroups],
      ungrouped,
    };
  }

  /**
   * Group notifications that share the same transferId.
   */
  private groupByTransfer(
    notifications: EnrichedNotification[],
  ): NotificationGroup[] {
    const transferMap = new Map<string, EnrichedNotification[]>();

    for (const notification of notifications) {
      if (notification.transferId) {
        const existing = transferMap.get(notification.transferId) || [];
        existing.push(notification);
        transferMap.set(notification.transferId, existing);
      }
    }

    const groups: NotificationGroup[] = [];
    for (const [transferId, groupNotifications] of transferMap.entries()) {
      // Only create a group if there are 2+ notifications
      if (groupNotifications.length >= 2) {
        const sorted = this.sortByTimestamp(groupNotifications);
        const representative = sorted[0]; // Most recent

        groups.push({
          id: `transfer_${transferId}`,
          type: 'transfer',
          notifications: sorted,
          representative,
          count: sorted.length,
          hasUnread: sorted.some((n) => !n.readAt),
          createdAt: representative.createdAt,
          priority: representative.priority,
        });
      }
    }

    return groups;
  }

  /**
   * Group notifications by type, priority, and time window.
   * Excludes critical notifications from time-based grouping.
   */
  private groupByTimeWindow(
    notifications: EnrichedNotification[],
  ): NotificationGroup[] {
    // Exclude critical notifications from time-based grouping
    const eligibleNotifications = notifications.filter((n) => n.priority !== 'critical');
    
    const groups: NotificationGroup[] = [];
    const processed = new Set<string>();

    for (const notification of eligibleNotifications) {
      if (processed.has(notification.id)) continue;

      const matchingNotifications = this.findTimeWindowMatches(
        notification,
        eligibleNotifications,
        processed,
      );

      // Only create a group if there are 2+ notifications
      if (matchingNotifications.length >= 2) {
        const sorted = this.sortByTimestamp(matchingNotifications);
        const representative = sorted[0]; // Most recent

        groups.push({
          id: `time_${notification.type}_${notification.priority}_${Date.now()}`,
          type: 'time_window',
          notifications: sorted,
          representative,
          count: sorted.length,
          hasUnread: sorted.some((n) => !n.readAt),
          createdAt: representative.createdAt,
          priority: representative.priority,
        });

        matchingNotifications.forEach((n) => processed.add(n.id));
      }
    }

    return groups;
  }

  /**
   * Find notifications that match type, priority, and fall within time window.
   */
  private findTimeWindowMatches(
    anchor: EnrichedNotification,
    candidates: EnrichedNotification[],
    processed: Set<string>,
  ): EnrichedNotification[] {
    const anchorTime = new Date(anchor.createdAt).getTime();
    const matches: EnrichedNotification[] = [];

    for (const candidate of candidates) {
      if (processed.has(candidate.id)) continue;

      const candidateTime = new Date(candidate.createdAt).getTime();
      const timeDiff = Math.abs(anchorTime - candidateTime);

      if (
        candidate.type === anchor.type &&
        candidate.priority === anchor.priority &&
        timeDiff <= this.TIME_WINDOW_MS
      ) {
        matches.push(candidate);
      }
    }

    return matches;
  }

  /**
   * Check if notification is in a transfer group.
   */
  private isInTransferGroup(
    notification: EnrichedNotification,
    groups: NotificationGroup[],
  ): boolean {
    return groups.some((g) => g.notifications.some((n) => n.id === notification.id));
  }

  /**
   * Check if notification is in a time window group.
   */
  private isInTimeWindowGroup(
    notification: EnrichedNotification,
    groups: NotificationGroup[],
  ): boolean {
    return groups.some((g) => g.notifications.some((n) => n.id === notification.id));
  }

  /**
   * Sort notifications by timestamp in descending order (newest first).
   */
  private sortByTimestamp(
    notifications: EnrichedNotification[],
  ): EnrichedNotification[] {
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}
