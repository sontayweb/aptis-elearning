import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeExam } from '../../core/schema.js';
import { upsertExam } from '../../core/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function safeFetch(url, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...(options.headers || {})
        }
      });
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

export async function crawl({ prisma = null, saveDb = false } = {}) {
  console.log('=====================================================');
  console.log('🌐 BẮT ĐẦU ĐỒNG BỘ: APTIS KỲ TÍCH (aptiskytich.vn) [BẢN PRO]');
  console.log('=====================================================\n');

  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));
  const supabaseUrl = config.supabaseUrl;
  const anonKey = config.anonKey;

  // 1. Đọc token PRO đã lưu
  const tokenFiles = [
    path.resolve(__dirname, '../../auth_token.json'),
    path.resolve(__dirname, '../../data/aptiskytich/session.json')
  ];

  let token = anonKey;
  let userEmail = null;

  for (const tf of tokenFiles) {
    if (fs.existsSync(tf)) {
      try {
        const tData = JSON.parse(fs.readFileSync(tf, 'utf-8'));
        if (tData.accessToken) {
          token = tData.accessToken;
          userEmail = tData.user?.email || 'sontayweb.admin@gmail.com';
          console.log(`🔑 Đã nạp User Access Token PRO của tài khoản: ${userEmail}`);
          break;
        }
      } catch {}
    }
  }

  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const outputDir = path.resolve(__dirname, '../../data/aptiskytich');
  const articlesDir = path.join(outputDir, 'meo_thi_articles');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(articlesDir, { recursive: true });

  const summary = {
    source: 'aptiskytich',
    userEmail,
    fullTestsCount: 0,
    examSetsCount: 0,
    proExamSetsCount: 0,
    freeExamSetsCount: 0,
    totalQuestionsCount: 0,
    dictationSetsCount: 0,
    dictationSentencesCount: 0,
    showcaseCount: 0,
    tipsCount: 0,
    totalNormalizedExams: 0,
    crawledAt: new Date().toISOString()
  };

  // -------------------------------------------------------------
  // 1. ĐỒNG BỘ 26 ĐỀ THI THỬ (FULL TESTS)
  // -------------------------------------------------------------
  console.log('⏳ [1/6] Đang đồng bộ 26 đề Thi Thử (Full Tests)...');
  let fullTests = [];
  try {
    const res = await safeFetch(`${supabaseUrl}/rest/v1/rpc/get_full_tests`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_category: 'aptis' })
    });
    if (res.ok) {
      fullTests = await res.json();
      summary.fullTestsCount = fullTests.length;
      fs.writeFileSync(path.join(outputDir, 'full_tests.json'), JSON.stringify(fullTests, null, 2));
      console.log(`✅ Lấy thành công ${fullTests.length} đề thi thử chính thức!`);
    }
  } catch (e) {
    console.warn('Lỗi lấy Full Tests online, thử dùng cache:', e.message);
  }

  if (!fullTests || fullTests.length === 0) {
    const cachedFt = path.join(outputDir, 'full_tests.json');
    if (fs.existsSync(cachedFt)) {
      try {
        fullTests = JSON.parse(fs.readFileSync(cachedFt, 'utf-8'));
        summary.fullTestsCount = fullTests.length;
        console.log(`📁 Sử dụng cache ${fullTests.length} đề thi thử.`);
      } catch {}
    }
  }

  // -------------------------------------------------------------
  // 2. ĐỒNG BỘ TOÀN BỘ 873 BỘ ĐỀ THI LẺ (EXAM SETS - PRO & FREE)
  // -------------------------------------------------------------
  console.log('\n⏳ [2/6] Đang tải danh mục 873 bộ đề thi lẻ (exam_sets)...');
  let examSets = [];
  try {
    const setsRes = await safeFetch(`${supabaseUrl}/rest/v1/exam_sets?select=*&order=created_at.asc`, { headers });
    if (setsRes.ok) {
      examSets = await setsRes.json();
      summary.examSetsCount = examSets.length;
      summary.proExamSetsCount = examSets.filter(s => s.access_tier === 'pro').length;
      summary.freeExamSetsCount = examSets.filter(s => s.access_tier === 'free').length;
      fs.writeFileSync(path.join(outputDir, 'exam_sets_catalog.json'), JSON.stringify(examSets, null, 2));
      console.log(`✅ Tải thành công danh mục ${examSets.length} bộ đề (Trong đó: ${summary.proExamSetsCount} PRO, ${summary.freeExamSetsCount} FREE)!`);
    }
  } catch (e) {
    console.warn('Lỗi tải exam_sets online, thử dùng cache:', e.message);
  }

  if (!examSets || examSets.length === 0) {
    const cachedSets = path.join(outputDir, 'exam_sets_catalog.json');
    if (fs.existsSync(cachedSets)) {
      try {
        examSets = JSON.parse(fs.readFileSync(cachedSets, 'utf-8'));
        summary.examSetsCount = examSets.length;
        summary.proExamSetsCount = examSets.filter(s => s.access_tier === 'pro').length;
        summary.freeExamSetsCount = examSets.filter(s => s.access_tier === 'free').length;
        console.log(`📁 Sử dụng cache danh mục ${examSets.length} bộ đề lẻ (${summary.proExamSetsCount} PRO, ${summary.freeExamSetsCount} FREE).`);
      } catch {}
    }
  }

  // -------------------------------------------------------------
  // 3. ĐỒNG BỘ TOÀN BỘ CÂU HỎI & GIẢI THÍCH (EXAM QUESTIONS - PRO)
  // -------------------------------------------------------------
  console.log('\n⏳ [3/6] Đang cào toàn bộ ngân hàng câu hỏi, options, đáp án & giải thích (exam_questions)...');
  const allQuestions = [];
  const batchSize = 40;
  for (let i = 0; i < examSets.length; i += batchSize) {
    const batch = examSets.slice(i, i + batchSize);
    const ids = batch.map(s => s.id);
    try {
      const res = await safeFetch(`${supabaseUrl}/rest/v1/exam_questions?exam_set_id=in.(${ids.join(',')})&select=*&order=order_index.asc`, { headers });
      if (res.ok) {
        const qList = await res.json();
        allQuestions.push(...qList);
        process.stdout.write(`   └─ Tiến độ: ${Math.min(i + batchSize, examSets.length)}/${examSets.length} đề (${allQuestions.length} câu hỏi)\r`);
      }
    } catch {}
  }

  if (allQuestions.length > 0) {
    summary.totalQuestionsCount = allQuestions.length;
    fs.writeFileSync(path.join(outputDir, 'all_exam_questions.json'), JSON.stringify(allQuestions, null, 2));
    console.log(`\n✅ Thu thập thành công ${allQuestions.length} câu hỏi chi tiết từ bản PRO!`);
  } else {
    const cachedQ = path.join(outputDir, 'all_exam_questions.json');
    if (fs.existsSync(cachedQ)) {
      try {
        const c = JSON.parse(fs.readFileSync(cachedQ, 'utf-8'));
        if (c.length > 0) {
          allQuestions.push(...c);
          summary.totalQuestionsCount = allQuestions.length;
          console.log(`\n📁 Sử dụng cache ${allQuestions.length} câu hỏi chi tiết.`);
        }
      } catch {}
    }
  }

  // Map câu hỏi theo exam_set_id
  const questionsBySet = new Map();
  allQuestions.forEach(q => {
    if (!questionsBySet.has(q.exam_set_id)) {
      questionsBySet.set(q.exam_set_id, []);
    }
    questionsBySet.get(q.exam_set_id).push(q);
  });

  // -------------------------------------------------------------
  // 4. CHUẨN HÓA DỮ LIỆU ĐỀ THI SANG SCHEMA DB (NORMALIZED EXAMS)
  // -------------------------------------------------------------
  console.log('\n⏳ [4/6] Đang chuẩn hóa đề thi theo Schema chung của hệ thống...');
  const normalizedExams = [];

  // Chuẩn hóa 873 exam sets lẻ
  for (const set of examSets) {
    const setQuestions = questionsBySet.get(set.id) || [];
    normalizedExams.push(normalizeExam({
      source: 'APTIS_KYTICH',
      externalId: set.id,
      title: set.title || `Bộ đề Kỳ Tích - ${set.part || set.skill}`,
      skill: set.skill ? set.skill.toUpperCase() : 'FULL_TEST',
      durationMinutes: set.time_limit || 30,
      isPro: set.access_tier === 'pro',
      description: set.description || '',
      parts: [{
        part_number: 1,
        title: set.part || `Part 1`,
        instructions: set.description || null,
        audio_url: setQuestions[0]?.audio_url || null,
        image_url: setQuestions[0]?.image_url || null,
        questions: setQuestions.map((q, qIdx) => ({
          question_number: q.order_index ?? (qIdx + 1),
          question_type: q.question_type || 'MULTIPLE_CHOICE',
          prompt: q.question_text || `Câu hỏi ${qIdx + 1}`,
          options: Array.isArray(q.options) ? q.options : [],
          correct_answer: q.correct_answer !== null && q.correct_answer !== undefined ? String(q.correct_answer) : null,
          explanation: q.explanation || null,
          max_score: 1.0
        }))
      }]
    }));
  }

  summary.totalNormalizedExams = normalizedExams.length;
  fs.writeFileSync(path.join(outputDir, 'normalized_exams.json'), JSON.stringify(normalizedExams, null, 2));
  console.log(`✅ Đã chuẩn hóa ${normalizedExams.length} bộ đề thi Kỳ Tích vào normalized_exams.json!`);

  // -------------------------------------------------------------
  // 5. ĐỒNG BỘ NGHE CHÉP CHÍNH TẢ (DICTATION SETS & SENTENCES)
  // -------------------------------------------------------------
  console.log('\n⏳ [5/6] Đang cào toàn bộ kho Nghe chép chính tả (Dictation)...');
  let dictationSets = [];
  const allSentences = [];
  try {
    const dRes = await safeFetch(`${supabaseUrl}/rest/v1/dictation_sets?select=*&order=level.asc,sort.asc`, { headers });
    if (dRes.ok) {
      dictationSets = await dRes.json();
      summary.dictationSetsCount = dictationSets.length;
      fs.writeFileSync(path.join(outputDir, 'dictation_sets.json'), JSON.stringify(dictationSets, null, 2));

      // Lấy toàn bộ câu chép chính tả
      const dBatch = 50;
      for (let i = 0; i < dictationSets.length; i += dBatch) {
        const batch = dictationSets.slice(i, i + dBatch);
        const ids = batch.map(s => s.id);
        const sRes = await safeFetch(`${supabaseUrl}/rest/v1/dictation_sentences?set_id=in.(${ids.join(',')})&select=*&order=sort.asc`, { headers });
        if (sRes.ok) {
          const sList = await sRes.json();
          allSentences.push(...sList);
        }
      }
      if (allSentences.length > 0) {
        summary.dictationSentencesCount = allSentences.length;
        fs.writeFileSync(path.join(outputDir, 'all_dictation_sentences.json'), JSON.stringify(allSentences, null, 2));
        console.log(`✅ Tải thành công ${dictationSets.length} bộ nghe chép & ${allSentences.length} câu chính tả!`);
      }
    }
  } catch (e) {
    console.warn('Lỗi tải Dictation:', e.message);
  }

  // -------------------------------------------------------------
  // 6. ĐỒNG BỘ SHOWCASE & 56 MẸO THI APTIS
  // -------------------------------------------------------------
  console.log('\n⏳ [6/6] Đang đồng bộ Bảng Kỳ Tích & 56 bài viết Mẹo Thi...');
  try {
    const allShowcases = [];
    for (let offset = 0; offset <= 400; offset += 100) {
      const scRes = await safeFetch(`${supabaseUrl}/rest/v1/rpc/get_showcase_board`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_skill: null, p_limit: 100, p_offset: offset })
      });
      if (scRes.ok) {
        const batch = await scRes.json();
        if (Array.isArray(batch) && batch.length > 0) allShowcases.push(...batch);
        else break;
      } else break;
    }
    summary.showcaseCount = allShowcases.length;
    fs.writeFileSync(path.join(outputDir, 'showcase_sample.json'), JSON.stringify(allShowcases, null, 2));

    // Blog Mẹo Thi
    const postsRes = await safeFetch(`${supabaseUrl}/rest/v1/blog_posts?status=eq.published&order=published_at.desc`, { headers });
    if (postsRes.ok) {
      const posts = await postsRes.json();
      summary.tipsCount = posts.length;
      fs.writeFileSync(path.join(outputDir, 'meo_thi_aptis_all.json'), JSON.stringify(posts, null, 2));
      for (const p of posts) {
        const md = `---\ntitle: "${p.title}"\nslug: "${p.slug}"\ncategory: "${p.category}"\npublished_at: "${p.published_at}"\n---\n\n${p.content || ''}`;
        fs.writeFileSync(path.join(articlesDir, `${p.slug}.md`), md, 'utf-8');
      }
    }
    console.log(`✅ Lấy thành công ${summary.showcaseCount} bài mẫu Band C & ${summary.tipsCount} bài viết Mẹo Thi!`);
  } catch (e) {
    console.warn('Lỗi lấy Showcase/Mẹo thi:', e.message);
  }

  fs.writeFileSync(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2));

  console.log('\n=====================================================');
  console.log('🎉 HOÀN THÀNH TOÀN DIỆN ĐỒNG BỘ APTIS KỲ TÍCH (BẢN PRO)!');
  console.log(`- Tài khoản PRO xác thực: ${userEmail}`);
  console.log(`- Đề Full Tests chính thức: ${summary.fullTestsCount} đề`);
  console.log(`- Danh mục đề thi lẻ:      ${summary.examSetsCount} bộ (${summary.proExamSetsCount} PRO, ${summary.freeExamSetsCount} FREE)`);
  console.log(`- Ngân hàng câu hỏi:       ${summary.totalQuestionsCount} câu (kèm đáp án & phân tích)`);
  console.log(`- Nghe chép chính tả:      ${summary.dictationSetsCount} bộ (${summary.dictationSentencesCount} câu)`);
  console.log(`- Bài mẫu học viên Band C: ${summary.showcaseCount} bài`);
  console.log(`- Mẹo thi Aptis:           ${summary.tipsCount} bài viết HTML/Markdown`);
  console.log(`👉 TỔNG SỐ ĐỀ CHUẨN HÓA:    ${summary.totalNormalizedExams} BỘ ĐỀ THI`);
  console.log(`💾 Thư mục dữ liệu: ${outputDir}/`);
  console.log('=====================================================\n');

  // Nạp vào PostgreSQL nếu yêu cầu
  if (saveDb && prisma && normalizedExams.length > 0) {
    console.log('\n🚀 Đang nạp đề Aptis Kỳ Tích vào PostgreSQL qua Prisma...');
    let inserted = 0;
    let updated = 0;
    for (const ex of normalizedExams) {
      const res = await upsertExam(prisma, ex);
      if (res?.status === 'CREATED') inserted++;
      if (res?.status === 'UPDATED') updated++;
    }
    console.log(`✅ Hoàn tất nạp DB: Thêm mới ${inserted} đề, Cập nhật ${updated} đề.`);
  }

  return summary;
}

// Chạy trực tiếp nếu gọi từ dòng lệnh
if (process.argv[1] && process.argv[1].endsWith('crawler.js')) {
  crawl().catch(console.error);
}
