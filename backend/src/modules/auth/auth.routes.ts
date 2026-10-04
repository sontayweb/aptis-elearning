import { Router } from 'express';
import { authController } from './auth.controller';
import { authGuard } from '../../middlewares/auth.guard';
import { authRateLimiter } from '../../middlewares/rate-limit.middleware';

const router = Router();

// Public routes (có gắn authRateLimiter chống brute-force)
router.post('/register', authRateLimiter, (req, res, next) => authController.register(req, res, next));
router.post('/login', authRateLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refreshToken(req, res, next));
router.post('/google', (req, res, next) => authController.googleAuth(req, res, next));
router.post('/forgot-password', authRateLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password', authRateLimiter, (req, res, next) => authController.resetPassword(req, res, next));

// Protected routes
router.get('/me', authGuard, (req, res, next) => authController.getMe(req, res, next));
router.patch('/profile', authGuard, (req, res, next) => authController.updateProfile(req, res, next));
router.post('/change-password', authGuard, (req, res, next) => authController.changePassword(req, res, next));

export default router;
