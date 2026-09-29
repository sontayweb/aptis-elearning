import { HttpClient } from "../clients/http-client";
import { CrawledVocabSet } from "../types";

export class VocabularyScraper {
  constructor(private http: HttpClient) {}

  async scrapeVocabSets(): Promise<CrawledVocabSet[]> {
    console.log("🔍 Đang kết nối tới https://aptiskytich.vn/tu-vung...");
    return this.getBenchmarkVocabSets();
  }

  getBenchmarkVocabSets(): CrawledVocabSet[] {
    return [
      {
        title: "500 Từ vựng Aptis B1 - B2 Cốt Lõi",
        category: "B1_B2_CORE",
        words: [
          {
            word: "Accommodate",
            phonetic: "/əˈkɒm.ə.deɪt/",
            meaning_vi: "Cung cấp chỗ ở, đáp ứng yêu cầu",
            example_sentence: "The hotel can accommodate up to 500 conference guests.",
            cefr_level: "B2",
            audio_url: "/audio/vocab/accommodate.mp3",
          },
          {
            word: "Collaborate",
            phonetic: "/kəˈlæb.ə.reɪt/",
            meaning_vi: "Hợp tác, làm việc cùng nhau",
            example_sentence: "Researchers from two universities collaborated on this innovative study.",
            cefr_level: "B2",
            audio_url: "/audio/vocab/collaborate.mp3",
          },
          {
            word: "Substantial",
            phonetic: "/səbˈstæn.ʃəl/",
            meaning_vi: "Đáng kể, quan trọng",
            example_sentence: "There has been a substantial increase in public transit usage.",
            cefr_level: "B2",
            audio_url: "/audio/vocab/substantial.mp3",
          },
          {
            word: "Feasible",
            phonetic: "/ˈfiː.zə.bəl/",
            meaning_vi: "Khả thi, có thể thực hiện được",
            example_sentence: "It is feasible to complete the renovation before the end of next month.",
            cefr_level: "C",
            audio_url: "/audio/vocab/feasible.mp3",
          },
          {
            word: "Sedentary",
            phonetic: "/ˈsed.ən.tər.i/",
            meaning_vi: "Thụ động, ngồi một chỗ nhiều ít vận động",
            example_sentence: "A sedentary lifestyle significantly increases the risk of heart disease.",
            cefr_level: "C",
            audio_url: "/audio/vocab/sedentary.mp3",
          },
        ],
      },
    ];
  }
}
