import { createLogger } from '../../logger';
import type { EventBus, DomainEvent } from '../../core/eventBus';
import type { TransferFlaggedEventPayload } from '../transfers/events';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface AdminAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  transferId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export class AdminAlertService {
  private alerts: AdminAlert[] = [];
  private logger = createLogger({ component: 'adminAlertService' });

  constructor(private readonly eventBus: EventBus) {
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    this.eventBus.subscribe<{
      transferId: string;
      userId: string;
      amount: number;
      currency: string;
      recipientName: string;
      error?: string;
    }>('transfer.failed', async (event: DomainEvent<{ userId: string; transferId: string; amount: number; currency: string; recipientName: string; error?: string }>) => {
      this.createAlert({
        type: 'transfer_failed',
        severity: event.payload.amount > 10000 ? 'critical' : 'high',
        title: 'Transfer Failed',
        message: `Transfer of $${event.payload.amount.toFixed(2)} ${event.payload.currency} to ${event.payload.recipientName} failed.${event.payload.error ? ` Error: ${event.payload.error}` : ''}`,
        transferId: event.payload.transferId,
        userId: event.payload.userId,
        metadata: { amount: event.payload.amount, currency: event.payload.currency },
      });
    });

    this.eventBus.subscribe<{
      jobId: string;
      transferId: string;
      error?: string;
    }>('queue.transfer_failed', async (event: DomainEvent<{ jobId: string; transferId: string; error?: string }>) => {
      this.createAlert({
        type: 'queue_failure',
        severity: 'high',
        title: 'Queue Processing Failure',
        message: `Transfer ${event.payload.transferId} failed in queue with error: ${event.payload.error || 'Unknown error'}`,
        transferId: event.payload.transferId,
        metadata: { jobId: event.payload.jobId },
      });
    });

    this.eventBus.subscribe<TransferFlaggedEventPayload>('transfer.flagged', async (event: DomainEvent<TransferFlaggedEventPayload>) => {
      this.createAlert({
        type: 'fraud_flagged',
        severity: event.payload.assessment.score > 80 ? 'critical' : 'high',
        title: 'Fraud Flagged Transfer',
        message: `Transfer of $${event.payload.amount.toFixed(2)} to ${event.payload.recipientName} flagged with score ${event.payload.assessment.score}.`,
        transferId: event.payload.transferId,
        userId: event.payload.userId,
        metadata: { score: event.payload.assessment.score },
      });
    });
  }

  createAlert(input: {
    type: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    transferId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }): AdminAlert {
    const alert: AdminAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: input.type,
      severity: input.severity,
      title: input.title,
      message: input.message,
      transferId: input.transferId,
      userId: input.userId,
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
    };

    this.alerts.unshift(alert);

    if (this.alerts.length > 500) {
      this.alerts = this.alerts.slice(0, 500);
    }

    this.logger.info({ alertId: alert.id, type: alert.type, severity: alert.severity }, 'admin alert created');

    void this.eventBus.publish({
      type: 'admin.alert.created',
      timestamp: alert.createdAt,
      payload: { alertId: alert.id, severity: alert.severity, type: alert.type },
    });

    return alert;
  }

  getAlerts(limit = 50, severity?: AlertSeverity): AdminAlert[] {
    let filtered = this.alerts;
    if (severity) {
      filtered = filtered.filter((a) => a.severity === severity);
    }
    return filtered.slice(0, limit);
  }

  acknowledgeAlert(alertId: string, userId: string): AdminAlert | null {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return null;
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = userId;
    return alert;
  }

  getAlertStats(): {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    unacknowledged: number;
  } {
    const unacknowledged = this.alerts.filter((a) => !a.acknowledgedAt);
    return {
      total: this.alerts.length,
      critical: this.alerts.filter((a) => a.severity === 'critical').length,
      high: this.alerts.filter((a) => a.severity === 'high').length,
      medium: this.alerts.filter((a) => a.severity === 'medium').length,
      low: this.alerts.filter((a) => a.severity === 'low').length,
      unacknowledged: unacknowledged.length,
    };
  }

  getAlertsByTransferId(transferId: string): AdminAlert[] {
    return this.alerts.filter((a) => a.transferId === transferId);
  }
}
