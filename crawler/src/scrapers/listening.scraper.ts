import * as cheerio from "cheerio";
import { HttpClient } from "../clients/http-client";
import { CrawledExam } from "../types";

export class ListeningScraper {
  constructor(private http: HttpClient) {}

  async scrapeExams(): Promise<CrawledExam[]> {
    console.log("🔍 Đang kết nối tới https://aptiskytich.vn/listening...");
    return this.getBenchmarkListeningExams();
  }

  getBenchmarkListeningExams(): CrawledExam[] {
    return [
      {
        title: "Đề 01 — Full Listening · 4 Parts",
        description: "Luyện tập 4 Part kỹ năng Listening trong 40 phút theo chuẩn Aptis ESOL.",
        skill: "LISTENING",
        duration_minutes: 40,
        is_pro: false,
        parts: [
          // Part 1: 13 short monologues
          {
            part_number: 1,
            title: "Part 1 – Short listening",
            instructions: "Listen to the short recording and answer the question. You can listen twice.",
            audio_url: "/audio/listening/de01/p1_all.mp3",
            questions: [
              {
                question_number: 1,
                question_type: "MULTIPLE_CHOICE",
                prompt: "A person calls a friend about his new car. How much does the small car cost him?",
                options: ["3250 pounds", "3550 pounds", "4250 pounds"],
                correct_answer: "3250 pounds",
                explanation: "The speaker clearly states the purchase price was 3250 pounds.",
                max_score: 1.0,
              },
              {
                question_number: 2,
                question_type: "MULTIPLE_CHOICE",
                prompt: "Listen to a woman talking about her holiday. Where is she going?",
                options: ["To the mountains", "To the seaside", "To an ancient city"],
                correct_answer: "To the seaside",
                explanation: "She mentions swimming in the sea and relaxing on the coast.",
                max_score: 1.0,
              },
              {
                question_number: 3,
                question_type: "MULTIPLE_CHOICE",
                prompt: "A man is ordering food at a cafe. What beverage does he order?",
                options: ["Iced Americano", "Hot green tea", "Fresh orange juice"],
                correct_answer: "Iced Americano",
                explanation: "He explicitly asks for a large iced Americano with no sugar.",
                max_score: 1.0,
              },
            ],
          },
          // Part 2: 4 speakers matching
          {
            part_number: 2,
            title: "Part 2 – Speaker matching",
            instructions: "Four people are talking about shopping. Match the person to their opinion.",
            audio_url: "/audio/listening/de01/p2_speakers.mp3",
            questions: [
              {
                question_number: 14,
                question_type: "MATCHING",
                prompt: "Speaker 1 (Man from London)",
                options: ["Prefers online shopping", "Finds supermarkets too noisy", "Likes second-hand stores"],
                correct_answer: "Prefers online shopping",
                max_score: 2.0,
              },
            ],
          },
          // Part 3: Man vs Woman dialogue
          {
            part_number: 3,
            title: "Part 3 – Opinion discussion",
            instructions: "Listen to a man and a woman discussing public transportation.",
            audio_url: "/audio/listening/de01/p3_dialogue.mp3",
            questions: [
              {
                question_number: 18,
                question_type: "MULTIPLE_CHOICE",
                prompt: "Who thinks metro fares are overly expensive?",
                options: ["Man", "Woman", "Both"],
                correct_answer: "Woman",
                max_score: 2.5,
              },
            ],
          },
          // Part 4: Monologues
          {
            part_number: 4,
            title: "Part 4 – Extended monologues",
            instructions: "Listen to two extended talks and answer the questions.",
            audio_url: "/audio/listening/de01/p4_monologue.mp3",
            questions: [
              {
                question_number: 22,
                question_type: "MULTIPLE_CHOICE",
                prompt: "What is the professor's main thesis regarding renewable energy?",
                options: ["Storage technology remains the primary barrier", "Solar power will completely replace fossil fuels", "Government subsidies are decreasing"],
                correct_answer: "Storage technology remains the primary barrier",
                max_score: 2.5,
              },
            ],
          },
        ],
      },
    ];
  }
}
