/**
 * CEFR Engine - Bộ chuyển đổi và so sánh cấp độ chuẩn khung tham chiếu Châu Âu (Aptis ESOL 2026)
 * Thang điểm quy đổi chuẩn hóa trên thang 50 điểm cho từng kỹ năng riêng biệt (Listening, Reading, Speaking, Writing).
 */

export type CefrLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const CEFR_ORDER: readonly CefrLevel[] = [
  'A0',
  'A1',
  'A2',
  'B1',
  'B2',
  'C1',
  'C2',
];

/**
 * Chuẩn hóa cấp độ đầu vào thành CefrLevel chuẩn (xử lý trường hợp "C" thành "C1")
 */
export function normalizeCefrLevel(level: string | null | undefined): CefrLevel | null {
  if (!level) return null;
  const upper = level.trim().toUpperCase();
  if (upper === 'C') return 'C1';
  if (CEFR_ORDER.includes(upper as CefrLevel)) {
    return upper as CefrLevel;
  }
  return null;
}

/**
 * Lấy chỉ số thứ hạng CEFR (0 = A0, 6 = C2, -1 nếu không xác định)
 */
export function getCefrRank(level: string | null | undefined): number {
  const norm = normalizeCefrLevel(level);
  if (!norm) return -1;
  return CEFR_ORDER.indexOf(norm);
}

/**
 * Quy đổi điểm số thô sang cấp độ CEFR chuẩn Aptis ESOL
 * Thang điểm chuẩn British Council Aptis:
 * - >= 42: C1 (Thành thạo)
 * - >= 36: B2 (Độc lập / Đầu ra Đại học)
 * - >= 26: B1 (Đạt chuẩn cơ sở)
 * - >= 16: A2 (Sơ cấp nâng cao)
 * - >= 10: A1 (Sơ cấp)
 * - < 10: A0 (Chưa đạt chuẩn)
 *
 * @param score Điểm số học viên đạt được
 * @param maxScore Thang điểm tối đa của bài thi (mặc định 50 cho từng kỹ năng, 200 cho Full Test)
 */
export function scoreToCefr(score: number, maxScore: number = 50): CefrLevel {
  const safeScore = Math.max(0, score);
  const normalized = maxScore > 0 ? (safeScore / maxScore) * 50 : safeScore;

  if (normalized >= 42) return 'C1';
  if (normalized >= 36) return 'B2';
  if (normalized >= 26) return 'B1';
  if (normalized >= 16) return 'A2';
  if (normalized >= 10) return 'A1';
  return 'A0';
}

/**
 * So sánh 2 cấp độ CEFR
 * @returns > 0 nếu a cao hơn b; 0 nếu bằng nhau; < 0 nếu a thấp hơn b
 */
export function compareCefr(
  a: string | null | undefined,
  b: string | null | undefined
): number {
  const rankA = getCefrRank(a);
  const rankB = getCefrRank(b);
  return rankA - rankB;
}

/**
 * Tìm cấp độ CEFR cao nhất từ một mảng các cấp độ
 */
export function getHighestCefr(levels: (string | null | undefined)[]): string {
  let highest: string = 'Chưa làm';
  let highestRank = -1;

  for (const lvl of levels) {
    const rank = getCefrRank(lvl);
    if (rank > highestRank) {
      highestRank = rank;
      highest = normalizeCefrLevel(lvl) || 'Chưa làm';
    }
  }

  return highest;
}
