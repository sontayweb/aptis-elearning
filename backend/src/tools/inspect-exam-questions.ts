import { prisma } from "../config/database";

async function main() {
  console.log("--- Question types count ---");
  const types = await prisma.question.groupBy({
    by: ["question_type"],
    _count: true,
  });
  console.log(JSON.stringify(types, null, 2));

  console.log("\n--- Exams with skills ---");
  const exams = await prisma.exam.findMany({
    select: {
      id: true,
      title: true,
      skill: true,
      _count: {
        select: { parts: true },
      },
    },
    take: 10,
  });
  console.log(JSON.stringify(exams, null, 2));

  console.log("\n--- Check parts and questions for a FULL_TEST or READING or WRITING exam ---");
  const sampleExam = await prisma.exam.findFirst({
    where: {
      OR: [
        { skill: "FULL_TEST" },
        { skill: "READING" },
        { skill: "WRITING" },
      ],
    },
    include: {
      parts: {
        include: {
          questions: {
            take: 3,
          },
        },
      },
    },
  });

  if (sampleExam) {
    console.log(`Sample Exam: ${sampleExam.title} (${sampleExam.skill})`);
    for (const part of sampleExam.parts) {
      console.log(`  Part ${part.part_number}: ${part.title} (${part.questions.length} questions, sample type: ${part.questions[0]?.question_type})`);
      if (part.questions[0]) {
        console.log(`    Sample Q options: ${JSON.stringify(part.questions[0].options)?.slice(0, 100)}`);
        console.log(`    Sample Q correct: ${part.questions[0].correct_answer}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
