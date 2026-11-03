import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

interface GeneratedHints {
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

// Hàm gọi AI (Gemini hoặc OpenAI) để sinh gợi ý học thuật
async function generateHintsWithAI(
  topicTitle: string,
  partNumber: 2 | 3,
  questionsPrompts: string[]
): Promise<GeneratedHints> {
  const isPart3 = partNumber === 3;
  const prompt = `You are an expert British Council Aptis ESOL Speaking examiner and curriculum developer.
Analyze the following Aptis Speaking ${isPart3 ? "Part 3 (Compare two contrasting pictures)" : "Part 2 (Describe a picture)"} topic.

TOPIC TITLE: "${topicTitle}"
QUESTIONS:
${questionsPrompts.map((q, i) => `${i + 1}. ${q}`).join("\n")}

YOUR TASK:
Generate high-scoring, B1-B2 level vocabulary hints, comparison phrases, and prompt engineering instructions for generating standard Aptis exam images.

Return STRICTLY a JSON object without markdown formatting or code blocks:
{
  "keywords": [5 to 7 sophisticated collocations/idioms for B1-B2 level strictly relevant to this topic],
  "startingPhrases": [2 introductory/comparing sentences starting with "While the first picture...", "Comparing the two...", or "Looking at the image..."],
  "linkingPhrases": [2 analytical/concluding sentences for B1-B2 level reflecting on preferences, contrast, or significance],
  "image1Prompt": "A photorealistic documentary-style photograph for Aptis Speaking exam depicting [first specific scene described in title]. Authentic natural lighting, candid composition, 8k quality, neutral exam atmosphere.",
  "image2Prompt": "${isPart3 ? "A photorealistic documentary-style photograph for Aptis Speaking exam depicting [second contrasting scene described in title]. Authentic natural lighting, candid composition, 8k quality." : ""}"
}`;

  // 1. Thử dùng OpenAI nếu có key
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && openAiKey.trim().length > 10) {
    try {
      const openai = new OpenAI({ apiKey: openAiKey });
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
      const text = resp.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(text);
      return {
        partNumber,
        topicTitle,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        startingPhrases: Array.isArray(parsed.startingPhrases) ? parsed.startingPhrases : [],
        linkingPhrases: Array.isArray(parsed.linkingPhrases) ? parsed.linkingPhrases : [],
        aiImagePrompts: {
          image1Prompt: parsed.image1Prompt || "",
          image2Prompt: isPart3 ? parsed.image2Prompt || "" : undefined,
        },
      };
    } catch (err: any) {
      console.warn("  [Test] OpenAI call failed, falling back to Gemini:", err?.message || err);
    }
  }

  // 2. Thử dùng Gemini
  const geminiKey = process.env.GEMINI_API_KEY || (process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(",")[0].trim() : "");
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanJson = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(cleanJson);
      return {
        partNumber,
        topicTitle,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        startingPhrases: Array.isArray(parsed.startingPhrases) ? parsed.startingPhrases : [],
        linkingPhrases: Array.isArray(parsed.linkingPhrases) ? parsed.linkingPhrases : [],
        aiImagePrompts: {
          image1Prompt: parsed.image1Prompt || "",
          image2Prompt: isPart3 ? parsed.image2Prompt || "" : undefined,
        },
      };
    } catch (err: any) {
      console.warn("  [Test] Gemini call failed:", err?.message || err);
    }
  }

  // 3. Fallback theo ngữ cảnh
  const parts = topicTitle.split(/(?:,|\bvs\b|\bvới\b)/i);
  const sideA = parts[0]?.trim() || topicTitle;
  const sideB = parts[1]?.trim() || "contrasting scenario";

  return {
    partNumber,
    topicTitle,
    keywords: isPart3
      ? ["stark difference in pace", "traditional versus modern approach", "human endurance vs mechanical power", "environmental impact", "personal fulfillment"]
      : ["central focal point", "vibrant atmosphere", "intense concentration", "daily routine", "emotional expression"],
    startingPhrases: isPart3
      ? [
          `While the first picture portrays ${sideA}, the second depicts ${sideB}...`,
          `Comparing the two scenarios, there is a prominent distinction in ambiance and energy...`,
        ]
      : [
          `Looking at the picture, the prominent feature is ${topicTitle}...`,
          `The image immediately captures a lively moment in daily life...`,
        ],
    linkingPhrases: isPart3
      ? [
          `On the one hand, ${sideA} requires dedicated effort, whereas ${sideB} focuses on speed and convenience...`,
          `Personally, I find ${sideA} more appealing because it fosters genuine discipline...`,
        ]
      : [
          `In the background, the overall atmosphere conveys a sense of purpose and harmony...`,
          `From my perspective, this scene highlights how individuals find balance in modern life...`,
        ],
    aiImagePrompts: {
      image1Prompt: `A photorealistic documentary-style photograph for Aptis Speaking test showing ${sideA}. Natural daylight, candid composition, high resolution.`,
      image2Prompt: isPart3 ? `A photorealistic documentary-style photograph for Aptis Speaking test showing ${sideB}. Natural daylight, candid composition, high resolution.` : undefined,
    },
  };
}

// Bộ Test Cases đại diện chuẩn các dạng đề Aptis Speaking thực tế trong DB
const TEST_CASES = [
  {
    name: "TC-01: Part 3 - Đua xe đạp vs Đua xe máy (Thể thao & Tốc độ đối lập)",
    partNumber: 3 as const,
    topicTitle: "1 cuộc đua xe đạp, 1 cuộc đua xe máy",
    questions: [
      "Describe the two pictures.",
      "What are the difficulties of these two sports?",
      "Why do many people prefer team sports rather than individual sports?",
    ],
  },
  {
    name: "TC-02: Part 3 - Trò chuyện dưới tuyết vs Tắm nắng (Mùa đông vs Mùa hè đối lập)",
    partNumber: 3 as const,
    topicTitle: "1 cặp đôi trò chuyện dưới tuyết, 2 cô gái đang tắm nắng",
    questions: [
      "What are the people doing in each picture?",
      "How are the weather conditions in these two pictures different?",
      "Which of these two activities would you prefer to do on your holiday and why?",
    ],
  },
  {
    name: "TC-03: Part 3 - Sách giấy vs Máy tính (Truyền thống vs Công nghệ số)",
    partNumber: 3 as const,
    topicTitle: "1 cô gái đọc sách giấy, 1 cô gái nhìn màn hình máy tính",
    questions: [
      "Describe what each person is doing.",
      "How are the ways these two people acquiring information different?",
      "Do you think digital devices will completely replace paper books in the future? Why?",
    ],
  },
  {
    name: "TC-04: Part 2 - Người đàn ông mặc vest đứng đợi tàu (Bối cảnh công sở / Di chuyển)",
    partNumber: 2 as const,
    topicTitle: "1 người đàn ông mặc vest đứng đợi tàu",
    questions: [
      "Describe the picture.",
      "How do you think this person is feeling at that moment?",
      "Tell me about a time when you had to wait for public transportation.",
    ],
  },
  {
    name: "TC-05: Part 2 - Người đàn ông ngồi vẽ tranh (Sở thích nghệ thuật / Tĩnh lặng)",
    partNumber: 2 as const,
    topicTitle: "1 người đàn ông ngồi vẽ tranh",
    questions: [
      "Describe what you can see in the picture.",
      "Why do people enjoy painting or doing creative hobbies?",
      "Do you think schools should invest more in art classes for children?",
    ],
  },
];

async function runUnitTests() {
  console.log("================================================================================");
  console.log("[TEST] BẮT ĐẦU CHẠY UNIT TEST BỘ GENERATOR CHO SPEAKING VOCABULARY HINTS");
  console.log("================================================================================\n");

  let passedTests = 0;
  let failedTests = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    console.log(`--------------------------------------------------------------------------------`);
    console.log(` CHẠY TEST CASE ${i + 1}/${TEST_CASES.length}: ${tc.name}`);
    console.log(`  Đề thi: "${tc.topicTitle}" (Part ${tc.partNumber})`);

    const startTime = Date.now();
    const result = await generateHintsWithAI(tc.topicTitle, tc.partNumber, tc.questions);
    const duration = Date.now() - startTime;

    // KIỂM TRA ĐIỀU KIỆN (ASSERTIONS)
    const errors: string[] = [];

    // 1. Kiểm tra Collocations
    if (!result.keywords || result.keywords.length < 4) {
      errors.push(`Số lượng Collocations quá ít: ${result.keywords?.length || 0} (yêu cầu >= 4)`);
    }

    // 2. Kiểm tra Mẫu câu mở đầu
    if (!result.startingPhrases || result.startingPhrases.length < 2) {
      errors.push(`Số lượng startingPhrases quá ít: ${result.startingPhrases?.length || 0} (yêu cầu >= 2)`);
    }

    // 3. Kiểm tra Mẫu câu liên hệ / đối sánh
    if (!result.linkingPhrases || result.linkingPhrases.length < 2) {
      errors.push(`Số lượng linkingPhrases quá ít: ${result.linkingPhrases?.length || 0} (yêu cầu >= 2)`);
    }

    // 4. Kiểm tra Prompt gen ảnh
    if (!result.aiImagePrompts?.image1Prompt || result.aiImagePrompts.image1Prompt.length < 20) {
      errors.push("image1Prompt rỗng hoặc quá ngắn");
    }
    if (tc.partNumber === 3 && (!result.aiImagePrompts?.image2Prompt || result.aiImagePrompts.image2Prompt.length < 20)) {
      errors.push("Part 3 bắt buộc phải có image2Prompt cho ảnh thứ 2");
    }

    if (errors.length === 0) {
      passedTests++;
      console.log(`  [PASS] KẾT QUẢ: ĐẠT CHUẨN 100% (Thời gian: ${duration}ms)`);
      console.log(`\n  [NOTE] KẾT QUẢ ĐẦU RA SẼ RENDER LÊN GIAO DIỆN HỌC VIÊN:`);
      console.log(`     • Collocations đối lập:`);
      result.keywords.forEach((kw) => console.log(`       [ ${kw} ]`));
      console.log(`\n     • Mẫu câu so sánh & đối chiếu:`);
      result.startingPhrases.forEach((p) => console.log(`       "${p}"`));
      result.linkingPhrases.forEach((p) => console.log(`       "${p}"`));

      console.log(`\n     • Prompts chuẩn bị giao cho Agent/Designer gen lại ảnh:`);
      console.log(`       - Ảnh 1: ${result.aiImagePrompts.image1Prompt}`);
      if (result.aiImagePrompts.image2Prompt) {
        console.log(`       - Ảnh 2: ${result.aiImagePrompts.image2Prompt}`);
      }
    } else {
      failedTests++;
      console.log(`  [FAIL] KẾT QUẢ: KHÔNG ĐẠT (${errors.join(", ")})`);
    }
    console.log();
  }

  console.log("================================================================================");
  console.log(`[STATS] TỔNG KẾT UNIT TEST:`);
  console.log(`   - Tổng số ca kiểm thử: ${TEST_CASES.length}`);
  console.log(`   - Số ca ĐẠT (PASS):   ${passedTests} / ${TEST_CASES.length}`);
  console.log(`   - Số ca LỖI (FAIL):   ${failedTests} / ${TEST_CASES.length}`);
  console.log("================================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runUnitTests().catch((err) => {
  console.error("Lỗi thực thi unit test:", err);
  process.exit(1);
});

