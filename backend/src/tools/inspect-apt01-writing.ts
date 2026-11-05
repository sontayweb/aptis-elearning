import { prisma } from "../config/database";

async function main() {
  const apt01 = await prisma.exam.findFirst({
    where: {
      OR: [
        { title: { contains: "APT-01" } },
        { title: { contains: "Aptis ESOL Full Test #01" } },
      ],
    },
    include: {
      parts: {
        orderBy: { part_number: "asc" },
        include: {
          questions: true,
        },
      },
    },
  });

  if (apt01) {
    console.log(`\n=== EXAM: ${apt01.title} (${apt01.id}) ===`);
    for (const p of apt01.parts) {
      console.log(`Part ${p.part_number}: ${p.title} (${p.questions.length} Qs, type: ${p.questions[0]?.question_type})`);
      for (const q of p.questions) {
        console.log(`  Q[${q.id}]: prompt="${q.prompt?.slice(0, 80)}", options=${JSON.stringify(q.options)?.slice(0, 100)}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
