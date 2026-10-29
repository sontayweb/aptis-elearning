import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateExam, normalizeExamTitle } from './contracts.js';

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
 * Deep Idempotent Upsert đề thi vào PostgreSQL qua Prisma
 * Đảm bảo:
 * 1. Chống sinh đề trùng lặp nhờ chuẩn hóa title và tìm kiếm đa điều kiện.
 * 2. Cập nhật sâu (Deep Replace) toàn bộ parts và questions nếu đề chưa có lượt làm bài.
 * 3. Bảo toàn 100% ID câu hỏi nếu đề đã có học viên nộp bài (Safe In-Place Update).
 * 4. Thẩm định qua Data Contract trước khi ghi vào Database.
 */
export async function upsertExam(prisma, normalizedExam) {
  if (!prisma) return null;

  try {
    // 1. Thẩm định đề thi qua Contract Gate
    const validation = validateExam(normalizedExam);
    if (!validation.isValid) {
      console.error(`❌ [TỪ CHỐI NẠP] Đề "${normalizedExam.title}":`, validation.errors.join('; '));
      return {
        status: 'VALIDATION_FAILED',
        title: normalizedExam.title,
        errors: validation.errors
      };
    }

    if (validation.warnings.length > 0) {
      console.warn(`⚠️ [CẢNH BÁO] Đề "${normalizedExam.title}":`, validation.warnings.join('; '));
    }

    const cleanTitle = normalizeExamTitle(normalizedExam.title);

    // 2. Tìm kiếm đề thi đã tồn tại
    let existing = null;

    // Tìm theo externalId và source nếu có
    if (normalizedExam.externalId && normalizedExam.source) {
      existing = await prisma.exam.findFirst({
        where: {
          source: normalizedExam.source,
          OR: [
            { id: normalizedExam.externalId },
            { description: { contains: normalizedExam.externalId } }
          ]
        },
        include: {
          parts: {
            orderBy: { part_number: 'asc' },
            include: {
              questions: { orderBy: { question_number: 'asc' } }
            }
          },
          _count: { select: { submissions: true } }
        }
      });
    }

    // Nếu chưa thấy, tìm theo skill và title (chính xác hoặc tương đương)
    if (!existing) {
      existing = await prisma.exam.findFirst({
        where: {
          skill: normalizedExam.skill,
          OR: [
            { title: cleanTitle },
            { title: { equals: cleanTitle, mode: 'insensitive' } }
          ]
        },
        include: {
          parts: {
            orderBy: { part_number: 'asc' },
            include: {
              questions: { orderBy: { question_number: 'asc' } }
            }
          },
          _count: { select: { submissions: true } }
        }
      });
    }

    // 3. XỬ LÝ NẾU ĐỀ THI ĐÃ TỒN TẠI
    if (existing) {
      const submissionsCount = existing._count?.submissions || 0;

      // TH 3A: Chưa có học viên nộp bài -> Deep Replace toàn bộ parts & questions
      if (submissionsCount === 0) {
        await prisma.$transaction(async (tx) => {
          // Cập nhật metadata
          await tx.exam.update({
            where: { id: existing.id },
            data: {
              title: cleanTitle,
              description: normalizedExam.description || existing.description,
              duration_minutes: normalizedExam.duration_minutes || existing.duration_minutes,
              is_pro: normalizedExam.is_pro !== undefined ? normalizedExam.is_pro : existing.is_pro,
              is_published: normalizedExam.is_published !== undefined ? normalizedExam.is_published : existing.is_published,
              hot_level: normalizedExam.hot_level !== undefined ? normalizedExam.hot_level : existing.hot_level,
              forecast_tag: normalizedExam.forecast_tag || existing.forecast_tag,
              source: normalizedExam.source || existing.source
            }
          });

          // Lưu lại map media của parts cũ để không bao giờ ghi đè URL hợp lệ bằng tên file thô/rỗng
          const oldPartMediaMap = new Map();
          for (const op of existing.parts || []) {
            oldPartMediaMap.set(op.part_number, {
              image_url: op.image_url,
              audio_url: op.audio_url,
              passage_text: op.passage_text
            });
          }

          const isValidMediaUrl = (u) => {
            if (!u || typeof u !== 'string') return false;
            const s = u.trim();
            return s.startsWith('/uploads/') || s.startsWith('uploads/') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('speaking/') || s.startsWith('listening/');
          };

          // Xóa toàn bộ parts cũ (tự động cascade xóa questions)
          await tx.examPart.deleteMany({
            where: { exam_id: existing.id }
          });

          // Tạo mới toàn bộ parts & questions chuẩn hóa
          for (const p of normalizedExam.parts) {
            const oldMedia = oldPartMediaMap.get(p.part_number);
            const finalImageUrl = isValidMediaUrl(p.image_url)
              ? p.image_url
              : (oldMedia && isValidMediaUrl(oldMedia.image_url) ? oldMedia.image_url : p.image_url);
            const finalAudioUrl = isValidMediaUrl(p.audio_url)
              ? p.audio_url
              : (oldMedia && isValidMediaUrl(oldMedia.audio_url) ? oldMedia.audio_url : p.audio_url);

            await tx.examPart.create({
              data: {
                exam_id: existing.id,
                part_number: p.part_number,
                title: p.title,
                instructions: p.instructions,
                passage_text: p.passage_text || (oldMedia ? oldMedia.passage_text : null),
                audio_url: finalAudioUrl,
                image_url: finalImageUrl,
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
              }
            });
          }
        });

        return {
          status: 'DEEP_UPDATED',
          id: existing.id,
          title: cleanTitle,
          partsCount: normalizedExam.parts.length
        };
      }

      // TH 3B: Đã có học viên nộp bài -> Cập nhật in-place bảo toàn ID câu hỏi
      await prisma.$transaction(async (tx) => {
        // Cập nhật metadata
        await tx.exam.update({
          where: { id: existing.id },
          data: {
            title: cleanTitle,
            description: normalizedExam.description || existing.description,
            duration_minutes: normalizedExam.duration_minutes || existing.duration_minutes,
            is_published: normalizedExam.is_published !== undefined ? normalizedExam.is_published : true,
            source: normalizedExam.source || existing.source
          }
        });

        // Cập nhật từng part và question tương ứng
        const isValidMediaUrlInPlace = (u) => {
          if (!u || typeof u !== 'string') return false;
          const s = u.trim();
          return s.startsWith('/uploads/') || s.startsWith('uploads/') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('speaking/') || s.startsWith('listening/');
        };
        for (const newPart of normalizedExam.parts) {
          const matchedPart = existing.parts.find(p => p.part_number === newPart.part_number);
          if (matchedPart) {
            const finalImageUrl = isValidMediaUrlInPlace(newPart.image_url)
              ? newPart.image_url
              : (isValidMediaUrlInPlace(matchedPart.image_url) ? matchedPart.image_url : newPart.image_url);
            const finalAudioUrl = isValidMediaUrlInPlace(newPart.audio_url)
              ? newPart.audio_url
              : (isValidMediaUrlInPlace(matchedPart.audio_url) ? matchedPart.audio_url : newPart.audio_url);

            await tx.examPart.update({
              where: { id: matchedPart.id },
              data: {
                title: newPart.title,
                instructions: newPart.instructions,
                passage_text: newPart.passage_text || matchedPart.passage_text,
                audio_url: finalAudioUrl,
                image_url: finalImageUrl
              }
            });

            for (const newQ of newPart.questions) {
              const matchedQ = matchedPart.questions.find(q => q.question_number === newQ.question_number);
              if (matchedQ) {
                await tx.question.update({
                  where: { id: matchedQ.id },
                  data: {
                    question_type: newQ.question_type,
                    prompt: newQ.prompt,
                    options: newQ.options,
                    correct_answer: newQ.correct_answer,
                    explanation: newQ.explanation,
                    max_score: newQ.max_score
                  }
                });
              } else {
                // Câu hỏi mới phát sinh chưa có trong đề cũ
                await tx.question.create({
                  data: {
                    part_id: matchedPart.id,
                    question_number: newQ.question_number,
                    question_type: newQ.question_type,
                    prompt: newQ.prompt,
                    options: newQ.options,
                    correct_answer: newQ.correct_answer,
                    explanation: newQ.explanation,
                    max_score: newQ.max_score
                  }
                });
              }
            }
          }
        }
      });

      return {
        status: 'IN_PLACE_UPDATED',
        id: existing.id,
        title: cleanTitle,
        submissionsPreserved: submissionsCount
      };
    }

    // 4. XỬ LÝ NẾU ĐỀ THI CHƯA TỒN TẠI (TẠO MỚI HOÀN TOÀN)
    const created = await prisma.exam.create({
      data: {
        title: cleanTitle,
        description: normalizedExam.description,
        skill: normalizedExam.skill,
        duration_minutes: normalizedExam.duration_minutes,
        is_pro: normalizedExam.is_pro,
        is_published: normalizedExam.is_published,
        hot_level: normalizedExam.hot_level,
        forecast_tag: normalizedExam.forecast_tag,
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

    return {
      status: 'CREATED',
      id: created.id,
      title: created.title,
      partsCount: normalizedExam.parts.length
    };
  } catch (err) {
    console.error(`💥 Lỗi nghiêm trọng khi upsert đề "${normalizedExam.title}":`, err.message);
    return { status: 'ERROR', error: err.message, title: normalizedExam.title };
  }
}
