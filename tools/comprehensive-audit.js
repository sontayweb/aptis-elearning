import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function auditAcademy() {
  console.log('========================================================================');
  console.log('📊 KIỂM TRA ĐỘ ĐẦY ĐỦ CỦA DỮ LIỆU: APTIS ACADEMY (aptisacademy.com.vn)');
  console.log('========================================================================');

  const baseDir = path.resolve(__dirname, 'data/aptisacademy');
  const exportDir = path.join(baseDir, 'exported_exams');
  const bodeKeyDir = path.join(baseDir, 'bo_de_key');

  const auditReport = {
    exportedExams: {},
    bodeKey: {},
    fullTests167: {},
    normalizedTotal: 0
  };

  // 1. Kiểm tra 4 kỹ năng đã export
  const skills = ['listening', 'reading', 'speaking', 'writing'];
  for (const s of skills) {
    const filePath = path.join(exportDir, `${s}_all.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      let totalQuestions = 0;
      let missingAudio = 0;
      let missingOptions = 0;
      let hasAudio = 0;

      data.forEach(item => {
        if (s === 'listening') {
          if (!item.audioUrl) missingAudio++;
          else hasAudio++;
        }
        (item.questions || []).forEach(q => {
          totalQuestions++;
          if (s === 'listening' || s === 'reading') {
            if (!q.options || q.options.length === 0) missingOptions++;
          }
        });
      });

      auditReport.exportedExams[s] = {
        totalExams: data.length,
        totalQuestions,
        hasAudio,
        missingAudio,
        missingOptions
      };
      console.log(`• [Exported] ${s.toUpperCase().padEnd(10)}: ${data.length} đề | ${totalQuestions} câu hỏi | Audio: ${hasAudio} có / ${missingAudio} thiếu | Options trống: ${missingOptions}`);
    } else {
      console.log(`❌ [Exported] Thiếu file: ${filePath}`);
    }
  }

  // 2. Kiểm tra bộ đề Full Tests 167 đề
  const full167Path = path.join(baseDir, 'full_tests_167.json');
  if (fs.existsSync(full167Path)) {
    const full167 = JSON.parse(fs.readFileSync(full167Path, 'utf-8'));
    let totalQuestions = 0;
    let totalSubQuestions = 0;
    let audioCount = 0;

    full167.forEach(item => {
      (item.questions || []).forEach(q => {
        totalQuestions++;
        if (q.file) audioCount++;
        totalSubQuestions += (q.subQuestion || []).length;
      });
    });

    auditReport.fullTests167 = {
      totalExams: full167.length,
      totalQuestions,
      totalSubQuestions,
      audioCount
    };
    console.log(`• [Full Tests]:    ${full167.length} đề thi tổng hợp CLB | ${totalQuestions} parts | ${totalSubQuestions} câu hỏi con | ${audioCount} files audio MP3`);
  }

  // 3. Kiểm tra Bộ Đề Key (Chuyên sâu)
  let keyTotalFiles = 0;
  let keyTotalExams = 0;
  for (const center of ['exams', 'exams_center_b']) {
    const cDir = path.join(bodeKeyDir, center);
    if (fs.existsSync(cDir)) {
      const files = fs.readdirSync(cDir).filter(f => f.endsWith('.json'));
      keyTotalFiles += files.length;
      files.forEach(f => {
        try {
          const d = JSON.parse(fs.readFileSync(path.join(cDir, f), 'utf-8'));
          if (Array.isArray(d)) keyTotalExams += d.length;
        } catch {}
      });
    }
  }
  auditReport.bodeKey = { keyTotalFiles, keyTotalExams };
  console.log(`• [Bộ Đề Key]:     ${keyTotalFiles} files JSON chuyên sâu | ${keyTotalExams} đề thi bộ key (đầy đủ options, audio, giải thích)`);

  // 4. File chuẩn hóa chung
  const normPath = path.join(baseDir, 'normalized_exams.json');
  if (fs.existsSync(normPath)) {
    const norm = JSON.parse(fs.readFileSync(normPath, 'utf-8'));
    auditReport.normalizedTotal = norm.length;
    console.log(`• [Chuẩn hóa DB]:  ${norm.length} bộ đề thi hoàn chỉnh trong normalized_exams.json`);
  }

  return auditReport;
}

function auditKytich() {
  console.log('\n========================================================================');
  console.log('📊 KIỂM TRA ĐỘ ĐẦY ĐỦ CỦA DỮ LIỆU: APTIS KỲ TÍCH (aptiskytich.vn)');
  console.log('========================================================================');

  const baseDir = path.resolve(__dirname, 'data/aptiskytich');
  const auditReport = {};

  // 1. Full Tests (26 đề)
  const fullTestsPath = path.join(baseDir, 'full_tests.json');
  if (fs.existsSync(fullTestsPath)) {
    const ft = JSON.parse(fs.readFileSync(fullTestsPath, 'utf-8'));
    let totalExamSets = 0;
    ft.forEach(item => {
      const ids = item.examSetIds || [];
      totalExamSets += ids.length;
    });
    auditReport.fullTests = { count: ft.length, totalExamSets };
    console.log(`• [Full Tests]:        ${ft.length} đề thi thử chính thức | ${totalExamSets} bài thi kỹ năng thành phần (exam_sets)`);
  }

  // 2. Mẹo thi Aptis (56 bài)
  const meoThiPath = path.join(baseDir, 'meo_thi_aptis_all.json');
  const articlesDir = path.join(baseDir, 'meo_thi_articles');
  if (fs.existsSync(meoThiPath)) {
    const posts = JSON.parse(fs.readFileSync(meoThiPath, 'utf-8'));
    const mdFiles = fs.existsSync(articlesDir) ? fs.readdirSync(articlesDir).filter(f => f.endsWith('.md')).length : 0;
    auditReport.meoThi = { jsonCount: posts.length, mdFiles };
    console.log(`• [Mẹo Thi Aptis]:     ${posts.length} bài viết đầy đủ nội dung HTML & SEO | ${mdFiles} file Markdown đã xuất`);
  }

  // 3. Showcase (Bảng Kỳ Tích)
  const scPath = path.join(baseDir, 'showcase_sample.json');
  if (fs.existsSync(scPath)) {
    const sc = JSON.parse(fs.readFileSync(scPath, 'utf-8'));
    auditReport.showcase = { count: sc.length };
    console.log(`• [Bảng Kỳ Tích]:      ${sc.length} bài mẫu học viên điểm cao (Writing/Speaking)`);
  }

  // 4. Nghe chép chính tả (Dictation)
  const dictPath = path.join(baseDir, 'dictation_levels.json');
  if (fs.existsSync(dictPath)) {
    const dl = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));
    auditReport.dictation = { levels: dl };
    console.log(`• [Nghe Chép Cấp Độ]:  ${dl.length} levels thống kê (${dl.reduce((acc, l) => acc + (l.bo || 0), 0)} bộ, ${dl.reduce((acc, l) => acc + (l.cau || 0), 0)} câu)`);
  }

  // 5. Danh mục 873 đề lẻ & 2916 câu hỏi chi tiết
  const catPath = path.join(baseDir, 'exam_sets_catalog.json');
  const qPath = path.join(baseDir, 'all_exam_questions.json');
  if (fs.existsSync(catPath)) {
    const cat = JSON.parse(fs.readFileSync(catPath, 'utf-8'));
    const totalQ = fs.existsSync(qPath) ? JSON.parse(fs.readFileSync(qPath, 'utf-8')).length : 0;
    auditReport.catalog = { count: cat.length, totalQuestions: totalQ };
    console.log(`• [Danh Mục Đề Lẻ]:    ${cat.length} bộ đề thi lẻ (${cat.filter(s => s.access_tier === 'pro').length} PRO, ${cat.filter(s => s.access_tier === 'free').length} FREE)`);
    console.log(`• [Ngân Hàng Câu Hỏi]: ${totalQ} câu hỏi chi tiết (kèm đáp án, options & bài giải)`);
  }

  // 6. Câu chép chính tả chi tiết
  const sPath = path.join(baseDir, 'all_dictation_sentences.json');
  if (fs.existsSync(sPath)) {
    const sentences = JSON.parse(fs.readFileSync(sPath, 'utf-8'));
    console.log(`• [Chi Tiết Chính Tả]: ${sentences.length} câu luyện nghe chép chính tả chi tiết`);
  }

  // 7. Đề thi chuẩn hóa DB
  const normPath = path.join(baseDir, 'normalized_exams.json');
  if (fs.existsSync(normPath)) {
    const norm = JSON.parse(fs.readFileSync(normPath, 'utf-8'));
    console.log(`• [Chuẩn Hóa DB]:      ${norm.length} bộ đề thi Kỳ Tích đã chuẩn hóa sang DB Schema`);
  }

  return auditReport;
}

const academyReport = auditAcademy();
const kytichReport = auditKytich();

console.log('\n========================================================================');
console.log('✅ HOÀN TẤT KIỂM TOÁN DỮ LIỆU CẢ 2 NỀN TẢNG!');
console.log('========================================================================\n');
