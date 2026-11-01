import { prisma } from "../config/database";

async function main() {
  const speakingExams = await prisma.exam.findMany({
    where: { skill: "SPEAKING" },
    include: {
      parts: {
        include: {
          questions: true,
        },
      },
    },
    take: 5,
  });

  console.log("Total speaking exams found:", speakingExams.length);
  for (const ex of speakingExams) {
    console.log("\n========================================================");
    console.log("Exam:", ex.id, "| Title:", ex.title);
    for (const p of ex.parts) {
      console.log(`\n  [Part ${p.part_number}] ${p.title}`);
      console.log("    image_url:", p.image_url);
      if (p.passage_text) {
        console.log("    passage_text:", p.passage_text.slice(0, 100));
      }
      for (const q of p.questions) {
        console.log(`    Q${q.question_number}: prompt = "${q.prompt?.slice(0, 60)}"`);
        console.log("      options =", JSON.stringify(q.options));
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
