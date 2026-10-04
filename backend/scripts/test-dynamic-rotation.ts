import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AQ.Ab8RN6IVwgbOPSbD3zmqMEtDhn6pOXqBReuqjKCETPAqhOu8Mw';

async function testDynamicDiscoveryAndRotation() {
  console.log('🌐 1. Tự động lấy danh sách Model từ Google API (Không hardcode)...');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  
  if (!data.models || !Array.isArray(data.models)) {
    console.error('Không lấy được danh sách model:', data);
    return;
  }

  // Lọc ra các model hỗ trợ generateContent và thuộc họ Gemini
  const activeGeminiModels = data.models
    .filter((m: any) => 
      m.supportedGenerationMethods?.includes('generateContent') &&
      m.name.includes('gemini') &&
      !m.name.includes('tts') &&
      !m.name.includes('image') &&
      !m.name.includes('robotics') &&
      !m.name.includes('computer-use')
    )
    .map((m: any) => m.name.replace(/^models\//, ''));

  console.log(`Tìm thấy ${activeGeminiModels.length} models Gemini khả dụng từ Google API:`);
  console.log(activeGeminiModels);

  // 2. Chạy thử cơ chế xoay vòng
  console.log('\n🔄 2. Chạy kiểm tra xoay vòng (Model Rotation):');
  const genAI = new GoogleGenerativeAI(apiKey);

  let currentStickyModel = activeGeminiModels[0];
  console.log(`Model khởi đầu thử nghiệm: "${currentStickyModel}"`);

  for (const modelName of activeGeminiModels.slice(0, 5)) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = 'Cho tôi kết quả dạng JSON: {"status": "success", "engine": "Gemini", "message": "Aptis AI ready"}';
      const output = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      console.log(`✅ Model [${modelName}] HOẠT ĐỘNG HOÀN HẢO!`);
      currentStickyModel = modelName;
      console.log(`🎯 ĐÃ LƯU MODEL "${currentStickyModel}" LÀM ACTIVE MODEL CHO CÁC LẦN GỌI TIẾP THEO!\n`);
      break; // Đã tìm được model phản hồi tốt nhất -> Dừng lại và giữ làm sticky model!
    } catch (err: any) {
      console.warn(`⚠️ Model [${modelName}] lỗi: ${err.message}. Đang xoay vòng sang model kế tiếp...`);
    }
  }
}

testDynamicDiscoveryAndRotation();
