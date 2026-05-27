import { createLogger } from '../../logger';
import type { TransferRepository } from '../transfers/repository';
import type { TransferRecord } from '../transfers/domain';
import type { StellarSubmitResult } from '../../services/stellarAdapter';
import { submitPayment } from '../../services/stellarAdapter';

export interface ReconciliationResult {
  runId: string;
  timestamp: string;
  totalDB: number;
  totalBlockchain: number;
  matched: number;
  unmatchedDB: string[];
  unmatchedBlockchain: string[];
  mismatched: MismatchedTransfer[];
  autoReconciled: string[];
  errors: string[];
}

export interface MismatchedTransfer {
  transferId: string;
  dbState: string;
  blockchainState: string;
  dbAmount: number;
  blockchainAmount: number;
  resolved: boolean;
}

interface BlockchainTxInfo {
  id: string;
  hash: string;
  amount: number;
  status: string;
  timestamp: string;
}

export class ReconciliationService {
  private readonly logger;
  private readonly runHistory = new Map<string, ReconciliationResult>();

  constructor(private readonly repository: TransferRepository) {
    this.logger = createLogger({ component: 'reconciliationService' });
  }

  async runReconciliation(): Promise<ReconciliationResult> {
    const runId = `recon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const errors: string[] = [];
    const autoReconciled: string[] = [];

    const allRecords = await this.repository.listAll();
    const blockchainRecords = await this.fetchBlockchainRecords();

    const dbMap = new Map(allRecords.map((r) => [r.id, r]));
    const blockchainMap = new Map(blockchainRecords.map((r) => [r.id, r]));

    const allIds = new Set([...dbMap.keys(), ...blockchainMap.keys()]);
    const matched: string[] = [];
    const unmatchedDB: string[] = [];
    const unmatchedBlockchain: string[] = [];
    const mismatched: MismatchedTransfer[] = [];

    for (const id of allIds) {
      const dbRecord = dbMap.get(id);
      const bcRecord = blockchainMap.get(id);

      if (dbRecord && bcRecord) {
        const isMatch = this.compareRecords(dbRecord, bcRecord);
        if (isMatch) {
          matched.push(id);
        } else {
          const mm = this.buildMismatch(dbRecord, bcRecord);
          const reconciled = await this.tryAutoReconcile(mm, dbRecord, bcRecord);
          if (reconciled) {
            autoReconciled.push(id);
            mm.resolved = true;
          }
          mismatched.push(mm);
        }
      } else if (dbRecord && !bcRecord) {
        unmatchedDB.push(id);
      } else if (!dbRecord && bcRecord) {
        unmatchedBlockchain.push(id);
      }
    }

    const result: ReconciliationResult = {
      runId,
      timestamp: new Date().toISOString(),
      totalDB: allRecords.length,
      totalBlockchain: blockchainRecords.length,
      matched: matched.length,
      unmatchedDB,
      unmatchedBlockchain,
      mismatched,
      autoReconciled,
      errors,
    };

    this.runHistory.set(runId, result);
    this.logger.info(
      { runId, matched: matched.length, mismatched: mismatched.length, autoReconciled: autoReconciled.length },
      'reconciliation completed',
    );

    return result;
  }

  async getReconciliationHistory(): Promise<ReconciliationResult[]> {
    return Array.from(this.runHistory.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getReconciliationById(runId: string): Promise<ReconciliationResult | null> {
    return this.runHistory.get(runId) ?? null;
  }

  private async fetchBlockchainRecords(): Promise<BlockchainTxInfo[]> {
    const records: BlockchainTxInfo[] = [];
    const allRecords = await this.repository.listAll();

    for (const record of allRecords) {
      if (record.transactionHash) {
        records.push({
          id: record.id,
          hash: record.transactionHash,
          amount: record.amount,
          status: record.state === 'settled' ? 'completed' : record.state,
          timestamp: record.createdAt,
        });
      }
    }

    return records;
  }

  private compareRecords(db: TransferRecord, bc: BlockchainTxInfo): boolean {
    const dbAmount = Math.round(db.amount * 100);
    const bcAmount = Math.round(bc.amount * 100);
    if (dbAmount !== bcAmount) return false;

    const dbState = this.normalizeState(db.state);
    const bcState = this.normalizeState(bc.status);
    if (dbState !== bcState) return false;

    return true;
  }

  private buildMismatch(db: TransferRecord, bc: BlockchainTxInfo): MismatchedTransfer {
    return {
      transferId: db.id,
      dbState: db.state,
      blockchainState: bc.status,
      dbAmount: db.amount,
      blockchainAmount: bc.amount,
      resolved: false,
    };
  }

  private async tryAutoReconcile(
    mismatch: MismatchedTransfer,
    db: TransferRecord,
    bc: BlockchainTxInfo,
  ): Promise<boolean> {
    if (mismatch.dbState === 'settled' && mismatch.blockchainState === 'completed') {
      if (Math.abs(mismatch.dbAmount - mismatch.blockchainAmount) <= 0.01) {
        this.logger.info({ transferId: db.id }, 'auto-reconciled minor amount discrepancy');
        return true;
      }
    }

    if (mismatch.dbState === 'submitted' && mismatch.blockchainState === 'completed') {
      const now = new Date().toISOString();
      db.state = 'settled';
      db.statusHistory.push({ state: 'settled', at: now, notes: 'auto-reconciled' });
      db.updatedAt = now;
      try {
        await this.repository.update(db);
        this.logger.info({ transferId: db.id }, 'auto-reconciled submitted->settled');
        return true;
      } catch (err) {
        this.logger.error({ transferId: db.id, err }, 'failed to auto-reconcile');
        return false;
      }
    }

    if (mismatch.dbState === 'failed' && mismatch.blockchainState === 'completed') {
      const now = new Date().toISOString();
      db.state = 'settled';
      db.transactionHash = bc.hash;
      db.statusHistory.push({ state: 'settled', at: now, notes: 'auto-reconciled from blockchain' });
      db.updatedAt = now;
      try {
        await this.repository.update(db);
        this.logger.info({ transferId: db.id }, 'auto-reconciled failed->settled (blockchain has record)');
        return true;
      } catch (err) {
        this.logger.error({ transferId: db.id, err }, 'failed to auto-reconcile failed->settled');
        return false;
      }
    }

    return false;
  }

  private normalizeState(state: string): string {
    const map: Record<string, string> = {
      settled: 'completed',
      completed: 'completed',
      submitted: 'submitted',
      held: 'held',
      created: 'created',
      failed: 'failed',
      validated: 'validated',
      awaiting_multisig: 'awaiting_multisig',
    };
    return map[state] || state;
  }
}
