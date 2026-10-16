import { PrismaClient } from '@prisma/client';
import { ExamService } from '../src/modules/exams/exam.service';

const prisma = new PrismaClient();
const examService = new ExamService();

async function main() {
  console.log('=== AUDITING DETAILED EXAM API RESPONSES & FLOWS ACROSS 4 SKILLS ===\n');

  const admin = await prisma.user.findFirst({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
    select: { id: true, email: true, role: true },
  });
  console.log(`Using Staff User for Audit: ${admin?.email} (${admin?.role}, id: ${admin?.id})\n`);

  // Check Exam 01 Specifically
  console.log('Testing Exam 01 Full Listening Audio Mapping:');
  const de01 = await examService.getExamQuestions('61fdc722-45c4-43a8-adc2-52db6c4110bc', admin?.id);
  console.log(`Exam 01 Title: "${de01.title}"`);
  console.log(`Part 1 Q1 audio: ${(de01.parts[0]?.questions[0] as any)?.audio_url}`);
  console.log(`Part 1 Q1 transcript: ${(de01.parts[0]?.questions[0] as any)?.transcript?.substring(0, 40)}`);
  console.log(`Part 2 audio: ${(de01.parts[1] as any)?.audio_url}`);
  console.log(`Part 3 audio: ${(de01.parts[2] as any)?.audio_url}`);
  console.log(`Part 4 Q1 audio: ${(de01.parts[3]?.questions[0] as any)?.audio_url}\n`);

  const skills = ['LISTENING', 'SPEAKING', 'READING', 'WRITING'];

  for (const skill of skills) {
    console.log(`\n===============================================================`);
    console.log(`[SKILL AUDIT: ${skill}]`);
    console.log(`===============================================================`);

    const count = await prisma.exam.count({ where: { skill: skill as any } });
    console.log(`Total exams in DB: ${count}`);

    // Get 1 Free and 1 Pro exam if possible
    const sampleExams = await prisma.exam.findMany({
      where: { skill: skill as any },
      take: 2,
      select: { id: true, title: true, duration_minutes: true, is_pro: true },
    });

    for (const exam of sampleExams) {
      console.log(`\n-----------------------------------------------------------`);
      console.log(`Exam: [${exam.id}] "${exam.title}" (isPro: ${exam.is_pro})`);
      console.log(`-----------------------------------------------------------`);

      const res = await examService.getExamQuestions(exam.id, admin?.id);
      const parts = res.parts || [];
      console.log(`Parts returned count: ${parts.length}`);

      for (const p of parts) {
        console.log(`\n  * Part ${p.part_number}: "${p.title}"`);
        console.log(`    - Passage text: ${p.passage_text ? p.passage_text.substring(0, 70) + '...' : '(empty)'}`);
        console.log(`    - Audio URL on part: ${(p as any).audio_url || 'NONE'}`);
        console.log(`    - Transcript on part: ${(p as any).transcript ? (p as any).transcript.substring(0, 70) + '...' : 'NONE'}`);
        console.log(`    - Questions count: ${p.questions?.length || 0}`);

        if (p.questions && p.questions.length > 0) {
          const qSample = p.questions[0];
          console.log(`      > Q1 (#${qSample.question_number}) prompt: "${qSample.prompt?.substring(0, 60)}..."`);
          console.log(`      > Q1 audio_url: ${(qSample as any).audio_url || 'NONE'}`);
          console.log(`      > Q1 transcript: ${(qSample as any).transcript ? (qSample as any).transcript.substring(0, 60) + '...' : 'NONE'}`);
          console.log(`      > Q1 explanation: ${(qSample as any).explanation ? (qSample as any).explanation.substring(0, 50) + '...' : 'HIDDEN'}`);
          console.log(`      > Q1 correct_answer: "${qSample.correct_answer}"`);
          console.log(`      > Q1 options type:`, typeof qSample.options, Array.isArray(qSample.options) ? `[${(qSample.options as any[]).length} items]` : '');
        }
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
