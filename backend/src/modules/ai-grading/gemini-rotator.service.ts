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
  activeTier: 'FREE' | 'PAID';
  freeCooldownRemainingSeconds: number;
  totalFreeCalls: number;
  totalPaidCalls: number;
  totalTierFailovers: number;
}

export class GeminiRotatorService {
  // --- Dual-Tier API Keys ---
  private freeApiKey: string | null = null;
  private paidApiKey: string | null = null;
  private freeGenAI: GoogleGenerativeAI | null = null;
  private paidGenAI: GoogleGenerativeAI | null = null;

  // --- Tier Failover & Circuit Breaker ---
  private freeCooldownUntil: number = 0; // Timestamp cooldown cho Free Key khi chạm 429/15 RPM
  private totalFreeCalls: number = 0;
  private totalPaidCalls: number = 0;
  private totalTierFailovers: number = 0;

  // --- Model Rotation ---
  private modelsPool: string[] = [];
  private activeModel: string = 'gemini-flash-lite-latest';
  private lastRotatedAt: Date | null = null;
  private totalRotations: number = 0;
  private lastError: string | null = null;
  private deadModelsSet: Set<string> = new Set();
  private cooldownMap: Map<string, number> = new Map(); // model -> timestamp cooldown hết hạn
  private modelHealth: Record<string, { status: 'healthy' | 'error' | 'cooldown'; lastChecked?: Date; error?: string }> = {};
  private isDiscovering: boolean = false;
  private discoveryPromise: Promise<string[]> | null = null;
  private lastDiscoveredAt: Date | null = null;

  constructor() {
    // Khôi phục models từ cache ngay lập tức khi khởi động để không bị trễ
    const cached = this.loadModelsFromLocalCache();
    if (cached.length > 0) {
      this.modelsPool = cached;
      this.activeModel = cached[0];
    } else {
      this.modelsPool = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
      this.activeModel = this.modelsPool[0];
    }

    this.reloadConfig();
  }

  public async reloadConfig() {
    // 1. Cấu hình Free Tier Key (Ưu tiên số 1 - $0 chi phí, 1.500 req/ngày, 15 RPM)
    this.freeApiKey =
      (process.env.FREE_GEMINI_API_KEY && process.env.FREE_GEMINI_API_KEY.trim()) ||
      (process.env.ADMIN_GEMINI_API_KEY && process.env.ADMIN_GEMINI_API_KEY.trim()) ||
      null;

    // 2. Cấu hình Paid/Billing Tier Key (Dự phòng số 2 - Tự động failover khi Free chạm 429)
    this.paidApiKey =
      (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) ||
      (process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',')[0].trim() : null) ||
      null;

    if (this.freeApiKey && this.freeApiKey.trim() !== '') {
      this.freeGenAI = new GoogleGenerativeAI(this.freeApiKey.trim());
    } else {
      this.freeGenAI = null;
    }

    if (this.paidApiKey && this.paidApiKey.trim() !== '') {
      this.paidGenAI = new GoogleGenerativeAI(this.paidApiKey.trim());
    } else {
      this.paidGenAI = null;
    }

    // Tự động khám phá danh sách model Google mới nhất
    await this.discoverModelsFromGoogle();
  }

  /**
   * TỰ ĐỘNG KHÁM PHÁ & XẾP HẠNG ƯU TIÊN SỰ ỔN ĐỊNH CAO NHẤT (STABILITY-FIRST)
   * - Hoàn toàn không hardcode phiên bản.
   * - Tự động trích xuất version số học bằng regex toán học.
   * - Cực kỳ ưu tiên các bí danh vĩnh cửu của Google (*-latest) không bao giờ bị khai tử.
   * - Đẩy các bản Preview / Exp hay bị 503 quá tải xuống cuối danh sách.
   */
  public async discoverModelsFromGoogle(): Promise<string[]> {
    if (process.env.NODE_ENV === 'test') return this.modelsPool;
    if (this.discoveryPromise) return this.discoveryPromise;

    const discoveryKey = this.freeApiKey || this.paidApiKey;
    if (!discoveryKey) return this.modelsPool;

    this.discoveryPromise = (async () => {
      try {
        this.isDiscovering = true;
        console.log('[Gemini Rotator] Đang truy vấn Google API để đồng bộ danh sách models mới nhất...');

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${discoveryKey}`);
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
            console.log(`[SUCCESS] [Gemini Rotator] Đã đồng bộ ${this.modelsPool.length} models từ Google. Ưu tiên hàng đầu (Ổn định nhất): "${this.activeModel}"`);
            console.log(`Top 5 models ổn định: [${this.modelsPool.slice(0, 5).join(', ')}]`);
          }
        }
      } catch (err: any) {
        console.warn('[WARN] [Gemini Rotator] Không thể kết nối Google API lúc khởi động, đọc từ Cache hoặc Bí danh vĩnh cửu:', err?.message || err);

        // Thử nạp từ File Cache đã lưu từ lần gọi thành công trước đó (KHÔNG CẦN HARDCODE)
        const cached = this.loadModelsFromLocalCache();
        if (cached.length > 0) {
          this.modelsPool = cached;
          this.activeModel = cached[0];
          console.log(`[INFO] [Gemini Rotator] Đã khôi phục ${cached.length} models từ cache gần nhất. Active: "${this.activeModel}"`);
        } else if (this.modelsPool.length === 0) {
          // Phao cứu sinh tối giản: CHỈ dùng 2 Bí Danh Vĩnh Cửu của Google (Google cam kết không bao giờ 404/khai tử)
          this.modelsPool = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
          this.activeModel = this.modelsPool[0];
        }
      } finally {
        this.isDiscovering = false;
        this.discoveryPromise = null;
      }
      return this.modelsPool;
    })();

    return this.discoveryPromise;
  }

  public isAvailable(): boolean {
    return Boolean((this.freeApiKey && this.freeApiKey.trim() !== '') || (this.paidApiKey && this.paidApiKey.trim() !== ''));
  }

  public getStatus(): GeminiRotationStatus {
    const isFreeCoolingDown = Date.now() < this.freeCooldownUntil;
    const cooldownRemaining = isFreeCoolingDown
      ? Math.max(0, Math.ceil((this.freeCooldownUntil - Date.now()) / 1000))
      : 0;

    return {
      activeModel: this.activeModel,
      availableModels: [...this.modelsPool],
      totalDiscovered: this.modelsPool.length,
      lastRotatedAt: this.lastRotatedAt,
      totalRotations: this.totalRotations,
      lastError: this.lastError,
      deadModels: Array.from(this.deadModelsSet),
      modelHealth: { ...this.modelHealth },
      activeTier: isFreeCoolingDown ? 'PAID' : 'FREE',
      freeCooldownRemainingSeconds: cooldownRemaining,
      totalFreeCalls: this.totalFreeCalls,
      totalPaidCalls: this.totalPaidCalls,
      totalTierFailovers: this.totalTierFailovers,
    };
  }

  /**
   * Kiểm tra lỗi có phải do Quota / Rate Limit (429 / ResourceExhausted) hay không
   */
  private isQuotaOrRateLimitError(err: any): boolean {
    const msg = (err?.message || String(err)).toLowerCase();
    const status = err?.status || err?.statusCode || 0;
    return (
      status === 429 ||
      msg.includes('429') ||
      msg.includes('resourceexhausted') ||
      msg.includes('resource_exhausted') ||
      msg.includes('quota') ||
      msg.includes('rate limit') ||
      msg.includes('too many requests')
    );
  }

  /**
   * CƠ CHẾ XOAY VÒNG THÔNG MINH ĐA TẦNG (MULTI-TIER KEY + MODEL ROTATION):
   * 
   * TẦNG 1: KEY FAILOVER (FREE TIER FIRST -> BILLING FALLBACK)
   * - Toàn bộ yêu cầu chấm thi ưu tiên sử dụng Key Free Tier ($0 chi phí, 1.500 req/ngày).
   * - Nếu Key Free chạm ngưỡng 15 RPM hoặc hết hạn ngạch (429/ResourceExhausted):
   *   -> Lập tức kích hoạt Cooldown 60s cho Free Key.
   *   -> Tức thì (<50ms) chuyển tiếp sang Paid Billing Key để hoàn tất việc chấm bài.
   *   -> Học viên KHÔNG BAO GIỜ bị gián đoạn hay nhận thông báo lỗi!
   * - Trong 60s cooldown, các bài nộp sau đi thẳng vào Paid Key để tránh mất thời gian thử lại.
   * - Sau 60s, hệ thống tự động quay lại Free Tier để tiết kiệm tối đa ngân sách.
   * 
   * TẦNG 2: MODEL ROTATION (CIRCUIT BREAKER & COOLDOWN)
   * - Xoay vòng các model Flash / Flash Lite ổn định nhất.
   * - Tự động loại bỏ model 404 (khai tử), cooldown model 503 (quá tải).
   */
  public async executeWithRotation<T>(
    operation: (model: GenerativeModel, modelName: string) => Promise<T>
  ): Promise<{ data: T; usedModel: string; usedTier: 'FREE' | 'PAID' }> {
    if (!this.isAvailable()) {
      throw new Error('Chưa cấu hình GEMINI_API_KEY hoặc FREE_GEMINI_API_KEY trong backend/.env');
    }

    if (this.modelsPool.length === 0) {
      await this.discoverModelsFromGoogle();
    }

    const now = Date.now();
    const isFreeCoolingDown = now < this.freeCooldownUntil;

    // Xác định thứ tự các tầng Key sẽ thử:
    const tiersToAttempt: Array<{ tier: 'FREE' | 'PAID'; genAI: GoogleGenerativeAI }> = [];

    if (!isFreeCoolingDown && this.freeGenAI) {
      // Free Key đang khỏe mạnh: Ưu tiên Free Key trước!
      tiersToAttempt.push({ tier: 'FREE', genAI: this.freeGenAI });
      if (this.paidGenAI && this.paidApiKey !== this.freeApiKey) {
        tiersToAttempt.push({ tier: 'PAID', genAI: this.paidGenAI });
      }
    } else {
      // Free Key đang trong cooldown hoặc chưa cấu hình: Đi thẳng vào Paid Key!
      if (this.paidGenAI) {
        const remainingSec = Math.ceil((this.freeCooldownUntil - now) / 1000);
        if (isFreeCoolingDown) {
          console.log(`[Gemini Rotator] [TIER BYPASS] Free Key đang Cooldown (còn ${remainingSec}s), chuyển thẳng sang Paid Billing Key.`);
        }
        tiersToAttempt.push({ tier: 'PAID', genAI: this.paidGenAI });
      }
      // Nếu không có Paid Key riêng, vẫn thử Free Key như cứu cánh cuối
      if (this.freeGenAI && (!this.paidGenAI || this.paidApiKey === this.freeApiKey)) {
        tiersToAttempt.push({ tier: 'FREE', genAI: this.freeGenAI });
      }
    }

    // Lọc bỏ các model đã chết (404) hoặc đang trong thời gian Cooldown (503)
    const availableCandidates = this.modelsPool.filter((m) => {
      if (this.deadModelsSet.has(m)) return false;
      const cooldownExp = this.cooldownMap.get(m);
      if (cooldownExp && cooldownExp > now) return false;
      return true;
    });

    const prioritizedModels = Array.from(new Set([
      this.activeModel,
      ...availableCandidates,
      ...this.modelsPool, // Phao cứu sinh cuối cùng nếu tất cả đều bị cooldown
    ])).filter((m) => !this.deadModelsSet.has(m));

    let lastException: any = null;

    // Duyệt qua từng tầng Key
    for (let t = 0; t < tiersToAttempt.length; t++) {
      const { tier, genAI } = tiersToAttempt[t];

      // Duyệt qua từng model trong danh sách ưu tiên
      for (let i = 0; i < prioritizedModels.length; i++) {
        const candidateModel = prioritizedModels[i];
        try {
          const modelInstance = genAI.getGenerativeModel({ model: candidateModel });
          const result = await operation(modelInstance, candidateModel);

          // Ghi nhận thành công
          this.modelHealth[candidateModel] = {
            status: 'healthy',
            lastChecked: new Date(),
          };
          this.cooldownMap.delete(candidateModel);

          // Cập nhật thống kê theo tầng
          if (tier === 'FREE') {
            this.totalFreeCalls++;
          } else {
            this.totalPaidCalls++;
          }

          // Cập nhật active model nếu model này phản hồi tốt hơn model cũ
          if (candidateModel !== this.activeModel) {
            console.warn(
              `[Gemini Rotator] ĐÃ TỰ ĐỘNG CHUYỂN SANG MODEL ỔN ĐỊNH: "${candidateModel}" LÀM ACTIVE MODEL MỚI! (Tier: ${tier})`
            );
            this.activeModel = candidateModel;
            this.lastRotatedAt = new Date();
            this.totalRotations++;
          }

          return { data: result, usedModel: candidateModel, usedTier: tier };
        } catch (err: any) {
          lastException = err;
          const errMsg = err?.message || String(err);
          this.lastError = `[Tier ${tier}] Model ${candidateModel} error: ${errMsg}`;

          // PHÂN LOẠI LỖI 1: Rate Limit / Quota (429 / ResourceExhausted)
          if (this.isQuotaOrRateLimitError(err)) {
            if (tier === 'FREE') {
              const isDailyLimit = errMsg.toLowerCase().includes('per day') || errMsg.toLowerCase().includes('daily');
              const cooldownDuration = isDailyLimit ? 60 * 60 * 1000 : 60 * 1000; // 1 giờ nếu hết ngày, 60s nếu 15 RPM
              this.freeCooldownUntil = Date.now() + cooldownDuration;
              this.totalTierFailovers++;

              console.warn(
                `[WARN] [Gemini Rotator] [KEY FAILOVER] Free Tier Key chạm giới hạn ${isDailyLimit ? 'ngày' : '15 RPM'} (429/ResourceExhausted). Kích hoạt Cooldown ${cooldownDuration / 1000}s và TỨC THÌ chuyển sang Paid Billing Key!`
              );
              // Ngắt ngay lập tức vòng lặp models của Free Tier để nhảy sang Paid Tier
              break;
            } else {
              // Paid Tier cũng bị 429: Thử model tiếp theo
              console.warn(`[WARN] [Gemini Rotator] Paid Tier chạm giới hạn tạm thời với model "${candidateModel}". Thử model kế tiếp...`);
            }
          }
          // PHÂN LOẠI LỖI 2: Model 404 đã bị Google khai tử
          else if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('no longer available')) {
            console.warn(`[WARN] [Gemini Rotator] Model "${candidateModel}" ĐÃ BỊ GOOGLE KHAI TỬ (404). Đang loại bỏ khỏi danh sách.`);
            this.deadModelsSet.add(candidateModel);
            this.modelHealth[candidateModel] = { status: 'error', lastChecked: new Date(), error: 'Deprecated 404' };
          }
          // PHÂN LOẠI LỖI 3: Model 503 quá tải cụm máy chủ Google
          else if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('overloaded')) {
            console.warn(`[WARN] [Gemini Rotator] Model "${candidateModel}" bị quá tải tạm thời (503). Cooldown 3 phút.`);
            this.cooldownMap.set(candidateModel, Date.now() + 3 * 60 * 1000);
            this.modelHealth[candidateModel] = { status: 'cooldown', lastChecked: new Date(), error: 'Temporarily overloaded 503' };
          } else {
            this.modelHealth[candidateModel] = { status: 'error', lastChecked: new Date(), error: errMsg };
          }
        }
      }
    }

    throw new Error(
      `Tất cả các tầng Key (Free & Paid) và models trong pool đều không phản hồi lúc này. Lỗi cuối: ${lastException?.message || lastException}`
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

    const { data, usedModel, usedTier } = await this.executeWithRotation(async (model) => {
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

    return { ...data, aiProvider: 'gemini', usedModel, usedTier, raw: data };
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

    const { data, usedModel, usedTier } = await this.executeWithRotation(async (model) => {
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
      usedTier,
      raw: data,
    };
  }

  /**
   * Health Check: Test nhanh các models trong pool
   */
  public async testAllModels(): Promise<Array<{ model: string; ok: boolean; latencyMs: number; error?: string }>> {
    const genAI = this.freeGenAI || this.paidGenAI;
    if (!genAI) {
      throw new Error('Chưa cấu hình API Key cho Gemini');
    }

    if (this.modelsPool.length === 0) {
      await this.discoverModelsFromGoogle();
    }

    const results = [];
    for (const modelName of this.modelsPool.slice(0, 8)) {
      const startTime = Date.now();
      try {
        const modelInstance = genAI.getGenerativeModel({ model: modelName });
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
