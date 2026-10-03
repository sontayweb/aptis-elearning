import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.resolve(__dirname, '../logs');

// Đảm bảo thư mục tools/logs tồn tại
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function getTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${dateStr} ${timeStr}`;
}

function getFileTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

class Logger {
  constructor() {
    this.currentLogFile = null;
    this.latestLogFile = path.join(logsDir, 'latest.log');
    this.writeStream = null;
    this.isIntercepting = false;
  }

  // Khởi tạo phiên log mới cho mỗi lần chạy sync
  initSession(prefix = 'sync') {
    const filename = `${prefix}_${getFileTimestamp()}.log`;
    this.currentLogFile = path.join(logsDir, filename);

    const banner = `================================================================================\n` +
      `📝 PHIÊN GHI NHẬN NHẬT KÝ ĐỒNG BỘ: ${prefix.toUpperCase()}\n` +
      `⏱️ Bắt đầu lúc: ${getTimestamp()}\n` +
      `📁 File log chi tiết: ${this.currentLogFile}\n` +
      `================================================================================\n\n`;

    fs.writeFileSync(this.currentLogFile, banner, 'utf-8');
    fs.writeFileSync(this.latestLogFile, banner, 'utf-8');

    // Mở stream ghi nối tiếp (append)
    this.writeStream = fs.createWriteStream(this.currentLogFile, { flags: 'a', encoding: 'utf-8' });

    // Tự động kích hoạt intercept console để bắt toàn bộ log của tất cả các crawler
    this.enableConsoleIntercept();

    return this.currentLogFile;
  }

  writeRaw(text) {
    if (!this.writeStream) return;
    // Bỏ mã màu ANSI khi ghi vào file
    const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');
    this.writeStream.write(cleanText);
    try {
      fs.appendFileSync(this.latestLogFile, cleanText, 'utf-8');
    } catch {}
  }

  formatArgs(args) {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  logMessage(level, ...args) {
    const msg = this.formatArgs(args);
    const line = `[${getTimestamp()}] [${level.padEnd(5)}] ${msg}\n`;
    this.writeRaw(line);
  }

  info(...args) {
    this.logMessage('INFO', ...args);
  }

  warn(...args) {
    this.logMessage('WARN', ...args);
  }

  error(...args) {
    this.logMessage('ERROR', ...args);
  }

  debug(...args) {
    this.logMessage('DEBUG', ...args);
  }

  // Bắt toàn bộ console.log, console.warn, console.error để ghi đồng thời ra file
  enableConsoleIntercept() {
    if (this.isIntercepting) return;
    this.isIntercepting = true;

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    console.log = (...args) => {
      originalLog.apply(console, args);
      const msg = this.formatArgs(args);
      this.writeRaw(`[${getTimestamp()}] [LOG]   ${msg}\n`);
    };

    console.info = (...args) => {
      originalInfo.apply(console, args);
      const msg = this.formatArgs(args);
      this.writeRaw(`[${getTimestamp()}] [INFO]  ${msg}\n`);
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      const msg = this.formatArgs(args);
      this.writeRaw(`[${getTimestamp()}] [WARN]  ${msg}\n`);
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      const msg = this.formatArgs(args);
      this.writeRaw(`[${getTimestamp()}] [ERROR] ${msg}\n`);
    };
  }

  closeSession() {
    if (this.writeStream) {
      const footer = `\n================================================================================\n` +
        `🏁 KẾT THÚC PHIÊN ĐỒNG BỘ: ${getTimestamp()}\n` +
        `================================================================================\n`;
      this.writeRaw(footer);
      this.writeStream.end();
      this.writeStream = null;
    }
  }

  getLogsList() {
    if (!fs.existsSync(logsDir)) return [];
    return fs.readdirSync(logsDir)
      .filter(f => f.endsWith('.log'))
      .map(f => {
        const full = path.join(logsDir, f);
        const st = fs.statSync(full);
        return {
          filename: f,
          sizeBytes: st.size,
          updatedAt: st.mtime
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

export const logger = new Logger();
