import { prisma } from "../config/database";

async function main() {
  const fullTest = await prisma.exam.findFirst({
    where: {
      id: "0b19e29d-0d41-4ecc-94dd-2a5b4854f24d", // Full Test 07
    },
    include: {
      parts: {
        include: {
          questions: true,
        },
      },
    },
  });

  if (!fullTest) return;

  console.log("=== READING PARTS IN FULL TEST 07 ===");
  for (const p of fullTest.parts.filter(p => p.title.includes("READING"))) {
    console.log(`Part ${p.part_number}: ${p.title} (${p.questions.length} questions)`);
    console.log(`  Instructions: ${p.instructions?.slice(0, 100)}`);
    console.log(`  PassageText length: ${p.passage_text?.length}`);
    for (const q of p.questions) {
      console.log(`    Q[${q.id}]: type=${q.question_type}, prompt="${q.prompt.slice(0, 60)}", opts=${JSON.stringify(q.options)?.slice(0, 80)}, correct="${q.correct_answer}"`);
    }
  }

  console.log("\n=== WRITING PARTS IN FULL TEST 07 ===");
  for (const p of fullTest.parts.filter(p => p.title.includes("WRITING"))) {
    console.log(`Part ${p.part_number}: ${p.title} (${p.questions.length} questions)`);
    console.log(`  Instructions: ${p.instructions?.slice(0, 100)}`);
    console.log(`  PassageText length: ${p.passage_text?.length}`);
    for (const q of p.questions) {
      console.log(`    Q[${q.id}]: type=${q.question_type}, prompt="${q.prompt.slice(0, 60)}", opts=${JSON.stringify(q.options)?.slice(0, 80)}, correct="${q.correct_answer}"`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

