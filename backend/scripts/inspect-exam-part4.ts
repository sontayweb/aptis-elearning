import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const latestSubs = await prisma.examSubmission.findMany({
    orderBy: { started_at: 'desc' },
    take: 3,
    include: {
      exam: { select: { id: true, title: true, skill: true } },
      answers: true,
      ai_results: true,
    },
  });

  console.log('--- LATEST 3 SUBMISSIONS IN DB ---');
  for (const s of latestSubs) {
    console.log(`\nSub [${s.id}] | Exam: ${s.exam.title} (${s.exam.skill}) | started: ${s.started_at}`);
    console.log(`Status: ${s.status} | Answers: ${s.answers.length} | AI Results: ${s.ai_results.length}`);
    for (const a of s.answers) {
      console.log(`  - Answer Q [${a.question_id}]: audio_url = ${a.audio_url}`);
    }
    for (const r of s.ai_results) {
      console.log(`  - AI Result Q [${r.question_id}]: model = ${r.model_name}, score = ${r.score}, band = ${r.cefr_level}`);
      console.log(`    transcript = ${JSON.stringify(r.transcript?.slice(0, 80))}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
