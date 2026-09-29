import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { ExamSkill, QuestionType, SubmissionStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

describe('--- MODULE 9: SPEAKING AUDIO RECORDING & STREAMING TESTS ---', () => {
  let userToken = '';
  let otherUserToken = '';
  let testUserId = '';
  let otherUserId = '';
  let sampleExamId = '';
  let sampleSubmissionId = '';
  let speakingQId = '';

  beforeAll(async () => {
    // 1. Tạo user chính và user lạ để test IDOR
    const userRes = await request(app).post('/api/auth/register').send({
      email: `audio_student_${Date.now()}@aptiskytich.vn`,
      password: 'AudioPassword123!',
      fullName: 'Học Viên Thi Speaking',
    });
    userToken = userRes.body.data.tokens.accessToken;
    testUserId = userRes.body.data.user.id;

    const otherUserRes = await request(app).post('/api/auth/register').send({
      email: `other_audio_${Date.now()}@aptiskytich.vn`,
      password: 'OtherPassword123!',
      fullName: 'Học Viên Lạ Khác',
    });
    otherUserToken = otherUserRes.body.data.tokens.accessToken;
    otherUserId = otherUserRes.body.data.user.id;

    // 2. Tạo đề thi Speaking
    const exam = await prisma.exam.create({
      data: {
        title: 'Đề Thi Speaking Aptis Test Audio Stream',
        skill: ExamSkill.SPEAKING,
        duration_minutes: 12,
        parts: {
          create: [
            {
              part_number: 1,
              title: 'Part 1: Personal Information',
              questions: {
                create: [
                  {
                    question_number: 1,
                    question_type: QuestionType.SPEAKING_AUDIO,
                    prompt: 'Please tell me about your daily routine.',
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
    speakingQId = exam.parts[0].questions[0].id;

    // 3. Khởi tạo phiên làm bài thi IN_PROGRESS
    const subRes = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ examId: sampleExamId });

    sampleSubmissionId = subRes.body.data.submissionId;
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu test
    if (sampleSubmissionId) {
      await prisma.submissionAnswer.deleteMany({ where: { submission_id: sampleSubmissionId } });
      await prisma.examSubmission.delete({ where: { id: sampleSubmissionId } });
    }
    if (sampleExamId) {
      await prisma.exam.delete({ where: { id: sampleExamId } });
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
    if (otherUserId) {
      await prisma.user.delete({ where: { id: otherUserId } });
    }
  });

  describe('1. POST /api/submissions/:id/answers/:questionId/audio (Upload Recording)', () => {
    it('Nên upload thành công file âm thanh WebM thu âm qua mic và lưu vào DB', async () => {
      // Giả lập một buffer file WebM audio dung lượng 20KB
      const dummyAudioBuffer = Buffer.alloc(20480, 0x55);

      const res = await request(app)
        .post(`/api/submissions/${sampleSubmissionId}/answers/${speakingQId}/audio`)
        .set('Authorization', `Bearer ${userToken}`)
        .field('durationSeconds', 30)
        .attach('audio', dummyAudioBuffer, {
          filename: 'recording.webm',
          contentType: 'audio/webm',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.audioUrl).toBe(
        `/api/submissions/${sampleSubmissionId}/audio/${speakingQId}`
      );
      expect(res.body.data.audioDuration).toBe(30);

      // Kiểm tra DB đã ghi nhận bản ghi câu trả lời
      const answer = await prisma.submissionAnswer.findUnique({
        where: {
          submission_id_question_id: {
            submission_id: sampleSubmissionId,
            question_id: speakingQId,
          },
        },
      });

      expect(answer).toBeDefined();
      expect(answer?.audio_url).toBe(`/api/submissions/${sampleSubmissionId}/audio/${speakingQId}`);
      expect(answer?.audio_size_bytes).toBe(20480);
      expect(answer?.audio_mime_type).toBe('audio/webm');
    });

    it('Nên từ chối upload khi không đính kèm tệp âm thanh', async () => {
      const res = await request(app)
        .post(`/api/submissions/${sampleSubmissionId}/answers/${speakingQId}/audio`)
        .set('Authorization', `Bearer ${userToken}`)
        .field('durationSeconds', 30);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Nên từ chối upload nếu người dùng khác cố tình upload vào bài thi (IDOR)', async () => {
      const dummyAudioBuffer = Buffer.alloc(1024, 0x11);

      const res = await request(app)
        .post(`/api/submissions/${sampleSubmissionId}/answers/${speakingQId}/audio`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .attach('audio', dummyAudioBuffer, {
          filename: 'hacked.webm',
          contentType: 'audio/webm',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. GET /api/submissions/:id/audio/:questionId (HTTP Range Streaming Proxy)', () => {
    it('Nên stream toàn bộ file audio với HTTP 200 khi không có Range header', async () => {
      const res = await request(app)
        .get(`/api/submissions/${sampleSubmissionId}/audio/${speakingQId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('audio/webm');
      expect(parseInt(res.headers['content-length'], 10)).toBe(20480);
      expect(res.headers['accept-ranges']).toBe('bytes');
    });

    it('Nên hỗ trợ HTTP Range request và trả về 206 Partial Content để tua audio', async () => {
      const res = await request(app)
        .get(`/api/submissions/${sampleSubmissionId}/audio/${speakingQId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('Range', 'bytes=0-1023');

      expect(res.status).toBe(206);
      expect(res.headers['content-range']).toBe('bytes 0-1023/20480');
      expect(res.headers['content-length']).toBe('1024');
      expect(res.headers['content-type']).toBe('audio/webm');
    });

    it('Nên từ chối nghe trộm audio nếu không phải chủ sở hữu hoặc giáo viên (IDOR Protection)', async () => {
      const res = await request(app)
        .get(`/api/submissions/${sampleSubmissionId}/audio/${speakingQId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
