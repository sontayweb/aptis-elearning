const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== BẮT ĐẦU AUDIT TOÀN DIỆN TẤT CẢ ĐỀ THI READING TRÊN DATABASE ===\n");
    
    const exams = await prisma.exam.findMany({
        where: { skill: 'READING' },
        include: {
            parts: {
                include: {
                    questions: {
                        orderBy: { question_number: 'asc' }
                    }
                },
                orderBy: { part_number: 'asc' }
            }
        },
        orderBy: { title: 'asc' }
    });

    console.log(`Tổng số đề Reading trong Database: ${exams.length}\n`);

    const categories = {
        full_exams: [],
        standalone_p1: [],
        standalone_p2: [],
        standalone_p3: [],
        standalone_p4: []
    };

    let totalQuestions = 0;
    let questionsWithAnswer = 0;
    let issues = [];

    for (const exam of exams) {
        let isFull = exam.parts.length >= 4;
        let examIssues = [];

        if (exam.parts.length === 0) {
            examIssues.push("Không có Part nào");
        }

        for (const part of exam.parts) {
            const pTitle = (part.title || '').toLowerCase();
            const pNum = part.part_number;
            const qs = part.questions || [];
            const passageLen = (part.passage_text || '').trim().length;

            totalQuestions += qs.length;

            // Kiểm tra từng Part
            const isP1 = pTitle.includes('gap fill') || pTitle.includes('part 1') || pNum === 1;
            const isP2 = pTitle.includes('cohesion') || pTitle.includes('order') || pTitle.includes('part 2') || pNum === 2;
            const isP3 = pTitle.includes('opinion') || pTitle.includes('part 4') || (qs.length > 0 && Array.isArray(qs[0].options) && qs[0].options.includes('Person A'));
            const isP4 = pTitle.includes('heading') || pTitle.includes('long reading') || pTitle.includes('part 5') || (qs.length > 0 && qs.some(q => (q.prompt || '').toLowerCase().includes('paragraph')));

            // 1. Kiểm tra Part 1
            if (isP1 && !isP2 && !isP3 && !isP4) {
                if (qs.length < 5) examIssues.push(`Part 1 thiếu câu hỏi (${qs.length}/5 câu)`);
                for (const q of qs) {
                    if (!q.correct_answer) examIssues.push(`Part 1 Q#${q.question_number} thiếu đáp án đúng`);
                    else questionsWithAnswer++;
                    if (!q.options || (Array.isArray(q.options) && q.options.length < 3)) {
                        examIssues.push(`Part 1 Q#${q.question_number} thiếu options`);
                    }
                }
            }

            // 2. Kiểm tra Part 2 (Ordering)
            else if (isP2 && !isP3 && !isP4) {
                if (qs.length === 0) examIssues.push(`Part 2 không có câu hỏi`);
                for (const q of qs) {
                    if (!q.correct_answer) examIssues.push(`Part 2 Q#${q.question_number} thiếu đáp án sắp xếp`);
                    else questionsWithAnswer++;
                    if (!q.options) examIssues.push(`Part 2 Q#${q.question_number} thiếu danh sách câu văn`);
                }
            }

            // 3. Kiểm tra Part 4 (Opinion Matching)
            else if (isP3 && !isP4) {
                if (passageLen < 100) examIssues.push(`Part 4 thiếu bài đọc Person A-D (độ dài text: ${passageLen})`);
                if (qs.length < 7) examIssues.push(`Part 4 thiếu câu hỏi (${qs.length}/7 câu)`);
                for (const q of qs) {
                    if (!q.correct_answer) examIssues.push(`Part 4 Q#${q.question_number} thiếu đáp án đúng`);
                    else questionsWithAnswer++;
                }
            }

            // 4. Kiểm tra Part 5 (Long Reading)
            else if (isP4) {
                if (qs.length < 7) examIssues.push(`Part 5 thiếu đoạn văn (${qs.length}/7 đoạn)`);
                for (const q of qs) {
                    if (!q.correct_answer) examIssues.push(`Part 5 Đoạn #${q.question_number} thiếu Heading đúng`);
                    else questionsWithAnswer++;
                    if (!q.options || (Array.isArray(q.options) && q.options.length < 7)) {
                        examIssues.push(`Part 5 Đoạn #${q.question_number} thiếu danh sách Heading lựa chọn`);
                    }
                }
            }
        }

        if (examIssues.length > 0) {
            issues.push({ id: exam.id, title: exam.title, issues: examIssues });
        }

        // Phân loại đề
        if (isFull) {
            categories.full_exams.push(exam);
        } else {
            const firstPartTitle = (exam.parts[0]?.title || '').toLowerCase();
            if (firstPartTitle.includes('gap fill') || firstPartTitle.includes('part 1')) categories.standalone_p1.push(exam);
            else if (firstPartTitle.includes('cohesion') || firstPartTitle.includes('part 2')) categories.standalone_p2.push(exam);
            else if (firstPartTitle.includes('opinion') || firstPartTitle.includes('part 4')) categories.standalone_p3.push(exam);
            else categories.standalone_p4.push(exam);
        }
    }

    console.log("==================================================");
    console.log("THỐNG KÊ PHÂN LOẠI ĐỀ THI READING:");
    console.log(`- Đề Full Test (4-5 parts): ${categories.full_exams.length}`);
    console.log(`- Đề lẻ Part 1 (Gap Fill): ${categories.standalone_p1.length}`);
    console.log(`- Đề lẻ Part 2 (Text Cohesion): ${categories.standalone_p2.length}`);
    console.log(`- Đề lẻ Part 4 (Opinion Matching): ${categories.standalone_p3.length}`);
    console.log(`- Đề lẻ Part 5 (Long Reading): ${categories.standalone_p4.length}`);
    console.log(`- Tổng số câu hỏi: ${totalQuestions}`);
    console.log(`- Số câu đã có ĐÁP ÁN ĐÚNG 100%: ${questionsWithAnswer} / ${totalQuestions} (${((questionsWithAnswer/totalQuestions)*100).toFixed(1)}%)`);
    console.log("==================================================");

    if (issues.length === 0) {
        console.log("\n✅ XÁC NHẬN: 100% CÁC ĐỀ THI TRONG DATABASE ĐỀU HOÀN HẢO!");
        console.log("   - Đầy đủ bài đọc & đoạn văn.");
        console.log("   - Đầy đủ số lượng câu hỏi.");
        console.log("   - Đầy đủ đáp án đúng & danh sách lựa chọn.");
    } else {
        console.log(`\n⚠️ PHÁT HIỆN ${issues.length} ĐỀ CẦN XEM XÉT:`);
        for (const item of issues) {
            const ex = exams.find(e => e.id === item.id);
            const subCount = await prisma.examSubmission.count({ where: { exam_id: item.id } });
            console.log(`- [${item.id}] "${item.title}" | is_published: ${ex?.is_published} | is_pro: ${ex?.is_pro} | Lượt nộp bài: ${subCount}:`);
            item.issues.forEach(i => console.log(`   + ${i}`));
        }
    }
}

main().catch(err => {
    console.error("Lỗi:", err);
    process.exit(1);
}).finally(() => prisma.$disconnect());
