import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AQ.Ab8RN6IVwgbOPSbD3zmqMEtDhn6pOXqBReuqjKCETPAqhOu8Mw';
const genAI = new GoogleGenerativeAI(apiKey);

async function testAliases() {
  const models = [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
  ];

  for (const m of models) {
    const t0 = Date.now();
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Say OK' }] }]
      });
      console.log(`✅ [${m}] THÀNH CÔNG (${Date.now() - t0}ms):`, res.response.text().trim());
    } catch (err: any) {
      console.log(`❌ [${m}] THẤT BÀI (${Date.now() - t0}ms):`, err?.message || err);
    }
  }
}

testAliases();
