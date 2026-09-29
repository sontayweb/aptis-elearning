import { z } from 'zod';
import { AuditAction } from '@prisma/client';

export const auditLogFilterSchema = z.object({
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().optional(),
  userId: z.string().optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
