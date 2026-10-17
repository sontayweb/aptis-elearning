import { examService } from '../src/modules/exams/exam.service';

async function main() {
  const apiData = await examService.getExamQuestions('f41d0420-e7ff-4b12-841e-b4d2e54097c9');
  console.log('API Data parts length:', apiData?.parts?.length);
  const p = apiData?.parts?.[0];
  console.log('Part title:', p?.title);
  console.log('Part partType:', (p as any)?.partType);
  console.log('Part questions count:', p?.questions?.length);
  console.log('Questions options:', p?.questions?.[0]?.options);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
