"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogFilterSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.auditLogFilterSchema = zod_1.z.object({
    action: zod_1.z.nativeEnum(client_1.AuditAction).optional(),
    entityType: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('20').transform(Number),
});
