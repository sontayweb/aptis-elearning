import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { config } from "../config";

export class HttpClient {
  private baseHeaders: Record<string, string>;

  constructor() {
    this.baseHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: config.sourceBaseUrl,
    };

    if (config.aptisCookie) {
      this.baseHeaders["Cookie"] = config.aptisCookie;
    }
    if (config.aptisBearerToken) {
      this.baseHeaders["Authorization"] = `Bearer ${config.aptisBearerToken}`;
    }
  }

  async sleep(ms?: number) {
    const delay =
      ms ??
      Math.floor(
        Math.random() * (config.requestDelayMaxMs - config.requestDelayMinMs + 1) +
          config.requestDelayMinMs
      );
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private buildUrl(urlPath: string): string {
    if (urlPath.startsWith("http")) return urlPath;
    const cleanPath = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
    return `${config.sourceBaseUrl}${cleanPath}`;
  }

  async getHtml(urlPath: string): Promise<string> {
    await this.sleep();
    try {
      const res = await fetch(this.buildUrl(urlPath), {
        headers: this.baseHeaders,
      });
      return await res.text();
    } catch (err: any) {
      console.warn(`Lỗi fetch HTML từ ${urlPath}:`, err.message);
      return "";
    }
  }

  async getJson<T = any>(urlPath: string): Promise<T | null> {
    await this.sleep();
    try {
      const res = await fetch(this.buildUrl(urlPath), {
        headers: {
          ...this.baseHeaders,
          Accept: "application/json",
        },
      });
      return (await res.json()) as T;
    } catch (err: any) {
      console.warn(`Lỗi fetch JSON từ ${urlPath}:`, err.message);
      return null;
    }
  }

  /**
   * Tải file nhị phân (Audio .mp3 hoặc Ảnh .jpg/.png) và lưu vào ổ cứng bằng native fetch
   */
  async downloadMedia(
    remoteUrl: string,
    targetSubdir: string,
    filename: string
  ): Promise<string | null> {
    try {
      const fullUrl = this.buildUrl(remoteUrl);
      const targetDir = path.join(config.mediaOutputDir, targetSubdir);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, filename);
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        return `/uploads/${targetSubdir}/${filename}`;
      }

      const res = await fetch(fullUrl, {
        headers: {
          "User-Agent": this.baseHeaders["User-Agent"],
        },
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const fileStream = fs.createWriteStream(filePath);
      // @ts-ignore
      await finished(Readable.fromWeb(res.body).pipe(fileStream));

      return `/uploads/${targetSubdir}/${filename}`;
    } catch (err: any) {
      console.warn(`Không thể tải media từ ${remoteUrl}:`, err.message);
      return null;
    }
  }
}
