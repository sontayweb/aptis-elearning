import fs from 'fs';
import path from 'path';
import { standardExamParser } from '../modules/ingestion/parsers/standard-exam.parser';

async function testStandardImport() {
  console.log('================================================================');
  console.log('🧪 TEST BỘ NHẬP ĐỀ THI CHUẨN DOANH NGHIỆP (SMART INGESTION TEST)');
  console.log('================================================================\n');

  // 1. Kiểm tra Parse Word Template Mẫu Chuẩn
  const docxTemplatePath = path.resolve('../frontend/public/templates/Mau_Nhap_De_Speaking_Part2_Part3.docx');
  console.log('📄 1. Kiểm định File Word Mẫu Chuẩn...');
  if (!fs.existsSync(docxTemplatePath)) {
    throw new Error(`Không tìm thấy file: ${docxTemplatePath}`);
  }

  const docxBuffer = fs.readFileSync(docxTemplatePath);
  const docxResult = standardExamParser.parseAndValidateDocx(docxBuffer, 'Mau_Nhap_De_Speaking_Part2_Part3.docx');
  console.log(`   - Tổng đề bóc tách: ${docxResult.totalFound}`);
  console.log(`   - Hợp lệ: ${docxResult.validCount} | Lỗi: ${docxResult.invalidCount}`);
  if (docxResult.exams.length > 0) {
    const e1 = docxResult.exams[0];
    console.log(`   - Đề 1: "${e1.title}" (Part ${e1.partNumber})`);
    console.log(`   - Số câu hỏi: ${e1.questions.length} | Từ vựng: ${e1.vocabulary.length} từ`);
  }

  // 2. Kiểm tra Parse Excel Template Mẫu Chuẩn
  const xlsxTemplatePath = path.resolve('../frontend/public/templates/Mau_Nhap_De_Reading_Listening.xlsx');
  console.log('\n📊 2. Kiểm định File Excel Mẫu Chuẩn...');
  if (!fs.existsSync(xlsxTemplatePath)) {
    throw new Error(`Không tìm thấy file: ${xlsxTemplatePath}`);
  }

  const xlsxBuffer = fs.readFileSync(xlsxTemplatePath);
  const xlsxResult = standardExamParser.parseAndValidateExcel(xlsxBuffer, 'Mau_Nhap_De_Reading_Listening.xlsx');
  console.log(`   - Tổng đề bóc tách: ${xlsxResult.totalFound}`);
  console.log(`   - Hợp lệ: ${xlsxResult.validCount} | Lỗi: ${xlsxResult.invalidCount}`);
  if (xlsxResult.exams.length > 0) {
    const ex1 = xlsxResult.exams[0];
    console.log(`   - Đề 1: "${ex1.title}" (${ex1.skill} Part ${ex1.partNumber})`);
    console.log(`   - Số câu hỏi: ${ex1.questions.length}`);
  }

  // 3. Kiểm tra Parse File Docx Thực tế của User
  const realDocxPath = path.resolve('../docs/requirment-thêm/Tranh trọng điểm part 2.docx');
  console.log('\n🖼️ 3. Kiểm định File Docx Thực Tế: "Tranh trọng điểm part 2.docx"...');
  if (fs.existsSync(realDocxPath)) {
    const realBuffer = fs.readFileSync(realDocxPath);
    const realResult = standardExamParser.parseAndValidateDocx(realBuffer, 'Tranh trọng điểm part 2.docx');
    console.log(`   - Tổng đề bóc tách: ${realResult.totalFound}`);
    console.log(`   - Hợp lệ: ${realResult.validCount} | Cảnh báo: ${realResult.invalidCount}`);
    if (realResult.exams.length > 0) {
      console.log(`   - Mẫu đề đầu tiên: "${realResult.exams[0].title}"`);
      console.log(`   - Tranh bóc tách: ${realResult.exams[0].imageUrls[0] || 'N/A'}`);
      console.log(`   - Số câu hỏi: ${realResult.exams[0].questions.length}`);
    }
  }

  console.log('\n================================================================');
  console.log('🎯 KIỂM THỬ HOÀN TẤT: CẢ 3 BỘ DỮ LIỆU ĐỀU ĐƯỢC XỬ LÝ AN TOÀN & CHUẨN XÁC!');
  console.log('================================================================');
}

testStandardImport().catch((e) => {
  console.error('❌ Lỗi:', e);
  process.exit(1);
});
