"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myHistoryFilterSchema = exports.heartbeatSchema = exports.autosaveAnswerSchema = exports.startSubmissionSchema = void 0;
const zod_1 = require("zod");
exports.startSubmissionSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid('Exam ID không hợp lệ'),
});
exports.autosaveAnswerSchema = zod_1.z.object({
    answers: zod_1.z.array(zod_1.z.object({
        questionId: zod_1.z.string().uuid(),
        selectedOption: zod_1.z.string().nullable().optional(),
        textAnswer: zod_1.z.string().nullable().optional(),
        audioUrl: zod_1.z.string().nullable().optional(),
        audioDuration: zod_1.z.number().nullable().optional(),
    })),
});
exports.heartbeatSchema = zod_1.z.object({
    tabSwitchCount: zod_1.z.number().optional().default(0),
});
exports.myHistoryFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    skill: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
});
