import { prisma } from '../../config/database';
import { ReviewStatus, AuditAction } from '@prisma/client';
import { auditService } from '../audit/audit.service';
import { Request } from 'express';

export class CmsService {
  async getPage(slug: string) {
    const pages: Record<string, any> = {
      about: {
        title: 'Giới thiệu về Aptis Kỳ Tích',
        content:
          'Aptis Kỳ Tích là nền tảng luyện thi và khảo thí Aptis ESOL trực tuyến tiên phong tại Việt Nam, kết hợp phương pháp đào tạo chuẩn hóa của Hội đồng Anh (British Council) và trí tuệ nhân tạo (AI Engine Whisper + GPT-4o) hỗ trợ bóc băng và chấm điểm theo khung tham chiếu CEFR.',
        mission: 'Giúp 100.000+ sinh viên và người đi làm vượt qua rào cản tiếng Anh đạt chuẩn B1, B2, C1 cấp tốc.',
        coreValues: [
          'Chính xác: Mô phỏng 100% phần mềm thi máy tính British Council.',
          'Thực chiến: Ngân hàng 860+ bộ đề Key trúng tủ cập nhật liên tục theo từng tháng thi thật.',
          'Tận tâm: Đội ngũ giảng viên và trợ giảng đồng hành hỗ trợ chữa bài 1:1 chuyên sâu.',
        ],
        stats: {
          studentsPassed: '15,200+',
          targetRate: '98.6%',
          examBankCount: '860+',
        },
      },
      'meo-thi': {
        title: 'Mẹo Làm Bài Thi Aptis ESOL Đạt Chuẩn Band C (Listening, Reading, Speaking, Writing)',
        content:
          'Tổng hợp chiến lược phân bổ thời gian và mẹo xử lý các dạng bài khó trong kỳ thi Aptis ESOL chính thức.',
        tips: [
          {
            skill: 'Speaking',
            title: 'Chiến thuật Part 4: 1 phút chuẩn bị & 2 phút nói liên tục',
            summary: 'Ghi chú 3 nhánh ý chính tương ứng với 3 câu hỏi; sử dụng mẫu câu mở đoạn học thuật (In my viewpoint, from an objective angle).',
          },
          {
            skill: 'Writing',
            title: 'Tối ưu độ dài bài viết Part 4 (Formal & Informal Letter)',
            summary: 'Thư thân mật 50 từ (20% thời gian), Thư trang trọng 120-150 từ (80% thời gian); luôn dùng câu phức và từ nối liên kết.',
          },
          {
            skill: 'Reading',
            title: 'Phân bổ 35 phút cho 4 Parts',
            summary: 'Part 1 hoàn thành trong 4 phút; dành 20 phút cho Part 4 (bài đọc dài 7 đoạn nối tiêu đề).',
          },
          {
            skill: 'Listening',
            title: 'Nghe lần 1 bắt từ khóa chính, nghe lần 2 đối chiếu phương án gây nhiễu',
            summary: 'Chú ý các từ chuyển ý (However, Unfortunately, Actually) vì đáp án đúng thường nằm sau các từ này.',
          },
        ],
      },
      terms: {
        title: 'Điều Khoản Dịch Vụ & Chính Sách Bảo Mật Aptis Kỳ Tích',
        content:
          'Cam kết bảo vệ dữ liệu cá nhân học viên, minh bạch chính sách hoàn phí và quyền sở hữu nội dung đào tạo.',
        sections: [
          {
            heading: '1. Quy định bản quyền và tài khoản học tập',
            body: 'Mỗi tài khoản học viên chỉ phục vụ mục đích cá nhân. Mọi hành vi chia sẻ tài khoản cho bên thứ ba hoặc sao chép đề thi thương mại đều bị nghiêm cấm.',
          },
          {
            heading: '2. Chính sách thanh toán và kích hoạt VIP',
            body: 'Hệ thống tự động kích hoạt tài khoản VIP qua cổng VietQR SePay trong vòng 3-5 giây. Nếu sai sót thông tin, học viên được hỗ trợ đối soát 24/7.',
          },
          {
            heading: '3. Bảo mật thông tin học viên',
            body: 'Toàn bộ mật khẩu được băm mã hóa một chiều Bcrypt 12 rounds. Lịch sử bài làm và thông tin thanh toán được bảo vệ theo chuẩn mã hóa SSL/TLS.',
          },
        ],
      },
      contact: {
        title: 'Liên Hệ Hỗ Trợ Học Vụ & Tư Vấn Khóa Học',
        hotline: '0379 866 596',
        email: 'aptiskytich.admin@gmail.com',
        address: 'Hà Nội & TP. Hồ Chí Minh, Việt Nam',
        zaloSupport: 'https://zalo.me/0867833227',
        workingHours: '8:00 - 22:30 (Thứ 2 - Chủ Nhật, kể cả Lễ Tết)',
      },
    };

    return pages[slug] || { title: 'Trang thông tin', content: 'Nội dung đang được cập nhật.' };
  }

  /**
   * Lấy danh sách feedback & bảng điểm nổi bật phục vụ Dashboard Carousel
   */
  async getFeaturedFeedbacks() {
    const reviews = await prisma.examReview.findMany({
      where: {
        status: ReviewStatus.APPROVED,
        is_featured: true,
      },
      orderBy: { display_order: 'asc' },
      take: 10,
      include: {
        user: { select: { full_name: true, avatar_url: true } },
      },
    });

    if (reviews.length === 0) {
      return [
        {
          id: 'fb-1',
          studentName: 'Trịnh Liên Hương',
          className: 'Lớp 22/2026',
          achievedBand: 'Đạt B2',
          quote: 'Cảm ơn cô và khóa học, tài liệu rất sát đề và dễ hiểu ạ!',
          scoreSummary: 'Overall 164/200 - B2',
          certificateImageUrl: '/assets/certificates/huong-b2.png',
          verified: true,
        },
        {
          id: 'fb-2',
          studentName: 'Quỳnh Trang',
          className: 'Lớp 21/2026',
          achievedBand: 'Đạt C1',
          quote: 'Em không ngờ mình chỉ cần B2 mà được C1. Cám ơn cô nhiều ạ!',
          scoreSummary: 'Overall 182/200 - C1',
          certificateImageUrl: '/assets/certificates/trang-c1.png',
          verified: true,
        },
        {
          id: 'fb-3',
          studentName: 'Học viên lớp 21/2026',
          className: 'ĐHQG Hà Nội',
          achievedBand: 'Đạt B2',
          quote: 'Cháu học ĐHQG, cám ơn trung tâm nhiều, không ngờ lần 1 đã đỗ ạ!',
          scoreSummary: 'Overall 158/200 - B2',
          certificateImageUrl: '/assets/certificates/student-b2.png',
          verified: true,
        },
        {
          id: 'fb-4',
          studentName: 'Nguyễn Minh Đức',
          className: 'Lớp 23/2026',
          achievedBand: 'Đạt B2',
          quote: 'AI chấm Speaking & Writing phát hiện đúng lỗi ngữ pháp, đi thi tự tin hẳn!',
          scoreSummary: 'Overall 160/200 - B2',
          certificateImageUrl: '/assets/certificates/duc-b2.png',
          verified: true,
        },
        {
          id: 'fb-5',
          studentName: 'Trần Mai Anh',
          className: 'Lớp 20/2026',
          achievedBand: 'Đạt C1',
          quote: 'Bộ đề khoanh vùng trúng ngay bài thi Reading Part 4, đạt điểm tối đa luôn ạ.',
          scoreSummary: 'Overall 185/200 - C1',
          certificateImageUrl: '/assets/certificates/maianh-c1.png',
          verified: true,
        },
      ];
    }

    return reviews.map((r) => ({
      id: r.id,
      studentName: r.user.full_name,
      className: r.class_name || 'Khóa Luyện Thi B2',
      achievedBand: r.score_achieved?.includes('C') ? 'Đạt C1' : 'Đạt B2',
      quote: r.comment,
      scoreSummary: r.score_achieved ? `Overall ${r.score_achieved}` : 'Đạt chuẩn B2',
      certificateImageUrl: r.certificate_image_url || '/assets/certificates/sample.png',
      verified: r.verified_by_admin,
    }));
  }

  async getReviews(includePending: boolean = false) {
    const where: any = {};
    if (!includePending) {
      where.status = ReviewStatus.APPROVED;
    }

    const reviews = await prisma.examReview.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            email: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            skill: true,
          },
        },
      },
    });

    // Nếu CSDL chưa có review nào, seed review mẫu ban đầu
    if (reviews.length === 0) {
      return [
        {
          id: 'rev-1',
          studentName: 'Nguyễn Thảo Linh',
          score: 'B2 (168/200)',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Linh',
          comment: 'Nhờ luyện đề trên Aptis Kỳ Tích mà mình đã đạt B2 sau đúng 3 tuần ôn cấp tốc!',
          rating: 5,
          date: '2026-09-20',
          isApproved: true,
          teacherNote: 'Chúc mừng em Linh, phát huy tốt ở môi trường làm việc nhé!',
        },
        {
          id: 'rev-2',
          studentName: 'Trần Minh Quang',
          score: 'C1 (185/200)',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quang',
          comment: 'Đề Key Dự Đoán trúng tủ bài Writing Part 4, thật sự rất biết ơn thầy cô!',
          rating: 5,
          date: '2026-09-18',
          isApproved: true,
          teacherNote: 'Tuyệt vời Quang ơi, điểm Speaking & Writing xuất sắc!',
        },
      ];
    }

    return reviews.map((r) => ({
      id: r.id,
      studentName: r.user.full_name,
      avatarUrl: r.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.user.full_name)}`,
      score: r.score_achieved || 'B2 Target',
      comment: r.comment,
      rating: r.rating,
      date: r.created_at.toISOString().split('T')[0],
      isApproved: r.status === ReviewStatus.APPROVED,
      status: r.status,
      teacherNote: r.teacher_note,
      examLocation: r.exam_location,
      rewardClaimed: r.reward_claimed,
      rewardQuota: r.reward_quota,
      examTitle: r.exam?.title,
    }));
  }

  async createReview(
    userId: string,
    data: {
      examId?: string;
      rating: number;
      scoreAchieved?: string;
      comment: string;
      examLocation?: string;
      examDate?: string;
    }
  ) {
    const review = await prisma.examReview.create({
      data: {
        user_id: userId,
        exam_id: data.examId || null,
        rating: Math.max(1, Math.min(5, data.rating || 5)),
        score_achieved: data.scoreAchieved || null,
        comment: data.comment,
        exam_location: data.examLocation || 'British Council',
        exam_date: data.examDate ? new Date(data.examDate) : new Date(),
        status: ReviewStatus.PENDING,
      },
    });

    return review;
  }

  async updateReview(
    id: string,
    data: { isApproved?: boolean; status?: ReviewStatus; teacherNote?: string; rewardQuota?: number },
    req?: Request
  ) {
    const existing = await prisma.examReview.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      throw { statusCode: 404, message: 'Đánh giá không tồn tại' };
    }

    let targetStatus = existing.status;
    if (data.status) {
      targetStatus = data.status;
    } else if (data.isApproved !== undefined) {
      targetStatus = data.isApproved ? ReviewStatus.APPROVED : ReviewStatus.REJECTED;
    }

    const updated = await prisma.$transaction(async (tx) => {
      let rewardClaimed = existing.reward_claimed;
      const quotaToAdd = data.rewardQuota || 5;

      // Nếu duyệt bài và chưa thưởng quota: tự động cộng 5 lượt AI
      if (targetStatus === ReviewStatus.APPROVED && !rewardClaimed && quotaToAdd > 0) {
        const userSub = await tx.userSubscription.findFirst({
          where: { user_id: existing.user_id, is_active: true },
          orderBy: { end_date: 'desc' },
        });

        if (userSub) {
          await tx.userSubscription.update({
            where: { id: userSub.id },
            data: { ai_quota_left: userSub.ai_quota_left + quotaToAdd },
          });
          rewardClaimed = true;
        }
      }

      return tx.examReview.update({
        where: { id },
        data: {
          status: targetStatus,
          teacher_note: data.teacherNote !== undefined ? data.teacherNote : existing.teacher_note,
          reward_claimed: rewardClaimed,
          reward_quota: quotaToAdd,
        },
      });
    });

    auditService.record({
      req,
      action: AuditAction.EXAM_UPDATE,
      entityType: 'EXAM_REVIEW',
      entityId: id,
      description: `Cập nhật trạng thái review của học viên ${existing.user.full_name}: ${targetStatus}`,
      newValue: { status: targetStatus, teacherNote: data.teacherNote },
    });

    return updated;
  }

  async deleteReview(id: string, req?: Request) {
    const existing = await prisma.examReview.findUnique({ where: { id } });
    if (!existing) {
      throw { statusCode: 404, message: 'Đánh giá không tồn tại' };
    }

    await prisma.examReview.delete({ where: { id } });

    auditService.record({
      req,
      action: AuditAction.EXAM_DELETE,
      entityType: 'EXAM_REVIEW',
      entityId: id,
      description: `Đã xóa bài review ID ${id}`,
    });

    return { success: true, id };
  }

  async getHallOfFame() {
    return [
      {
        id: 'hof-1',
        studentName: 'Nguyễn Minh Anh',
        overallScore: '48/50',
        cefrLevel: 'C',
        examDate: '20/09/2026',
        topicTitle: 'Part 4: Formal Letter regarding Environmental Conservation Policy',
        writingSample:
          'Dear Committee Members,\n\nI am writing to express my earnest perspective regarding the proposed municipal initiatives on urban reforestation...',
        teacherComment:
          'Vốn từ học thuật bậc C1-C2 cực kỳ phong phú và tự nhiên. Cấu trúc câu đảo ngữ và mệnh đề quan hệ rút gọn được vận dụng chuẩn xác.',
        likesCount: 142,
      },
      {
        id: 'hof-2',
        studentName: 'Trần Quốc Bảo',
        overallScore: '50/50',
        cefrLevel: 'C',
        examDate: '18/09/2026',
        topicTitle: 'Part 4: The Socio-economic Impacts of Artificial Intelligence',
        speakingSampleUrl: 'https://cdn.aptiskytich.vn/audio/samples/hof_speaking_c.mp3',
        excerpt:
          'From my personal standpoint, technological disruption is neither inherently dystopian nor completely panacean. Rather, its trajectory hinges upon regulatory frameworks...',
        teacherComment:
          'Phát âm chuẩn ngữ điệu RP British, độ trôi chảy mượt mà, không ngập ngừng và phân tích đa chiều sắc sảo.',
        likesCount: 198,
      },
      {
        id: 'hof-3',
        studentName: 'Lê Thu Hà',
        overallScore: '44/50',
        cefrLevel: 'B2',
        examDate: '15/09/2026',
        topicTitle: 'Part 3: Social Network Debate on Remote Education vs Traditional Classrooms',
        writingSample:
          'While distance learning undeniably offers geographical flexibility and personalized pacing, synchronous classroom interactions remain indispensable for socio-emotional cultivation...',
        teacherComment:
          'Lập luận chặt chẽ, sử dụng đa dạng liên từ nối học thuật (undeniably, indispensable, socio-emotional).',
        likesCount: 115,
      },
    ];
  }
}

export const cmsService = new CmsService();
