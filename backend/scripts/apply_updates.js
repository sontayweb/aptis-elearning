
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const raw = fs.readFileSync('/tmp/standalone_p3_p4_updates.json', 'utf8');
    const updates = JSON.parse(raw);
    console.log(`Processing ${updates.length} exam updates...`);

    let count = 0;
    for (const item of updates) {
        // Find examPart by exam_id
        const part = await prisma.examPart.findFirst({
            where: { exam_id: item.exam_id }
        });
        if (!part) {
            console.log(`[SKIP] ExamPart not found for exam ${item.exam_id}`);
            continue;
        }

        await prisma.$transaction(async (tx) => {
            // 1. Update ExamPart
            await tx.examPart.update({
                where: { id: part.id },
                data: {
                    title: item.part_title,
                    instructions: item.instructions,
                    passage_text: item.passage_text
                }
            });

            // 2. Fetch existing questions for this part
            const existingQuestions = await tx.question.findMany({
                where: { part_id: part.id },
                orderBy: { question_number: 'asc' }
            });

            // 3. Update existing questions or create new ones
            for (let i = 0; i < item.questions.length; i++) {
                const q = item.questions[i];
                if (i < existingQuestions.length) {
                    await tx.question.update({
                        where: { id: existingQuestions[i].id },
                        data: {
                            question_number: q.question_number,
                            question_type: q.question_type,
                            prompt: q.prompt,
                            options: q.options,
                            correct_answer: q.correct_answer,
                            max_score: q.max_score,
                            explanation: q.explanation || null
                        }
                    });
                } else {
                    await tx.question.create({
                        data: {
                            part_id: part.id,
                            question_number: q.question_number,
                            question_type: q.question_type,
                            prompt: q.prompt,
                            options: q.options,
                            correct_answer: q.correct_answer,
                            max_score: q.max_score,
                            explanation: q.explanation || null
                        }
                    });
                }
            }

            // 4. If there were extra existing questions, clean them up
            if (existingQuestions.length > item.questions.length) {
                const extraIds = existingQuestions.slice(item.questions.length).map(q => q.id);
                await tx.submissionAnswer.deleteMany({
                    where: { question_id: { in: extraIds } }
                });
                await tx.question.deleteMany({
                    where: { id: { in: extraIds } }
                });
            }
        });
        count++;
        console.log(`[${count}/${updates.length}] Updated ${item.exam_id} (${item.type})`);
    }
    console.log(`SUCCESS: ${count} exams updated.`);
}

main().catch(err => {
    console.error("ERROR:", err);
    process.exit(1);
}).finally(() => prisma.$disconnect());
