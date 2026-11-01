/**
 * WRITING VALIDATOR & WORD LIMIT HARD LOCK
 * Quy chuẩn giới hạn từ cho đề thi Aptis Writing
 */

export const WRITING_WORD_LIMITS = {
  PART_1: 10, // 10 từ / câu
  PART_2: 45, // 45 từ / bài
  PART_3: 60, // 60 từ / câu
  PART_4_MAIL_1: 75, // 75 từ (Email thân mật)
  PART_4_MAIL_2: 225, // 225 từ (Email trang trọng)
} as const;

/**
 * Đếm số từ thực tế dựa trên các khối ký tự phân cách bởi khoảng trắng
 */
export function countWords(text?: string | null): number {
  if (!text || !text.trim()) return 0;
  return (text.trim().match(/\S+/g) || []).length;
}

/**
 * Kiểm soát và khóa cứng giới hạn từ (Hard Lock):
 * - Nếu chưa chạm maxWords: cho phép gõ bình thường
 * - Nếu đang ở maxWords và người dùng cố gõ thêm từ mới: chặn phím mới, giữ nguyên text cũ
 * - Nếu dán (paste) đoạn văn dài: tự động cắt gọn đúng maxWords từ đầu tiên
 * - Luôn cho phép Backspace, Delete hoặc bôi đen sửa từ cũ
 */
export function enforceWordLimit(
  newVal: string,
  oldVal: string,
  maxWords: number
): { value: string; isAtLimit: boolean } {
  const newCount = countWords(newVal);

  // 1. Số từ vẫn nằm trong giới hạn cho phép
  if (newCount <= maxWords) {
    return {
      value: newVal,
      isAtLimit: newCount === maxWords,
    };
  }

  // 2. Số từ vượt quá giới hạn:
  // Nếu là thao tác dán (paste) nhiều ký tự cùng lúc
  if (newVal.length - oldVal.length > 5) {
    const words = newVal.trim().match(/\S+/g) || [];
    const truncated = words.slice(0, maxWords).join(" ");
    return {
      value: truncated,
      isAtLimit: true,
    };
  }

  // Nếu là gõ phím thông thường làm phát sinh từ thứ (maxWords + 1) -> Khóa cứng, giữ text cũ
  return {
    value: oldVal,
    isAtLimit: true,
  };
}

