"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
const auth_guard_1 = require("../../middlewares/auth.guard");
const router = (0, express_1.Router)();
// Public routes
router.get('/plans', (req, res, next) => payment_controller_1.paymentController.getPlans(req, res, next));
router.get('/order-status/:orderCode', (req, res, next) => payment_controller_1.paymentController.getStatus(req, res, next));
// Webhook từ SePay (không yêu cầu Bearer token của user)
router.post('/webhook', (req, res, next) => payment_controller_1.paymentController.handleWebhook(req, res, next));
// Protected routes
router.post('/initiate', auth_guard_1.authGuard, (req, res, next) => payment_controller_1.paymentController.initiate(req, res, next));
router.post('/verify/:orderCode', auth_guard_1.authGuard, (req, res, next) => payment_controller_1.paymentController.verify(req, res, next));
router.post('/report-issue/:orderCode', auth_guard_1.authGuard, (req, res, next) => payment_controller_1.paymentController.reportIssue(req, res, next));
router.post('/reconcile', auth_guard_1.authGuard, (req, res, next) => payment_controller_1.paymentController.reconcile(req, res, next));
router.get('/my-subscription', auth_guard_1.authGuard, (req, res, next) => payment_controller_1.paymentController.getMySubscription(req, res, next));
router.get('/transactions', auth_guard_1.authGuard, (req, res, next) => payment_controller_1.paymentController.getTransactions(req, res, next));
exports.default = router;
