import { prisma } from '../src/config/database';

async function main() {
  const exams = await prisma.exam.findMany({
    where: {
      skill: 'SPEAKING',
    },
    include: {
      parts: {
        include: {
          questions: true,
        },
      },
    },
    orderBy: {
      title: 'asc',
    },
  });

  console.log(`Total Speaking Exams in DB: ${exams.length}`);
  const part3Exams = exams.filter(
    (e) =>
      e.parts.length === 1 &&
      (e.title.toLowerCase().includes('part 3') ||
        e.parts[0]?.title?.toLowerCase().includes('part 3') ||
        e.parts[0]?.part_number === 3)
  );

  console.log(`\nFound ${part3Exams.length} single-part Speaking Part 3 exams in DB:`);
  for (const e of part3Exams) {
    const p = e.parts[0];
    console.log(`----------------------------------------------------------------`);
    console.log(`Exam ID: ${e.id}`);
    console.log(`Title: ${e.title}`);
    console.log(`Part Title: ${p?.title}`);
    console.log(`Part Image URL: ${p?.image_url}`);
    console.log(`Questions count: ${p?.questions?.length}`);
    for (const q of p?.questions || []) {
      console.log(`  - Q${q.question_number}: ${q.prompt?.slice(0, 60)}... (img: ${(q as any).image_url || 'none'})`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
