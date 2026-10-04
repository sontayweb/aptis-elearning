const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Kết nối PostgreSQL thành công!');
    
    // Đếm dữ liệu các bảng hiện tại
    const examCount = await prisma.exam.count();
    const partCount = await prisma.examPart.count();
    const questionCount = await prisma.question.count();
    const userCount = await prisma.user.count();
    const submissionCount = await prisma.examSubmission.count();
    const dictationLessonCount = await prisma.dictationLesson.count();
    const dictationSentenceCount = await prisma.dictationSentence.count();

    console.log('📊 Thống kê dữ liệu hiện tại trong DB:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Exams: ${examCount}`);
    console.log(`- ExamParts: ${partCount}`);
    console.log(`- Questions: ${questionCount}`);
    console.log(`- ExamSubmissions: ${submissionCount}`);
    console.log(`- DictationLessons: ${dictationLessonCount}`);
    console.log(`- DictationSentences: ${dictationSentenceCount}`);
  } catch (err) {
    console.error('❌ Lỗi kết nối:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
