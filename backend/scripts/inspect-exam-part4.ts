import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const examId = 'fed97ee1-6774-41b0-99d7-85889ce93ca7';
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      parts: {
        include: { questions: true },
        orderBy: { part_number: 'asc' }
      }
    }
  });

  console.log(`\nExam: ${exam?.title} (${exam?.id})`);
  for (const p of exam?.parts || []) {
    console.log(`Part ${p.part_number} (${p.title}): ${p.questions.length} questions`);
    for (const q of p.questions) {
      console.log(`  - Q [${q.id}]: ${JSON.stringify(q.prompt?.slice(0, 50))}`);
    }
  }

  // Xem submissions gần nhất của exam này
  const submissions = await prisma.examSubmission.findMany({
    where: { exam_id: examId },
    orderBy: { started_at: 'desc' },
    take: 3,
    include: {
      answers: true,
      ai_results: true
    }
  });

  console.log(`\nSubmissions count: ${submissions.length}`);
  for (const s of submissions) {
    console.log(`Submission [${s.id}] status: ${s.status}, started: ${s.started_at}`);
    console.log(`  Answers: ${s.answers.length}, AI Results: ${s.ai_results.length}`);
    for (const a of s.answers) {
      console.log(`    Answer Q [${a.question_id}]: audio_url = ${a.audio_url}`);
    }
    for (const r of s.ai_results) {
      console.log(`    AI Result Q [${r.question_id}]: score = ${r.score}, band = ${r.cefr_level}, transcript = ${r.transcript?.slice(0, 50)}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
