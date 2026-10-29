const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== BẮT ĐẦU AUDIT TOÀN DIỆN CẢ 4 KỸ NĂNG TRÊN HỆ THỐNG ===\n");
    
    const skills = ['READING', 'LISTENING', 'WRITING', 'SPEAKING'];

    for (const skill of skills) {
        const exams = await prisma.exam.findMany({
            where: { skill, is_published: true },
            include: {
                parts: {
                    include: {
                        questions: true
                    }
                }
            }
        });

        let totalQuestions = 0;
        let questionsWithAnswer = 0;
        let examsWithoutParts = 0;
        let examsWithoutQuestions = 0;

        for (const ex of exams) {
            if (ex.parts.length === 0) examsWithoutParts++;
            for (const part of ex.parts) {
                totalQuestions += part.questions.length;
                for (const q of part.questions) {
                    if (q.correct_answer || skill === 'WRITING' || skill === 'SPEAKING') {
                        questionsWithAnswer++;
                    }
                }
            }
            const totalQ = ex.parts.reduce((sum, p) => sum + p.questions.length, 0);
            if (totalQ === 0) examsWithoutQuestions++;
        }

        console.log(`[${skill}]`);
        console.log(`  - Đề đang Published: ${exams.length}`);
        console.log(`  - Tổng câu hỏi: ${totalQuestions}`);
        if (skill === 'READING' || skill === 'LISTENING') {
            console.log(`  - Câu có đáp án chấm tự động: ${questionsWithAnswer}/${totalQuestions} (${((questionsWithAnswer/Math.max(1, totalQuestions))*100).toFixed(1)}%)`);
        }
        console.log(`  - Đề rỗng (không có part/câu hỏi): ${examsWithoutQuestions}`);
        console.log("");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
