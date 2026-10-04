import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('Không tìm thấy trình duyệt');
}

async function getBrowser() {
  // Thử kết nối tới Chrome đang chạy qua cổng debug 9222
  try {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    console.log('⚡ Đã kết nối trực tiếp vào cửa sổ Chrome đang mở!');
    return { browser, isConnected: true };
  } catch {
    // Nếu chưa mở, khởi động Chrome mới với profile
    const profileDir = path.resolve(__dirname, '../.chrome_profile_aptis');
    console.log('🚀 Khởi động Chrome với profile đã lưu...');
    const browser = await puppeteer.launch({
      executablePath: getExecutablePath(),
      headless: false,
      userDataDir: profileDir,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--remote-debugging-port=9222']
    });
    return { browser, isConnected: false };
  }
}

async function extractCurrentExam() {
  const { browser, isConnected } = await getBrowser();
  const pages = await browser.pages();

  if (pages.length === 0) {
    console.log('❌ Không tìm thấy tab nào trong Chrome.');
    return;
  }

  // Lấy tab hiện tại (tab active hoặc tab cuối cùng)
  const targetUrl = process.argv[2];
  let page = pages[pages.length - 1];

  if (targetUrl) {
    console.log(`🌐 Đang mở URL chỉ định: ${targetUrl}`);
    page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  }

  const currentUrl = page.url();
  console.log(`\n📄 Đang quét dữ liệu từ trang: ${currentUrl}`);

  // Trích xuất toàn diện DOM & cấu trúc bài thi
  const examData = await page.evaluate(() => {
    const title =
      document.querySelector('h1, h2, .exam-title, .test-title, .title')?.textContent?.trim() ||
      document.title ||
      'Aptis Exam Backup';

    // 1. Thu thập tất cả các file Audio có trên trang
    const audioUrls = [];
    document.querySelectorAll('audio, source').forEach((el) => {
      const src = el.src || el.getAttribute('src');
      if (src && !audioUrls.includes(src)) audioUrls.push(src);
    });

    // 2. Thu thập bài đọc / đoạn văn (Passages)
    const passages = [];
    document.querySelectorAll('.passage, .reading-text, .text-content, article, .part-content').forEach((p) => {
      const text = p.innerText?.trim();
      if (text && text.length > 30) passages.push(text);
    });

    // 3. Thu thập câu hỏi và lựa chọn đáp án
    const questions = [];
    const qElements = document.querySelectorAll(
      '.question-item, .question-card, .quiz-question, .question, [data-question-id], .exam-question'
    );

    if (qElements.length > 0) {
      qElements.forEach((qEl, idx) => {
        const qText =
          qEl.querySelector('.question-text, .prompt, .title, p, h4')?.textContent?.trim() ||
          `Câu hỏi ${idx + 1}`;

        const options = [];
        qEl.querySelectorAll('input[type="radio"], input[type="checkbox"], .option, .answer-choice, label').forEach((opt) => {
          const optText = opt.textContent?.trim();
          if (optText && !options.includes(optText)) options.push(optText);
        });

        // Tìm đáp án đúng nếu có hiển thị trên DOM (chế độ review / key)
        const correctAnswer =
          qEl.querySelector('.correct, .is-correct, [data-correct="true"]')?.textContent?.trim() || null;

        questions.push({
          question_number: idx + 1,
          question_type: 'MULTIPLE_CHOICE',
          prompt: qText,
          options: options.length > 0 ? options : undefined,
          correct_answer: correctAnswer
        });
      });
    }

    return {
      title,
      url: window.location.href,
      extractedAt: new Date().toISOString(),
      audios: audioUrls,
      passages,
      questionsCount: questions.length,
      questions,
      fullHtml: document.documentElement.outerHTML
    };
  });

  // Lưu file backup JSON và HTML
  const outJsonDir = path.resolve(__dirname, '../crawler/output/json');
  const outHtmlDir = path.resolve(__dirname, '../crawler/output/raw_html');
  fs.mkdirSync(outJsonDir, { recursive: true });
  fs.mkdirSync(outHtmlDir, { recursive: true });

  const safeName = examData.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 50);

  const timestamp = Date.now();
  const jsonPath = path.join(outJsonDir, `backup_${safeName}_${timestamp}.json`);
  const htmlPath = path.join(outHtmlDir, `backup_${safeName}_${timestamp}.html`);

  // Lưu HTML thô để không bao giờ bị mất bất kỳ chi tiết nào
  fs.writeFileSync(htmlPath, examData.fullHtml, 'utf-8');

  // Lưu JSON cấu trúc
  const structuredOutput = {
    title: examData.title,
    source_url: examData.url,
    extracted_at: examData.extractedAt,
    audio_files: examData.audios,
    passages: examData.passages,
    questions: examData.questions,
    html_backup_path: htmlPath
  };

  fs.writeFileSync(jsonPath, JSON.stringify(structuredOutput, null, 2), 'utf-8');

  console.log('\n======================================================');
  console.log(`🎉 ĐÃ QUÉT VÀ BACKUP THÀNH CÔNG!`);
  console.log(`- Tiêu đề: ${examData.title}`);
  console.log(`- Số câu hỏi tìm thấy: ${examData.questionsCount}`);
  console.log(`- Số file audio tìm thấy: ${examData.audios.length}`);
  console.log(`- Số đoạn văn tìm thấy: ${examData.passages.length}`);
  console.log(`📁 File JSON cấu trúc: ${jsonPath}`);
  console.log(`📁 File HTML gốc: ${htmlPath}`);
  console.log('======================================================\n');

  if (!isConnected) {
    await browser.close();
  }
}

extractCurrentExam().catch(console.error);
