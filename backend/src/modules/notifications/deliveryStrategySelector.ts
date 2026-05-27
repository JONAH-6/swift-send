import { getSession } from '../../auth/sessionStore';
import type { PriorityLevel } from './priorityCalculator';
import type { NotificationDelivery } from './notificationService';

export type NotificationChannel = 'email' | 'sms' | 'in_app' | 'push';

export interface DeliveryStrategy {
  channels: NotificationChannel[];
  bypassRateLimiting: boolean;
  immediateDelivery: boolean;
}

export class DeliveryStrategySelector {
  /**
   * Select delivery channels based on priority level.
   * 
   * Rules:
   * - critical: all channels (email, sms, in_app, push), immediate, bypass rate limiting
   * - high: in_app, email, push
   * - medium: in_app, push
   * - low: in_app, push
   */
  selectStrategy(priority: PriorityLevel): DeliveryStrategy {
    switch (priority) {
      case 'critical':
        return {
          channels: ['email', 'sms', 'in_app', 'push'],
          bypassRateLimiting: true,
          immediateDelivery: true,
        };
      case 'high':
        return {
          channels: ['in_app', 'email', 'push'],
          bypassRateLimiting: false,
          immediateDelivery: false,
        };
      case 'medium':
      case 'low':
        return {
          channels: ['in_app', 'push'],
          bypassRateLimiting: false,
          immediateDelivery: false,
        };
    }
  }

  /**
   * Build delivery records based on strategy and user session.
   * Replaces the existing buildDeliveries() method logic.
   */
  buildDeliveries(
    userId: string,
    strategy: DeliveryStrategy,
    timestamp: string,
  ): NotificationDelivery[] {
    const session = getSession(userId);
    const deliveries: NotificationDelivery[] = [];

    // In-app is always included
    if (strategy.channels.includes('in_app')) {
      deliveries.push({
        channel: 'in_app',
        status: 'sent',
        sentAt: timestamp,
      });
    }

    // Email delivery
    if (strategy.channels.includes('email')) {
      if (session?.email) {
        deliveries.push({
          channel: 'email',
          status: 'sent',
          sentAt: timestamp,
          target: session.email,
        });
      } else {
        deliveries.push({
          channel: 'email',
          status: 'skipped',
          reason: 'No email on file',
        });
      }
    }

    // SMS delivery
    if (strategy.channels.includes('sms')) {
      if (session?.phone) {
        deliveries.push({
          channel: 'sms',
          status: 'sent',
          sentAt: timestamp,
          target: session.phone,
        });
      } else {
        deliveries.push({
          channel: 'sms',
          status: 'skipped',
          reason: 'No phone number on file',
        });
      }
    }

    return deliveries;
  }
}
