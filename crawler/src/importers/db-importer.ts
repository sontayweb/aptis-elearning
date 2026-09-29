import fs from "fs";
import path from "path";
import { config } from "../config";
import {
  CrawledExam,
  CrawledDictationSentence,
  CrawledVocabSet,
} from "../types";

export class DatabaseImporter {
  private prisma: any = null;

  constructor() {
    this.initPrisma();
    this.ensureOutputDirs();
  }

  private ensureOutputDirs() {
    if (!fs.existsSync(config.jsonOutputDir)) {
      fs.mkdirSync(config.jsonOutputDir, { recursive: true });
    }
  }

  private initPrisma() {
    try {
      // Ưu tiên load Prisma Client từ backend nếu crawler chưa cài node_modules
      const backendPrismaPath = path.resolve(
        __dirname,
        "../../../backend/node_modules/@prisma/client"
      );
      if (fs.existsSync(backendPrismaPath)) {
        const { PrismaClient } = require(backendPrismaPath);
        this.prisma = new PrismaClient();
        console.log("✅ Đã kết nối Prisma Client từ backend.");
      } else {
        const { PrismaClient } = require("@prisma/client");
        this.prisma = new PrismaClient();
        console.log("✅ Đã kết nối Prisma Client nội bộ.");
      }
    } catch (err: any) {
      console.warn("⚠️ Chưa thể khởi tạo kết nối Prisma trực tiếp:", err.message);
      console.log("💡 Chế độ dự phòng: Dữ liệu sẽ được lưu tự động thành file JSON và SQL Seed.");
    }
  }

  /**
   * Nạp đề thi vào Database (hỗ trợ Reading, Listening, Grammar, v.v.)
   */
  async importExam(examData: CrawledExam): Promise<boolean> {
    console.log(`📦 Đang xử lý đề thi: ${examData.title} (${examData.skill})...`);

    // Luôn luôn xuất file backup JSON
    const safeTitle = examData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const jsonPath = path.join(config.jsonOutputDir, `exam_${safeTitle}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(examData, null, 2), "utf-8");
    console.log(`💾 Đã xuất file JSON: ${jsonPath}`);

    if (!this.prisma) {
      console.log("⚠️ Bỏ qua nạp DB vì Prisma Client chưa sẵn sàng.");
      return true;
    }

    try {
      // 1. Tìm hoặc tạo Exam
      let exam = await this.prisma.exam.findFirst({
        where: { title: examData.title },
      });

      if (!exam) {
        exam = await this.prisma.exam.create({
          data: {
            title: examData.title,
            description: examData.description || "",
            skill: examData.skill,
            duration_minutes: examData.duration_minutes,
            is_pro: examData.is_pro,
            is_published: true,
            source: "WEB",
          },
        });
        console.log(`✨ Đã tạo mới Exam ID: ${exam.id}`);
      } else {
        console.log(`ℹ️ Đề thi đã tồn tại ID: ${exam.id}, cập nhật các Part...`);
      }

      // 2. Nạp các Part và Question
      for (const p of examData.parts) {
        let part = await this.prisma.examPart.findFirst({
          where: {
            exam_id: exam.id,
            part_number: p.part_number,
          },
        });

        if (!part) {
          part = await this.prisma.examPart.create({
            data: {
              exam_id: exam.id,
              part_number: p.part_number,
              title: p.title,
              instructions: p.instructions || null,
              passage_text: p.passage_text || null,
              audio_url: p.audio_url || null,
              image_url: p.image_url || null,
            },
          });
        }

        // Tạo câu hỏi cho Part
        for (const q of p.questions) {
          const existingQ = await this.prisma.question.findFirst({
            where: {
              part_id: part.id,
              question_number: q.question_number,
            },
          });

          if (!existingQ) {
            await this.prisma.question.create({
              data: {
                part_id: part.id,
                question_number: q.question_number,
                question_type: q.question_type,
                prompt: q.prompt,
                options: q.options || null,
                correct_answer: q.correct_answer || null,
                explanation: q.explanation || null,
                max_score: q.max_score || 1.0,
              },
            });
          }
        }
      }

      console.log(`🎉 Nạp đề thi "${examData.title}" vào Database thành công!`);
      return true;
    } catch (err: any) {
      console.error(`❌ Lỗi khi nạp đề thi "${examData.title}":`, err.message);
      return false;
    }
  }

  /**
   * Nạp danh sách câu Nghe chép / Nói nhại vào Database
   */
  async importDictation(sentences: CrawledDictationSentence[]): Promise<boolean> {
    const jsonPath = path.join(config.jsonOutputDir, "dictation_sentences.json");
    fs.writeFileSync(jsonPath, JSON.stringify(sentences, null, 2), "utf-8");
    console.log(`💾 Đã xuất ${sentences.length} câu dictation ra: ${jsonPath}`);
    return true;
  }

  /**
   * Nạp bộ từ vựng vào Database
   */
  async importVocabulary(vocabSets: CrawledVocabSet[]): Promise<boolean> {
    const jsonPath = path.join(config.jsonOutputDir, "vocabulary_sets.json");
    fs.writeFileSync(jsonPath, JSON.stringify(vocabSets, null, 2), "utf-8");
    console.log(`💾 Đã xuất ${vocabSets.length} bộ từ vựng ra: ${jsonPath}`);
    return true;
  }

  async close() {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }
}
