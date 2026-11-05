import { prisma } from "../config/database";

async function main() {
  const fullTests = await prisma.exam.findMany({
    where: { skill: "FULL_TEST" },
    include: {
      parts: {
        orderBy: { part_number: "asc" },
        include: {
          questions: {
            take: 1,
            select: { id: true, question_type: true },
          },
        },
      },
    },
    take: 5,
  });

  for (const ft of fullTests) {
    console.log(`\n==============================================`);
    console.log(`FULL TEST: ${ft.title} (ID: ${ft.id}) - Total Parts: ${ft.parts.length}`);
    for (const p of ft.parts) {
      console.log(`  Part ${p.part_number} (ID: ${p.id}): ${p.title} | QType: ${p.questions[0]?.question_type}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

