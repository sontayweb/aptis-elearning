import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export interface TtsOptions {
  voice?: string; // 'en-GB-RyanNeural', 'en-GB-SoniaNeural', 'en-US-JennyNeural', etc.
  rate?: string;  // '+0%', '-5%'
  volume?: string;
}

export class TtsAudioService {
  private audioDir: string;
  private subDir: string;

  constructor(customUploadDir?: string, subDir: string = 'listening') {
    const baseUpload = customUploadDir || path.resolve(process.env.UPLOAD_DIR || './uploads');
    this.subDir = subDir;
    this.audioDir = path.join(baseUpload, 'audio', subDir);
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  /**
   * Sinh file âm thanh từ văn bản lời thoại (Transcript)
   */
  public async generateSpeech(
    text: string,
    filenamePrefix: string,
    options?: TtsOptions
  ): Promise<{ localPath: string; publicUrl: string }> {
    const cleanText = text.replace(/[\r\n]+/g, ' ').replace(/"/g, '\\"').trim();
    if (!cleanText) {
      throw new Error('Nội dung văn bản để sinh giọng nói không được rỗng.');
    }

    const voice = options?.voice || 'en-GB-RyanNeural'; // Giọng chuẩn Anh - Anh thi Aptis
    const safePrefix = filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safePrefix}_${Date.now()}.mp3`;
    const outputPath = path.join(this.audioDir, filename);

    // Ghi nội dung vào file text tạm để tránh lỗi quote escaping trên PowerShell/Windows
    const tempTextFile = path.join(this.audioDir, `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.txt`);
    fs.writeFileSync(tempTextFile, text.trim(), 'utf-8');

    let helperScript = path.resolve(__dirname, '../../tools/tts_helper.py');
    if (!fs.existsSync(helperScript)) {
      helperScript = path.resolve(process.cwd(), 'src/tools/tts_helper.py');
    }
    if (!fs.existsSync(helperScript)) {
      helperScript = path.resolve(process.cwd(), 'dist/tools/tts_helper.py');
    }
    const command = `python "${helperScript}" "${tempTextFile}" "${outputPath}" "${voice}"`;

    try {
      await execAsync(command);
    } catch (err: any) {
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Lỗi khi tạo audio TTS: ${err.message}`);
      }
    } finally {
      if (fs.existsSync(tempTextFile)) {
        try { fs.unlinkSync(tempTextFile); } catch {}
      }
    }

    return {
      localPath: outputPath,
      publicUrl: `/uploads/audio/${this.subDir}/${filename}`,
    };
  }

  /**
   * Sinh đoạn hội thoại 2 người (Nam / Nữ) cho Listening Part 3
   */
  public async generateDialogue(
    dialogueLines: { speaker: 'MAN' | 'WOMAN' | 'NARRATOR'; text: string }[],
    filenamePrefix: string
  ): Promise<{ localPath: string; publicUrl: string }> {
    // Ghép toàn bộ nội dung hội thoại thành 1 kịch bản liền mạch
    const fullText = dialogueLines
      .map((l) => `${l.speaker === 'MAN' ? 'Man' : l.speaker === 'WOMAN' ? 'Woman' : 'Narrator'}: ${l.text}`)
      .join('\n');

    return this.generateSpeech(fullText, filenamePrefix, { voice: 'en-GB-RyanNeural' });
  }
}

export const ttsAudioService = new TtsAudioService();
