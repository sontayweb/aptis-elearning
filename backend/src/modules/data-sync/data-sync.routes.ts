import express, { Router } from 'express';
import { dataSyncController } from './data-sync.controller';
import { authGuard } from '../../middlewares/auth.guard';
import { roleGuard } from '../../middlewares/role.guard';

const router = Router();

// Cho phép payload JSON lớn (tối đa 30MB) phục vụ upload file JSON đề thi đồng bộ
router.use(express.json({ limit: '30mb' }));

// Yêu cầu quyền ADMIN hoặc SUPER_ADMIN
router.use(authGuard);
router.use(roleGuard(['ADMIN', 'SUPER_ADMIN']));

// 1. Thống kê tổng quan & chẩn đoán sức khỏe kho đề
router.get('/overview', (req, res, next) => dataSyncController.getOverview(req, res, next));

// 2. Chạy tự động chuẩn hóa & sửa lỗi trực tiếp trên CSDL (Auto-Heal)
router.post('/standardize', (req, res, next) => dataSyncController.runAutoStandardize(req, res, next));

// 3. Chạy bộ kiểm thử tự động Unit Test đối soát từng Part của 5 kỹ năng
router.post('/audit', (req, res, next) => dataSyncController.runUnitTestAudit(req, res, next));

// 4. Đồng bộ hàng loạt đề thi qua Data Contract & Deep Upsert Engine
router.post('/sync-batch', (req, res, next) => dataSyncController.syncBatch(req, res, next));

export default router;
