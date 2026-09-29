import path from "path";

// Tự động nạp .env mà không bắt buộc phải cài riêng package dotenv
try {
  require("dotenv").config();
} catch {
  try {
    const backendDotenv = path.resolve(__dirname, "../../../backend/node_modules/dotenv");
    require(backendDotenv).config();
  } catch {
    if (typeof (process as any).loadEnvFile === "function") {
      try {
        (process as any).loadEnvFile();
      } catch {}
    }
  }
}

export const config = {
  sourceBaseUrl: process.env.SOURCE_BASE_URL || "https://aptiskytich.vn",
  aptisCookie: process.env.APTIS_COOKIE || "",
  aptisBearerToken: process.env.APTIS_BEARER_TOKEN || "",
  databaseUrl: process.env.DATABASE_URL || "",
  mediaOutputDir: path.resolve(
    __dirname,
    process.env.MEDIA_OUTPUT_DIR || "../../backend/uploads"
  ),
  jsonOutputDir: path.resolve(__dirname, "../output/json"),
  mediaLocalDir: path.resolve(__dirname, "../output/media"),
  requestTimeoutMs: 15000,
  requestDelayMinMs: 800,
  requestDelayMaxMs: 2000,
};
