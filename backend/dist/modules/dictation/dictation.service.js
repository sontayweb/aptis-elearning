"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dictationService = exports.DictationService = void 0;
const database_1 = require("../../config/database");
const client_1 = require("@prisma/client");
const word_diff_1 = require("../../utils/word-diff");
class DictationService {
    async getLevelsSummary(userId) {
        const levels = [
            {
                level: client_1.DictationLevel.FOUNDATION,
                title: 'Level 1 · Foundation',
                description: 'Câu ngắn, tốc độ chậm — dựng phản xạ (Listening câu 1 - 13)',
            },
            {
                level: client_1.DictationLevel.MOMENTUM,
                title: 'Level 2 · Momentum',
                description: 'Đoạn dài, nhiều thông tin — tập giữ mạch khi dồn dập (Listening câu 14)',
            },
            {
                level: client_1.DictationLevel.MASTERY,
                title: 'Level 3 · Mastery',
                description: 'Hội thoại nêu quan điểm và bài nói học thuật khó (Listening câu 15 - 17)',
            },
        ];
        const results = [];
        for (const lvl of levels) {
            const lessons = await database_1.prisma.dictationLesson.findMany({
                where: { level: lvl.level },
                select: { id: true, total_sentences: true },
            });
            const totalLessons = lessons.length;
            const totalSentences = lessons.reduce((sum, l) => sum + l.total_sentences, 0);
            let completedSentences = 0;
            if (userId && lessons.length > 0) {
                const progress = await database_1.prisma.userDictationProgress.findMany({
                    where: {
                        user_id: userId,
                        lesson_id: { in: lessons.map((l) => l.id) },
                    },
                });
                completedSentences = progress.reduce((sum, p) => sum + p.completed_sentences, 0);
            }
            results.push({
                ...lvl,
                totalLessons,
                totalSentences,
                completedSentences,
                percentage: totalSentences > 0
                    ? Math.round((completedSentences / totalSentences) * 100)
                    : 0,
            });
        }
        return results;
    }
    async getLessons(level, userId) {
        const lessons = await database_1.prisma.dictationLesson.findMany({
            where: { level },
            orderBy: { order_index: 'asc' },
            include: {
                _count: { select: { sentences: true } },
            },
        });
        let progressMap = new Map();
        if (userId) {
            const progress = await database_1.prisma.userDictationProgress.findMany({
                where: {
                    user_id: userId,
                    lesson_id: { in: lessons.map((l) => l.id) },
                },
            });
            progressMap = new Map(progress.map((p) => [p.lesson_id, p]));
        }
        return lessons.map((l) => {
            const p = progressMap.get(l.id);
            return {
                id: l.id,
                level: l.level,
                title: l.title,
                orderIndex: l.order_index,
                totalSentences: l.total_sentences || l._count.sentences,
                completedSentences: p ? p.completed_sentences : 0,
                isCompleted: p ? p.is_completed : false,
            };
        });
    }
    async getLessonDetail(lessonId) {
        const lesson = await database_1.prisma.dictationLesson.findUnique({
            where: { id: lessonId },
            include: {
                sentences: {
                    orderBy: { order_index: 'asc' },
                    select: {
                        id: true,
                        order_index: true,
                        audio_url: true,
                        duration_seconds: true,
                        hints: true,
                        translation_vi: true,
                        // Ẩn transcript gốc khi chưa check
                    },
                },
            },
        });
        if (!lesson) {
            throw { statusCode: 404, message: 'Bài học nghe chép không tồn tại' };
        }
        return lesson;
    }
    async checkSentence(userId, sentenceId, mode, submittedText, audioUrl) {
        const sentence = await database_1.prisma.dictationSentence.findUnique({
            where: { id: sentenceId },
            include: { lesson: true },
        });
        if (!sentence) {
            throw { statusCode: 404, message: 'Câu cần kiểm tra không tồn tại' };
        }
        const diffResult = (0, word_diff_1.computeWordDiff)(sentence.transcript, submittedText || '');
        // Lưu lượt nộp bài
        await database_1.prisma.userDictationAttempt.create({
            data: {
                user_id: userId,
                sentence_id: sentenceId,
                mode: mode || client_1.DictationMode.DICTATION,
                submitted_text: submittedText,
                audio_url: audioUrl || null,
                accuracy_rate: diffResult.accuracyRate,
                word_diff_result: diffResult.tokens,
                is_passed: diffResult.isPassed,
            },
        });
        // Cập nhật tiến độ học viên
        if (diffResult.isPassed) {
            // Đếm số câu duy nhất đã pass trong bài học này
            const passedCount = await database_1.prisma.userDictationAttempt.count({
                where: {
                    user_id: userId,
                    sentence: { lesson_id: sentence.lesson_id },
                    is_passed: true,
                },
            });
            const isCompleted = passedCount >= sentence.lesson.total_sentences;
            await database_1.prisma.userDictationProgress.upsert({
                where: {
                    user_id_lesson_id: {
                        user_id: userId,
                        lesson_id: sentence.lesson_id,
                    },
                },
                update: {
                    completed_sentences: passedCount,
                    is_completed: isCompleted,
                },
                create: {
                    user_id: userId,
                    lesson_id: sentence.lesson_id,
                    completed_sentences: passedCount,
                    is_completed: isCompleted,
                },
            });
        }
        return {
            sentenceId,
            originalTranscript: sentence.transcript,
            translationVi: sentence.translation_vi,
            accuracyRate: diffResult.accuracyRate,
            isPassed: diffResult.isPassed,
            diffTokens: diffResult.tokens,
        };
    }
}
exports.DictationService = DictationService;
exports.dictationService = new DictationService();
