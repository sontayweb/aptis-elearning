import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { ExamSkill, QuestionType } from '@prisma/client';

describe('--- MODULE 2: EXAMS & SUBMISSION ENGINE TESTS ---', () => {
  let userToken = '';
  let testUserId = '';
  let sampleExamId = '';
  let sampleQuestionId = '';
  let submissionId = '';

  beforeAll(async () => {
    // 1. Tạo user test
    const userRes = await request(app).post('/api/auth/register').send({
      email: `exam_student_${Date.now()}@aptiskytich.vn`,
      password: 'ExamPassword123!',
      fullName: 'Học Viên Thi Thử',
    });

    userToken = userRes.body.data.tokens.accessToken;
    testUserId = userRes.body.data.user.id;

    // 2. Tạo một đề thi mẫu chuẩn
    const exam = await prisma.exam.create({
      data: {
        title: 'Đề Thi Thử Listening & Grammar Aptis Mẫu',
        skill: ExamSkill.LISTENING,
        duration_minutes: 40,
        is_pro: false,
        source: 'WEB',
        parts: {
          create: [
            {
              part_number: 1,
              title: 'Part 1: Information Recognition',
              questions: {
                create: [
                  {
                    question_number: 1,
                    question_type: QuestionType.MULTIPLE_CHOICE,
                    prompt: 'What time does the train to Oxford depart?',
                    options: ['A. 10:15 AM', 'B. 10:45 AM', 'C. 11:00 AM'],
                    correct_answer: 'B',
                    explanation: 'Audio states the train leaves at a quarter to eleven (10:45).',
                    max_score: 1.0,
                  },
                  {
                    question_number: 2,
                    question_type: QuestionType.MULTIPLE_CHOICE,
                    prompt: 'Where will the conference be held?',
                    options: ['A. Main Hall', 'B. Room 204', 'C. Hotel Lobby'],
                    correct_answer: 'A',
                    explanation: 'The speaker announced Main Hall.',
                    max_score: 1.0,
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        parts: {
          include: { questions: true },
        },
      },
    });

    sampleExamId = exam.id;
    sampleQuestionId = exam.parts[0].questions[0].id;
  });

  afterAll(async () => {
    if (sampleExamId) {
      await prisma.exam.delete({ where: { id: sampleExamId } });
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  describe('1. GET /api/exams & /api/exams/:id', () => {
    it('Nên lấy danh sách đề thi kèm phân trang thành công', async () => {
      const res = await request(app).get('/api/exams').query({ skill: 'LISTENING' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Nên lấy chi tiết cấu trúc đề thi thành công', async () => {
      const res = await request(app).get(`/api/exams/${sampleExamId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(sampleExamId);
      expect(res.body.data.parts.length).toBe(1);
      expect(res.body.data.totalQuestions).toBe(2);
    });

    it('Nên lấy danh sách câu hỏi phòng thi mà KHÔNG để lộ đáp án đúng', async () => {
      const res = await request(app).get(`/api/exams/${sampleExamId}/questions`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const question = res.body.data.parts[0].questions[0];
      expect(question.prompt).toBeDefined();
      expect(question.options).toBeDefined();
      // BẢO MẬT CHỐNG GIAN LẬN:
      expect(question.correct_answer).toBeUndefined();
      expect(question.explanation).toBeUndefined();
    });
  });

  describe('2. Quản Lý Phòng Thi: Start -> Autosave -> Heartbeat -> Resume -> Submit', () => {
    it('Nên bắt đầu bài thi và tính toán thời gian server chuẩn xác', async () => {
      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ examId: sampleExamId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.submissionId).toBeDefined();
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.serverTimeRemaining).toBeGreaterThan(2300); // 40p = 2400s

      submissionId = res.body.data.submissionId;
    });

    it('Nên tự động lưu nháp (Autosave) câu trả lời của thí sinh', async () => {
      const res = await request(app)
        .put(`/api/submissions/${submissionId}/autosave`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          answers: [
            {
              questionId: sampleQuestionId,
              selectedOption: 'B', // Đáp án đúng
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.savedCount).toBe(1);
      expect(res.body.data.isExpired).toBe(false);
    });

    it('Nên ghi nhận Heartbeat và đếm số lần chuyển tab (Tab switch)', async () => {
      const res = await request(app)
        .post(`/api/submissions/${submissionId}/heartbeat`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ tabSwitchCount: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('Nên khôi phục phiên thi (Resume) kèm toàn bộ đáp án đã lưu nháp khi F5', async () => {
      const res = await request(app)
        .get(`/api/submissions/${submissionId}/resume`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.submissionId).toBe(submissionId);
      expect(res.body.data.savedAnswers[sampleQuestionId].selectedOption).toBe('B');
    });

    it('Nên nộp bài thi thành công và tự động chấm điểm trắc nghiệm tức thì', async () => {
      const res = await request(app)
        .post(`/api/submissions/${submissionId}/submit`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('GRADED');
      expect(res.body.data.totalScore).toBe(1.0); // 1 câu đúng = 1 điểm
    });

    it('Nên xem được bảng điểm chi tiết kèm lời giải thích sau khi đã nộp bài', async () => {
      const res = await request(app)
        .get(`/api/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total_score).toBe(1.0);
      const answer = res.body.data.answers[0];
      expect(answer.score).toBe(1.0);
    });
  });

  describe('3. POST /api/exams/custom-builder', () => {
    it('Nên cho phép học viên tự tạo bộ đề thi tùy biến', async () => {
      const examDetail = await prisma.exam.findUnique({
        where: { id: sampleExamId },
        include: { parts: true },
      });

      const partId = examDetail!.parts[0].id;

      const res = await request(app)
        .post('/api/exams/custom-builder')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Bộ Đề Luyện Tập Nghe Riêng Của Tôi',
          durationMinutes: 30,
          partIds: [partId],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.source).toBe('CUSTOM');
      expect(res.body.data.creator_id).toBe(testUserId);
    });
  });
});
