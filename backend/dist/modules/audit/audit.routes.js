"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_controller_1 = require("./audit.controller");
const auth_guard_1 = require("../../middlewares/auth.guard");
const role_guard_1 = require("../../middlewares/role.guard");
const router = (0, express_1.Router)();
// Toàn bộ API kiểm toán yêu cầu JWT và Role ADMIN
router.use(auth_guard_1.authGuard);
router.use((0, role_guard_1.roleGuard)(['ADMIN']));
router.get('/', (req, res, next) => audit_controller_1.auditController.listLogs(req, res, next));
router.get('/stats', (req, res, next) => audit_controller_1.auditController.getStats(req, res, next));
exports.default = router;
