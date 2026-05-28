import type { FastifyInstance } from 'fastify';
import { requireVerifiedSession } from '../middleware/authenticate';
import type { JwtSessionPayload, PublicUser } from '../auth/sessionTypes';
import { getSession, saveSession } from '../auth/sessionStore';
import { ValidationError } from '../errors';
import { recoveryRateLimiter } from '../auth/rateLimiter';
import {
  listLinkedWallets,
  removeLinkedWallet,
  setPrimaryLinkedWallet,
  upsertLinkedWallet,
  type LinkedWalletRecord,
} from '../modules/wallets/linkedWalletStore';

type VerifiedUserSession = { id: string; user: PublicUser };

function requireUser(payload: JwtSessionPayload): VerifiedUserSession {
  const session = getSession(payload.sub);
  if (!session) throw new ValidationError('Session expired');
  if (!session.user) throw new ValidationError('Onboarding incomplete');
  return { id: session.id, user: session.user };
}

interface LinkWalletBody {
  wallet: LinkedWalletRecord;
}

interface UnlinkWalletBody {
  walletId: string;
}

interface SetPrimaryBody {
  walletId: string;
}

export default async function walletRoutes(fastify: FastifyInstance) {
  fastify.get('/wallets/linked', { preHandler: [requireVerifiedSession] }, async (req) => {
    const payload = req.user as JwtSessionPayload;
    const { user } = requireUser(payload);
    return { items: listLinkedWallets(user) };
  });

  fastify.post<{ Body: LinkWalletBody }>(
    '/wallets/linked',
    { preHandler: [requireVerifiedSession] },
    async (req, reply) => {
      const payload = req.user as JwtSessionPayload;
      const session = getSession(payload.sub);
      if (!session?.user) throw new ValidationError('Onboarding incomplete');

      const wallet = req.body?.wallet;
      if (!wallet?.id || !wallet.publicKey || !wallet.provider) {
        return reply.code(400).send({ error: 'wallet.id, wallet.publicKey, wallet.provider are required' });
      }

      const next = upsertLinkedWallet(session.user, wallet);
      session.user.wallets = next;
      saveSession(session);
      return { items: next };
    },
  );

  fastify.delete<{ Body: UnlinkWalletBody }>(
    '/wallets/linked',
    { preHandler: [requireVerifiedSession] },
    async (req, reply) => {
      const payload = req.user as JwtSessionPayload;
      const session = getSession(payload.sub);
      if (!session?.user) throw new ValidationError('Onboarding incomplete');

      const walletId = req.body?.walletId;
      if (!walletId) return reply.code(400).send({ error: 'walletId is required' });

      const next = removeLinkedWallet(session.user, walletId);
      session.user.wallets = next;
      saveSession(session);
      return { items: next };
    },
  );

  fastify.post<{ Body: SetPrimaryBody }>(
    '/wallets/linked/primary',
    { preHandler: [requireVerifiedSession] },
    async (req, reply) => {
      const payload = req.user as JwtSessionPayload;
      const session = getSession(payload.sub);
      if (!session?.user) throw new ValidationError('Onboarding incomplete');

      const walletId = req.body?.walletId;
      if (!walletId) return reply.code(400).send({ error: 'walletId is required' });

      const next = setPrimaryLinkedWallet(session.user, walletId);
      session.user.wallets = next;
      saveSession(session);
      return { items: next };
    },
  );

  /**
   * Wallet Recovery Restore (MVP)
   * Requires the existing step-up verification flag to be cleared (enforced by middleware),
   * and rate-limits restore attempts to prevent abuse.
   */
  fastify.post('/wallets/recovery/restore', { preHandler: [requireVerifiedSession] }, async (req, reply) => {
    const payload = req.user as JwtSessionPayload;
    const session = getSession(payload.sub);
    if (!session?.user) throw new ValidationError('Onboarding incomplete');

    const key = `restore:${session.id}:${req.ip}`;
    if (recoveryRateLimiter.isLimited(key)) {
      return reply.code(429).send({
        error: 'Too many recovery attempts. Please try again later.',
        lockedSeconds: recoveryRateLimiter.getRemainingSeconds(key),
      });
    }
    recoveryRateLimiter.recordAttempt(key);

    const items = listLinkedWallets(session.user);
    session.user.wallets = items;
    saveSession(session);

    return { restored: true, items };
  });
}

