import { FastifyInstance } from 'fastify';
import { requireVerifiedSession } from '../middleware/authenticate';

interface EscrowOverrideBody {
  destination_account?: string;
  reason?: string;
}

export default async function escrowRoutes(fastify: FastifyInstance) {
  fastify.get('/escrow/:transferId', { preHandler: [requireVerifiedSession] }, async (req, reply) => {
    const transferId = (req.params as { transferId: string }).transferId;
    const escrow = await fastify.container.services.wallets.getEscrow(transferId);
    if (!escrow) {
      return reply.status(404).send({ error: `Escrow not found for transfer '${transferId}'` });
    }
    return escrow;
  });

  fastify.post('/escrow/:transferId/release', { preHandler: [requireVerifiedSession] }, async (req, reply) => {
    const transferId = (req.params as { transferId: string }).transferId;
    const escrow = await fastify.container.services.wallets.getEscrow(transferId);
    if (!escrow) {
      return reply.status(404).send({ error: `Escrow not found for transfer '${transferId}'` });
    }

    const body = (req.body as EscrowOverrideBody) || {};
    const destination = body.destination_account || `recipient:${transferId}`;

    try {
      await fastify.container.services.wallets.settleEscrow({
        transferId,
        destinationAccount: destination,
        amount: escrow.amount,
        currency: escrow.currency,
        metadata: { reason: 'manual_release' },
      });
      return { ...escrow, status: 'released', destination };
    } catch (err: any) {
      const statusCode = err?.statusCode || (err?.code === 'escrow_already_finalized' ? 409 : 500);
      return reply.status(statusCode).send({ error: err?.message || 'Release failed', code: err?.code });
    }
  });

  fastify.post('/escrow/:transferId/refund', { preHandler: [requireVerifiedSession] }, async (req, reply) => {
    const transferId = (req.params as { transferId: string }).transferId;
    const escrow = await fastify.container.services.wallets.getEscrow(transferId);
    if (!escrow) {
      return reply.status(404).send({ error: `Escrow not found for transfer '${transferId}'` });
    }

    const body = (req.body as EscrowOverrideBody) || {};

    try {
      await fastify.container.services.wallets.refundEscrow({
        transferId,
        destinationAccount: `wallet:${transferId}`,
        amount: escrow.amount,
        currency: escrow.currency,
        metadata: { reason: body.reason || 'manual_refund' },
      });
      return { ...escrow, status: 'refunded', reason: body.reason };
    } catch (err: any) {
      const statusCode = err?.statusCode || (err?.code === 'escrow_already_finalized' ? 409 : 500);
      return reply.status(statusCode).send({ error: err?.message || 'Refund failed', code: err?.code });
    }
  });

  fastify.post('/escrow/:transferId/dispute', { preHandler: [requireVerifiedSession] }, async (req, reply) => {
    const transferId = (req.params as { transferId: string }).transferId;
    const escrow = await fastify.container.services.wallets.getEscrow(transferId);
    if (!escrow) {
      return reply.status(404).send({ error: `Escrow not found for transfer '${transferId}'` });
    }

    const body = (req.body as EscrowOverrideBody) || {};

    try {
      const updated = await fastify.container.services.wallets.disputeEscrow(transferId, body.reason);
      return { ...updated, message: 'Escrow marked as disputed. Funds are frozen pending resolution.' };
    } catch (err: any) {
      const statusCode = err?.statusCode || (err?.code === 'escrow_already_finalized' ? 409 : 500);
      return reply.status(statusCode).send({ error: err?.message || 'Dispute failed', code: err?.code });
    }
  });
}
