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
  url = url.replace(/^[\["']+|[\]"']+$/g, "").trim();

  if (!url || url === "null" || url === "undefined") return "";

  // Xử lý link cũ aptiskey.com chuyển sang assets nội bộ
  if (url.includes("aptiskey.com/images/speaking/part2/")) {
    const filename = url.split("/").pop() || "";
    const num = filename.replace(/\D/g, "");
    if (num) return `/uploads/speaking/part2/image${num}.png`;
  }
  if (url.includes("aptiskey.com/images/speaking/part3/")) {
    const filename = url.split("/").pop() || "";
    const num = filename.replace(/\D/g, "");
    if (num) {
      if (num === "1" || num === "4") return `/uploads/speaking/part3/image${num}.jpg`;
      return `/uploads/speaking/part3/image${num}.png`;
    }
  }

  // Link thư mục speaking/ CDN (kể cả khi bị gắn nhầm dấu "/" ở đầu như "/speaking/...")
  if (url.startsWith("speaking/") || url.startsWith("/speaking/")) {
    const cleanPath = url.replace(/^\/+/, "");
    return `https://files.aptisacademy.com.vn/${cleanPath}`;
  }

  // Link ngoài hoặc CDN đầy đủ
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Chuẩn hóa image1.png / image4.png trong part3 sang .jpg đúng tên file thực tế
  if (url === "/uploads/speaking/part3/image1.png" || url === "uploads/speaking/part3/image1.png") {
    return "/uploads/speaking/part3/image1.jpg";
  }
  if (url === "/uploads/speaking/part3/image4.png" || url === "uploads/speaking/part3/image4.png") {
    return "/uploads/speaking/part3/image4.jpg";
  }

  // Link upload nội bộ
  if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
    return url.startsWith("/") ? url : `/${url}`;
  }

  // Ảnh gốc chuẩn từ kho Aptis Kỳ Tích (ví dụ: de01_1.png, de01_2.png, p2_60.jpg, p3_60_1.jpg, 1.png..99.png)
  if (/^(?:de\d+_[12]|p[234]_\d+(?:_[12]|_v2)?|\d+)\.(?:png|jpg|jpeg|webp)$/i.test(url)) {
    return `https://bacoamhbatqpxatrrflz.supabase.co/storage/v1/object/public/exam-images/${url}`;
  }
  if (url.startsWith("Tranh_tr_ng__i_m_part_2_") || url.startsWith("Tranh_tr_ng__i_m_part_3_")) {
    return `/uploads/exams/speaking/${url}`;
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
