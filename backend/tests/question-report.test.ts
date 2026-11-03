import { examService } from '../src/modules/exams/exam.service';
import { prisma } from '../src/config/database';
import { auditService } from '../src/modules/audit/audit.service';
import { notificationService } from '../src/modules/notifications/notification.service';

jest.mock('../src/modules/exams/fulltest-generator', () => ({
  ensureTwentyFullTestExams: jest.fn().mockImplementation(() => Promise.resolve()),
}));

jest.mock('../src/config/database', () => ({
  prisma: {
    exam: {
      count: jest.fn().mockResolvedValue(20),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    user: {
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  },
}));

jest.mock('../src/modules/audit/audit.service', () => ({
  auditService: {
    record: jest.fn(),
  },
}));

jest.mock('../src/modules/notifications/notification.service', () => ({
  notificationService: {
    createNotification: jest.fn(),
  },
}));

describe('--- UNIT TESTS: QUESTION REPORTING & ADMIN INBOX ---', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. examService.reportQuestionIssue', () => {
    it('should record audit log with status PENDING and notify admins', async () => {
      (prisma.exam.findUnique as jest.Mock).mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        title: 'Full Test 01',
        parts: [],
        _count: { submissions: 0 },
      });

      (auditService.record as jest.Mock).mockResolvedValue({ id: 'audit-1' });

      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'admin-1', role: 'ADMIN' },
        { id: 'admin-2', role: 'SUPER_ADMIN' },
      ]);

      (notificationService.createNotification as jest.Mock).mockResolvedValue({ id: 'notif-1' });

      const fakeReq = {
        user: { id: 'student-1', email: 'student@test.com', full_name: 'Nguyen Van A' },
        ip: '127.0.0.1',
      } as any;

      const result = await examService.reportQuestionIssue(
        '11111111-1111-1111-1111-111111111111',
        {
          questionNumber: 3,
          reason: 'Sai đáp án',
          note: 'Đáp án đúng phải là C thay vì B',
        },
        fakeReq
      );

      expect(result).toHaveProperty('reported', true);
      expect(auditService.record).toHaveBeenCalledTimes(1);

      const recordCall = (auditService.record as jest.Mock).mock.calls[0][0];
      expect(recordCall.entityType).toBe('QUESTION_REPORT');
      expect(recordCall.newValue.status).toBe('PENDING');
      expect(recordCall.newValue.reason).toBe('Sai đáp án');
      expect(recordCall.newValue.questionNumber).toBe(3);
      expect(recordCall.newValue.examTitle).toBe('Full Test 01');

      // Admins received notification
      expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('2. examService.listQuestionReports', () => {
    it('should correctly format and calculate KPI stats (total, pending, resolved)', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          entity_id: 'exam-1',
          created_at: new Date('2026-11-01T10:00:00Z'),
          actor_name: 'Hoc Vien 1',
          actor_email: 'hv1@test.com',
          ip_address: '1.1.1.1',
          new_value: {
            examId: 'exam-1',
            examTitle: 'Test 1',
            questionNumber: 1,
            reason: 'Lỗi âm thanh',
            note: 'Audio bị rè',
            status: 'PENDING',
          },
          user: null,
        },
        {
          id: 'log-2',
          entity_id: 'exam-2',
          created_at: new Date('2026-11-02T10:00:00Z'),
          actor_name: 'Hoc Vien 2',
          actor_email: 'hv2@test.com',
          ip_address: '2.2.2.2',
          new_value: {
            examId: 'exam-2',
            examTitle: 'Test 2',
            questionNumber: 5,
            reason: 'Sai chính tả',
            note: 'Viết sai chính tả',
            status: 'RESOLVED',
            resolvedAt: '2026-11-02T12:00:00Z',
            resolvedBy: 'admin@aptis.com',
          },
          user: null,
        },
      ];

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

      const result = await examService.listQuestionReports({ page: 1, limit: 10, status: 'ALL' });

      expect(result.kpi.total).toBe(2);
      expect(result.kpi.pending).toBe(1);
      expect(result.kpi.resolved).toBe(1);
      expect(result.reports).toHaveLength(2);
      expect(result.reports[0].status).toBe('PENDING');
      expect(result.reports[1].status).toBe('RESOLVED');
    });

    it('should filter by status PENDING when requested', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          entity_id: 'exam-1',
          created_at: new Date(),
          new_value: { status: 'PENDING', examTitle: 'Test 1' },
        },
        {
          id: 'log-2',
          entity_id: 'exam-2',
          created_at: new Date(),
          new_value: { status: 'RESOLVED', examTitle: 'Test 2' },
        },
      ];

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

      const result = await examService.listQuestionReports({ status: 'PENDING' });
      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].id).toBe('log-1');
      expect(result.kpi.total).toBe(2);
      expect(result.kpi.pending).toBe(1);
    });
  });

  describe('3. examService.resolveQuestionReport', () => {
    it('should update status to RESOLVED and record admin metadata', async () => {
      (prisma.auditLog.findUnique as jest.Mock).mockResolvedValue({
        id: 'log-1',
        entity_type: 'QUESTION_REPORT',
        new_value: {
          examId: 'exam-1',
          status: 'PENDING',
        },
      });

      (prisma.auditLog.update as jest.Mock).mockImplementation(({ data }) => {
        return Promise.resolve({
          id: 'log-1',
          new_value: data.new_value,
        });
      });

      const result = await examService.resolveQuestionReport(
        'log-1',
        { status: 'RESOLVED', note: 'Đã sửa đáp án key C' },
        { email: 'admin@aptisesolpremier.com', full_name: 'Admin Master' }
      );

      expect(result.status).toBe('RESOLVED');
      expect(result.resolvedBy).toBe('admin@aptisesolpremier.com');
      expect(prisma.auditLog.update).toHaveBeenCalledTimes(1);

      const updateCall = (prisma.auditLog.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.new_value.status).toBe('RESOLVED');
      expect(updateCall.data.new_value.resolutionNote).toBe('Đã sửa đáp án key C');
    });

    it('should throw 404 when report does not exist or is not QUESTION_REPORT', async () => {
      (prisma.auditLog.findUnique as jest.Mock).mockResolvedValue({
        id: 'other-log',
        entity_type: 'EXAM_UPDATE',
      });

      await expect(
        examService.resolveQuestionReport('other-log', { status: 'RESOLVED' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
