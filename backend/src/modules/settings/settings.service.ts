import { prisma } from '../../config/database';
import { AuditAction } from '@prisma/client';
import { auditService } from '../audit/audit.service';
import { UpdateSettingsInput } from './settings.dto';
import { Request } from 'express';

// Enterprise Caching Layer (In-Memory với TTL 10 phút, tự động invalidate khi Admin cập nhật)
interface CacheEntry {
  data: Record<string, any>;
  expiresAt: number;
}

let publicSettingsCache: CacheEntry | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 phút

const DEFAULT_EVENT_THEME_JSON = JSON.stringify({
  enabled: true,
  activeTemplate: 'tet',
  name: 'Tết Nguyên Đán 🌸',
  icon: '🌸',
  badge: 'Xuân như ý',
  description: 'Sắc xuân rạng ngời với hoa đào, hoa mai rơi nhẹ và phong bao lì xì may mắn',
  primaryColor: '#DE1A35',
  accentColor: '#F59E0B',
  bannerEnabled: true,
  bannerText: '🌸 Khai xuân đắc lộc — Lì xì khóa học và nhân đôi lượt chấm bài thi thử Aptis!',
  bannerLink: '/pricing',
  decorationType: 'blossoms',
  appearanceMode: 'light',
  forceEventTheme: true,
  updatedAt: new Date().toISOString(),
});

const DEFAULT_SETTINGS = [
  {
    key: 'ZALO_CONTACT_URL',
    value: 'https://zalo.me/0379866596',
    category: 'CONTACT',
    description: 'Link Zalo tiếp nhận học viên & tư vấn tuyển sinh tập trung',
    is_public: true,
  },
  {
    key: 'HOTLINE_PHONE',
    value: '0379 866 596',
    category: 'CONTACT',
    description: 'Số Hotline hỗ trợ kỹ thuật và giải đáp thắc mắc',
    is_public: true,
  },
  {
    key: 'FANPAGE_URL',
    value: 'https://www.facebook.com/Aptiskytich',
    category: 'CONTACT',
    description: 'Trang Fanpage Facebook chính thức của APTIS ESOL PREMIER',
    is_public: true,
  },
  {
    key: 'ZALO_CONSULTANT_NAME',
    value: 'Giảng viên Aptis ESOL',
    category: 'CONTACT',
    description: 'Tên hiển thị của giảng viên tư vấn trên Zalo',
    is_public: true,
  },
  {
    key: 'SYSTEM_EVENT_THEME_CONFIG',
    value: DEFAULT_EVENT_THEME_JSON,
    category: 'THEME',
    description: 'Cấu hình giao diện và banner sự kiện toàn hệ thống (Tết, Noel, Halloween, Custom)',
    is_public: true,
  },
];

export class SettingsService {
  /**
   * Lấy cấu hình công khai phục vụ Frontend (0ms latency qua Cache Layer)
   */
  async getPublicSettings() {
    const now = Date.now();

    // 1. Kiểm tra Cache
    if (publicSettingsCache && publicSettingsCache.expiresAt > now) {
      return publicSettingsCache.data;
    }

    // 2. Query Database
    let settings = await prisma.systemSetting.findMany({
      where: { is_public: true },
    });

    // 3. Nếu CSDL chưa có hoặc thiếu key mặc định, tự động Seed / Bổ sung dữ liệu chuẩn
    const existingKeys = new Set(settings.map((s) => s.key));
    const missingDefaults = DEFAULT_SETTINGS.filter((item) => !existingKeys.has(item.key));
    if (missingDefaults.length > 0) {
      await prisma.$transaction(
        missingDefaults.map((item) =>
          prisma.systemSetting.upsert({
            where: { key: item.key },
            update: {},
            create: item,
          })
        )
      );

      settings = await prisma.systemSetting.findMany({
        where: { is_public: true },
      });
    }

    // 4. Map thành Object cấu trúc thuận tiện cho Client
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    let eventThemeConfig = null;
    if (settingsMap['SYSTEM_EVENT_THEME_CONFIG']) {
      try {
        eventThemeConfig = JSON.parse(settingsMap['SYSTEM_EVENT_THEME_CONFIG']);
      } catch (err) {
        console.error('Lỗi parse SYSTEM_EVENT_THEME_CONFIG từ Database:', err);
      }
    }

    const formattedData = {
      zaloContactUrl: settingsMap['ZALO_CONTACT_URL'] || 'https://zalo.me/0379866596',
      hotlinePhone: settingsMap['HOTLINE_PHONE'] || '0379 866 596',
      fanpageUrl: settingsMap['FANPAGE_URL'] || 'https://www.facebook.com/Aptiskytich',
      consultantName: settingsMap['ZALO_CONSULTANT_NAME'] || 'Giảng viên Aptis ESOL',
      eventThemeConfig,
      raw: settingsMap,
    };

    // 5. Lưu vào Cache
    publicSettingsCache = {
      data: formattedData,
      expiresAt: now + CACHE_TTL_MS,
    };

    return formattedData;
  }

  /**
   * Lấy toàn bộ danh sách cấu hình hệ thống (Admin)
   */
  async getAllSettings() {
    return prisma.systemSetting.findMany({
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Cập nhật cấu hình hệ thống, Invalidate Cache & Ghi Audit Log (Admin)
   */
  async updateSettings(
    adminId: string,
    input: UpdateSettingsInput,
    req?: Request
  ) {
    // 1. Transaction cập nhật Database
    const updatedItems = await prisma.$transaction(
      input.settings.map((item) =>
        prisma.systemSetting.upsert({
          where: { key: item.key },
          update: {
            value: item.value,
            description: item.description,
            updated_by: adminId,
          },
          create: {
            key: item.key,
            value: item.value,
            description: item.description,
            category: item.key.includes('THEME') ? 'THEME' : 'CONTACT',
            is_public: true,
            updated_by: adminId,
          },
        })
      )
    );

    // 2. Invalidate Cache ngay lập tức (Học viên nhận giá trị mới sau 0 giây)
    publicSettingsCache = null;

    // 3. Ghi vết Kiểm toán (Enterprise Audit Trail)
    if (adminId && req) {
      await auditService.record(
        {
          req,
          action: AuditAction.SYSTEM_SETTING_UPDATE,
          entityType: 'SystemSetting',
          entityId: 'BATCH_UPDATE',
          description: `Admin cập nhật cấu hình hệ thống: ${input.settings
            .map((s) => `${s.key}=${s.value}`)
            .join(', ')}`,
          newValue: input.settings,
        }
      );
    }

    return updatedItems;
  }
}

export const settingsService = new SettingsService();
