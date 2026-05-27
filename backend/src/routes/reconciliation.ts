import type { FastifyInstance } from 'fastify';
import { requireVerifiedSession } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

interface ReconQuery {
  runId?: string;
}

export default async function reconciliationRoutes(fastify: FastifyInstance) {
  const adminGuards = {
    preHandler: [requireVerifiedSession, requireRole('admin')],
  };

  fastify.post(
    '/admin/reconciliation/run',
    adminGuards,
    async () => {
      return fastify.container.services.reconciliation.runReconciliation();
    },
  );

  fastify.get<{ Querystring: ReconQuery }>(
    '/admin/reconciliation/history',
    adminGuards,
    async (req) => {
      const { runId } = req.query;
      if (runId) {
        const result = await fastify.container.services.reconciliation.getReconciliationById(runId);
        if (!result) {
          return { error: 'Reconciliation run not found' };
        }
        return result;
      }
      return fastify.container.services.reconciliation.getReconciliationHistory();
    },
  );
}
