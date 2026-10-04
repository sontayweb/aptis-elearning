import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AQ.Ab8RN6IVwgbOPSbD3zmqMEtDhn6pOXqBReuqjKCETPAqhOu8Mw';

const modelsToTest = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-pro',
  'gemini-3-flash',
];

async function runTest() {
  console.log('🔑 Kiểm tra API Key với các model thế hệ mới:');
  console.log(`Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-6)}`);
  
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of modelsToTest) {
    process.stdout.write(`\n🔍 Đang test model: "${modelName}"... `);
    const start = Date.now();
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Trả lời ngắn gọn bằng JSON: {"test": "ok", "message": "Aptis AI ready"}' }],
          },
        ],
      });
      const duration = Date.now() - start;
      const text = result.response.text();
      console.log(`\n🎉 ✅ THÀNH CÔNG VỚI MODEL [${modelName}] (${duration}ms)!`);
      console.log(`Phản hồi từ AI: ${text.trim()}\n`);
    } catch (err: any) {
      const duration = Date.now() - start;
      console.log(`❌ THẤT BÀI (${duration}ms)`);
      console.log(`   Lỗi: ${err?.message || err}`);
    }
  }
}

runTest();
