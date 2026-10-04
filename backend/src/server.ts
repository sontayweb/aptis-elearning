import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { prisma } from './config/database';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Aptis Backend Server] running on http://localhost:${PORT}`);
  console.log(`[Environment]: ${process.env.NODE_ENV || 'development'}`);
});

/**
 * Graceful Shutdown: Đóng HTTP server và giải phóng toàn bộ connection pool tới PostgreSQL
 */
async function gracefulShutdown(signal: string) {
  console.log(`\n[Aptis Backend Server] ${signal} signal received: closing HTTP server...`);
  server.close(async () => {
    console.log('[Aptis Backend Server] HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('[Aptis Backend Server] Database connections closed cleanly.');
    } catch (err) {
      console.error('[Aptis Backend Server] Error disconnecting from database:', err);
    } finally {
      process.exit(0);
    }
  });

  // Tự động ép tắt sau 10s nếu còn tiến trình treo
  setTimeout(() => {
    console.error('[Aptis Backend Server] Forcefully shutting down after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
