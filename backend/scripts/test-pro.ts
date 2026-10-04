import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AQ.Ab8RN6IVwgbOPSbD3zmqMEtDhn6pOXqBReuqjKCETPAqhOu8Mw';

async function testPro() {
  const genAI = new GoogleGenerativeAI(apiKey);
  console.log('Testing gemini-3.1-pro...');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-pro' });
    const res = await model.generateContent('Hi');
    console.log('Result gemini-3.1-pro:', res.response.text());
  } catch (e: any) {
    console.log('gemini-3.1-pro error:', e.message);
  }
}

testPro();
