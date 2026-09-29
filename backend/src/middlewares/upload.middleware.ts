import multer from 'multer';
import path from 'path';
import fs from 'fs';

const TEMP_UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads', 'temp');

// Đảm bảo thư mục tạm tồn tại
if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
}

// Cấu hình lưu tạm bằng diskStorage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEMP_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `audio_${uniqueSuffix}${ext}`);
  },
});

// Danh sách MIME type âm thanh được phép theo đặc tả
const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/wav',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  'audio/mpeg',
];

export const uploadAudioMiddleware = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB tối đa
  },
  fileFilter: (_req, file, cb) => {
    const isAllowed = ALLOWED_MIME_TYPES.some((mime) =>
      file.mimetype.toLowerCase().startsWith(mime.split(';')[0])
    );

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`Định dạng tệp âm thanh không được hỗ trợ: ${file.mimetype}`));
    }
  },
});
