import { prisma } from "../config/database";

async function main() {
  console.log("=== BẮT ĐẦU SỬA LỖI QUESTION TYPE TRONG DATABASE ===");

  // 1. Sửa tất cả câu hỏi Writing có question_type là MULTIPLE_CHOICE -> ESSAY
  const writingParts = await prisma.examPart.findMany({
    where: {
      OR: [
        { title: { contains: "WRITING", mode: "insensitive" } },
        { title: { contains: "VIẾT", mode: "insensitive" } },
        { title: { contains: "VIET", mode: "insensitive" } },
        { exam: { skill: "WRITING" } },
      ],
    },
    select: { id: true },
  });
  const writingPartIds = writingParts.map((p) => p.id);

  const updatedWriting = await prisma.question.updateMany({
    where: {
      part_id: { in: writingPartIds },
      question_type: { in: ["MULTIPLE_CHOICE", "SHORT_TEXT"] },
    },
    data: {
      question_type: "ESSAY",
    },
  });
  console.log(`✓ Đã cập nhật ${updatedWriting.count} câu hỏi Writing từ MULTIPLE_CHOICE/SHORT_TEXT sang ESSAY.`);

  // 2. Sửa các câu hỏi Reading Part 1 có question_type là MULTIPLE_CHOICE nhưng là điền từ -> GAP_FILL
  const readingP1Parts = await prisma.examPart.findMany({
    where: {
      AND: [
        {
          OR: [
            { title: { contains: "Part 1", mode: "insensitive" } },
            { part_number: 1 },
            { part_number: 5 },
            { part_number: 15 },
          ],
        },
        {
          OR: [
            { title: { contains: "READING", mode: "insensitive" } },
            { title: { contains: "ĐỌC", mode: "insensitive" } },
            { title: { contains: "Sentence comprehension", mode: "insensitive" } },
            { exam: { skill: "READING" } },
          ],
        },
      ],
    },
    select: { id: true },
  });
  const readingP1PartIds = readingP1Parts.map((p) => p.id);

  const updatedReadingP1 = await prisma.question.updateMany({
    where: {
      part_id: { in: readingP1PartIds },
      question_type: "MULTIPLE_CHOICE",
      OR: [
        { prompt: { contains: "tentisspace", mode: "insensitive" } },
        { prompt: { contains: "[gap]", mode: "insensitive" } },
        { prompt: { contains: "[blank]", mode: "insensitive" } },
      ],
    },
    data: {
      question_type: "GAP_FILL",
    },
  });
  console.log(`✓ Đã cập nhật ${updatedReadingP1.count} câu hỏi Reading Part 1 sang GAP_FILL.`);

  // 3. Chuẩn hóa 10 câu hỏi SENTENCE_ORDER có options dạng mảng chuỗi thành object chuẩn { title, sentences }
  const sentenceOrderQuestions = await prisma.question.findMany({
    where: { question_type: "SENTENCE_ORDER" },
    select: { id: true, options: true, prompt: true, correct_answer: true },
  });

  let fixedSentenceOrderCount = 0;
  for (const q of sentenceOrderQuestions) {
    let opts = q.options as any;
    if (typeof opts === "string") {
      try { opts = JSON.parse(opts); } catch {}
    }

    if (Array.isArray(opts)) {
      // Lọc các câu tiếng Anh (nếu có cặp bản dịch tiếng Việt)
      const rawArr = opts.filter((item: any) => typeof item === "string" && item.trim());
      const hasVnPairs = rawArr.length >= 4 && rawArr.some((s: string) => /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s));

      let englishSentences: string[] = [];
      if (hasVnPairs && rawArr.length % 2 === 0) {
        englishSentences = rawArr.filter((_: string, i: number) => i % 2 === 0);
      } else {
        englishSentences = rawArr;
      }

      const sentences = englishSentences.map((text: string, idx: number) => ({
        id: `s${idx + 1}`,
        text: text.trim(),
      }));

      const newOptions = {
        title: q.prompt && !q.prompt.toLowerCase().includes("sentences into") ? q.prompt : "Text Cohesion",
        sentences,
      };

      const correctOrder = sentences.map((s) => s.id);

      await prisma.question.update({
        where: { id: q.id },
        data: {
          options: newOptions,
          correct_answer: JSON.stringify(correctOrder),
        },
      });
      fixedSentenceOrderCount++;
    }
  }
  console.log(`✓ Đã chuẩn hóa ${fixedSentenceOrderCount} câu hỏi SENTENCE_ORDER thành cấu trúc object chuẩn.`);
  console.log("=== HOÀN TẤT CẬP NHẬT DATABASE ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());

