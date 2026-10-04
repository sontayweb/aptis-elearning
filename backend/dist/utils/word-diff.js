"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeWordDiff = void 0;
const computeWordDiff = (transcript, submittedText) => {
    // Chuẩn hóa: loại bỏ dấu câu đặc biệt, đưa về chữ thường
    const clean = (str) => str
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    const expectedWords = clean(transcript).split(' ').filter(Boolean);
    const submittedWords = clean(submittedText).split(' ').filter(Boolean);
    let correctCount = 0;
    const tokens = [];
    const maxLength = Math.max(expectedWords.length, submittedWords.length);
    for (let i = 0; i < maxLength; i++) {
        const expected = expectedWords[i];
        const submitted = submittedWords[i];
        if (!submitted) {
            // Học viên bị thiếu từ
            tokens.push({
                word: expected,
                status: 'MISSING',
                expected,
            });
        }
        else if (!expected) {
            // Học viên gõ thừa từ
            tokens.push({
                word: submitted,
                status: 'WRONG',
            });
        }
        else if (submitted === expected) {
            correctCount++;
            tokens.push({
                word: submitted,
                status: 'CORRECT',
            });
        }
        else {
            tokens.push({
                word: submitted,
                status: 'WRONG',
                expected,
            });
        }
    }
    const accuracyRate = expectedWords.length > 0
        ? Math.round((correctCount / expectedWords.length) * 100 * 10) / 10
        : 0;
    return {
        accuracyRate,
        isPassed: accuracyRate >= 80,
        totalExpectedWords: expectedWords.length,
        correctWordsCount: correctCount,
        tokens,
    };
};
exports.computeWordDiff = computeWordDiff;
