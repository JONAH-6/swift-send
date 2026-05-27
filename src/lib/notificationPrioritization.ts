import type { UserNotification, NotificationCategory, NotificationPriority, NotificationGroup } from '@/types/activity';

const PRIORITY_WEIGHTS: Record<NotificationPriority, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

const CATEGORY_PRIORITY: Record<NotificationCategory, number> = {
  security: 100,
  compliance: 90,
  transaction: 70,
  account: 60,
  system: 40,
  marketing: 20,
};

/**
 * Calculate the overall priority score for a notification
 * Based on priority level, category, recency, and read status
 */
export function calculateNotificationScore(notification: UserNotification): number {
  let score = PRIORITY_WEIGHTS[notification.priority];
  
  // Add category weight
  score += CATEGORY_PRIORITY[notification.category];
  
  // Boost for unread notifications
  if (!notification.readAt) {
    score += 30;
  }
  
  // Recency boost (more recent = higher score)
  const hoursSinceCreation = (Date.now() - notification.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreation < 1) {
    score += 20;
  } else if (hoursSinceCreation < 24) {
    score += 10;
  }
  
  // Deduct for expired notifications
  if (notification.expiresAt && new Date() > notification.expiresAt) {
    score -= 50;
  }
  
  return score;
}

/**
 * Sort notifications by priority score (highest first)
 */
export function sortNotificationsByPriority(notifications: UserNotification[]): UserNotification[] {
  return [...notifications].sort((a, b) => {
    const scoreA = calculateNotificationScore(a);
    const scoreB = calculateNotificationScore(b);
    return scoreB - scoreA;
  });
}

/**
 * Filter notifications by priority level
 */
export function filterNotificationsByPriority(
  notifications: UserNotification[],
  minPriority: NotificationPriority
): UserNotification[] {
  const minScore = PRIORITY_WEIGHTS[minPriority];
  return notifications.filter(n => calculateNotificationScore(n) >= minScore);
}

/**
 * Get critical notifications (highest priority)
 */
export function getCriticalNotifications(notifications: UserNotification[]): UserNotification[] {
  return notifications.filter(n => 
    n.priority === 'critical' && !n.readAt && 
    (!n.expiresAt || new Date() < n.expiresAt)
  );
}

/**
 * Group notifications by category
 */
export function groupNotificationsByCategory(notifications: UserNotification[]): NotificationGroup[] {
  const groups: Record<string, NotificationGroup> = {};
  
  notifications.forEach(notification => {
    const category = notification.category;
    
    if (!groups[category]) {
      groups[category] = {
        category,
        count: 0,
        latestTimestamp: notification.createdAt,
        notifications: [],
      };
    }
    
    groups[category].count++;
    groups[category].notifications.push(notification);
    
    // Update latest timestamp
    if (notification.createdAt > groups[category].latestTimestamp) {
      groups[category].latestTimestamp = notification.createdAt;
    }
  });
  
  return Object.values(groups).sort((a, b) => {
    // Sort by category priority, then by count
    const priorityDiff = CATEGORY_PRIORITY[b.category] - CATEGORY_PRIORITY[a.category];
    if (priorityDiff !== 0) return priorityDiff;
    return b.count - a.count;
  });
}

/**
 * Group notifications by time period
 */
export function groupNotificationsByTime(notifications: UserNotification[]): Record<string, UserNotification[]> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return {
    recent: notifications.filter(n => n.createdAt >= oneHourAgo),
    today: notifications.filter(n => n.createdAt >= oneDayAgo && n.createdAt < oneHourAgo),
    thisWeek: notifications.filter(n => n.createdAt >= oneWeekAgo && n.createdAt < oneDayAgo),
    older: notifications.filter(n => n.createdAt < oneWeekAgo),
  };
}

/**
 * Get notification category display info
 */
export function getCategoryInfo(category: NotificationCategory) {
  const categoryConfig = {
    transaction: {
      label: 'Transactions',
      icon: '💸',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    },
    security: {
      label: 'Security',
      icon: '🔒',
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
    },
    account: {
      label: 'Account',
      icon: '👤',
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    },
    compliance: {
      label: 'Compliance',
      icon: '⚖️',
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    },
    system: {
      label: 'System',
      icon: '⚙️',
      color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    },
    marketing: {
      label: 'Marketing',
      icon: '📢',
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
    },
  };
  
  return categoryConfig[category];
}

/**
 * Get priority display info
 */
export function getPriorityInfo(priority: NotificationPriority) {
  const priorityConfig = {
    critical: {
      label: 'Critical',
      color: 'bg-red-500 text-white',
      borderColor: 'border-red-500',
      icon: '🚨',
    },
    high: {
      label: 'High',
      color: 'bg-orange-500 text-white',
      borderColor: 'border-orange-500',
      icon: '⚠️',
    },
    medium: {
      label: 'Medium',
      color: 'bg-yellow-500 text-white',
      borderColor: 'border-yellow-500',
      icon: '📋',
    },
    low: {
      label: 'Low',
      color: 'bg-gray-500 text-white',
      borderColor: 'border-gray-500',
      icon: 'ℹ️',
    },
  };
  
  return priorityConfig[priority];
}

/**
 * Auto-categorize a notification based on its content
 * This is a helper function for backend or when category is not set
 */
export function autoCategorizeNotification(
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message: string
): NotificationCategory {
  const content = `${title} ${message}`.toLowerCase();
  
  // Security-related keywords
  if (content.includes('security') || content.includes('phishing') || 
      content.includes('unauthorized') || content.includes('suspicious') ||
      content.includes('login') || content.includes('password') ||
      content.includes('device') || content.includes('verification')) {
    return 'security';
  }
  
  // Compliance-related keywords
  if (content.includes('compliance') || content.includes('kyc') ||
      content.includes('verification') || content.includes('limit') ||
      content.includes('regulation') || content.includes('aml')) {
    return 'compliance';
  }
  
  // Transaction-related keywords
  if (content.includes('transfer') || content.includes('sent') ||
      content.includes('received') || content.includes('payment') ||
      content.includes('transaction') || content.includes('refund')) {
    return 'transaction';
  }
  
  // Account-related keywords
  if (content.includes('account') || content.includes('profile') ||
      content.includes('balance') || content.includes('wallet')) {
    return 'account';
  }
  
  // Marketing-related keywords
  if (content.includes('offer') || content.includes('promotion') ||
      content.includes('deal') || content.includes('discount')) {
    return 'marketing';
  }
  
  // Default to system
  return 'system';
}

/**
 * Auto-prioritize a notification based on its content and type
 */
export function autoPrioritizeNotification(
  type: 'success' | 'error' | 'warning' | 'info',
  category: NotificationCategory,
  title: string,
  message: string
): NotificationPriority {
  const content = `${title} ${message}`.toLowerCase();
  
  // Critical indicators
  if (type === 'error' && category === 'security') {
    return 'critical';
  }
  
  if (content.includes('failed') && category === 'transaction') {
    return 'high';
  }
  
  if (content.includes('blocked') || content.includes('suspended')) {
    return 'critical';
  }
  
  if (content.includes('urgent') || content.includes('immediate')) {
    return 'critical';
  }
  
  // High priority indicators
  if (type === 'error') {
    return 'high';
  }
  
  if (category === 'security' || category === 'compliance') {
    return 'high';
  }
  
  if (type === 'warning') {
    return 'medium';
  }
  
  // Medium priority
  if (category === 'transaction' || category === 'account') {
    return 'medium';
  }
  
  // Low priority
  if (category === 'marketing') {
    return 'low';
  }
  
  if (type === 'info') {
    return 'low';
  }
  
  return 'medium';
}
