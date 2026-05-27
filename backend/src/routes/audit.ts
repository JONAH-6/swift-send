import type { FastifyInstance } from 'fastify';
import { requireVerifiedSession } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

interface AuditQuery {
  limit?: string;
  userId?: string;
  checkType?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

interface AuditIdParam {
  id: string;
}

export default async function auditRoutes(fastify: FastifyInstance) {
  const authGuards = { preHandler: [requireVerifiedSession] };
  const adminGuards = {
    preHandler: [requireVerifiedSession, requireRole('admin')],
  };

  fastify.post(
    '/admin/compliance/audit/verify',
    adminGuards,
    async () => {
      return fastify.container.services.auditStorage.verifyIntegrity();
    },
  );

  fastify.get<{ Querystring: AuditQuery }>(
    '/admin/compliance/audit/report',
    adminGuards,
    async (req) => {
      const filters = {
        userId: req.query.userId,
        checkType: req.query.checkType,
        status: req.query.status,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
      };
      return fastify.container.services.auditStorage.getComplianceReport(filters);
    },
  );

  fastify.get<{ Querystring: AuditQuery }>(
    '/admin/compliance/audit',
    adminGuards,
    async (req) => {
      const limit = Number(req.query.limit || 100);
      return fastify.container.services.auditStorage.getAllAuditRecords(limit);
    },
  );

  fastify.get<{ Params: AuditIdParam }>(
    '/admin/compliance/audit/:id',
    adminGuards,
    async (req, reply) => {
      const record = await fastify.container.services.auditStorage.getAuditRecord(req.params.id);
      if (!record) {
        return reply.code(404).send({ error: 'Audit record not found' });
      }
      return record;
    },
  );

  fastify.get<{ Params: { logId: string } }>(
    '/admin/compliance/audit/by-log/:logId',
    adminGuards,
    async (req) => {
      return fastify.container.services.auditStorage.getAuditRecordsByLogId(req.params.logId);
    },
  );
}
