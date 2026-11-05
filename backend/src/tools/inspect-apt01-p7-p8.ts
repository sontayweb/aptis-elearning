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

  if (!apt01) return;

  const p7 = apt01.parts.find(p => p.part_number === 7);
  const p8 = apt01.parts.find(p => p.part_number === 8);

  console.log("=== PART 7 ===");
  console.log("Title:", p7?.title);
  console.log("PassageText length:", p7?.passage_text?.length);
  console.log("PassageText snippet:", p7?.passage_text?.slice(0, 300));
  console.log("Instructions:", p7?.instructions);
  console.log("Questions count:", p7?.questions.length);

  console.log("\n=== PART 8 ===");
  console.log("Title:", p8?.title);
  console.log("PassageText length:", p8?.passage_text?.length);
  console.log("PassageText snippet:", p8?.passage_text?.slice(0, 300));
  console.log("Instructions:", p8?.instructions);
  console.log("Questions count:", p8?.questions.length);
  p8?.questions.forEach((q, idx) => {
    console.log(`  Q${idx+1}: prompt="${q.prompt.slice(0, 80)}", opts=${JSON.stringify(q.options)?.slice(0, 60)}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

