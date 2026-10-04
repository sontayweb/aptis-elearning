"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinClassroomSchema = exports.createClassroomSchema = exports.gradeSubmissionSchema = void 0;
const zod_1 = require("zod");
exports.gradeSubmissionSchema = zod_1.z.object({
    totalScore: zod_1.z.number().min(0).max(50, 'Điểm tối đa là 50 theo chuẩn Aptis'),
    cefrLevel: zod_1.z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    teacherFeedback: zod_1.z.string().min(5, 'Nhận xét phải có ít nhất 5 ký tự'),
    answersFeedback: zod_1.z
        .array(zod_1.z.object({
        answerId: zod_1.z.string().uuid(),
        score: zod_1.z.number().min(0),
        feedback: zod_1.z.string().optional(),
    }))
        .optional(),
});
exports.createClassroomSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'Tên lớp học phải có ít nhất 3 ký tự'),
    description: zod_1.z.string().optional(),
});
exports.joinClassroomSchema = zod_1.z.object({
    classCode: zod_1.z.string().min(3, 'Mã lớp không hợp lệ'),
});
