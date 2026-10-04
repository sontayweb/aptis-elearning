import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function getPrismaClient() {
  let PrismaClient;
  try {
    const backendPrisma = await import('../../backend/node_modules/@prisma/client/default.js').catch(() => null);
    PrismaClient = backendPrisma?.PrismaClient;
  } catch {}

  if (!PrismaClient) {
    try {
      const p = await import('@prisma/client');
      PrismaClient = p.PrismaClient;
    } catch {}
  }

  if (!PrismaClient) {
    console.warn('⚠️ Không tìm thấy Prisma Client. Dữ liệu sẽ lưu ra JSON mà không nạp trực tiếp vào DB.');
    return null;
  }

  return new PrismaClient();
}

/**
 * Idempotent Upsert đề thi vào PostgreSQL
 * Đảm bảo: Không sinh đề trùng, không làm mất bài làm học viên (submissions)
 */
export async function upsertExam(prisma, normalizedExam) {
  if (!prisma) return null;

  try {
    // 1. Kiểm tra đề thi đã có chưa (theo title, skill và source)
    let existing = await prisma.exam.findFirst({
      where: {
        title: normalizedExam.title,
        skill: normalizedExam.skill,
        source: normalizedExam.source
      },
      include: {
        parts: {
          include: {
            questions: true
          }
        }
      }
    });

    if (existing) {
      // Đã có đề -> Cập nhật in-place thông tin
      const updated = await prisma.exam.update({
        where: { id: existing.id },
        data: {
          description: normalizedExam.description || existing.description,
          duration_minutes: normalizedExam.duration_minutes || existing.duration_minutes,
          source: normalizedExam.source || existing.source
        }
      });
      return { status: 'UPDATED', id: updated.id, title: updated.title };
    }

    // 2. Chưa có đề -> Tạo mới hoàn toàn
    const created = await prisma.exam.create({
      data: {
        title: normalizedExam.title,
        description: normalizedExam.description,
        skill: normalizedExam.skill,
        duration_minutes: normalizedExam.duration_minutes,
        is_pro: normalizedExam.is_pro,
        is_published: normalizedExam.is_published,
        source: normalizedExam.source,
        parts: {
          create: normalizedExam.parts.map(p => ({
            part_number: p.part_number,
            title: p.title,
            instructions: p.instructions,
            passage_text: p.passage_text,
            audio_url: p.audio_url,
            image_url: p.image_url,
            questions: {
              create: p.questions.map(q => ({
                question_number: q.question_number,
                question_type: q.question_type,
                prompt: q.prompt,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                max_score: q.max_score
              }))
            }
          }))
        }
      }
    });

    return { status: 'CREATED', id: created.id, title: created.title };
  } catch (err) {
    console.error(`Lỗi upsert đề "${normalizedExam.title}":`, err.message);
    return { status: 'ERROR', error: err.message };
  }
}
