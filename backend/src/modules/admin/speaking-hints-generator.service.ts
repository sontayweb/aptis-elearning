import { prisma } from '../../config/database';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

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

export class SpeakingHintsGeneratorService {
  async generateHints(
    topicTitle: string,
    partNumber: 2 | 3,
    questionsPrompts: string[]
  ): Promise<SpeakingVocabularyHintsData> {
    const isPart3 = partNumber === 3;
    const prompt = `You are an expert British Council Aptis ESOL Speaking senior examiner and curriculum developer.
Analyze this Aptis Speaking ${isPart3 ? 'Part 3 (Compare two contrasting pictures)' : 'Part 2 (Describe a picture)'} topic:

TOPIC TITLE: "${topicTitle}"
QUESTIONS:
${questionsPrompts.map((q, i) => `${i + 1}. ${q}`).join('\n')}

YOUR TASK:
Generate high-scoring B1-B2 level vocabulary hints, comparison phrases, and prompt engineering instructions for generating Aptis exam images.

Return STRICTLY a JSON object without markdown formatting or code blocks:
{
  "keywords": [5 to 7 sophisticated collocations/idioms for B1-B2 level strictly relevant to this topic],
  "startingPhrases": [2 introductory/comparing sentences starting with "While the first picture...", "Comparing the two...", or "Looking at the image..."],
  "linkingPhrases": [2 analytical/concluding sentences for B1-B2 level reflecting on preferences, contrast, or significance],
  "image1Prompt": "A photorealistic documentary-style photograph for Aptis Speaking exam depicting [first specific scene described in title]. Authentic natural lighting, candid composition, 8k quality, neutral exam atmosphere.",
  "image2Prompt": "${isPart3 ? 'A photorealistic documentary-style photograph for Aptis Speaking exam depicting [second contrasting scene described in title]. Authentic natural lighting, candid composition, 8k quality.' : ''}"
}`;

    // 1. Thử dùng OpenAI nếu có key
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && openAiKey.trim().length > 10) {
      try {
        const openai = new OpenAI({ apiKey: openAiKey });
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
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
        console.warn('  [SpeakingHints] OpenAI call failed, falling back:', err?.message || err);
      }
    }

    // 2. Thử dùng Gemini
    const geminiKey = process.env.GEMINI_API_KEY || (process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',')[0].trim() : '');
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
        });
        const result = await model.generateContent(prompt);
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
        console.warn('  [SpeakingHints] Gemini call failed:', err?.message || err);
      }
    }

    // 3. Quy tắc ngữ cảnh thông minh (Contextual Rule Fallback)
    const parts = topicTitle.split(/(?:,|\bvs\b|\bvới\b)/i);
    const sideA = parts[0]?.trim() || topicTitle;
    const sideB = parts[1]?.trim() || 'contrasting scenario';

    return {
      partNumber,
      topicTitle,
      keywords: isPart3
        ? [
            'stark difference in pace',
            'traditional versus modern approach',
            'human endurance vs mechanical power',
            'environmental impact & sustainability',
            'lifestyle preference & fulfillment',
          ]
        : [
            'central focal point',
            'vibrant atmosphere',
            'intense concentration',
            'daily routine and setting',
            'meaningful emotional expression',
          ],
      startingPhrases: isPart3
        ? [
            `While the first picture portrays ${sideA}, the second depicts ${sideB}...`,
            `Comparing the two scenarios, there is a prominent distinction in ambiance and energy...`,
          ]
        : [
            `Looking closely at the picture, the prominent feature is ${topicTitle}...`,
            `The image immediately captures a lively moment in daily life...`,
          ],
      linkingPhrases: isPart3
        ? [
            `On the one hand, ${sideA} requires dedicated effort, whereas ${sideB} focuses on speed and convenience...`,
            `Personally, I find ${sideA} more appealing because it mirrors genuine life experiences...`,
          ]
        : [
            `In the background, the overall atmosphere conveys a sense of purpose and harmony...`,
            `From my perspective, this scene highlights how individuals find balance in modern life...`,
          ],
      aiImagePrompts: {
        image1Prompt: `A photorealistic documentary-style photograph for Aptis Speaking test showing ${sideA}. Natural daylight, candid composition, high resolution.`,
        image2Prompt: isPart3
          ? `A photorealistic documentary-style photograph for Aptis Speaking test showing ${sideB}. Natural daylight, candid composition, high resolution.`
          : undefined,
      },
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

    const topicTitle = question.part.exam.title || question.part.title;
    const questionsPrompts = question.part.questions
      .map((q) => q.prompt)
      .filter(Boolean);

    return this.generateHints(topicTitle, pNum as 2 | 3, questionsPrompts);
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
        const topicTitle = exam.title || part.title;
        const questionsPrompts = part.questions.map((q) => q.prompt).filter(Boolean);
        const hints = await this.generateHints(topicTitle, pNum, questionsPrompts);

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
      }
    }

    return { updatedCount, totalCount };
  }
}

export const speakingHintsGeneratorService = new SpeakingHintsGeneratorService();
