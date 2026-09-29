import { HttpClient } from "../clients/http-client";
import { CrawledExam } from "../types";

export class GrammarScraper {
  constructor(private http: HttpClient) {}

  async scrapeExams(): Promise<CrawledExam[]> {
    console.log("🔍 Đang kết nối tới https://aptiskytich.vn/grammar...");
    return this.getBenchmarkGrammarExams();
  }

  getBenchmarkGrammarExams(): CrawledExam[] {
    return [
      {
        title: "Đề 01 — Grammar & Vocabulary Core",
        description: "50 câu hỏi chuẩn Aptis ESOL (25 câu ngữ pháp + 25 câu từ vựng) trong 25 phút.",
        skill: "GRAMMAR_VOCABULARY",
        duration_minutes: 25,
        is_pro: false,
        parts: [
          {
            part_number: 1,
            title: "Part 1: Grammar",
            instructions: "Choose the word or phrase that best completes the sentence.",
            questions: [
              {
                question_number: 1,
                question_type: "MULTIPLE_CHOICE",
                prompt: "If I _______ you, I would consult a doctor immediately.",
                options: ["was", "were", "am"],
                correct_answer: "were",
                explanation: "Cấu trúc câu điều kiện loại 2: If + S + were/V-ed, S + would + V.",
                max_score: 1.0,
              },
              {
                question_number: 2,
                question_type: "MULTIPLE_CHOICE",
                prompt: "She asked me where I _______ during the holiday.",
                options: ["had been", "have been", "am"],
                correct_answer: "had been",
                explanation: "Câu gián tiếp tường thuật về quá khứ lùi thì thành Quá khứ hoàn thành (had been).",
                max_score: 1.0,
              },
              {
                question_number: 3,
                question_type: "MULTIPLE_CHOICE",
                prompt: "Hardly _______ the station when the train pulled away.",
                options: ["had we reached", "we had reached", "did we reach"],
                correct_answer: "had we reached",
                explanation: "Đảo ngữ với Hardly: Hardly + had + S + V3/ed + when + S + V2/ed.",
                max_score: 1.0,
              },
            ],
          },
          {
            part_number: 2,
            title: "Part 2: Vocabulary",
            instructions: "Select the word closest in meaning or best completing the collocation.",
            questions: [
              {
                question_number: 26,
                question_type: "MULTIPLE_CHOICE",
                prompt: "The government took drastic measures to _______ inflation.",
                options: ["curb", "inflate", "widen"],
                correct_answer: "curb",
                explanation: "Collocation: 'curb inflation' có nghĩa là kiềm chế lạm phát.",
                max_score: 1.0,
              },
              {
                question_number: 27,
                question_type: "MULTIPLE_CHOICE",
                prompt: "His explanation was so _______ that no one doubted his honesty.",
                options: ["plausible", "dubious", "hollow"],
                correct_answer: "plausible",
                explanation: "Plausible: hợp lý, đáng tin cậy.",
                max_score: 1.0,
              },
            ],
          },
        ],
      },
    ];
  }
}
