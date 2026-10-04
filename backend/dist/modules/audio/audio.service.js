"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioService = exports.AudioService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../../config/database");
const UPLOAD_ROOT = path_1.default.resolve(process.env.UPLOAD_DIR || './uploads');
class AudioService {
    async saveSubmissionAudio(userId, submissionId, questionId, file, durationSeconds) {
        const submission = await database_1.prisma.examSubmission.findUnique({
            where: { id: submissionId },
        });
        if (!submission || submission.user_id !== userId) {
            throw { statusCode: 404, message: 'Bài làm không tồn tại hoặc không thuộc quyền sở hữu' };
        }
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const targetDir = path_1.default.join(UPLOAD_ROOT, 'audio', 'submissions', String(year), month, submissionId);
        if (!fs_1.default.existsSync(targetDir)) {
            fs_1.default.mkdirSync(targetDir, { recursive: true });
        }
        const ext = path_1.default.extname(file.originalname) || '.webm';
        const filename = `q_${questionId}${ext}`;
        const destinationPath = path_1.default.join(targetDir, filename);
        fs_1.default.copyFileSync(file.path, destinationPath);
        try {
            fs_1.default.unlinkSync(file.path);
        }
        catch {
            // ignore
        }
        const relativeAudioUrl = `/api/submissions/${submissionId}/audio/${questionId}`;
        const answer = await database_1.prisma.submissionAnswer.upsert({
            where: {
                submission_id_question_id: {
                    submission_id: submissionId,
                    question_id: questionId,
                },
            },
            update: {
                audio_url: relativeAudioUrl,
                audio_mime_type: file.mimetype,
                audio_size_bytes: file.size,
                audio_duration: durationSeconds || Math.round(file.size / 16000), // ước tính nếu chưa truyền
            },
            create: {
                submission_id: submissionId,
                question_id: questionId,
                audio_url: relativeAudioUrl,
                audio_mime_type: file.mimetype,
                audio_size_bytes: file.size,
                audio_duration: durationSeconds || Math.round(file.size / 16000),
            },
        });
        return {
            answerId: answer.id,
            audioUrl: answer.audio_url,
            audioDuration: answer.audio_duration,
            saved: true,
        };
    }
    getPhysicalFilePath(submissionId, questionId, createdAt) {
        const date = createdAt || new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const targetDir = path_1.default.join(UPLOAD_ROOT, 'audio', 'submissions', String(year), month, submissionId);
        const commonExts = ['.webm', '.mp4', '.wav', '.m4a', '.aac', '.ogg'];
        for (const ext of commonExts) {
            const candidate = path_1.default.join(targetDir, `q_${questionId}${ext}`);
            if (fs_1.default.existsSync(candidate)) {
                return candidate;
            }
        }
        const submissionsBase = path_1.default.join(UPLOAD_ROOT, 'audio', 'submissions');
        if (fs_1.default.existsSync(submissionsBase)) {
            const findInDir = (dir) => {
                const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path_1.default.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        if (entry.name === submissionId) {
                            for (const ext of commonExts) {
                                const candidate = path_1.default.join(fullPath, `q_${questionId}${ext}`);
                                if (fs_1.default.existsSync(candidate))
                                    return candidate;
                            }
                        }
                        const found = findInDir(fullPath);
                        if (found)
                            return found;
                    }
                }
                return null;
            };
            return findInDir(submissionsBase);
        }
        return null;
    }
    async streamSubmissionAudio(submissionId, questionId, reqHeaders, res, userId, userRole) {
        const submission = await database_1.prisma.examSubmission.findUnique({
            where: { id: submissionId },
            include: {
                answers: {
                    where: { question_id: questionId },
                },
            },
        });
        if (!submission) {
            res.status(404).json({ success: false, message: 'Phiên làm bài thi không tồn tại' });
            return;
        }
        // Kiểm tra quyền truy cập: Chính chủ thí sinh HOẶC Giáo viên / Quản trị viên
        if (submission.user_id !== userId && userRole !== 'ADMIN' && userRole !== 'TEACHER') {
            res.status(403).json({ success: false, message: 'Bạn không có quyền nghe bản ghi âm này' });
            return;
        }
        const answer = submission.answers[0];
        if (!answer || !answer.audio_url) {
            res.status(404).json({ success: false, message: 'Chưa có bản ghi âm cho câu hỏi này' });
            return;
        }
        const createdAt = answer.created_at || submission.started_at || new Date();
        const resolvedFilePath = this.getPhysicalFilePath(submissionId, questionId, createdAt);
        if (!resolvedFilePath || !fs_1.default.existsSync(resolvedFilePath)) {
            res.status(404).json({ success: false, message: 'Tệp âm thanh vật lý không tìm thấy trên máy chủ' });
            return;
        }
        const mimeType = answer.audio_mime_type || 'audio/webm';
        this.streamAudio(resolvedFilePath, reqHeaders, res, mimeType);
    }
    streamAudio(filePath, reqHeaders, res, mimeType = 'audio/webm') {
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({ success: false, message: 'File âm thanh không tồn tại' });
            return;
        }
        const stat = fs_1.default.statSync(filePath);
        const fileSize = stat.size;
        const range = reqHeaders.range;
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = end - start + 1;
            const file = fs_1.default.createReadStream(filePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': mimeType,
            };
            res.writeHead(206, head);
            file.pipe(res);
        }
        else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': mimeType,
                'Accept-Ranges': 'bytes',
            };
            res.writeHead(200, head);
            fs_1.default.createReadStream(filePath).pipe(res);
        }
    }
}
exports.AudioService = AudioService;
exports.audioService = new AudioService();
