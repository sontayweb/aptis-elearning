import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole, ExamSkill, SubmissionStatus } from '@prisma/client';

import { generateTokens } from '../src/utils/token';

describe('--- MODULE 5: TEACHER GRADING PORTAL & CLASSROOM TESTS ---', () => {
  let teacherToken = '';
  let studentToken = '';
  let teacherUserId = '';
  let studentUserId = '';
  let sampleSubmissionId = '';
  let sampleClassroomId = '';
  let sampleClassCode = '';

  beforeAll(async () => {
    // 1. Tạo Giảng viên
    const teacherEmail = `teacher_test_${Date.now()}@aptiskytich.vn`;
    const teacherRes = await request(app).post('/api/auth/register').send({
      email: teacherEmail,
      password: 'TeacherPass123!',
      fullName: 'Cô Mai Chấm Thi',
    });
    teacherUserId = teacherRes.body.data.user.id;

    // Nâng role thành TEACHER trong DB và cấp token mới với role TEACHER
    await prisma.user.update({
      where: { id: teacherUserId },
      data: { role: UserRole.TEACHER },
    });

    const teacherTokens = generateTokens({
      userId: teacherUserId,
      email: teacherEmail,
      role: 'TEACHER',
    });
    teacherToken = teacherTokens.accessToken;

    // 2. Tạo Học viên
    const studentRes = await request(app).post('/api/auth/register').send({
      email: `student_grade_${Date.now()}@aptiskytich.vn`,
      password: 'StudentPass123!',
      fullName: 'Học Sinh Chờ Điểm',
    });
    studentToken = studentRes.body.data.tokens.accessToken;
    studentUserId = studentRes.body.data.user.id;

    // 3. Tạo đề thi Writing & Bài nộp đang chờ chấm
    const exam = await prisma.exam.create({
      data: {
        title: 'Đề Thi Writing Aptis Club Cần Chấm',
        skill: ExamSkill.WRITING,
        duration_minutes: 50,
      },
    });

    const submission = await prisma.examSubmission.create({
      data: {
        user_id: studentUserId,
        exam_id: exam.id,
        status: SubmissionStatus.PENDING_EVALUATION,
        deadline_at: new Date(Date.now() + 3600000),
      },
    });

    sampleSubmissionId = submission.id;
  });

  afterAll(async () => {
    if (sampleClassroomId) {
      await prisma.classroomMember.deleteMany({ where: { classroom_id: sampleClassroomId } });
      await prisma.classroom.delete({ where: { id: sampleClassroomId } });
    }
    if (sampleSubmissionId) {
      const sub = await prisma.examSubmission.findUnique({ where: { id: sampleSubmissionId } });
      await prisma.examSubmission.delete({ where: { id: sampleSubmissionId } });
      if (sub) {
        await prisma.exam.delete({ where: { id: sub.exam_id } });
      }
    }
    if (teacherUserId) {
      await prisma.user.delete({ where: { id: teacherUserId } });
    }
    if (studentUserId) {
      await prisma.user.delete({ where: { id: studentUserId } });
    }
  });

  describe('1. RBAC Phân Quyền Giảng Viên', () => {
    it('Nên từ chối học viên truy cập vào Hàng đợi chấm bài (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/teacher/grading-queue')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('không có quyền');
    });

    it('Nên cho phép Giảng viên truy cập Hàng đợi chấm bài', async () => {
      const res = await request(app)
        .get('/api/teacher/grading-queue')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const sub = res.body.data.find((s: any) => s.id === sampleSubmissionId);
      expect(sub).toBeDefined();
    });
  });

  describe('2. Chấm Điểm & Phê Duyệt Bài Thi', () => {
    it('Nên lấy chi tiết bài thi để bắt đầu chấm', async () => {
      const res = await request(app)
        .get(`/api/teacher/submissions/${sampleSubmissionId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(sampleSubmissionId);
    });

    it('Nên chấm điểm thành công, lưu feedback và đổi trạng thái sang GRADED', async () => {
      const res = await request(app)
        .post(`/api/teacher/submissions/${sampleSubmissionId}/grade`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          totalScore: 42,
          cefrLevel: 'B2',
          teacherFeedback: 'Bài viết tốt, sử dụng linking words phong phú và đạt chuẩn B2.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SubmissionStatus.GRADED);
      expect(res.body.data.total_score).toBe(42);
      expect(res.body.data.cefr_level).toBe('B2');
      expect(res.body.data.graded_by_id).toBe(teacherUserId);
    });

    it('Nên xem được thống kê hoạt động của Giảng viên', async () => {
      const res = await request(app)
        .get('/api/teacher/stats')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.gradedByMeCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Quản Lý Lớp Học & Học Viên', () => {
    it('Nên tạo lớp học mới thành công kèm mã lớp (classCode)', async () => {
      const res = await request(app)
        .post('/api/teacher/classrooms')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: 'Lớp Luyện Aptis B2 Cấp Tốc - Tháng 10',
          description: 'Lớp dành cho các bạn mục tiêu B2 trong 4 tuần',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.class_code).toBeDefined();

      sampleClassroomId = res.body.data.id;
      sampleClassCode = res.body.data.class_code;
    });

    it('Nên cho phép học viên tham gia lớp học qua mã classCode', async () => {
      const res = await request(app)
        .post('/api/teacher/classrooms/join')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ classCode: sampleClassCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.classroom_id).toBe(sampleClassroomId);
      expect(res.body.data.user_id).toBe(studentUserId);
    });

    it('Nên lấy được danh sách học viên trong lớp kèm lịch sử bài nộp', async () => {
      const res = await request(app)
        .get(`/api/teacher/classrooms/${sampleClassroomId}/members`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].user.id).toBe(studentUserId);
    });
  });
});
