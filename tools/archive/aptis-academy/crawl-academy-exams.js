import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function getBrowser() {
  // Thử kết nối port 9223 trước (port riêng của Academy)
  try {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9223' });
    console.log('⚡ Đã kết nối vào Chrome Academy (Port 9223)!');
    return browser;
  } catch {}

  // Thử kết nối port 9222
  try {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    console.log('⚡ Đã kết nối vào Chrome (Port 9222)!');
    return browser;
  } catch {}

  throw new Error('Chưa mở Chrome! Hãy nhấp đúp vào open-academy-chrome.bat để mở trình duyệt trước.');
}

async function crawlCurrentExam() {
  console.log('=====================================================');
  console.log('🎯 BẮT ĐẦU CÀO ĐỀ THI TỪ APTIS ACADEMY');
  console.log('=====================================================\n');

  const browser = await getBrowser();
  const pages = await browser.pages();

  if (pages.length === 0) {
    console.log('❌ Không tìm thấy tab nào trong Chrome.');
    return;
  }

  // Lấy tab active cuối cùng
  const page = pages[pages.length - 1];
  const currentUrl = page.url();
  console.log(`📄 Đang cào dữ liệu từ trang: ${currentUrl}`);

  // Bóc tách toàn diện dữ liệu bài thi
  const examData = await page.evaluate(() => {
    const title =
      document.querySelector('h1, h2, .exam-title, .test-title, .header-title')?.textContent?.trim() ||
      document.title ||
      'Aptis Academy Exam';

    // 1. Quét toàn bộ link audio MP3
    const audios = [];
    document.querySelectorAll('audio, source, [data-audio]').forEach(el => {
      const src = el.src || el.getAttribute('src') || el.getAttribute('data-audio');
      if (src && !audios.includes(src)) audios.push(src);
    });

    // 2. Quét bài đọc / Passage
    const passages = [];
    document.querySelectorAll('.passage, .reading-text, .reading-content, article, [data-passage]').forEach(p => {
      const txt = p.innerText?.trim();
      if (txt && txt.length > 30 && !passages.includes(txt)) passages.push(txt);
    });

    // 3. Quét câu hỏi & lựa chọn
    const questions = [];
    const qElements = document.querySelectorAll(
      '.question-item, .question-card, .quiz-question, .question, [data-question], .exam-question, tr, .test-item'
    );

    qElements.forEach((qEl, idx) => {
      const prompt =
        qEl.querySelector('.question-text, .prompt, .title, p, h4, .text')?.textContent?.trim() ||
        `Câu hỏi ${idx + 1}`;

      const options = [];
      qEl.querySelectorAll('input[type="radio"], input[type="checkbox"], .option, .answer, label').forEach(opt => {
        const optText = opt.textContent?.trim();
        if (optText && !options.includes(optText) && optText.length > 0 && optText.length < 200) {
          options.push(optText);
        }
      });

      if (prompt && prompt.length > 3) {
        questions.push({
          question_number: idx + 1,
          prompt,
          options,
          correct_answer: null
        });
      }
    });

    return {
      title,
      url: window.location.href,
      crawledAt: new Date().toISOString(),
      audios,
      passages,
      questions
    };
  });

  console.log(`\n🎉 KẾT QUẢ CÀO:`);
  console.log(`- Tiêu đề đề thi: "${examData.title}"`);
  console.log(`- Số lượng file âm thanh Audio: ${examData.audios.length}`);
  console.log(`- Số lượng đoạn văn (Passage): ${examData.passages.length}`);
  console.log(`- Số lượng câu hỏi: ${examData.questions.length}`);

  // Lưu ra file JSON
  const outDir = path.resolve(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  const cleanName = examData.title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]+/g, '_').substring(0, 50);
  const outPath = path.join(outDir, `academy_${cleanName}_${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(examData, null, 2), 'utf-8');

  console.log(`\n💾 ĐÃ LƯU FILE DỮ LIỆU ĐỀ THI TẠI:`);
  console.log(outPath);
}

crawlCurrentExam().catch(err => {
  console.error('Lỗi khi cào đề thi:', err.message);
});
