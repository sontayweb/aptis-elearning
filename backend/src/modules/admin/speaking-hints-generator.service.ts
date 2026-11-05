import { prisma } from '../../config/database';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export interface SpeakingVocabularyHintsData {
  partNumber: 2 | 3;
  topicTitle: string;
  keywords: string[];
  startingPhrases: string[];
  linkingPhrases: string[];
  aiImagePrompts: {
    image1Prompt: string;
    image2Prompt?: string;
  };
}

interface ImageBufferResult {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Đọc buffer và mime type của ảnh từ đường dẫn file cục bộ hoặc URL
 */
async function resolveImageBuffer(imgUrl: string): Promise<ImageBufferResult | null> {
  if (!imgUrl || typeof imgUrl !== 'string' || imgUrl.trim() === '') {
    return null;
  }

  const trimmed = imgUrl.trim();

  const detectMimeType = (filePathOrUrl: string, buf?: Buffer): string => {
    if (buf && buf.length >= 4) {
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
      if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
      if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'image/webp';
    }
    const ext = path.extname(filePathOrUrl.split('?')[0]).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.gif') return 'image/gif';
    return 'image/jpeg';
  };

  // Kiểm tra đường dẫn trực tiếp trên đĩa
  const directCandidates = [
    path.resolve(trimmed),
    path.resolve(process.cwd(), trimmed),
    path.resolve(process.cwd(), '..', trimmed),
  ];
  for (const p of directCandidates) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        const buf = await fs.promises.readFile(p);
        return { buffer: buf, mimeType: detectMimeType(p, buf) };
      }
    } catch {
      // Bỏ qua nếu không đọc được
    }
  }

  // Tải ảnh từ URL nếu là liên kết http/https
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const urlObj = new URL(trimmed);
      const pathname = urlObj.pathname;
      if (pathname.includes('/uploads/')) {
        const localRel = pathname.replace(/^\/?(api\/)?uploads\/?/, '');
        const candidatePaths = [
          path.resolve(process.env.UPLOAD_DIR || './uploads', localRel),
          path.resolve('./uploads', localRel),
          path.resolve('../frontend/public/uploads', localRel),
          path.resolve('../frontend/public', pathname.replace(/^\//, '')),
        ];
        for (const cp of candidatePaths) {
          if (fs.existsSync(cp)) {
            const buf = await fs.promises.readFile(cp);
            return { buffer: buf, mimeType: detectMimeType(cp, buf) };
          }
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(trimmed, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        const mime = res.headers.get('content-type') || detectMimeType(trimmed, buf);
        return { buffer: buf, mimeType: mime };
      }
    } catch (err: any) {
      console.warn(`[SpeakingHintsGenerator] Không tải được ảnh từ URL ${trimmed}:`, err?.message || err);
    }
  }

  // Tìm file trong thư mục uploads hoặc public
  const cleanRel = trimmed.replace(/^\/?(api\/)?uploads\/?/, '');
  const candidatePaths = [
    path.resolve(process.env.UPLOAD_DIR || './uploads', cleanRel),
    path.resolve('./uploads', cleanRel),
    path.resolve('../frontend/public/uploads', cleanRel),
    path.resolve('../frontend/public', trimmed.replace(/^\//, '')),
    path.resolve(process.cwd(), 'uploads', cleanRel),
    path.resolve(process.cwd(), '../frontend/public/uploads', cleanRel),
  ];

  for (const cp of candidatePaths) {
    try {
      if (fs.existsSync(cp)) {
        const buf = await fs.promises.readFile(cp);
        return { buffer: buf, mimeType: detectMimeType(cp, buf) };
      }
    } catch {
      // Thử đường dẫn tiếp theo
    }
  }

  // Fallback tải từ domain production nếu chạy môi trường dev
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    try {
      const prodUrl = `https://aptisesolpremier.com/${trimmed.replace(/^\//, '')}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(prodUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        return { buffer: buf, mimeType: detectMimeType(prodUrl, buf) };
      }
    } catch (err: any) {
      console.warn(`[SpeakingHintsGenerator] Không tải được ảnh từ host production ${trimmed}:`, err?.message || err);
    }
  }

  return null;
}

export class SpeakingHintsGeneratorService {
  /**
   * Phân tích ảnh Speaking Part 2/3 bằng Vision AI để trích xuất từ vựng và mẫu câu
   */
  async generateHints(
    topicTitle: string,
    partNumber: 2 | 3,
    questionsPrompts: string[],
    imageUrl?: string,
    secondImageUrl?: string
  ): Promise<SpeakingVocabularyHintsData> {
    const isPart3 = partNumber === 3;

    // Lấy dữ liệu ảnh Part 2 hoặc cặp ảnh Part 3
    const img1Promise = imageUrl ? resolveImageBuffer(imageUrl) : Promise.resolve(null);
    const img2Promise = secondImageUrl ? resolveImageBuffer(secondImageUrl) : Promise.resolve(null);
    const [image1Data, image2Data] = await Promise.all([img1Promise, img2Promise]);

    if (!image1Data && !image2Data) {
      throw {
        statusCode: 400,
        message: `Phần thi Speaking Part ${partNumber} chưa có ảnh minh họa hợp lệ (Ảnh: "${imageUrl || 'trống'}"). Vui lòng tải ảnh minh họa lên trước khi yêu cầu AI sinh gợi ý.`,
      };
    }

    const prompt = `You are a senior British Council Aptis ESOL Speaking examiner and assessment specialist.
You are inspecting the attached Aptis Speaking ${isPart3 ? 'Part 3 (Compare two contrasting pictures)' : 'Part 2 (Describe a picture)'} examination image(s).

${isPart3 ? 'Analyze the two contrasting images attached (Picture 1 and Picture 2).' : 'Analyze the single examination picture attached.'}

CRITICAL ASSESSMENT RULES:
1. EXAMINE VISUAL EVIDENCE ONLY: Inspect the actual concrete subjects, physical actions, equipment, clothing, environment, and atmosphere visibly captured in the image(s).
2. ZERO HALLUCINATION: Do NOT guess, assume, or invent activities or contexts that are not visible. For example, if people are hiking on a mountain, do NOT generate volunteering or gardening.
3. APTIS B1-B2 CEFR CRITERIA: Generate practical, high-scoring vocabulary and natural phrasing suitable for B1-B2 candidates answering Part ${partNumber}.

${topicTitle && !topicTitle.toLowerCase().startsWith('đề') && !topicTitle.toLowerCase().startsWith('part') ? `Topic reference: "${topicTitle}"` : ''}
${questionsPrompts.length > 0 ? `Sub-questions for candidates:\n${questionsPrompts.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}

OUTPUT REQUIREMENT:
Return ONLY a valid, parseable JSON object matching this schema (no markdown blocks, no commentary):
{
  "keywords": [
    "5 to 7 sophisticated, natural collocations or idioms for B1-B2 candidates strictly describing the visible activity, setting, and objects in the image(s)"
  ],
  "startingPhrases": [
    "2 natural introductory opening sentence frames describing what is happening in the picture(s)"
  ],
  "linkingPhrases": [
    "2 analytical, reflective, or concluding sentence frames discussing personal experience, importance, or comparison regarding this activity"
  ],
  "image1Prompt": "A photorealistic documentary-style prompt accurately describing Picture 1 in detail.",
  "image2Prompt": "${isPart3 ? 'A photorealistic documentary-style prompt accurately describing Picture 2 in detail.' : ''}"
}`;

    // 1. Thử dùng Gemini Vision với cơ chế Khám phá Động và Đa Tầng Key (Free Tier trước -> Billing sau)
    const candidateKeys = Array.from(new Set([
      process.env.FREE_GEMINI_API_KEY,
      process.env.ADMIN_GEMINI_API_KEY,
      process.env.GEMINI_ADMIN_API_KEY,
      process.env.GEMINI_API_KEY,
      ...(process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',').map((k) => k.trim()) : []),
    ].filter((k): k is string => Boolean(k && k.trim().length > 10 && !k.includes('YOUR_GEMINI_API_KEY')))));

    if (candidateKeys.length > 0) {
      try {
        const contentParts: any[] = [prompt];
        if (image1Data) {
          contentParts.push({
            inlineData: {
              data: image1Data.buffer.toString('base64'),
              mimeType: image1Data.mimeType,
            },
          });
        }
        if (image2Data) {
          contentParts.push({
            inlineData: {
              data: image2Data.buffer.toString('base64'),
              mimeType: image2Data.mimeType,
            },
          });
        }

        // Lặp qua từng tầng Key (Free Tier trước -> Failover sang Paid Billing Key)
        for (let kIdx = 0; kIdx < candidateKeys.length; kIdx++) {
          const activeKey = candidateKeys[kIdx];
          const genAI = new GoogleGenerativeAI(activeKey);

          const candidateModels = [
            process.env.ADMIN_GEMINI_MODEL,
            process.env.GEMINI_MODEL,
            'gemini-flash-lite-latest',
            'gemini-flash-latest',
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash',
            'gemini-3.8-flash',
          ].filter(Boolean) as string[];

          let keyQuotaExceeded = false;

          for (const modelName of candidateModels) {
            try {
              const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 2048,
                },
              });

              // Giới hạn timeout 20s
              const geminiPromise = model.generateContent(contentParts);
              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Gemini Vision (${modelName}) timeout sau 20 giây`)), 20000)
              );
              const result: any = await Promise.race([geminiPromise, timeoutPromise]);

              const text = result.response.text().trim();
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              const cleanJson = jsonMatch ? jsonMatch[0] : text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
              const parsed = JSON.parse(cleanJson);
              if (Array.isArray(parsed.keywords) && parsed.keywords.length >= 3) {
                return {
                  partNumber,
                  topicTitle,
                  keywords: parsed.keywords,
                  startingPhrases: Array.isArray(parsed.startingPhrases) ? parsed.startingPhrases : [],
                  linkingPhrases: Array.isArray(parsed.linkingPhrases) ? parsed.linkingPhrases : [],
                  aiImagePrompts: {
                    image1Prompt: parsed.image1Prompt || '',
                    image2Prompt: isPart3 ? parsed.image2Prompt || '' : undefined,
                  },
                };
              }
            } catch (modelErr: any) {
              const errMsg = (modelErr?.message || String(modelErr)).toLowerCase();
              if (errMsg.includes('429') || errMsg.includes('resourceexhausted') || errMsg.includes('quota')) {
                console.warn(`  [SpeakingHints] Key #${kIdx + 1} chạm hạn ngạch (429/ResourceExhausted). Chuyển sang Key tiếp theo...`);
                keyQuotaExceeded = true;
                break; // Thoát vòng lặp model của key này để thử key tiếp theo
              } else {
                console.warn(`  [SpeakingHints] Gemini Vision model "${modelName}" failed:`, modelErr?.message || modelErr);
              }
            }
          }

          if (keyQuotaExceeded) {
            continue;
          }
        }
      } catch (err: any) {
        console.warn('  [SpeakingHints] Gemini Vision calls failed, falling back to OpenAI Vision:', err?.message || err);
      }
    }

    // 2. Dự phòng OpenAI Vision (gpt-4o-mini)
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && openAiKey.trim().length > 10) {
      try {
        const openai = new OpenAI({ apiKey: openAiKey, timeout: 8000 });
        const userContent: any[] = [{ type: 'text', text: prompt }];

        if (image1Data) {
          userContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${image1Data.mimeType};base64,${image1Data.buffer.toString('base64')}`,
              detail: 'low',
            },
          });
        }
        if (image2Data) {
          userContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${image2Data.mimeType};base64,${image2Data.buffer.toString('base64')}`,
              detail: 'low',
            },
          });
        }

        const resp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: userContent }],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 1024,
        });

        const text = resp.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.keywords) && parsed.keywords.length >= 3) {
          return {
            partNumber,
            topicTitle,
            keywords: parsed.keywords,
            startingPhrases: Array.isArray(parsed.startingPhrases) ? parsed.startingPhrases : [],
            linkingPhrases: Array.isArray(parsed.linkingPhrases) ? parsed.linkingPhrases : [],
            aiImagePrompts: {
              image1Prompt: parsed.image1Prompt || '',
              image2Prompt: isPart3 ? parsed.image2Prompt || '' : undefined,
            },
          };
        }
      } catch (err: any) {
        console.warn('  [SpeakingHints] OpenAI Vision call failed:', err?.message || err);
      }
    }

    // Trường hợp cả hai dịch vụ đều không phản hồi
    throw {
      statusCode: 502,
      message: 'Không thể phân tích hình ảnh qua Vision AI. Vui lòng kiểm tra cấu hình khóa API (OpenAI/Gemini) hoặc kết nối mạng máy chủ.',
    };
  }

  async generateForQuestion(questionId: string): Promise<SpeakingVocabularyHintsData> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        part: {
          include: {
            exam: true,
            questions: true,
          },
        },
      },
    });

    if (!question) {
      throw { statusCode: 404, message: 'Câu hỏi không tồn tại' };
    }

    const pNum = question.part.part_number;
    if (pNum !== 2 && pNum !== 3) {
      throw {
        statusCode: 400,
        message: 'Tính năng gợi ý tranh chỉ áp dụng cho Speaking Part 2 và Part 3',
      };
    }

    const topicTitle = question.part.title || question.part.exam.title;
    const questionsPrompts = question.part.questions
      .map((q) => q.prompt)
      .filter(Boolean);

    // Tách ảnh 1 và ảnh 2 (nếu có)
    const rawImg = question.part.image_url || '';
    let img1: string | undefined;
    let img2: string | undefined;

    if (rawImg.includes(',')) {
      const parts = rawImg.split(',').map((s) => s.trim()).filter(Boolean);
      img1 = parts[0];
      img2 = parts[1];
    } else {
      img1 = rawImg.trim() || undefined;
    }

    return this.generateHints(topicTitle, pNum as 2 | 3, questionsPrompts, img1, img2);
  }

  async batchGenerateForExam(examId: string): Promise<{ updatedCount: number; totalCount: number }> {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        parts: {
          where: { part_number: { in: [2, 3] } },
          include: { questions: true },
        },
      },
    });

    if (!exam) {
      throw { statusCode: 404, message: 'Đề thi không tồn tại' };
    }

    const totalCount = exam.parts.length;

    // Xử lý song song các part để tối ưu thời gian phản hồi
    const results = await Promise.all(
      exam.parts.map(async (part) => {
        const pNum = part.part_number as 2 | 3;
        const firstQ = part.questions[0];
        const existingOptions = (firstQ?.options as any) || {};

        // Bỏ qua nếu part đã có gợi ý
        if (existingOptions.vocabularyHints) {
          return false;
        }

        const topicTitle = part.title || exam.title;
        const questionsPrompts = part.questions.map((q) => q.prompt).filter(Boolean);

        const rawImg = part.image_url || '';
        let img1: string | undefined;
        let img2: string | undefined;
        if (rawImg.includes(',')) {
          const parts = rawImg.split(',').map((s) => s.trim()).filter(Boolean);
          img1 = parts[0];
          img2 = parts[1];
        } else {
          img1 = rawImg.trim() || undefined;
        }

        // Bỏ qua nếu chưa cấu hình ảnh
        if (!img1 && !img2) {
          return false;
        }

        try {
          const hints = await this.generateHints(topicTitle, pNum, questionsPrompts, img1, img2);

          for (const q of part.questions) {
            const currentOpt = (q.options as any) || {};
            await prisma.question.update({
              where: { id: q.id },
              data: {
                options: {
                  ...currentOpt,
                  vocabularyHints: hints,
                },
              },
            });
          }
          return true;
        } catch (err: any) {
          console.error(`[BatchSpeakingHints] Lỗi khi phân tích ảnh cho part ${part.id} (${part.title}):`, err?.message || err);
          return false;
        }
      })
    );

    const updatedCount = results.filter(Boolean).length;
    return { updatedCount, totalCount };
  }

  /**
   * Lấy tổng quan toàn bộ tranh Speaking Part 2 & Part 3 trên toàn hệ thống đề thi
   */
  async getOverview(): Promise<{
    summary: {
      totalParts: number;
      completedCount: number;
      pendingCount: number;
      missingImageCount: number;
      completionRate: number;
    };
    items: Array<{
      partId: string;
      partNumber: 2 | 3;
      partTitle: string;
      examId: string;
      examTitle: string;
      examCode: string;
      skill: string;
      imageUrl: string | null;
      secondImageUrl: string | null;
      hasImage: boolean;
      status: 'COMPLETED' | 'PENDING' | 'MISSING_IMAGE';
      questionCount: number;
      firstQuestionId: string | null;
      vocabularyHints: SpeakingVocabularyHintsData | null;
      questions: Array<{
        id: string;
        question_number: number;
        prompt: string;
      }>;
    }>;
  }> {
    const parts = await prisma.examPart.findMany({
      where: {
        part_number: { in: [2, 3] },
        OR: [
          { exam: { skill: 'SPEAKING' } },
          {
            exam: { skill: 'FULL_TEST' },
            OR: [
              { title: { contains: 'SPEAKING', mode: 'insensitive' } },
              { image_url: { not: null } },
            ],
          },
          { image_url: { not: null } },
        ],
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            skill: true,
            created_at: true,
          },
        },
        questions: {
          select: {
            id: true,
            question_number: true,
            prompt: true,
            options: true,
          },
          orderBy: { question_number: 'asc' },
        },
      },
      orderBy: [
        { exam: { created_at: 'desc' } },
        { part_number: 'asc' },
      ],
    });

    let completedCount = 0;
    let pendingCount = 0;
    let missingImageCount = 0;

    const items = parts.map((part) => {
      const pNum = part.part_number as 2 | 3;
      const rawImg = part.image_url || '';
      let img1: string | null = null;
      let img2: string | null = null;

      if (rawImg.includes(',')) {
        const splitUrls = rawImg.split(',').map((s) => s.trim()).filter(Boolean);
        img1 = splitUrls[0] || null;
        img2 = splitUrls[1] || null;
      } else if (rawImg.trim()) {
        img1 = rawImg.trim();
      }

      const hasImage = Boolean(img1);
      const firstQ = part.questions[0];
      const firstOptions = (firstQ?.options as any) || {};
      const hints = (firstOptions.vocabularyHints as SpeakingVocabularyHintsData) || null;
      const hasHints = Boolean(
        hints &&
        Array.isArray(hints.keywords) &&
        hints.keywords.length > 0
      );

      let status: 'COMPLETED' | 'PENDING' | 'MISSING_IMAGE';
      if (!hasImage) {
        status = 'MISSING_IMAGE';
        missingImageCount++;
      } else if (hasHints) {
        status = 'COMPLETED';
        completedCount++;
      } else {
        status = 'PENDING';
        pendingCount++;
      }

      return {
        partId: part.id,
        partNumber: pNum,
        partTitle: part.title || `Part ${pNum}`,
        examId: part.exam.id,
        examTitle: part.exam.title,
        examCode: part.exam.id.slice(0, 8).toUpperCase(),
        skill: part.exam.skill,
        imageUrl: img1,
        secondImageUrl: img2,
        hasImage,
        status,
        questionCount: part.questions.length,
        firstQuestionId: firstQ?.id || null,
        vocabularyHints: hasHints ? hints : null,
        questions: part.questions.map((q) => ({
          id: q.id,
          question_number: q.question_number,
          prompt: q.prompt,
        })),
      };
    });

    const totalParts = items.length;
    const completionRate = totalParts > 0 ? Math.round((completedCount / totalParts) * 100) : 0;

    return {
      summary: {
        totalParts,
        completedCount,
        pendingCount,
        missingImageCount,
        completionRate,
      },
      items,
    };
  }

  /**
   * Lưu gợi ý thủ công hoặc cập nhật cho toàn bộ câu hỏi trong Part
   */
  async saveHintsForPart(partId: string, hints: SpeakingVocabularyHintsData): Promise<void> {
    const part = await prisma.examPart.findUnique({
      where: { id: partId },
      include: { questions: true },
    });

    if (!part) {
      throw { statusCode: 404, message: 'Phần thi không tồn tại' };
    }

    for (const q of part.questions) {
      const currentOpt = (q.options as any) || {};
      await prisma.question.update({
        where: { id: q.id },
        data: {
          options: {
            ...currentOpt,
            vocabularyHints: hints,
          },
        },
      });
    }
  }

  /**
   * Sinh gợi ý AI cho một Part duy nhất và cập nhật toàn bộ câu hỏi trong Part
   */
  async generateHintsForPart(partId: string): Promise<SpeakingVocabularyHintsData> {
    const part = await prisma.examPart.findUnique({
      where: { id: partId },
      include: {
        exam: true,
        questions: true,
      },
    });

    if (!part) {
      throw { statusCode: 404, message: 'Phần thi không tồn tại' };
    }

    const pNum = part.part_number;
    if (pNum !== 2 && pNum !== 3) {
      throw { statusCode: 400, message: 'Tính năng gợi ý tranh chỉ áp dụng cho Speaking Part 2 và Part 3' };
    }

    const topicTitle = part.title || part.exam.title;
    const questionsPrompts = part.questions.map((q) => q.prompt).filter(Boolean);

    const rawImg = part.image_url || '';
    let img1: string | undefined;
    let img2: string | undefined;

    if (rawImg.includes(',')) {
      const parts = rawImg.split(',').map((s) => s.trim()).filter(Boolean);
      img1 = parts[0];
      img2 = parts[1];
    } else {
      img1 = rawImg.trim() || undefined;
    }

    if (!img1 && !img2) {
      throw { statusCode: 400, message: 'Phần thi này chưa được cấu hình hình ảnh.' };
    }

    const hints = await this.generateHints(topicTitle, pNum as 2 | 3, questionsPrompts, img1, img2);
    await this.saveHintsForPart(partId, hints);
    return hints;
  }

  /**
   * Sinh hàng loạt toàn hệ thống theo cơ chế tuần tự + delay an toàn tránh rate limit
   */
  async batchGenerateAll(options?: {
    skipExisting?: boolean;
    delayMs?: number;
    partIds?: string[];
  }): Promise<{
    processed: number;
    succeeded: number;
    skipped: number;
    failed: number;
    errors: Array<{ partId: string; examTitle: string; partNumber: number; error: string }>;
  }> {
    const skipExisting = options?.skipExisting ?? true;
    const delayMs = options?.delayMs ?? 1500;
    const filterPartIds = options?.partIds && options.partIds.length > 0 ? options.partIds : undefined;

    const parts = await prisma.examPart.findMany({
      where: {
        part_number: { in: [2, 3] },
        ...(filterPartIds ? { id: { in: filterPartIds } } : {}),
        OR: [
          { exam: { skill: 'SPEAKING' } },
          {
            exam: { skill: 'FULL_TEST' },
            OR: [
              { title: { contains: 'SPEAKING', mode: 'insensitive' } },
              { image_url: { not: null } },
            ],
          },
          { image_url: { not: null } },
        ],
      },
      include: {
        exam: { select: { id: true, title: true } },
        questions: true,
      },
      orderBy: [{ exam: { created_at: 'desc' } }, { part_number: 'asc' }],
    });

    let processed = 0;
    let succeeded = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ partId: string; examTitle: string; partNumber: number; error: string }> = [];

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const part of parts) {
      processed++;
      const pNum = part.part_number as 2 | 3;
      const rawImg = part.image_url || '';

      let img1: string | undefined;
      let img2: string | undefined;
      if (rawImg.includes(',')) {
        const splitUrls = rawImg.split(',').map((s) => s.trim()).filter(Boolean);
        img1 = splitUrls[0];
        img2 = splitUrls[1];
      } else {
        img1 = rawImg.trim() || undefined;
      }

      if (!img1 && !img2) {
        skipped++;
        continue;
      }

      const firstQ = part.questions[0];
      const existingHints = (firstQ?.options as any)?.vocabularyHints;
      if (skipExisting && existingHints && Array.isArray(existingHints.keywords) && existingHints.keywords.length > 0) {
        skipped++;
        continue;
      }

      try {
        const topicTitle = part.title || part.exam.title;
        const questionsPrompts = part.questions.map((q) => q.prompt).filter(Boolean);

        const hints = await this.generateHints(topicTitle, pNum, questionsPrompts, img1, img2);
        await this.saveHintsForPart(part.id, hints);
        succeeded++;

        // Delay an toàn chống 429 quota Gemini/OpenAI
        if (delayMs > 0) {
          await sleep(delayMs);
        }
      } catch (err: any) {
        failed++;
        errors.push({
          partId: part.id,
          examTitle: part.exam.title,
          partNumber: pNum,
          error: err?.message || 'Lỗi không xác định khi gọi AI Vision',
        });
      }
    }

    return {
      processed,
      succeeded,
      skipped,
      failed,
      errors,
    };
  }
}

export const speakingHintsGeneratorService = new SpeakingHintsGeneratorService();
