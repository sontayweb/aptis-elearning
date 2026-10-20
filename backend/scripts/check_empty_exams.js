const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emptyExams = await prisma.exam.findMany({
    where: {
      parts: {
        none: {
          questions: {
            some: {}
          }
        }
      }
    },
    select: {
      id: true,
      title: true,
      skill: true,
      is_published: true
    }
  });

  console.log('Total completely empty exams (0 questions):', emptyExams.length);
  emptyExams.slice(0, 15).forEach(e => {
    console.log(` - [${e.skill}] ${e.title} (Published: ${e.is_published})`);
  });

  // Check how many are published
  const publishedEmpty = emptyExams.filter(e => e.is_published);
  console.log(`Number of published empty exams: ${publishedEmpty.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
