import type { FastifyInstance } from 'fastify';
import { requireVerifiedSession } from '../middleware/authenticate';

export default async function successRateRoutes(fastify: FastifyInstance) {
  fastify.get('/admin/success-rate', { preHandler: [requireVerifiedSession] }, async (req) => {
    const query = req.query as { days?: string };
    const days = Number(query.days) || 30;
    return fastify.container.services.successRate.getMetrics(days);
  });

  fastify.get('/admin/success-rate/daily-report', { preHandler: [requireVerifiedSession] }, async (req) => {
    const query = req.query as { date?: string };
    return fastify.container.services.successRate.getDailyReport(query.date);
  });
}
