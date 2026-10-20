const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const exams = await prisma.exam.findMany({
    where: {
      OR: [
        { skill: 'SPEAKING' },
        { skill: 'LISTENING' },
        { skill: 'FULL_TEST' }
      ]
    },
    select: {
      id: true,
      title: true,
      skill: true,
      parts: {
        select: {
          part_number: true,
          title: true,
          image_url: true,
          audio_url: true,
          questions: {
            select: {
              id: true,
              prompt: true,
              question_type: true,
              options: true,
              correct_answer: true,
            }
          }
        },
        orderBy: { part_number: 'asc' }
      }
    },
    orderBy: { created_at: 'asc' },
    take: 30
  });

  console.log('Total exams matching skill in DB:', exams.length);
  exams.forEach(ex => {
    console.log(`\nEXAM: ${ex.title} (ID: ${ex.id}, Skill: ${ex.skill}) - Total parts: ${ex.parts.length}`);
    ex.parts.forEach(p => {
      console.log(`  Part ${p.part_number}: ${p.title} | Img: ${p.image_url || 'none'} | Audio: ${p.audio_url || 'none'} | Qs count: ${p.questions.length}`);
      if (ex.skill === 'SPEAKING' || p.title.toLowerCase().includes('speaking')) {
        p.questions.forEach((q, qIdx) => {
          console.log(`     Q[${qIdx + 1}]: ${q.prompt?.substring(0, 50)}`);
        });
      }
      if (p.part_number === 1 && (ex.skill === 'LISTENING' || p.title.toLowerCase().includes('listening'))) {
        p.questions.slice(0, 3).forEach((q, qIdx) => {
          console.log(`     Listening Q[${qIdx + 1}]: ${q.prompt?.substring(0, 40)} | Opts: ${JSON.stringify(q.options)} | Ans: ${q.correct_answer}`);
        });
      }
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
