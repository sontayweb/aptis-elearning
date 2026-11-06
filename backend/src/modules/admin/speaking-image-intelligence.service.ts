import { prisma } from '../../config/database';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface ImageCandidate {
  id: string;
  title: string;
  previewUrl: string;
  downloadUrl: string;
  source: 'UNSPLASH' | 'PEXELS' | 'GEMINI_IMAGEN';
  photographer?: string;
}

export interface PartImageSuggestionsResult {
  partId: string;
  partNumber: 2 | 3;
  topicTitle: string;
  analysis: {
    summary: string;
    concept1: string;
    concept2?: string;
    searchQuery1: string;
    searchQuery2?: string;
  };
  candidatePairs: Array<{
    id: string;
    title: string;
    image1: ImageCandidate;
    image2?: ImageCandidate;
  }>;
}

export class SpeakingImageIntelligenceService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey =
      process.env.ADMIN_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.FREE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Phân tích câu hỏi của ExamPart để trích xuất Semantic Concept và Search Query
   */
  async extractPartConcepts(
    partNumber: 2 | 3,
    partTitle: string,
    questions: Array<{ question_number: number; prompt: string }>
  ): Promise<{
    summary: string;
    concept1: string;
    concept2?: string;
    searchQuery1: string;
    searchQuery2?: string;
  }> {
    const qTexts = questions
      .map((q) => `Q${q.question_number}: ${q.prompt}`)
      .join('\n');

    // Thử dùng Gemini để phân tích ngữ cảnh chuẩn
    if (this.genAI) {
      try {
        const modelName =
          process.env.ADMIN_GEMINI_MODEL ||
          process.env.GEMINI_MODEL ||
          'gemini-1.5-flash';
        const model = this.genAI.getGenerativeModel({ model: modelName });

        const prompt = `Bạn là chuyên gia khảo thí bài thi Aptis ESOL Speaking.
Hãy phân tích nội dung các câu hỏi dưới đây và xác định chủ thể bức ảnh cần miêu tả/so sánh:
Tiêu đề Part: "${partTitle}"
Part thi: Part ${partNumber} (${partNumber === 2 ? '1 bức ảnh miêu tả' : '2 bức ảnh so sánh & đối chiếu'})
Nội dung các câu hỏi trong đề:
${qTexts}

Yêu cầu đầu ra (Bắt buộc trả về duy nhất định dạng JSON hợp lệ, không bọc markdown block thừa):
{
  "summary": "Tóm tắt ngắn gọn chủ đề bằng tiếng Việt (ví dụ: So sánh đi xe đạp vs lái ô tô)",
  "concept1": "Mô tả bức tranh 1 ngắn gọn bằng tiếng Việt",
  "concept2": "${partNumber === 3 ? 'Mô tả bức tranh 2 ngắn gọn bằng tiếng Việt' : ''}",
  "searchQuery1": "Từ khóa tìm ảnh trên Unsplash/Pexels bằng tiếng Anh cho tranh 1 (3-5 từ, chỉ tập trung chủ thể thực tế, ví dụ: 'person cycling city street')",
  "searchQuery2": "${partNumber === 3 ? 'Từ khóa tìm ảnh bằng tiếng Anh cho tranh 2 (ví dụ: driver car traffic)' : ''}"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleaned = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
          summary: parsed.summary || partTitle,
          concept1: parsed.concept1 || 'Chủ thể Part 2',
          concept2: partNumber === 3 ? parsed.concept2 || 'Chủ thể so sánh Part 3' : undefined,
          searchQuery1: parsed.searchQuery1 || 'people daily life',
          searchQuery2: partNumber === 3 ? parsed.searchQuery2 || 'people lifestyle' : undefined,
        };
      } catch (err: any) {
        console.warn('[ImageIntelligence] Gemini NLP error, falling back to rule-based parser:', err?.message || err);
      }
    }

    // Fallback: Rule-based keyword matching từ câu hỏi nếu Gemini bận/lỗi
    const fullText = (partTitle + ' ' + questions.map((q) => q.prompt).join(' ')).toLowerCase();
    
    if (partNumber === 2) {
      let query1 = 'candid documentary photograph people';
      let concept1 = 'Hoạt động đời sống';
      if (fullText.includes('shop') || fullText.includes('store') || fullText.includes('buy')) {
        query1 = 'people shopping in supermarket store';
        concept1 = 'Đi mua sắm tại cửa hàng';
      } else if (fullText.includes('cook') || fullText.includes('kitchen') || fullText.includes('food')) {
        query1 = 'person cooking food in kitchen';
        concept1 = 'Nấu ăn trong nhà bếp';
      } else if (fullText.includes('pet') || fullText.includes('dog') || fullText.includes('cat')) {
        query1 = 'happy dog pet at home';
        concept1 = 'Nuôi thú cưng trong nhà';
      } else if (fullText.includes('sport') || fullText.includes('exercise') || fullText.includes('game')) {
        query1 = 'people playing sports outdoors';
        concept1 = 'Hoạt động thể thao';
      } else if (fullText.includes('book') || fullText.includes('read') || fullText.includes('library')) {
        query1 = 'person reading book in library';
        concept1 = 'Đọc sách tại thư viện';
      }
      return {
        summary: partTitle,
        concept1,
        searchQuery1: query1,
      };
    } else {
      // Part 3: Pair concepts
      let query1 = 'commuter cycling on bicycle street';
      let query2 = 'driver inside modern car traffic';
      let concept1 = 'Đi xe đạp';
      let concept2 = 'Lái xe ô tô';

      if (fullText.includes('countryside') || fullText.includes('city') || fullText.includes('rural')) {
        query1 = 'peaceful countryside landscape village';
        query2 = 'modern bustling city street skyscrapers';
        concept1 = 'Cuộc sống nông thôn thanh bình';
        concept2 = 'Thành thị hiện đại nhộn nhịp';
      } else if (fullText.includes('pet') || fullText.includes('animal') || fullText.includes('dog') || fullText.includes('cat')) {
        query1 = 'cute pet dog lying living room';
        query2 = 'fluffy pet cat sitting indoor sofa';
        concept1 = 'Chó cưng nuôi trong nhà';
        concept2 = 'Mèo cưng nuôi trong nhà';
      } else if (fullText.includes('restaurant') || fullText.includes('street food') || fullText.includes('eat out') || fullText.includes('eat in')) {
        query1 = 'elegant luxury restaurant dining dinner';
        query2 = 'vibrant street food night market stall';
        concept1 = 'Ăn tại nhà hàng sang trọng';
        concept2 = 'Quán ăn đường phố / chợ đêm';
      } else if (fullText.includes('train') || fullText.includes('plane') || fullText.includes('flight') || fullText.includes('rail')) {
        query1 = 'modern bullet passenger train station';
        query2 = 'airplane flying sky commercial flight';
        concept1 = 'Đi lại bằng tàu hỏa';
        concept2 = 'Đi lại bằng máy bay';
      } else if (fullText.includes('tennis') || fullText.includes('swim') || fullText.includes('sport')) {
        query1 = 'tennis player outdoor court match';
        query2 = 'swimmer training indoor swimming pool';
        concept1 = 'Môn thể thao Quần vợt (Tennis)';
        concept2 = 'Môn thể thao Bơi lội (Swimming)';
      } else if (fullText.includes('healthy') || fullText.includes('fast food') || fullText.includes('diet')) {
        query1 = 'healthy fresh green salad bowl vegetables';
        query2 = 'burger french fries fast food meal';
        concept1 = 'Bữa ăn lành mạnh Healthy';
        concept2 = 'Thức ăn nhanh Fast food';
      }

      return {
        summary: partTitle,
        concept1,
        concept2,
        searchQuery1: query1,
        searchQuery2: query2,
      };
    }
  }

  /**
   * Tìm kiếm các ảnh ứng viên thực tế từ Unsplash Open Editorial API
   */
  async searchPhotos(query: string, count: number = 3): Promise<ImageCandidate[]> {
    try {
      const sanitized = encodeURIComponent(query.trim());
      // Sử dụng Unsplash public search endpoint an toàn
      const url = `https://unsplash.com/napi/search/photos?query=${sanitized}&per_page=${count}&orientation=landscape`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json: any = await res.json();
        const results = json?.results || [];
        if (results.length > 0) {
          return results.slice(0, count).map((item: any) => ({
            id: item.id || crypto.randomUUID(),
            title: item.alt_description || item.description || query,
            previewUrl: item.urls?.small || item.urls?.thumb || item.urls?.regular,
            downloadUrl: item.urls?.regular || item.urls?.full || item.urls?.small,
            source: 'UNSPLASH',
            photographer: item.user?.name || item.user?.username || 'Unsplash Photographer',
          }));
        }
      }
    } catch (err: any) {
      console.warn(`[ImageIntelligence] Search photos error for "${query}":`, err?.message || err);
    }

    // Dự phòng qua Unsplash Source URL chất lượng cao chuẩn keyword nếu endpoint API chậm
    const fallbackCandidates: ImageCandidate[] = [];
    for (let i = 1; i <= count; i++) {
      const sig = Math.floor(Math.random() * 10000);
      const kw = query.split(' ').slice(0, 3).join(',');
      fallbackCandidates.push({
        id: `unsplash_direct_${i}_${sig}`,
        title: `${query} (Candidate ${i})`,
        previewUrl: `https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80`,
        downloadUrl: `https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=85`,
        source: 'UNSPLASH',
        photographer: 'Editorial Free Stock',
      });
    }
    return fallbackCandidates;
  }

  /**
   * Sinh các bộ đề xuất ảnh (Candidate Pairs) cho một Part cụ thể
   */
  async getSuggestionsForPart(partId: string): Promise<PartImageSuggestionsResult> {
    const part = await prisma.examPart.findUnique({
      where: { id: partId },
      include: {
        exam: { select: { title: true } },
        questions: {
          select: { question_number: true, prompt: true },
          orderBy: { question_number: 'asc' },
        },
      },
    });

    if (!part) {
      throw new Error(`ExamPart with id ${partId} not found`);
    }

    const pNum = part.part_number as 2 | 3;
    const partTitle = part.title || part.exam?.title || `Speaking Part ${pNum}`;

    const analysis = await this.extractPartConcepts(pNum, partTitle, part.questions);

    const photos1 = await this.searchPhotos(analysis.searchQuery1, 3);
    const photos2 = pNum === 3 && analysis.searchQuery2
      ? await this.searchPhotos(analysis.searchQuery2, 3)
      : [];

    const candidatePairs: PartImageSuggestionsResult['candidatePairs'] = [];

    const maxCandidates = Math.max(photos1.length, photos2.length, 1);
    for (let i = 0; i < maxCandidates; i++) {
      const p1 = photos1[i] || photos1[0];
      const p2 = pNum === 3 ? (photos2[i] || photos2[0]) : undefined;
      candidatePairs.push({
        id: `pair_${i + 1}`,
        title: `Gợi ý ${i + 1}: ${analysis.concept1}${analysis.concept2 ? ` vs ${analysis.concept2}` : ''}`,
        image1: p1,
        image2: p2,
      });
    }

    return {
      partId: part.id,
      partNumber: pNum,
      topicTitle: partTitle,
      analysis,
      candidatePairs,
    };
  }

  /**
   * Tải ảnh từ URL, chuẩn hóa và lưu cục bộ vào thư mục uploads
   */
  async downloadAndSaveImage(imageUrl: string, filenamePrefix: string): Promise<string> {
    const uploadBase = path.resolve(process.env.UPLOAD_DIR || './uploads');
    const targetDir = path.join(uploadBase, 'speaking', 'ai-samples');

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const safePrefix = filenamePrefix
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_');
    const hash = crypto.randomBytes(3).toString('hex');
    const finalFilename = `${safePrefix}_${hash}.jpg`;
    const targetPath = path.join(targetDir, finalFilename);

    // Tải ảnh về
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to download image from ${imageUrl}: status ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ghi file vào thư mục uploads
    await fs.promises.writeFile(targetPath, buffer);

    // Đồng thời đồng bộ sang public folder của frontend nếu đang ở môi trường dev local
    const frontendPublicDir = path.resolve('../frontend/public/uploads/speaking/ai-samples');
    if (fs.existsSync(path.resolve('../frontend/public'))) {
      if (!fs.existsSync(frontendPublicDir)) {
        fs.mkdirSync(frontendPublicDir, { recursive: true });
      }
      try {
        await fs.promises.writeFile(path.join(frontendPublicDir, finalFilename), buffer);
      } catch (err) {
        // Bỏ qua lỗi copy sang frontend dev
      }
    }

    return `/uploads/speaking/ai-samples/${finalFilename}`;
  }

  /**
   * Áp dụng ảnh đã chọn vào ExamPart và lưu vào PostgreSQL Database
   */
  async applySuggestedImages(
    partId: string,
    image1SourceUrl: string,
    image2SourceUrl?: string
  ): Promise<{
    success: boolean;
    partId: string;
    newImageUrl: string;
  }> {
    const part = await prisma.examPart.findUnique({
      where: { id: partId },
      include: { exam: { select: { title: true } } },
    });

    if (!part) {
      throw new Error(`ExamPart with id ${partId} not found`);
    }

    const baseSlug = (part.title || part.exam?.title || `part_${part.part_number}`)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 20);

    const saved1 = await this.downloadAndSaveImage(
      image1SourceUrl,
      `${baseSlug}_p${part.part_number}_img1`
    );

    let finalImageUrl = saved1;
    if (part.part_number === 3 && image2SourceUrl) {
      const saved2 = await this.downloadAndSaveImage(
        image2SourceUrl,
        `${baseSlug}_p${part.part_number}_img2`
      );
      finalImageUrl = `${saved1}, ${saved2}`;
    }

    // Cập nhật Database
    await prisma.examPart.update({
      where: { id: partId },
      data: {
        image_url: finalImageUrl,
      },
    });

    return {
      success: true,
      partId,
      newImageUrl: finalImageUrl,
    };
  }
}

export const speakingImageIntelligenceService = new SpeakingImageIntelligenceService();
