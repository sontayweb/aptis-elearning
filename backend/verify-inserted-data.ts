import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('===========================================================');
  console.log('🔍 KIỂM ĐỊNH CHI TIẾT CẤU TRÚC ĐỀ THI TRONG POSTGRESQL');
  console.log('===========================================================');

  // 1. Kiểm tra Full Test tổng hợp
  const ft = await prisma.exam.findFirst({
    where: { skill: 'FULL_TEST', source: 'APTIS_KYTICH' },
    include: {
      parts: {
        orderBy: { part_number: 'asc' },
        include: { questions: true }
      }
    }
  });

  console.log(`\n1. Đề thi thử Full Test (Kỳ Tích):`);
  console.log(`- Tiêu đề: ${ft?.title}`);
  console.log(`- Kỹ năng: ${ft?.skill}`);
  console.log(`- Thời gian: ${ft?.duration_minutes} phút`);
  console.log(`- Số Parts: ${ft?.parts.length} parts`);
  console.log(`- Tổng câu hỏi: ${ft?.parts.reduce((s, p) => s + p.questions.length, 0)} câu`);
  console.log(`- Chi tiết các Parts:`);
  ft?.parts.slice(0, 5).forEach(p => {
    console.log(`  + Part ${p.part_number}: ${p.title} (${p.questions.length} câu) [Audio: ${p.audio_url ? 'Có' : 'Không'}]`);
  });

  // 2. Kiểm tra Đề thi Kỹ năng lẻ Reading
  const readEx = await prisma.exam.findFirst({
    where: { skill: 'READING' },
    include: {
      parts: {
        include: { questions: true }
      }
    }
  });

  console.log(`\n2. Đề thi luyện Reading:`);
  console.log(`- Tiêu đề: ${readEx?.title}`);
  console.log(`- Số Parts: ${readEx?.parts.length} parts`);
  console.log(`- Câu hỏi: ${readEx?.parts[0]?.questions.length} câu`);
  console.log(`- Câu 1: [Type: ${readEx?.parts[0]?.questions[0]?.question_type}] Prompt: "${readEx?.parts[0]?.questions[0]?.prompt?.substring(0, 50)}..."`);
  console.log(`- Options câu 1:`, readEx?.parts[0]?.questions[0]?.options);

  // 3. Kiểm tra Nghe chép chính tả
  const sampleLesson = await prisma.dictationLesson.findFirst({
    include: { sentences: true }
  });

  console.log(`\n3. Bài học Nghe chép chính tả:`);
  console.log(`- Tiêu đề: ${sampleLesson?.title}`);
  console.log(`- Level: ${sampleLesson?.level}`);
  console.log(`- Số câu: ${sampleLesson?.sentences.length} câu`);
  console.log(`- Câu mẫu: "${sampleLesson?.sentences[0]?.transcript}"`);
  console.log(`- Audio URL: ${sampleLesson?.sentences[0]?.audio_url}`);
  console.log('===========================================================\n');
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
