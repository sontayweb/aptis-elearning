"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const exam_routes_1 = __importDefault(require("./modules/exams/exam.routes"));
const submission_routes_1 = __importDefault(require("./modules/submissions/submission.routes"));
const dictation_routes_1 = __importDefault(require("./modules/dictation/dictation.routes"));
const vocab_routes_1 = __importDefault(require("./modules/vocabulary/vocab.routes"));
const payment_routes_1 = __importDefault(require("./modules/payment/payment.routes"));
const teacher_routes_1 = __importDefault(require("./modules/teacher/teacher.routes"));
const ai_grading_routes_1 = __importDefault(require("./modules/ai-grading/ai-grading.routes"));
const cms_routes_1 = __importDefault(require("./modules/cms/cms.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const audit_routes_1 = __importDefault(require("./modules/audit/audit.routes"));
const student_routes_1 = __importDefault(require("./modules/student/student.routes"));
const notification_routes_1 = __importDefault(require("./modules/notifications/notification.routes"));
const error_handler_1 = require("./middlewares/error.handler");
const app = (0, express_1.default)();
// Security & Parsing Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('dev'));
}
// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Module Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/exams', exam_routes_1.default);
app.use('/api/submissions', submission_routes_1.default);
app.use('/api/student', student_routes_1.default);
app.use('/api/dictation', dictation_routes_1.default);
app.use('/api/vocabulary', vocab_routes_1.default);
app.use('/api/payment', payment_routes_1.default);
app.use('/api/teacher', teacher_routes_1.default);
app.use('/api/ai-grading', ai_grading_routes_1.default);
app.use('/api/cms', cms_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/audit', audit_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
// Global Error Handler
app.use(error_handler_1.errorHandler);
exports.default = app;
