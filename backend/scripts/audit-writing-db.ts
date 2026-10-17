import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const writingExams = await prisma.exam.findMany({
    where: { skill: 'WRITING' },
    include: { parts: { include: { questions: true } } },
  });

  console.log('Total writing exams in DB:', writingExams.length);
  
  let p2SubCount = 0;
  let p2SubIssues = 0;

  for (const ex of writingExams) {
    const isP2Sub = ex.title.toLowerCase().includes('part 2') || (ex.parts.length === 1 && ex.parts[0].title.toLowerCase().includes('part 2'));
    if (isP2Sub) {
      p2SubCount++;
      const p = ex.parts[0];
      const q = p?.questions[0];
      const prompt = q?.prompt || '';
      const isInstruction = prompt.toLowerCase().includes('fill in the form') || prompt.toLowerCase().includes('sentences') || prompt.toLowerCase().includes('recommended time');
      if (isInstruction) {
        p2SubIssues++;
      }
    }
  }

  console.log(`Found ${p2SubCount} Part 2 sub-exams.`);
  console.log(`Of which ${p2SubIssues} have instruction instead of the actual question prompt!`);

  // Also check Full Writing exams
  const fullExams = writingExams.filter(ex => ex.parts.length > 1);
  console.log(`\nFound ${fullExams.length} Full Writing exams.`);
  let fullP2Issues = 0;
  for (const ex of fullExams) {
    const p2 = ex.parts.find(p => p.part_number === 2 || p.title.toLowerCase().includes('part 2'));
    if (p2) {
      const q = p2.questions[0];
      const prompt = q?.prompt || '';
      if (prompt.toLowerCase().includes('fill in the form') || prompt.toLowerCase().includes('sentences')) {
        fullP2Issues++;
      }
    }
  }
  console.log(`Of which ${fullP2Issues} Full Writing exams have instruction instead of question prompt in Part 2!`);

  await prisma.$disconnect();
}

run().catch(console.error);
