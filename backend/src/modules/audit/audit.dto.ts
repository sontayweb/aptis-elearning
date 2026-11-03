import { z } from 'zod';

export const auditLogFilterSchema = z.object({
  action: z.string().optional(),
  entityType: z.string().optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
