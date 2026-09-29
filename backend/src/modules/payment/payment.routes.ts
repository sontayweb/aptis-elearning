import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authGuard } from '../../middlewares/auth.guard';

const router = Router();

// Public routes
router.get('/plans', (req, res, next) => paymentController.getPlans(req, res, next));
router.get('/order-status/:orderCode', (req, res, next) => paymentController.getStatus(req, res, next));
// Webhook từ SePay (không yêu cầu Bearer token của user)
router.post('/webhook', (req, res, next) => paymentController.handleWebhook(req, res, next));

// Protected routes
router.post('/initiate', authGuard, (req, res, next) => paymentController.initiate(req, res, next));
router.post('/verify/:orderCode', authGuard, (req, res, next) => paymentController.verify(req, res, next));
router.post('/report-issue/:orderCode', authGuard, (req, res, next) => paymentController.reportIssue(req, res, next));
router.post('/reconcile', authGuard, (req, res, next) => paymentController.reconcile(req, res, next));
router.get('/my-subscription', authGuard, (req, res, next) =>
  paymentController.getMySubscription(req, res, next)
);
router.get('/transactions', authGuard, (req, res, next) =>
  paymentController.getTransactions(req, res, next)
);

export default router;
