// Single Source of Truth for Media & Image URLs across Aptis ESOL
// Handles single images, dual comparison images (Speaking Part 3), CDN fallbacks, and validation

/**
 * Phân tích an toàn chuỗi image_url từ cơ sở dữ liệu thành mảng danh sách URL sạch
 * Xử lý:
 * - Chuỗi phân tách bằng dấu phẩy (vd: "/uploads/img1.png, /uploads/img2.png")
 * - Chuỗi JSON mảng (vd: '["url1", "url2"]')
 * - Chuỗi đơn lẻ
 * - Loại bỏ khoảng trắng thừa, chuỗi rỗng, null, undefined
 */
export function parsePartImages(raw?: string | null): string[] {
  if (!raw) return [];
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return [];

  // Trường hợp chuỗi lưu dạng JSON array
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => resolveImageUrl(item))
          .filter(Boolean);
      }
    } catch {}
  }

  // Trường hợp phân tách bằng dấu phẩy (Speaking Part 3 - 2 tranh đối chiếu)
  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((item) => resolveImageUrl(item))
      .filter(Boolean);
  }

  // Trường hợp URL đơn lẻ
  const single = resolveImageUrl(trimmed);
  return single ? [single] : [];
}

/**
 * Chuẩn hóa một đường dẫn hình ảnh thành URL hợp lệ để render trong thẻ <img>
 * - Xử lý trường hợp chuỗi chứa dấu phẩy lọt vào (lấy URL đầu tiên)
 * - Xử lý URL tuyệt đối (http/https)
 * - Xử lý đường dẫn tương đối (/uploads/...)
 * - Fallback CDN nếu cần thiết
 */
export function resolveImageUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  let url = String(rawUrl).trim();

  // Phòng vệ: Nếu lọt dấu phẩy thì chỉ lấy URL đầu tiên
  if (url.includes(",")) {
    url = url.split(",")[0].trim();
  }

  if (!url || url === "null" || url === "undefined") return "";

  // Link ngoài hoặc CDN đầy đủ
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Link upload nội bộ
  if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
    return url.startsWith("/") ? url : `/${url}`;
  }

  // Link thư mục speaking/ CDN
  if (url.startsWith("speaking/")) {
    return `https://files.aptisacademy.com.vn/${url}`;
  }

  // Mặc định thêm slash đầu nếu là đường dẫn tĩnh
  return url.startsWith("/") ? url : `/${url}`;
}

/**
 * Ghép danh sách URL thành chuỗi chuẩn hóa để lưu vào database
 * Ví dụ: ["/uploads/img1.jpg", "/uploads/img2.jpg"] -> "/uploads/img1.jpg, /uploads/img2.jpg"
 */
export function formatPartImages(urls: (string | null | undefined)[]): string {
  return urls
    .map((u) => (u ? String(u).trim() : ""))
    .filter(Boolean)
    .join(", ");
}
