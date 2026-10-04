import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface GeminiRotationStatus {
  activeModel: string;
  availableModels: string[];
  totalDiscovered: number;
  lastRotatedAt: Date | null;
  totalRotations: number;
  lastError: string | null;
  deadModels: string[];
  modelHealth: Record<string, { status: 'healthy' | 'error' | 'cooldown'; lastChecked?: Date; error?: string }>;
}

export class GeminiRotatorService {
  private apiKey: string | null = null;
  private genAI: GoogleGenerativeAI | null = null;
  private modelsPool: string[] = [];
  private activeModel: string = 'gemini-flash-lite-latest';
  private lastRotatedAt: Date | null = null;
  private totalRotations: number = 0;
  private lastError: string | null = null;
  private deadModelsSet: Set<string> = new Set();
  private cooldownMap: Map<string, number> = new Map(); // model -> timestamp cooldown hết hạn
  private modelHealth: Record<string, { status: 'healthy' | 'error' | 'cooldown'; lastChecked?: Date; error?: string }> = {};
  private isDiscovering: boolean = false;
  private lastDiscoveredAt: Date | null = null;

  constructor() {
    this.reloadConfig();
  }

  public async reloadConfig() {
    this.apiKey = process.env.GEMINI_API_KEY || null;

    if (this.apiKey && this.apiKey.trim() !== '') {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      await this.discoverModelsFromGoogle();
    } else {
      this.genAI = null;
      this.modelsPool = [];
    }
  }

  /**
   * TỰ ĐỘNG KHÁM PHÁ & XẾP HẠNG ƯU TIÊN SỰ ỔN ĐỊNH CAO NHẤT (STABILITY-FIRST)
   * - Hoàn toàn không hardcode phiên bản.
   * - Tự động trích xuất version số học bằng regex toán học.
   * - Cực kỳ ưu tiên các bí danh vĩnh cửu của Google (*-latest) không bao giờ bị khai tử.
   * - Đẩy các bản Preview / Exp hay bị 503 quá tải xuống cuối danh sách.
   */
  public async discoverModelsFromGoogle(): Promise<string[]> {
    if (!this.apiKey) return [];
    if (this.isDiscovering) return this.modelsPool;

    try {
      this.isDiscovering = true;
      console.log('🌐 [Gemini Rotator] Đang truy vấn Google API để đồng bộ danh sách models mới nhất...');

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
      const data = (await response.json()) as any;

      if (data && data.models && Array.isArray(data.models)) {
        // 1. Lọc các model thuộc họ Gemini hỗ trợ generateContent
        const validModels: string[] = data.models
          .filter((m: any) =>
            m.supportedGenerationMethods?.includes('generateContent') &&
            m.name?.includes('gemini') &&
            !m.name?.includes('tts') &&
            !m.name?.includes('image') &&
            !m.name?.includes('robotics') &&
            !m.name?.includes('computer-use')
          )
          .map((m: any) => m.name.replace(/^models\//, ''))
          .filter((name: string) => !this.deadModelsSet.has(name));

        // 2. Thuật toán tính điểm Ổn Định Động (Dynamic Stability Score)
        const computeStabilityScore = (name: string): number => {
          let score = 0;

          // A. Bí danh vĩnh cửu của Google: Cam kết không bao giờ bị khai tử (404)
          if (name === 'gemini-flash-lite-latest') score += 2000;
          else if (name === 'gemini-flash-latest') score += 1900;
          else if (name.includes('latest')) score += 1500;

          // B. Phạt nặng các bản thử nghiệm (Preview, Exp) vì hay bị quá tải 503 hoặc đổi tên
          const isPreview = name.includes('preview') || name.includes('exp') || name.includes('customtools');
          if (isPreview) {
            score -= 600;
          } else {
            score += 500; // Bản phát hành ổn định (General Availability)
          }

          // C. Phạt nặng dòng "pro" vì Free Tier của Google hạn ngạch quota = 0 (gây lỗi 429)
          if (name.includes('pro')) {
            score -= 800;
          }

          // D. Ưu tiên Flash-Lite và Flash vì cực nhẹ, tốc độ dưới 1s, ít khi bị quá tải
          if (name.includes('flash-lite')) score += 200;
          else if (name.includes('flash')) score += 100;

          // E. Tự động bóc tách số phiên bản bằng Regex toán học (phiên bản cao hơn được cộng thêm điểm)
          const vMatch = name.match(/gemini-(\d+(?:\.\d+)?)/i);
          if (vMatch) {
            score += parseFloat(vMatch[1]) * 10;
          }

          return score;
        };

        // Sắp xếp danh sách theo điểm ổn định từ cao xuống thấp
        validModels.sort((a, b) => computeStabilityScore(b) - computeStabilityScore(a));

        // 3. Nếu người dùng chỉ định thứ tự riêng trong .env (GEMINI_MODELS), ưu tiên đưa lên trước
        const envModels = process.env.GEMINI_MODELS
          ? process.env.GEMINI_MODELS.split(',').map((m) => m.trim()).filter(Boolean)
          : [];

        this.modelsPool = Array.from(new Set([...envModels, ...validModels]));

        if (this.modelsPool.length > 0) {
          // Lưu vào local cache để dự phòng khi mất kết nối mạng
          this.saveModelsToLocalCache(this.modelsPool);

          // Nếu model active hiện tại bị chết hoặc chưa có, gán bằng model đứng đầu pool
          if (!this.modelsPool.includes(this.activeModel) || this.deadModelsSet.has(this.activeModel)) {
            this.activeModel = this.modelsPool[0];
          }
          this.lastDiscoveredAt = new Date();
          console.log(`✅ [Gemini Rotator] Đã đồng bộ ${this.modelsPool.length} models từ Google. Ưu tiên hàng đầu (Ổn định nhất): "${this.activeModel}"`);
          console.log(`📋 Top 5 models ổn định: [${this.modelsPool.slice(0, 5).join(', ')}]`);
        }
      }
    } catch (err: any) {
      console.warn('⚠️ [Gemini Rotator] Không thể kết nối Google API lúc khởi động, đọc từ Cache hoặc Bí danh vĩnh cửu:', err?.message || err);
      
      // Thử nạp từ File Cache đã lưu từ lần gọi thành công trước đó (KHÔNG CẦN HARDCODE)
      const cached = this.loadModelsFromLocalCache();
      if (cached.length > 0) {
        this.modelsPool = cached;
        this.activeModel = cached[0];
        console.log(`📦 [Gemini Rotator] Đã khôi phục ${cached.length} models từ cache gần nhất. Active: "${this.activeModel}"`);
      } else if (this.modelsPool.length === 0) {
        // Phao cứu sinh tối giản: CHỈ dùng 2 Bí Danh Vĩnh Cửu của Google (Google cam kết không bao giờ 404/khai tử)
        this.modelsPool = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
        this.activeModel = this.modelsPool[0];
      }
    } finally {
      this.isDiscovering = false;
    }

    return this.modelsPool;
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim() !== '');
  }

  public getStatus(): GeminiRotationStatus {
    return {
      activeModel: this.activeModel,
      availableModels: [...this.modelsPool],
      totalDiscovered: this.modelsPool.length,
      lastRotatedAt: this.lastRotatedAt,
      totalRotations: this.totalRotations,
      lastError: this.lastError,
      deadModels: Array.from(this.deadModelsSet),
      modelHealth: { ...this.modelHealth },
    };
  }

  /**
   * CƠ CHẾ XOAY VÒNG THÔNG MINH KÈM BỘ NGẮT MẠCH (CIRCUIT BREAKER & COOLDOWN):
   * 1. Luôn dùng model Active hiện tại.
   * 2. Nếu model Active lỗi 404 (Khai tử): Đưa vào Dead-List, loại bỏ vĩnh viễn khỏi vòng quay.
   * 3. Nếu model Active lỗi 503 / 429 (Quá tải): Cho vào Cooldown 3 phút, chuyển sang model ổn định kế tiếp.
   * 4. Khi tìm được model phản hồi tốt: Khóa chặt (Sticky) làm Active Model mới cho các bài thi sau.
   */
  public async executeWithRotation<T>(
    operation: (model: GenerativeModel, modelName: string) => Promise<T>
  ): Promise<{ data: T; usedModel: string }> {
    if (!this.genAI || !this.apiKey) {
      throw new Error('GEMINI_API_KEY chưa được thiết lập trong backend/.env');
    }

    if (this.modelsPool.length === 0) {
      await this.discoverModelsFromGoogle();
    }

    const now = Date.now();

    // Lọc bỏ các model đã chết (404) hoặc đang trong thời gian Cooldown (503/429)
    const availableCandidates = this.modelsPool.filter((m) => {
      if (this.deadModelsSet.has(m)) return false;
      const cooldownExp = this.cooldownMap.get(m);
      if (cooldownExp && cooldownExp > now) return false;
      return true;
    });

    // Ưu tiên activeModel nếu vẫn khả dụng
    const prioritizedModels = Array.from(new Set([
      this.activeModel,
      ...availableCandidates,
      ...this.modelsPool, // Phao cứu sinh cuối cùng nếu tất cả đều bị cooldown
    ])).filter((m) => !this.deadModelsSet.has(m));

    let lastException: any = null;

    for (let i = 0; i < prioritizedModels.length; i++) {
      const candidateModel = prioritizedModels[i];
      try {
        const modelInstance = this.genAI.getGenerativeModel({ model: candidateModel });
        const result = await operation(modelInstance, candidateModel);

        // Đánh dấu model khỏe mạnh và xóa cooldown nếu có
        this.modelHealth[candidateModel] = {
          status: 'healthy',
          lastChecked: new Date(),
        };
        this.cooldownMap.delete(candidateModel);

        // Nếu model vừa thành công khác với model active cũ -> Đã chuyển sang model ổn định mới!
        if (candidateModel !== this.activeModel) {
          console.warn(
            `🔄 [Gemini Rotator] ĐÃ TỰ ĐỘNG CHUYỂN SANG MODEL ỔN ĐỊNH: "${candidateModel}" LÀM ACTIVE MODEL MỚI! (Ghi nhớ cho các lần tiếp theo)`
          );
          this.activeModel = candidateModel;
          this.lastRotatedAt = new Date();
          this.totalRotations++;
        }

        return { data: result, usedModel: candidateModel };
      } catch (err: any) {
        lastException = err;
        const errMsg = err?.message || String(err);
        this.lastError = `Model ${candidateModel} error: ${errMsg}`;

        // PHÂN LOẠI LỖI ĐỂ XỬ LÝ THÔNG MINH:
        if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('no longer available')) {
          // Model đã bị Google khai tử -> Đưa vào danh sách đen, không bao giờ gọi lại
          console.warn(`🛑 [Gemini Rotator] Model "${candidateModel}" ĐÃ BỊ GOOGLE KHAI TỬ (404). Đang loại bỏ khỏi danh sách.`);
          this.deadModelsSet.add(candidateModel);
          this.modelHealth[candidateModel] = { status: 'error', lastChecked: new Date(), error: 'Deprecated 404' };
        } else if (errMsg.includes('503') || errMsg.includes('429') || errMsg.includes('high demand') || errMsg.includes('ResourceExhausted')) {
          // Model bị quá tải tạm thời -> Đưa vào Cooldown 3 phút
          console.warn(`⏳ [Gemini Rotator] Model "${candidateModel}" bị quá tải tạm thời (503/429). Cooldown 3 phút.`);
          this.cooldownMap.set(candidateModel, Date.now() + 3 * 60 * 1000);
          this.modelHealth[candidateModel] = { status: 'cooldown', lastChecked: new Date(), error: 'Temporarily overloaded' };
        } else {
          this.modelHealth[candidateModel] = { status: 'error', lastChecked: new Date(), error: errMsg };
        }
      }
    }

    throw new Error(
      `Tất cả models trong pool xoay vòng đều không phản hồi lúc này. Lỗi cuối: ${lastException?.message || lastException}`
    );
  }

  /**
   * Chấm bài Writing với Gemini
   */
  public async evaluateWriting(questionPrompt: string, context: string, text: string) {
    const prompt = `You are an official British Council Aptis ESOL Writing senior examiner.
Evaluate the candidate's writing response according to standard British Council Aptis ESOL criteria (score scale 0-50).

Scoring criteria:
- task_completion (0-50): Addressing all parts of the prompt, word count compliance, register/tone.
- grammar_score (0-50): Accuracy and range of grammatical structures.
- vocabulary_score (0-50): Lexical diversity, spelling, precision.
- cohesion_score (0-50): Coherence, paragraph flow, transitions.
Compute overall score (0-50) and map to CEFR level (A1, A2, B1, B2, C1).
Write summary feedback and suggestions in Vietnamese.

Respond STRICTLY in JSON format with NO markdown wrapping:
{
  "score": number,
  "cefr_level": "A1" | "A2" | "B1" | "B2" | "C1",
  "task_completion": number,
  "grammar_score": number,
  "vocabulary_score": number,
  "cohesion_score": number,
  "feedback_summary": string,
  "detailed_feedback": [
    {
      "original": string,
      "suggested": string,
      "errorType": string,
      "comment": string
    }
  ]
}

Question Prompt: "${questionPrompt}"
Context: "${context}"
Candidate Text:
"""
${text}
"""`;

    const { data, usedModel } = await this.executeWithRotation(async (model) => {
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.response.text();
      return this.cleanAndParseJson(rawText);
    });

    return { ...data, aiProvider: 'gemini', usedModel, raw: data };
  }

  /**
   * Chấm bài Speaking với Gemini (Sử dụng khả năng Multimodal nghe trực tiếp Audio)
   */
  public async evaluateSpeaking(audioFilePath: string, questionPrompt: string, audioDuration: number) {
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`File âm thanh không tồn tại tại đường dẫn: ${audioFilePath}`);
    }

    const audioBytes = fs.readFileSync(audioFilePath);
    const base64Audio = audioBytes.toString('base64');
    let mimeType = 'audio/webm';
    if (audioFilePath.endsWith('.mp3')) mimeType = 'audio/mp3';
    else if (audioFilePath.endsWith('.wav')) mimeType = 'audio/wav';
    else if (audioFilePath.endsWith('.m4a') || audioFilePath.endsWith('.mp4')) mimeType = 'audio/mp4';

    const prompt = `You are an official British Council Aptis ESOL Speaking senior examiner.
Listen carefully to the candidate's recorded audio response and evaluate according to standard British Council Aptis ESOL criteria (score scale 0-50).

Scoring criteria:
- pronunciation (0-50): Intelligibility, phonological features, word stress, sentence intonation.
- fluency_score (0-50): Speech rate, natural pauses, hesitation, rhythm.
- grammar_score (0-50): Accuracy and range of spoken grammatical structures.
- vocabulary_score (0-50): Lexical resource and topic relevance.

Instructions:
1. First, transcribe the exact spoken words into the field "transcribed_speech".
2. Compute overall score (0-50) and map to CEFR level (A1, A2, B1, B2, C1).
3. Write summary feedback and constructive suggestions in Vietnamese.

Respond STRICTLY in JSON format with NO markdown wrapping:
{
  "score": number,
  "cefr_level": "A1" | "A2" | "B1" | "B2" | "C1",
  "transcribed_speech": string,
  "pronunciation": number,
  "fluency_score": number,
  "grammar_score": number,
  "vocabulary_score": number,
  "feedback_summary": string,
  "detailed_feedback": [
    {
      "criterion": string,
      "comment": string
    }
  ]
}

Question Prompt: "${questionPrompt}"
Expected audio duration: ${audioDuration} seconds`;

    const { data, usedModel } = await this.executeWithRotation(async (model) => {
      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Audio,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.response.text();
      return this.cleanAndParseJson(rawText);
    });

    return {
      ...data,
      transcriptText: data.transcribed_speech || '',
      aiProvider: 'gemini',
      usedModel,
      raw: data,
    };
  }

  /**
   * Health Check: Test nhanh các models trong pool
   */
  public async testAllModels(): Promise<Array<{ model: string; ok: boolean; latencyMs: number; error?: string }>> {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY chưa được cấu hình');
    }

    if (this.modelsPool.length === 0) {
      await this.discoverModelsFromGoogle();
    }

    const results = [];
    for (const modelName of this.modelsPool.slice(0, 8)) {
      const startTime = Date.now();
      try {
        const modelInstance = this.genAI.getGenerativeModel({ model: modelName });
        await modelInstance.generateContent({
          contents: [{ role: 'user', parts: [{ text: 'Ping. Output {"status":"ok"}' }] }],
        });
        const latencyMs = Date.now() - startTime;
        results.push({ model: modelName, ok: true, latencyMs });
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        results.push({ model: modelName, ok: false, latencyMs, error: err?.message || String(err) });
      }
    }
    return results;
  }

  private getCacheFilePath(): string {
    return path.join(process.cwd(), '.gemini-models-cache.json');
  }

  private saveModelsToLocalCache(models: string[]): void {
    try {
      if (models && models.length > 0) {
        fs.writeFileSync(this.getCacheFilePath(), JSON.stringify(models, null, 2), 'utf-8');
      }
    } catch {
      // Bỏ qua lỗi ghi file nếu môi trường chỉ đọc (readonly)
    }
  }

  private loadModelsFromLocalCache(): string[] {
    try {
      const cachePath = this.getCacheFilePath();
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((m: string) => !this.deadModelsSet.has(m));
        }
      }
    } catch {
      // Ignored
    }
    return [];
  }

  private cleanAndParseJson(text: string): any {
    try {
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      return JSON.parse(cleaned);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error(`Không thể phân tích dữ liệu JSON từ phản hồi của Gemini: "${text.slice(0, 150)}..."`);
    }
  }
}

export const geminiRotator = new GeminiRotatorService();
