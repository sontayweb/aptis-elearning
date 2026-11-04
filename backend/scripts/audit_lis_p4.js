const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const parts = await prisma.examPart.findMany({
    where: {
      OR: [
        { title: { contains: 'Part 4', mode: 'insensitive' } },
        { part_number: 4 }
      ],
      exam: { skill: { in: ['LISTENING', 'FULL_TEST'] } }
    },
    include: {
      questions: true,
      exam: { select: { id: true, title: true, skill: true } }
    }
  });

  let totalQs = 0;
  let uuidCount = 0;
  let emptyCount = 0;
  let textCount = 0;
  let letterCount = 0;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const sampleUuid = [];
  const sampleEmpty = [];

  for (const p of parts) {
    // Only check if it's listening
    const pTitle = (p.title || '').toLowerCase();
    if (p.exam.skill === 'FULL_TEST' && !pTitle.includes('listen') && !pTitle.includes('nghe')) {
      continue;
    }

    for (const q of p.questions) {
      totalQs++;
      const ca = (q.correct_answer || '').trim();
      if (!ca) {
        emptyCount++;
        if (sampleEmpty.length < 5) {
          sampleEmpty.push({ exam: p.exam.title, part: p.title, prompt: q.prompt });
        }
      } else if (uuidRegex.test(ca)) {
        uuidCount++;
        if (sampleUuid.length < 5) {
          sampleUuid.push({ exam: p.exam.title, part: p.title, prompt: q.prompt, correct_answer: ca, options: q.options });
        }
      } else if (/^[A-D]$/i.test(ca)) {
        letterCount++;
      } else {
        textCount++;
      }
    }
  }

  console.log(JSON.stringify({ totalParts: parts.length, totalQs, uuidCount, emptyCount, textCount, letterCount }, null, 2));
  console.log('Sample UUID:', JSON.stringify(sampleUuid, null, 2));
  console.log('Sample Empty:', JSON.stringify(sampleEmpty, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());

