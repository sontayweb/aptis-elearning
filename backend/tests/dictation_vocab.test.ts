import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { DictationLevel, DictationMode } from '@prisma/client';
import { computeWordDiff } from '../src/utils/word-diff';

describe('--- MODULE 3: DICTATION & VOCABULARY TESTS ---', () => {
  let userToken = '';
  let testUserId = '';
  let sampleLessonId = '';
  let sampleSentenceId = '';
  let sampleSetId = '';
  let sampleWordId = '';

  beforeAll(async () => {
    // 1. Tạo user test
    const userRes = await request(app).post('/api/auth/register').send({
      email: `dictation_user_${Date.now()}@aptiskytich.vn`,
      password: 'DictationPass123!',
      fullName: 'Học Viên Nghe Chép',
    });

    userToken = userRes.body.data.tokens.accessToken;
    testUserId = userRes.body.data.user.id;

    // 2. Tạo bài học nghe chép mẫu
    const lesson = await prisma.dictationLesson.create({
      data: {
        level: DictationLevel.FOUNDATION,
        title: 'Bài 1: Giao tiếp tại nhà ga xe lửa',
        total_sentences: 1,
        sentences: {
          create: [
            {
              order_index: 1,
              audio_url: 'https://cdn.aptiskytich.vn/audio/dictation/lesson1_q1.mp3',
              transcript: 'The quick brown fox jumps over the lazy dog.',
              translation_vi: 'Con cáo nâu nhanh nhẹn nhảy qua con chó lười biếng.',
              hints: 'fox, dog',
              duration_seconds: 4.5,
            },
          ],
        },
      },
      include: { sentences: true },
    });

    sampleLessonId = lesson.id;
    sampleSentenceId = lesson.sentences[0].id;

    // 3. Tạo bộ từ vựng mẫu
    const set = await prisma.vocabSet.create({
      data: {
        title: '500 Từ Vựng Aptis B1 - B2 Cốt Lõi',
        category: 'B1',
        total_words: 1,
        words: {
          create: [
            {
              word: 'Accommodate',
              phonetic: '/əˈkɒm.ə.deɪt/',
              meaning_vi: 'Cung cấp nơi ở, đáp ứng nhu cầu',
              example_sentence: 'The hotel can accommodate up to 500 guests.',
              cefr_level: 'B1',
            },
          ],
        },
      },
      include: { words: true },
    });

    sampleSetId = set.id;
    sampleWordId = set.words[0].id;
  });

  afterAll(async () => {
    if (sampleLessonId) {
      await prisma.dictationLesson.delete({ where: { id: sampleLessonId } });
    }
    if (sampleSetId) {
      await prisma.vocabSet.delete({ where: { id: sampleSetId } });
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  describe('1. Word-Level Diff Algorithm (Unit Test)', () => {
    const transcript = 'The train leaves at ten thirty.';

    it('Nên trả về 100% accuracy và isPassed = true khi gõ đúng hoàn toàn', () => {
      const result = computeWordDiff(transcript, 'The train leaves at ten thirty.');
      expect(result.accuracyRate).toBe(100);
      expect(result.isPassed).toBe(true);
      expect(result.tokens.every((t) => t.status === 'CORRECT')).toBe(true);
    });

    it('Nên bỏ qua dấu câu và không phân biệt chữ hoa/thường', () => {
      const result = computeWordDiff(transcript, 'the TRAIN leaves at ten thirty!');
      expect(result.accuracyRate).toBe(100);
      expect(result.isPassed).toBe(true);
    });

    it('Nên đánh dấu từ sai (WRONG) và từ thiếu (MISSING)', () => {
      const result = computeWordDiff(transcript, 'The bus leaves at ten');
      // "bus" sai (expected: "train"), thiếu "thirty"
      expect(result.accuracyRate).toBeLessThan(80);
      expect(result.isPassed).toBe(false);

      const wrongToken = result.tokens.find((t) => t.status === 'WRONG');
      expect(wrongToken).toBeDefined();
      expect(wrongToken?.word).toBe('bus');

      const missingToken = result.tokens.find((t) => t.status === 'MISSING');
      expect(missingToken).toBeDefined();
      expect(missingToken?.word).toBe('thirty');
    });
  });

  describe('2. Dictation API Endpoints', () => {
    it('Nên lấy tổng quan 3 Level nghe chép kèm tiến độ', async () => {
      const res = await request(app)
        .get('/api/dictation/levels')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0].level).toBe('FOUNDATION');
    });

    it('Nên lấy danh sách bài học theo Level', async () => {
      const res = await request(app)
        .get('/api/dictation/lessons')
        .query({ level: 'FOUNDATION' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Nên nộp câu nghe chép, nhận word-diff và cập nhật tiến độ học viên', async () => {
      const res = await request(app)
        .post(`/api/dictation/sentences/${sampleSentenceId}/check`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mode: DictationMode.DICTATION,
          submittedText: 'The quick brown fox jumps over the lazy dog',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accuracyRate).toBe(100);
      expect(res.body.data.isPassed).toBe(true);
      expect(res.body.data.originalTranscript).toBeDefined();

      // Kiểm tra tiến độ được ghi nhận
      const progress = await prisma.userDictationProgress.findUnique({
        where: {
          user_id_lesson_id: {
            user_id: testUserId,
            lesson_id: sampleLessonId,
          },
        },
      });
      expect(progress?.is_completed).toBe(true);
    });
  });

  describe('3. Vocabulary & Notebook API Endpoints', () => {
    it('Nên lấy danh sách các bộ từ vựng', async () => {
      const res = await request(app).get('/api/vocabulary/sets');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Nên lấy danh sách từ vựng chi tiết của một bộ', async () => {
      const res = await request(app).get(`/api/vocabulary/sets/${sampleSetId}/words`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.words.length).toBe(1);
      expect(res.body.data.words[0].word).toBe('Accommodate');
    });

    it('Nên lưu từ vựng vào sổ tay cá nhân của học viên', async () => {
      const res = await request(app)
        .post('/api/vocabulary/notebook')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wordId: sampleWordId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.word_id).toBe(sampleWordId);
    });

    it('Nên đánh dấu từ đã ghi nhớ thành công', async () => {
      const res = await request(app)
        .patch(`/api/vocabulary/notebook/${sampleWordId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ isMemorized: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_memorized).toBe(true);
    });
  });
});
