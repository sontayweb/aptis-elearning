import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { ExamSkill, QuestionType, SubmissionStatus } from '@prisma/client';

describe('=== COMPREHENSIVE UAT RESPONSE VERIFICATION SUITE ===', () => {
  let studentToken = '';
  let studentId = '';
  let studentEmail = '';

  let listeningExamId = '';
  let readingExamId = '';
  let writingExamId = '';
  let speakingExamId = '';

  let listeningQuestionIds: string[] = [];
  let writingQuestionIds: string[] = [];

  beforeAll(async () => {
    studentEmail = `uat_tester_${Date.now()}@aptiskytich.vn`;
    const regRes = await request(app).post('/api/auth/register').send({
      email: studentEmail,
      password: 'UatPassword123!',
      fullName: 'Học Viên UAT Kiểm Thử',
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.tokens.accessToken).toBeDefined();

    studentToken = regRes.body.data.tokens.accessToken;
    studentId = regRes.body.data.user.id;

    // Tìm hoặc tạo đề Listening test
    const listeningExam = await prisma.exam.create({
      data: {
        title: 'UAT Benchmark Listening Exam',
        skill: ExamSkill.LISTENING,
        duration_minutes: 40,
        is_published: true,
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
                    prompt: 'What time is the meeting scheduled?',
                    options: ['A. 9:00 AM', 'B. 9:30 AM', 'C. 10:00 AM'],
                    correct_answer: 'B',
                    explanation: 'The speaker states the meeting will start at half past nine.',
                    max_score: 1.0,
                  },
                  {
                    question_number: 2,
                    question_type: QuestionType.MULTIPLE_CHOICE,
                    prompt: 'Which gate is the flight departing from?',
                    options: ['A. Gate 12', 'B. Gate 14', 'C. Gate 18'],
                    correct_answer: 'A',
                    explanation: 'The airport announcement confirms Gate 12.',
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
    listeningExamId = listeningExam.id;
    listeningQuestionIds = listeningExam.parts[0].questions.map((q) => q.id);

    // Tạo đề Writing test
    const writingExam = await prisma.exam.create({
      data: {
        title: 'UAT Benchmark Writing Club Exam',
        skill: ExamSkill.WRITING,
        duration_minutes: 50,
        is_published: true,
        is_pro: false,
        source: 'WEB',
        parts: {
          create: [
            {
              part_number: 1,
              title: 'Part 1: Short Answers',
              questions: {
                create: [
                  {
                    question_number: 1,
                    question_type: QuestionType.ESSAY,
                    prompt: 'What is your favorite book genre and why?',
                    explanation: 'I love science fiction because it inspires my imagination.',
                    max_score: 5.0,
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
    writingExamId = writingExam.id;
    writingQuestionIds = writingExam.parts[0].questions.map((q) => q.id);
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu test
    if (listeningExamId) {
      await prisma.examSubmission.deleteMany({ where: { exam_id: listeningExamId } });
      await prisma.exam.delete({ where: { id: listeningExamId } }).catch(() => {});
    }
    if (writingExamId) {
      await prisma.examSubmission.deleteMany({ where: { exam_id: writingExamId } });
      await prisma.exam.delete({ where: { id: writingExamId } }).catch(() => {});
    }
    if (studentId) {
      await prisma.examSubmission.deleteMany({ where: { user_id: studentId } });
      await prisma.user.delete({ where: { id: studentId } }).catch(() => {});
    }
  });

  describe('1. UAT Phase 1: Hệ Thống & Kiểm Tra Danh Sách Đề Thi (Discovery)', () => {
    it('Response Health Check trả về đúng mã 200 và trạng thái OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.timestamp).toBeDefined();
    });

    it('GET /api/exams trả về cấu trúc danh sách đề thi chuẩn xác với đầy đủ metadata', async () => {
      const res = await request(app)
        .get('/api/exams')
        .query({ skill: 'LISTENING', limit: 10 })
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const examItem = res.body.data.find((e: any) => e.id === listeningExamId);
      expect(examItem).toBeDefined();
      expect(examItem.title).toBe('UAT Benchmark Listening Exam');
      expect(examItem.skill).toBe('LISTENING');
      expect(examItem.durationMinutes).toBe(40);
      expect(examItem.userStatus).toBe('NOT_STARTED');
      expect(examItem.userAttempts).toBe(0);
    });
  });

  describe('2. UAT Phase 2: Bảo Mật Phòng Thi & Che Đáp Án Trắc Nghiệm (Anti-Cheating)', () => {
    it('GET /api/exams/:id/questions bảo vệ đề thi trắc nghiệm (không lộ correct_answer và explanation)', async () => {
      const res = await request(app).get(`/api/exams/${listeningExamId}/questions`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parts).toBeDefined();
      expect(res.body.data.parts.length).toBe(1);

      const part1 = res.body.data.parts[0];
      expect(part1.questions.length).toBe(2);

      const q1 = part1.questions[0];
      expect(q1.prompt).toBe('What time is the meeting scheduled?');
      expect(Array.isArray(q1.options)).toBe(true);
      expect(q1.options.length).toBe(3);

      // KHÔNG ĐƯỢC LỘ ĐÁP ÁN CHO OBJECTIVE EXAM TRONG PHÒNG THI
      expect(q1.correct_answer).toBeUndefined();
      expect(q1.explanation).toBeUndefined();
    });

    it('GET /api/exams/:id/questions giữ nguyên hướng dẫn và bài mẫu cho đề Writing', async () => {
      const res = await request(app).get(`/api/exams/${writingExamId}/questions`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const q = res.body.data.parts[0].questions[0];
      expect(q.prompt).toBe('What is your favorite book genre and why?');
      // Đề viết giữ explanation làm bài viết mẫu
      expect(q.explanation).toBeDefined();
    });
  });

  describe('3. UAT Phase 3: Vòng Đời Bài Thi Trắc Nghiệm (Listening Full Lifecycle)', () => {
    let subId = '';

    it('3.1 POST /api/submissions: Khởi tạo phiên thi và tính deadline server chính xác', async () => {
      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ examId: listeningExamId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.submissionId).toBeDefined();
      expect(res.body.data.status).toBe(SubmissionStatus.IN_PROGRESS);
      expect(res.body.data.serverTimeRemaining).toBeGreaterThan(2300); // 40 phút

      subId = res.body.data.submissionId;
    });

    it('3.2 PUT /api/submissions/:id/autosave: Tự động lưu đáp án của học viên', async () => {
      const res = await request(app)
        .put(`/api/submissions/${subId}/autosave`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          answers: [
            { questionId: listeningQuestionIds[0], selectedOption: 'B' }, // Đúng
            { questionId: listeningQuestionIds[1], selectedOption: 'B' }, // Sai (Đáp án đúng là A)
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.savedCount).toBe(2);
      expect(res.body.data.isExpired).toBe(false);
    });

    it('3.3 POST /api/submissions/:id/heartbeat: Ghi nhận chống gian lận & tab switch', async () => {
      const res = await request(app)
        .post(`/api/submissions/${subId}/heartbeat`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ tabSwitchCount: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SubmissionStatus.IN_PROGRESS);
    });

    it('3.4 GET /api/submissions/:id/resume: Khôi phục phiên thi khi reload trình duyệt', async () => {
      const res = await request(app)
        .get(`/api/submissions/${subId}/resume`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.submissionId).toBe(subId);
      expect(res.body.data.savedAnswers[listeningQuestionIds[0]].selectedOption).toBe('B');
      expect(res.body.data.savedAnswers[listeningQuestionIds[1]].selectedOption).toBe('B');
    });

    it('3.5 POST /api/submissions/:id/submit: Nộp bài, chấm điểm tự động và xếp chuẩn CEFR', async () => {
      const res = await request(app)
        .post(`/api/submissions/${subId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SubmissionStatus.GRADED);
      expect(res.body.data.totalScore).toBe(1.0); // 1 câu đúng = 1 điểm
      expect(res.body.data.correctCount).toBe(1);
      expect(res.body.data.totalQuestions).toBe(2);
      expect(res.body.data.hasSubjectiveEvaluation).toBe(false);
      expect(res.body.data.partBreakdown).toBeDefined();
      expect(res.body.data.partBreakdown[0].correctCount).toBe(1);
    });

    it('3.6 GET /api/submissions/:id: Xem lại bài thi kèm lời giải và đáp án chi tiết sau khi nộp', async () => {
      const res = await request(app)
        .get(`/api/submissions/${subId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(subId);
      expect(res.body.data.total_score).toBe(1.0);
      expect(res.body.data.answers.length).toBe(2);

      const gradedQ1 = res.body.data.answers.find((a: any) => a.question_id === listeningQuestionIds[0]);
      expect(gradedQ1.score).toBe(1.0);

      const gradedQ2 = res.body.data.answers.find((a: any) => a.question_id === listeningQuestionIds[1]);
      expect(gradedQ2.score).toBe(0.0);
    });
  });

  describe('4. UAT Phase 4: Vòng Đời Bài Thi Tự Luận (Writing Lifecycle)', () => {
    let writingSubId = '';

    it('4.1 Bắt đầu bài thi Writing và Autosave bài luận', async () => {
      const startRes = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ examId: writingExamId });

      expect(startRes.status).toBe(201);
      writingSubId = startRes.body.data.submissionId;

      const autosaveRes = await request(app)
        .put(`/api/submissions/${writingSubId}/autosave`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          answers: [
            {
              questionId: writingQuestionIds[0],
              textAnswer: 'I really love science fiction novels because they explore future possibilities.',
            },
          ],
        });

      expect(autosaveRes.status).toBe(200);
      expect(autosaveRes.body.data.savedCount).toBe(1);
    });

    it('4.2 Nộp bài Writing chuyển sang trạng thái PENDING_EVALUATION chờ giáo viên/AI chấm', async () => {
      const submitRes = await request(app)
        .post(`/api/submissions/${writingSubId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      expect(submitRes.body.data.status).toBe(SubmissionStatus.PENDING_EVALUATION);
      expect(submitRes.body.data.hasSubjectiveEvaluation).toBe(true);
    });
  });

  describe('5. UAT Phase 5: Báo Cáo Lịch Sử & Chỉ Số Dashboard Học Viên', () => {
    it('GET /api/submissions/my-history: Trả về lịch sử làm bài với chuẩn dữ liệu chi tiết', async () => {
      const res = await request(app)
        .get('/api/submissions/my-history')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2); // 1 Listening + 1 Writing

      const listeningEntry = res.body.data.find((item: any) => item.skill === 'Listening');
      expect(listeningEntry).toBeDefined();
      expect(listeningEntry.status).toBe('GRADED');
      expect(listeningEntry.score).toBe('1/50');
      expect(listeningEntry.scoreNumber).toBe(1);
      expect(listeningEntry.durationSpent).toBeDefined();
      expect(listeningEntry.date).toBeDefined();

      const writingEntry = res.body.data.find((item: any) => item.skill === 'Writing');
      expect(writingEntry).toBeDefined();
      expect(writingEntry.status).toBe('PENDING_EVALUATION');
      expect(writingEntry.score).toBe('Chờ chấm');

      // Kiểm tra khối thống kê tổng hợp (Summary)
      expect(res.body.meta?.summary).toBeDefined();
      expect(res.body.meta.summary.totalCompleted).toBeGreaterThan(0);
    });

    it('GET /api/student/dashboard-stats: Trả về chỉ số tiến độ học viên toàn diện', async () => {
      const res = await request(app)
        .get('/api/student/dashboard-stats')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalQuestionsAnswered).toBeGreaterThan(0);
      expect(res.body.data.accuracyPercent).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(res.body.data.recentTests)).toBe(true);
      expect(res.body.data.recentTests.length).toBe(2);
      expect(Array.isArray(res.body.data.skillProgress)).toBe(true);
      expect(res.body.data.skillProgress.length).toBe(5);
    });
  });
});
