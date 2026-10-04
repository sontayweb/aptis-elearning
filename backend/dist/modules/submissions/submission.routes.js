"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const submission_controller_1 = require("./submission.controller");
const auth_guard_1 = require("../../middlewares/auth.guard");
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const router = (0, express_1.Router)();
// Tất cả các route thi cử đều yêu cầu đăng nhập
router.use(auth_guard_1.authGuard);
router.post('/', (req, res, next) => submission_controller_1.submissionController.start(req, res, next));
router.put('/:id/autosave', (req, res, next) => submission_controller_1.submissionController.autosave(req, res, next));
router.post('/:id/heartbeat', (req, res, next) => submission_controller_1.submissionController.heartbeat(req, res, next));
router.get('/:id/resume', (req, res, next) => submission_controller_1.submissionController.resume(req, res, next));
router.post('/:id/submit', (req, res, next) => submission_controller_1.submissionController.submit(req, res, next));
router.get('/my-history', (req, res, next) => submission_controller_1.submissionController.myHistory(req, res, next));
router.get('/:id', (req, res, next) => submission_controller_1.submissionController.detail(req, res, next));
// Luồng Audio dành cho Speaking: Upload file thu âm & HTTP Range Streaming Proxy
router.post('/:id/answers/:questionId/audio', upload_middleware_1.uploadAudioMiddleware.single('audio'), (req, res, next) => submission_controller_1.submissionController.uploadAudio(req, res, next));
router.get('/:id/audio/:questionId', (req, res, next) => submission_controller_1.submissionController.streamAudio(req, res, next));
exports.default = router;
