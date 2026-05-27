import type { EscrowEntry, EscrowStatus } from '@/types/escrow';

type EscrowStatusListener = (entry: EscrowEntry) => void;

const listeners = new Set<EscrowStatusListener>();
const escrowStore = new Map<string, EscrowEntry>();

export async function ensureEscrow(
  transferId: string,
  amount: number,
  currency: string,
): Promise<EscrowEntry | null> {
  const existing = escrowStore.get(transferId);
  if (existing) return existing;

  const entry: EscrowEntry = {
    id: `escrow_${transferId}`,
    transferId,
    amount,
    currency,
    status: 'held',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expectedReleaseAt: new Date(Date.now() + 300_000).toISOString(),
  };

  escrowStore.set(transferId, entry);
  return entry;
}

export function onEscrowStatusChange(listener: EscrowStatusListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function updateEscrowStatus(transferId: string, status: EscrowStatus): EscrowEntry | null {
  const entry = escrowStore.get(transferId);
  if (!entry) return null;

  entry.status = status;
  entry.updatedAt = new Date().toISOString();
  listeners.forEach((listener) => listener(entry));
  return entry;
}
