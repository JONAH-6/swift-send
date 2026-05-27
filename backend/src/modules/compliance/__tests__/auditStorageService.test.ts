import { AuditStorageService } from '../auditStorageService';
import { EventBus } from '../../../core/eventBus';
import type { ComplianceLog } from '../complianceLogService';

function createSampleLog(overrides: Partial<ComplianceLog> = {}): ComplianceLog {
  return {
    id: `log_${Date.now()}`,
    userId: 'user_1',
    transferId: 'tx_1',
    checkType: 'aml',
    status: 'passed',
    riskScore: 10,
    flags: [],
    metadata: { amount: 100 },
    checkedAt: new Date().toISOString(),
    checkedBy: 'system',
    ...overrides,
  };
}

describe('AuditStorageService', () => {
  let eventBus: EventBus;
  let service: AuditStorageService;
  let publishSpy: jest.SpyInstance;

  beforeEach(() => {
    eventBus = new EventBus();
    service = new AuditStorageService(eventBus);
    publishSpy = jest.spyOn(eventBus, 'publish');
  });

  afterEach(() => {
    publishSpy.mockRestore();
  });

  it('should store an audit record with a valid hash', async () => {
    const log = createSampleLog();
    const record = await service.storeAuditRecord(log);

    expect(record.id).toBeDefined();
    expect(record.logId).toBe(log.id);
    expect(record.hash).toBeDefined();
    expect(record.hash.length).toBe(64);
    expect(record.previousHash).toBeDefined();
    expect(record.storedAt).toBeDefined();
  });

  it('should chain audit records sequentially', async () => {
    const log1 = createSampleLog({ id: 'log_1' });
    const log2 = createSampleLog({ id: 'log_2' });
    const log3 = createSampleLog({ id: 'log_3' });

    const record1 = await service.storeAuditRecord(log1);
    const record2 = await service.storeAuditRecord(log2);
    const record3 = await service.storeAuditRecord(log3);

    expect(record2.previousHash).toBe(record1.hash);
    expect(record3.previousHash).toBe(record2.hash);
  });

  it('should verify integrity of stored records', async () => {
    const log1 = createSampleLog({ id: 'log_int_1', userId: 'user_int' });
    const log2 = createSampleLog({ id: 'log_int_2', userId: 'user_int' });

    await service.storeAuditRecord(log1);
    await service.storeAuditRecord(log2);

    const results = await service.verifyIntegrity();
    expect(results.length).toBeGreaterThanOrEqual(2);
    results.forEach((r) => {
      expect(r.hashValid).toBe(true);
      expect(r.chainValid).toBe(true);
      expect(r.tampered).toBe(false);
    });
  });

  it('should publish event when audit record is stored', async () => {
    const log = createSampleLog();
    const record = await service.storeAuditRecord(log);

    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'compliance.audit_stored',
        payload: expect.objectContaining({
          auditId: record.id,
          logId: log.id,
          hash: record.hash,
        }),
      }),
    );
  });

  it('should retrieve audit records by log ID', async () => {
    const log = createSampleLog({ id: 'log_retrieve' });
    await service.storeAuditRecord(log);

    const records = await service.getAuditRecordsByLogId('log_retrieve');
    expect(records).toHaveLength(1);
    expect(records[0].logId).toBe('log_retrieve');
  });

  it('should retrieve audit records by user ID', async () => {
    await service.storeAuditRecord(createSampleLog({ id: 'log_u1', userId: 'user_a' }));
    await service.storeAuditRecord(createSampleLog({ id: 'log_u2', userId: 'user_b' }));
    await service.storeAuditRecord(createSampleLog({ id: 'log_u3', userId: 'user_a' }));

    const records = await service.getAuditRecordsByUserId('user_a');
    expect(records).toHaveLength(2);
  });

  it('should generate compliance report with integrity stats', async () => {
    await service.storeAuditRecord(createSampleLog({ userId: 'user_rpt' }));
    await service.storeAuditRecord(createSampleLog({ userId: 'user_rpt' }));

    const report = await service.getComplianceReport();
    expect(report.totalRecords).toBeGreaterThanOrEqual(2);
    expect(report.tamperedRecords).toBe(0);
    expect(report.integrityPassRate).toBe(100);
  });

  it('should filter compliance report by user ID', async () => {
    await service.storeAuditRecord(createSampleLog({ id: 'log_f1', userId: 'user_f1' }));
    await service.storeAuditRecord(createSampleLog({ id: 'log_f2', userId: 'user_f2' }));

    const report = await service.getComplianceReport({ userId: 'user_f1' });
    expect(report.records.length).toBeGreaterThanOrEqual(1);
    report.records.forEach((r) => {
      expect(r.userId).toBe('user_f1');
    });
  });

  it('should return null for non-existent audit record', async () => {
    const record = await service.getAuditRecord('nonexistent');
    expect(record).toBeNull();
  });
});
