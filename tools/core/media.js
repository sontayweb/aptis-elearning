import fs from 'node:fs';
import path from 'node:path';

/**
 * Tải file âm thanh hoặc hình ảnh về thư mục lưu trữ cục bộ
 */
export async function downloadMediaFile(url, targetFolder, customFileName = null) {
  if (!url || !url.startsWith('http')) return null;

  try {
    fs.mkdirSync(targetFolder, { recursive: true });

    let fileName = customFileName;
    if (!fileName) {
      const urlObj = new URL(url);
      fileName = path.basename(urlObj.pathname);
      if (!fileName || !fileName.includes('.')) {
        fileName = `media_${Date.now()}.mp3`;
      }
    }

    const filePath = path.join(targetFolder, fileName);
    if (fs.existsSync(filePath)) {
      return filePath; // Đã tải trước đó
    }

    const res = await fetch(url);
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    return filePath;
  } catch (err) {
    console.warn(`Lỗi tải media từ ${url}:`, err.message);
    return null;
  }
}
