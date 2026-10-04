import { prisma } from '../config/database';

export interface ProAccessResult {
  hasAccess: boolean;
  isStaff: boolean; // SUPER_ADMIN, ADMIN (Học vụ), TEACHER (Giảng viên)
  activeSubscription?: any;
}

/**
 * Kiểm tra xem người dùng có quyền truy cập tài nguyên / tính năng PRO hay không.
 * Quy tắc:
 * 1. Chưa đăng nhập (userId undefined/null): Ném lỗi 403 Forbidden yêu cầu đăng nhập.
 * 2. Tài khoản nội bộ (SUPER_ADMIN, ADMIN - Học vụ, TEACHER - Giảng viên): Luôn có quyền (miễn trừ VIP).
 * 3. Học viên (STUDENT): Bắt buộc phải có gói cước VIP còn hạn (is_active = true, end_date > now).
 * 
 * @param userId - ID của người dùng
 * @param resourceName - Tên tài nguyên hiển thị trong thông báo lỗi (vd: "Đề thi PRO", "Bài nghe chép PRO")
 * @returns Thông tin quyền truy cập và gói cước nếu hợp lệ
 * @throws Object lỗi { statusCode: 403, message, requirePro: true } nếu không đủ quyền
 */
export async function assertProAccess(
  userId: string | undefined,
  resourceName: string = 'Tính năng PRO'
): Promise<ProAccessResult> {
  // 1. Chưa đăng nhập
  if (!userId) {
    throw {
      statusCode: 403,
      message: `${resourceName} yêu cầu đăng nhập và nâng cấp gói VIP để truy cập`,
      requirePro: true,
    };
  }

  // 2. Lấy thông tin user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw { statusCode: 401, message: 'Người dùng không tồn tại' };
  }

  // 3. Quyền đặc quyền nội bộ (Super Admin, Học vụ, Giảng viên)
  const isStaff = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'TEACHER';
  if (isStaff) {
    return { hasAccess: true, isStaff: true };
  }

  // 4. Kiểm tra gói VIP của học viên
  const activeSub = await prisma.userSubscription.findFirst({
    where: {
      user_id: userId,
      is_active: true,
      end_date: { gt: new Date() },
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  if (!activeSub) {
    throw {
      statusCode: 403,
      message: `${resourceName} yêu cầu nâng cấp gói VIP để truy cập`,
      requirePro: true,
    };
  }

  return {
    hasAccess: true,
    isStaff: false,
    activeSubscription: activeSub,
  };
}

/**
 * Phiên bản không ném exception (Safe check) trả về true/false.
 * Hữu ích cho các trường hợp kiểm tra điều kiện UI hoặc tính toán logic phụ.
 */
export async function checkProAccess(userId: string | undefined): Promise<boolean> {
  try {
    const res = await assertProAccess(userId);
    return res.hasAccess;
  } catch {
    return false;
  }
}
