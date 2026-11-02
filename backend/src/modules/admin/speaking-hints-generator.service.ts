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
 * Helper tải hoặc đọc buffer hình ảnh từ đường dẫn cục bộ hoặc URL từ xa
 * Không phụ thuộc vào môi trường dev/production
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

  // 0. Nếu đường dẫn trực tiếp tồn tại trên đĩa (relative hoặc absolute)
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
      // ignore
    }
  }

  // 1. Nếu là HTTP / HTTPS URL
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

  // 2. Thử đường dẫn tệp cục bộ
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
      // bỏ qua, thử tiếp
    }
  }

  // 3. Dự phòng tải từ domain production nếu chạy môi trường dev chưa có đủ file
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
   * Sinh gợi ý học thuật dựa trên dữ liệu thị giác thực tế của bức tranh (Multimodal Vision)
   * Tuyệt đối không phỏng đoán hay suy diễn khi không có ảnh
   */
  async generateHints(
    topicTitle: string,
    partNumber: 2 | 3,
    questionsPrompts: string[],
    imageUrl?: string,
    secondImageUrl?: string
  ): Promise<SpeakingVocabularyHintsData> {
    const isPart3 = partNumber === 3;

    // Nạp buffer hình ảnh thật
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

    // 1. Thử dùng OpenAI Vision (gpt-4o-mini)
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && openAiKey.trim().length > 10) {
      try {
        const openai = new OpenAI({ apiKey: openAiKey });
        const userContent: any[] = [{ type: 'text', text: prompt }];

        if (image1Data) {
          userContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${image1Data.mimeType};base64,${image1Data.buffer.toString('base64')}`,
              detail: 'high',
            },
          });
        }
        if (image2Data) {
          userContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${image2Data.mimeType};base64,${image2Data.buffer.toString('base64')}`,
              detail: 'high',
            },
          });
        }

        const resp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: userContent }],
          response_format: { type: 'json_object' },
          temperature: 0.3,
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
        console.warn('  [SpeakingHints] OpenAI Vision call failed, falling back to Gemini Vision:', err?.message || err);
      }
    }

    // 2. Thử dùng Gemini Vision (gemini-1.5-flash / gemini-flash-latest)
    const geminiKey = process.env.GEMINI_API_KEY || (process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',')[0].trim() : '');
    if (geminiKey && geminiKey.trim().length > 10 && !geminiKey.includes('YOUR_GEMINI_API_KEY')) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
        const model = genAI.getGenerativeModel({
          model: modelName,
        });

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

        const result = await model.generateContent(contentParts);
        const text = result.response.text().trim();
        const cleanJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
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
      } catch (err: any) {
        console.warn('  [SpeakingHints] Gemini Vision call failed:', err?.message || err);
      }
    }

    // Nếu cả OpenAI lẫn Gemini đều không khả dụng, báo lỗi rõ ràng chứ không tự phỏng đoán dữ liệu rác
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

    // Trích xuất ảnh Part 2 hoặc Part 3
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

    let updatedCount = 0;
    const totalCount = exam.parts.length;

    for (const part of exam.parts) {
      const pNum = part.part_number as 2 | 3;
      const firstQ = part.questions[0];
      const existingOptions = (firstQ?.options as any) || {};

      // Nếu chưa có vocabularyHints thì tiến hành sinh và lưu
      if (!existingOptions.vocabularyHints) {
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

        // Bỏ qua nếu part chưa có ảnh minh họa
        if (!img1 && !img2) {
          continue;
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
          updatedCount++;
        } catch (err: any) {
          console.error(`[BatchSpeakingHints] Lỗi khi phân tích ảnh cho part ${part.id} (${part.title}):`, err?.message || err);
        }
      }
    }

    return { updatedCount, totalCount };
  }
}

export const speakingHintsGeneratorService = new SpeakingHintsGeneratorService();
