import json
import re

with open('frontend/src/data/extracted_reading_p2_topics.json', 'r', encoding='utf-8') as f:
    raw_topics = json.load(f)

# Assign appropriate emojis for each topic
emojis = [
    "🎓", "🎭", "📝", "🏆", "🎤", "🎤", "🎤", "🎬", 
    "🚀", "📊", "🚆", "🚗", "🔬", "🎵", "☕", "☕", 
    "☕", "🗺️", "🎪", "🌿"
]

clean_topics = []
for idx, t in enumerate(raw_topics):
    title = t['title']
    title = re.sub(r'^[.\s]+', '', title)
    title = re.sub(r'\(.*?\)', '', title).strip()
    if not title:
        title = f"Chủ đề {t['num']}"
    
    emoji = emojis[idx] if idx < len(emojis) else "📖"
    
    clean_topics.append({
        'id': f'topic-{idx+1}',
        'num': idx + 1,
        'title': title,
        'fullTitle': t['title'].lstrip('. '),
        'emoji': emoji,
        'pairs': t['pairs'],
        'summary': t['summary']
    })

print(f"Cleaned {len(clean_topics)} topics")

ts_code = '''/**
 * Dữ liệu chuẩn cho tính năng Key và Mẹo Thi Aptis - Reading (Part 1 - 4)
 * Thiết kế chuẩn theo ảnh mẫu và tài liệu Part 2-Reading-Meo-Thi.md.
 */

export interface ReadingP2Topic {
  id: string;
  num: number;
  title: string;
  fullTitle: string;
  emoji: string;
  pairs: { en: string; vn: string }[];
  summary: string;
}

export interface ReadingPartData {
  partNumber: number;
  title: string;
  badge: string;
  subtitle: string;
  overview: string;
  recommendedTime: string;
  tips: string[];
  mistakesToAvoid: string[];
  quickRemember: {
    highlight: string;
    description: string;
  };
  // Part 1 specific
  cluesP1?: { questionPattern: string; answerType: string }[];
  exampleP1?: {
    question: string;
    options: string;
    correctAnswer: string;
    explanation: string;
  };
  // Part 2 specific
  topicsP2?: ReadingP2Topic[];
  // Part 3 specific
  paraphraseTrapsP3?: {
    questionKeyword: string;
    passageSynonym: string;
    trapNote: string;
  }[];
  // Part 4 specific
  headingStrategiesP4?: {
    headingType: string;
    clueKeywords: string;
    guide: string;
  }[];
}

export const READING_P2_TOPICS: ReadingP2Topic[] = ''' + json.dumps(clean_topics, ensure_ascii=False, indent=2) + ''';

export const READING_KEY_MEO_DATA: Record<string, ReadingPartData> = {
  p1: {
    partNumber: 1,
    title: "Aptis Reading – Part 1",
    badge: "British Council +1",
    subtitle: "Chọn từ phù hợp để hoàn thành 5 chỗ trống trong một đoạn văn ngắn (email hoặc tin nhắn)",
    overview:
      "Part 1 gồm một đoạn văn ngắn dưới dạng email hoặc tin nhắn. Có 5 chỗ trống, nhiệm vụ là chọn từ phù hợp để hoàn thành từng câu. Phần này kiểm tra khả năng hiểu nghĩa câu, ngữ pháp và cách sử dụng từ trong ngữ cảnh.",
    recommendedTime: "~ 4 phút",
    tips: [
      "Đọc toàn bộ đoạn văn: Hiểu tình huống ai viết, viết cho ai và nội dung gì.",
      "Đọc cả câu có chỗ trống: Không chỉ nhìn riêng từ đứng trước hoặc sau chỗ trống.",
      "Xác định loại từ cần điền: Danh từ, động từ, tính từ, trạng từ hay giới từ.",
      "Đọc tất cả các phương án: Loại những đáp án sai về ngữ pháp hoặc không hợp nghĩa.",
      "Điền đáp án rồi đọc lại: Đọc lại cả câu để kiểm tra ngữ pháp và sự liền mạch.",
    ],
    cluesP1: [
      { questionPattern: "a / an / the + ___", answerType: "Thường cần danh từ" },
      { questionPattern: "be + ___", answerType: "Có thể cần tính từ hoặc V-ing / V3" },
      { questionPattern: "can / should / must + ___", answerType: "Động từ nguyên mẫu (V-inf)" },
      { questionPattern: "very / really + ___", answerType: "Thường cần tính từ hoặc trạng từ" },
      { questionPattern: "interested ___", answerType: 'Giới từ "in"' },
      { questionPattern: "look forward to + ___", answerType: "Danh từ hoặc V-ing" },
    ],
    mistakesToAvoid: [
      "Chỉ nhìn một từ gần chỗ trống mà không đọc cả câu.",
      "Chọn từ đúng nghĩa nhưng sai loại từ.",
      "Nhầm tính từ đuôi -ed và -ing: interested / interesting.",
      "Không kiểm tra giới từ đi kèm động từ hoặc tính từ.",
      "Dành quá nhiều thời gian cho một câu khó.",
    ],
    exampleP1: {
      question: "I am very _______ about joining the English club.",
      options: "A. excite | B. excited | C. exciting",
      correctAnswer: "B. excited",
      explanation: 'Cấu trúc "be excited about + N/V-ing" diễn tả cảm thấy hào hứng về điều gì đó.',
    },
    quickRemember: {
      highlight: "ĐỌC CẢ CÂU → XÁC ĐỊNH LOẠI TỪ → KIỂM TRA NGỮ PHÁP → KIỂM TRA NGHĨA",
      description: "Hãy đọc toàn bộ câu thay vì chỉ nhìn từ gần chỗ trống để tránh bẫy ngữ pháp.",
    },
  },

  p2: {
    partNumber: 2,
    title: "APTIS READING • PART 2: ĐỐI CHIẾU CẶP CÂU 🔍",
    badge: "British Council +1",
    subtitle: "Đọc hiểu liên kết: Đối chiếu đoạn văn gốc và phân tích đáp án có từ khóa biến thể (paraphrasing).",
    overview:
      "Part 2 gồm các bài đọc sắp xếp câu hoặc đối chiếu cặp câu. Nắm vững trật tự câu gốc, từ khóa móc nối và bản dịch nghĩa song song giúp bạn chọn chính xác thứ tự đoạn văn mà không mất thời gian dịch mò.",
    recommendedTime: "~ 6 - 8 phút",
    tips: [
      "Xác định câu mở đầu (Topic Sentence): Thường là câu giới thiệu thời gian, địa điểm hoặc nhân vật chính.",
      "Tìm từ nối và đại từ chỉ định: First, Then, After that, These staff members, This lack of money.",
      "Đối chiếu các từ khóa chính giữa câu trước và câu sau để bắt mạch liên kết logic.",
      "Ghi nhớ các cụm tóm tắt mẹo nhớ độc quyền của từng chủ đề để nhận diện ngay khi gặp đề thi thật.",
    ],
    topicsP2: READING_P2_TOPICS,
    mistakesToAvoid: [
      "Đọc câu đơn lẻ mà không liên kết với câu đứng trước.",
      "Bỏ qua các đại từ thay thế (He, She, They, This, These).",
      "Xếp các câu có liên từ đối lập (However, In contrast) lên đầu đoạn.",
    ],
    quickRemember: {
      highlight: "Bắt từ khóa móc nối + Đại từ thay thế",
      description: "Đọc câu gốc song song dịch nghĩa → Ghi nhớ cụm từ khóa cốt lõi của từng thẻ đề hot.",
    },
  },

  p3: {
    partNumber: 3,
    title: "Aptis Reading – Part 3",
    badge: "Nối ý kiến người nói (Opinion Matching)",
    subtitle: "Đọc 4 đoạn văn ngắn của 4 người (A, B, C, D) và ghép với 7 nhận định tương ứng.",
    overview:
      "Part 3 đưa ra 4 đoạn văn ngắn (A, B, C, D) chia sẻ ý kiến của 4 người về một chủ đề chung. Có 7 nhận định và bạn cần xác định mỗi nhận định thuộc về ai.",
    recommendedTime: "~ 8 - 10 phút",
    tips: [
      "Đọc 7 câu nhận định TRƯỚC TIÊN, gạch chân từ khóa chỉ nội dung và tính từ cảm xúc.",
      "Tìm từ đồng nghĩa (Paraphrasing): Đề thi Aptis không dùng y nguyên từ trong câu hỏi vào bài đọc.",
      "Cảnh giác bẫy từ vựng trùng 100%: Câu nào trong bài đọc có từ giống hệt câu hỏi thường là bẫy.",
      "Kỹ thuật Skimming & Scanning: Đọc lướt nhanh 4 đoạn để nắm ý chung, sau đó quét chi tiết tìm bằng chứng.",
    ],
    paraphraseTrapsP3: [
      {
        questionKeyword: "Low cost / Affordable",
        passageSynonym: "didn't cost a fortune / reasonable price / on a tight budget",
        trapNote: "Bài đọc có từ 'expensive' xuất hiện ở người khác để gài bẫy.",
      },
      {
        questionKeyword: "Disappointed with the service",
        passageSynonym: "far below my expectations / the staff was unhelpful",
        trapNote: "Nếu chỉ tìm từ 'disappointed' sẽ không ra đáp án vì đề dùng từ đồng nghĩa.",
      },
      {
        questionKeyword: "Wants to pursue as a career",
        passageSynonym: "hope to do this professionally / turn my passion into a living",
        trapNote: "Cụm 'turn passion into a living' chính là 'career'.",
      },
    ],
    mistakesToAvoid: [
      "Đọc chi tiết toàn bộ 4 đoạn văn từ đầu đến cuối trước khi đọc câu hỏi.",
      "Chọn đáp án chỉ vì thấy có 1 từ vựng trùng khớp trong bài.",
      "Bỏ qua các từ mang nghĩa phủ định tinh vi: rarely, hardly, seldom.",
    ],
    quickRemember: {
      highlight: "Đọc 7 nhận định trước → Tìm Synonyms trong bài",
      description: "Quét từ đồng nghĩa (Paraphrase) giữa nhận định và đoạn văn A, B, C, D.",
    },
  },

  p4: {
    partNumber: 4,
    title: "Aptis Reading – Part 4",
    badge: "Nối tiêu đề đoạn văn (Heading Matching)",
    subtitle: "Đọc bài luận dài (~750 từ) gồm 7-8 đoạn văn. Chọn tiêu đề phù hợp nhất cho mỗi đoạn.",
    overview:
      "Part 4 là bài đọc dài nhất (~750 từ), chia thành 7–8 đoạn văn về một chủ đề học thuật hoặc khoa học thường thức. Bạn cần chọn tiêu đề tóm tắt ý chính chính xác nhất cho từng đoạn.",
    recommendedTime: "~ 12 - 14 phút",
    tips: [
      "Nguyên tắc 'Đầu - Cuối': Đọc câu đầu tiên (Topic Sentence) và câu kết thúc của từng đoạn văn để nắm ý chính (Main Idea).",
      "Nếu câu đầu và cuối chưa đủ rõ, hãy lướt nhanh phần giữa đoạn để tìm từ khóa lặp lại nhiều nhất.",
      "Phương pháp loại trừ: Tiêu đề nào đã được chọn chắc chắn thì gạch bỏ khỏi danh sách lựa chọn.",
    ],
    headingStrategiesP4: [
      {
        headingType: "Lịch sử & Nguồn gốc (History / Origins)",
        clueKeywords: "began, originally, in the 19th century, first discovered, past",
        guide: "Đoạn văn chứa nhiều mốc thời gian, kể về sự ra đời sơ khai của đối tượng.",
      },
      {
        headingType: "Lợi ích & Ưu điểm (Benefits / Positive impacts)",
        clueKeywords: "advantage, effective, improve, beneficial, promote, valuable",
        guide: "Đoạn văn nêu những mặt tích cực, đóng góp tốt cho con người hoặc xã hội.",
      },
      {
        headingType: "Khó khăn & Thách thức (Challenges / Problems)",
        clueKeywords: "difficult, struggle, risk, concern, threaten, drawback",
        guide: "Đoạn văn chỉ ra rủi ro, tranh cãi hoặc điểm yếu đang phải đối mặt.",
      },
    ],
    mistakesToAvoid: [
      "Chọn tiêu đề chỉ nói về 1 chi tiết nhỏ hoặc một ví dụ minh họa trong đoạn.",
      "Dành quá nhiều thời gian cố đọc dịch từng câu chữ của cả bài 750 từ.",
    ],
    quickRemember: {
      highlight: "Đọc Câu Đầu & Câu Cuối đoạn văn",
      description: "Đọc Câu 1 + Câu cuối → Bắt Main Idea → Ghép Tiêu đề mang tính khái quát nhất.",
    },
  },
};
'''

with open('frontend/src/data/key-meo-reading-data.ts', 'w', encoding='utf-8') as f:
    f.write(ts_code)

print("Saved frontend/src/data/key-meo-reading-data.ts successfully!")

