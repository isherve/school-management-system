import { Request, Response } from 'express';
import prisma from '../../infrastructure/database/prisma.client.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export const auditLog = asyncHandler(async (req: Request, res: Response) => {
  const { action, module, entityId, oldData, newData } = req.body;

  const log = await prisma.auditLog.create({
    data: {
      userId: req.user?.userId,
      schoolId: req.user?.schoolId,
      action,
      module,
      entityId,
      oldData,
      newData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  res.json({ success: true, data: log });
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId!;
  const page = parseInt(String(req.query.page || '1'), 10);
  const limit = parseInt(String(req.query.limit || '20'), 10);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { schoolId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.auditLog.count({ where: { schoolId } }),
  ]);

  res.json({
    success: true,
    data: logs,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});
