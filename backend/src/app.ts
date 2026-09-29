import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './modules/auth/auth.routes';
import examRoutes from './modules/exams/exam.routes';
import submissionRoutes from './modules/submissions/submission.routes';
import dictationRoutes from './modules/dictation/dictation.routes';
import vocabRoutes from './modules/vocabulary/vocab.routes';
import paymentRoutes from './modules/payment/payment.routes';
import teacherRoutes from './modules/teacher/teacher.routes';
import aiGradingRoutes from './modules/ai-grading/ai-grading.routes';
import cmsRoutes from './modules/cms/cms.routes';
import adminRoutes from './modules/admin/admin.routes';
import auditRoutes from './modules/audit/audit.routes';
import studentRoutes from './modules/student/student.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import { errorHandler } from './middlewares/error.handler';

const app = express();

// Security & Parsing Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/dictation', dictationRoutes);
app.use('/api/vocabulary', vocabRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/ai-grading', aiGradingRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
