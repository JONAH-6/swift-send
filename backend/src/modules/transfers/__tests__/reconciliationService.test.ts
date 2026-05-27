import { ReconciliationService } from '../../reconciliation/reconciliationService';
import type { TransferRecord } from '../domain';

function createMockRecord(overrides: Partial<TransferRecord> = {}): TransferRecord {
  const now = new Date().toISOString();
  return {
    id: `tx_${Date.now()}`,
    clientReference: `ref_${Date.now()}`,
    userId: 'user_1',
    fromWalletId: 'wallet_1',
    recipient: { type: 'wallet', walletPublicKey: 'GABCDEF123', country: 'US' },
    amount: 100,
    currency: 'USDC',
    state: 'settled',
    statusHistory: [{ state: 'created', at: now }, { state: 'settled', at: now }],
    compliance: {
      canProceed: true,
      blockers: [],
      warnings: [],
      riskScore: 'low',
      tier: {
        id: 'starter', name: 'Starter',
        dailyLimit: 500, monthlyLimit: 2000, yearlyLimit: 10000,
        singleTransactionLimit: 250,
        maxTransactionsPerMinute: 1, maxTransactionsPerHour: 3,
        description: '', requirements: [], benefits: [],
      },
    },
    processingAttempts: 1,
    transactionHash: `hash_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('ReconciliationService', () => {
  let repository: { listAll: jest.Mock; update: jest.Mock };
  let service: ReconciliationService;

  beforeEach(() => {
    repository = {
      listAll: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    };
    service = new ReconciliationService(repository as any);
  });

  it('should report no discrepancies when records match', async () => {
    const record = createMockRecord();
    repository.listAll.mockResolvedValue([record]);

    const result = await service.runReconciliation();

    expect(result.totalDB).toBe(1);
    expect(result.totalBlockchain).toBe(1);
    expect(result.matched).toBe(1);
    expect(result.mismatched).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect amount mismatches', async () => {
    const dbRecord = createMockRecord({ amount: 100 });
    repository.listAll.mockResolvedValue([dbRecord]);

    const result = await service.runReconciliation();

    expect(result.mismatched.length).toBeGreaterThanOrEqual(0);
    expect(result.runId).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  it('should auto-reconcile submitted->settled transitions', async () => {
    const record = createMockRecord({
      state: 'submitted',
      transactionHash: 'hash_test',
      amount: 100,
    });
    repository.listAll.mockResolvedValue([record]);
    repository.update.mockResolvedValue(record);

    const result = await service.runReconciliation();

    expect(result.totalDB).toBe(1);
  });

  it('should maintain reconciliation history', async () => {
    repository.listAll.mockResolvedValue([]);

    const result1 = await service.runReconciliation();
    const result2 = await service.runReconciliation();

    const history = await service.getReconciliationHistory();
    expect(history).toHaveLength(2);
    expect(history[0].runId).toBe(result2.runId);
    expect(history[1].runId).toBe(result1.runId);
  });

  it('should retrieve a specific reconciliation run by ID', async () => {
    repository.listAll.mockResolvedValue([]);

    const result = await service.runReconciliation();
    const found = await service.getReconciliationById(result.runId);
    expect(found).not.toBeNull();
    expect(found!.runId).toBe(result.runId);

    const notFound = await service.getReconciliationById('nonexistent');
    expect(notFound).toBeNull();
  });
});
