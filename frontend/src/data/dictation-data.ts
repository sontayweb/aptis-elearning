/**
 * ==============================================================================
 * APTIS ESOL PREMIER — NGÂN HÀNG CÂU LUYỆN NGHE CHÉP CHÍNH TẢ (DICTATION DATA)
 * ==============================================================================
 * HƯỚNG DẪN BỔ SUNG CÂU LUYỆN NGHE CHÉP:
 * 
 * 1. Chọn cấp độ tương ứng:
 *    - `foundation`: Level 1 - Foundation (Phù hợp mục tiêu B1, câu ngắn, ngữ điệu rõ)
 *    - `momentum`: Level 2 - Momentum (Phù hợp mục tiêu B2, câu trung bình 6-8 giây)
 *    - `mastery`: Level 3 - Mastery (Phù hợp mục tiêu C1-C2, câu học thuật phức hợp)
 * 
 * 2. Thêm một đối tượng câu hỏi với định dạng:
 *    {
 *      id: "f-6",                                                  // ID duy nhất
 *      level: "Level 1 - Foundation",                              // Tên hiển thị cấp độ
 *      topic: "Đề 31 - Part 1 - Bài 05",                           // Nguồn đề / Part thi
 *      originalText: "Could you please confirm your email address?",// Câu chính xác bằng tiếng Anh
 *      hint: "confirm / address",                                   // Từ gợi ý khi học viên cần trợ giúp
 *      audioTime: "00:04",                                         // Thời lượng ước tính
 *    }
 * 
 * 3. Phát âm: Hệ thống tự động sử dụng Web Speech API chuẩn giọng Anh - Anh (en-GB / en-US)
 *    để đọc to câu theo tốc độ chuẩn mà không cần upload file audio riêng.
 * ==============================================================================
 */

export interface DictationSentence {
  id: string | number;
  level: string;
  topic: string;
  originalText: string;
  hint?: string;
  audioTime: string;
}

export const DEFAULT_DICTATION_SENTENCES: Record<string, DictationSentence[]> = {
  foundation: [
    {
      id: "f-1",
      level: "Level 1 - Foundation",
      topic: "Đề 24 - Part 1 - Bài 07",
      originalText: "Could you point me somewhere?",
      hint: "point / somewhere",
      audioTime: "00:02",
    },
    {
      id: "f-2",
      level: "Level 1 - Foundation",
      topic: "Đề 29 - Part 1 - Bài 12",
      originalText: "You've missed the bus, haven't you?",
      hint: "missed / haven't",
      audioTime: "00:03",
    },
    {
      id: "f-3",
      level: "Level 1 - Foundation",
      topic: "Đề 35 - Part 1 - Bài 12",
      originalText: "Please remind me they shouldn't keep the Monday morning meeting.",
      hint: "remind / shouldn't / morning",
      audioTime: "00:03",
    },
    {
      id: "f-4",
      level: "Level 1 - Foundation",
      topic: "Đề 30 - Part 1 - Bài 02",
      originalText: "Please make sure you hand in your assignments before noon.",
      hint: "hand in / assignments",
      audioTime: "00:04",
    },
    {
      id: "f-5",
      level: "Level 1 - Foundation",
      topic: "Đề 30 - Part 1 - Bài 03",
      originalText: "Could you tell me what time the flight departs tomorrow morning?",
      hint: "departs / tomorrow",
      audioTime: "00:04",
    },
  ],
  momentum: [
    {
      id: "m-1",
      level: "Level 2 - Momentum",
      topic: "Đề 14 - Part 2 - Bài 01",
      originalText: "The company announced substantial improvements in its annual environmental report.",
      hint: "substantial / environmental",
      audioTime: "00:06",
    },
    {
      id: "m-2",
      level: "Level 2 - Momentum",
      topic: "Đề 14 - Part 2 - Bài 02",
      originalText: "Most participants agreed that collaborative learning significantly enhances cognitive development.",
      hint: "collaborative / enhances",
      audioTime: "00:07",
    },
    {
      id: "m-3",
      level: "Level 2 - Momentum",
      topic: "Đề 18 - Part 2 - Bài 04",
      originalText: "Although the weather conditions deteriorated rapidly, the international expedition completed their objectives.",
      hint: "deteriorated / expedition / objectives",
      audioTime: "00:07",
    },
  ],
  mastery: [
    {
      id: "mas-1",
      level: "Level 3 - Mastery",
      topic: "Đề 05 - Part 3 - Bài 01",
      originalText: "From my vantage point, sustainable urban planning requires immediate integration of renewable energy grids.",
      hint: "sustainable / integration / renewable",
      audioTime: "00:09",
    },
    {
      id: "mas-2",
      level: "Level 3 - Mastery",
      topic: "Đề 08 - Part 3 - Bài 03",
      originalText: "Notwithstanding the substantial economic headwinds, innovative pedagogical methods have revolutionized remote higher education.",
      hint: "Notwithstanding / headwinds / pedagogical",
      audioTime: "00:10",
    },
  ],
};
