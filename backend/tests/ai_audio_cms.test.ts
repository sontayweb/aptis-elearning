import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { ExamSkill, QuestionType, SubmissionStatus } from '@prisma/client';

describe('--- MODULE 6: AI GRADING & PUBLIC CMS TESTS ---', () => {
  let userToken = '';
  let testUserId = '';
  let sampleExamId = '';
  let sampleSubmissionId = '';

  beforeAll(async () => {
    // 1. Tạo user test
    const userRes = await request(app).post('/api/auth/register').send({
      email: `ai_student_${Date.now()}@aptiskytich.vn`,
      password: 'AiPassword123!',
      fullName: 'Học Viên Chấm AI',
    });

    userToken = userRes.body.data.tokens.accessToken;
    testUserId = userRes.body.data.user.id;

    // 2. Tạo đề thi có Writing và Speaking
    const exam = await prisma.exam.create({
      data: {
        title: 'Đề Thi Speaking & Writing Tích Hợp Chấm AI',
        skill: ExamSkill.FULL_TEST,
        duration_minutes: 60,
        parts: {
          create: [
            {
              part_number: 1,
              title: 'Part 1: Writing Club Response',
              questions: {
                create: [
                  {
                    question_number: 1,
                    question_type: QuestionType.ESSAY,
                    prompt: 'Write an email explaining why you could not attend the club meeting.',
                    max_score: 50.0,
                  },
                ],
              },
            },
            {
              part_number: 2,
              title: 'Part 2: Speaking Audio Response',
              questions: {
                create: [
                  {
                    question_number: 2,
                    question_type: QuestionType.SPEAKING_AUDIO,
                    prompt: 'Describe your favourite vacation spot.',
                    max_score: 50.0,
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        parts: { include: { questions: true } },
      },
    });

    sampleExamId = exam.id;
    const writingQId = exam.parts[0].questions[0].id;
    const speakingQId = exam.parts[1].questions[0].id;

    // 3. Tạo bài nộp có sẵn câu trả lời tự luận
    const submission = await prisma.examSubmission.create({
      data: {
        user_id: testUserId,
        exam_id: sampleExamId,
        status: SubmissionStatus.PENDING_EVALUATION,
        deadline_at: new Date(Date.now() + 3600000),
        answers: {
          create: [
            {
              question_id: writingQId,
              text_answer:
                'Dear Club President, I am writing to sincerely apologize for my absence at the recent club gathering. Unfortunately, I had an urgent family matter that required my immediate attention. I promise to catch up on all meeting notes and participate actively next week.',
            },
            {
              question_id: speakingQId,
              audio_url: '/uploads/audio/submissions/test_speaking.webm',
              audio_duration: 35,
              transcript_text:
                'My favourite vacation spot is Da Nang city because of its beautiful beaches and friendly local people.',
            },
          ],
        },
      },
    });

    sampleSubmissionId = submission.id;
  });

  afterAll(async () => {
    if (sampleSubmissionId) {
      await prisma.aiGradingResult.deleteMany({ where: { submission_id: sampleSubmissionId } });
      await prisma.submissionAnswer.deleteMany({ where: { submission_id: sampleSubmissionId } });
      await prisma.examSubmission.delete({ where: { id: sampleSubmissionId } });
    }
    if (sampleExamId) {
      await prisma.exam.delete({ where: { id: sampleExamId } });
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  describe('1. AI Grading Pipeline (Speaking & Writing)', () => {
    it('Nên kích hoạt chấm AI thành công và tính điểm theo khung CEFR', async () => {
      const res = await request(app)
        .post(`/api/ai-grading/${sampleSubmissionId}/evaluate-ai`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallScore).toBeGreaterThan(0);
      expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).toContain(res.body.data.cefrLevel);
      expect(res.body.data.evaluatedQuestionsCount).toBe(2);

      // Kiểm tra DB cập nhật trạng thái GRADED
      const updatedSub = await prisma.examSubmission.findUnique({
        where: { id: sampleSubmissionId },
      });
      expect(updatedSub?.status).toBe(SubmissionStatus.GRADED);
    });

    it('Nên lấy chi tiết bản phân tích tiêu chí chấm của AI', async () => {
      const res = await request(app)
        .get(`/api/ai-grading/${sampleSubmissionId}/ai-feedback`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);

      const writingResult = res.body.data.find((r: any) => r.skill === ExamSkill.WRITING);
      expect(writingResult).toBeDefined();
      expect(writingResult.task_completion).toBeDefined();
      expect(writingResult.grammar_score).toBeDefined();
      expect(writingResult.feedback_summary).toBeDefined();

      const speakingResult = res.body.data.find((r: any) => r.skill === ExamSkill.SPEAKING);
      expect(speakingResult).toBeDefined();
      expect(speakingResult.pronunciation).toBeDefined();
    });

    it('Nên trả về kết quả đã lưu mà không tạo trùng lặp nếu gọi lại lần 2 (Idempotent AI evaluation)', async () => {
      const res = await request(app)
        .post(`/api/ai-grading/${sampleSubmissionId}/evaluate-ai`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCached).toBe(true);
    });

    it('Nên từ chối chấm bài nếu tài khoản khác cố tình can thiệp (IDOR Protection)', async () => {
      // Đăng ký một user lạ
      const otherUserRes = await request(app).post('/api/auth/register').send({
        email: `other_student_${Date.now()}@aptiskytich.vn`,
        password: 'OtherPassword123!',
        fullName: 'Học Viên Lạ',
      });
      const otherToken = otherUserRes.body.data.tokens.accessToken;

      const res = await request(app)
        .post(`/api/ai-grading/${sampleSubmissionId}/evaluate-ai`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Xóa user lạ sau test
      await prisma.user.delete({ where: { id: otherUserRes.body.data.user.id } });
    });
  });

  describe('2. Public CMS & Landing Page Portal', () => {
    it('Nên lấy nội dung trang tĩnh (About)', async () => {
      const res = await request(app).get('/api/cms/pages/about');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain('Aptis Kỳ Tích');
    });

    it('Nên lấy danh sách đánh giá của học viên trên trang chủ', async () => {
      const res = await request(app).get('/api/cms/reviews');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].rating).toBe(5);
    });

    it('Nên lấy danh sách Bảng Kỳ Tích vinh danh học viên', async () => {
      const res = await request(app).get('/api/cms/hall-of-fame');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
