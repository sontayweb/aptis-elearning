/**
 * API Client for Aptis Kỳ Tích E-learning Platform
 * Connects Next.js Frontend with Node.js/Express Backend (Port 5000)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string> || {}),
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // If 401 Unauthorized, notify or clear stale token
        if (response.status === 401 && typeof window !== 'undefined') {
          // Token expired or invalid
          if (endpoint !== '/auth/login' && endpoint !== '/auth/me') {
            console.warn('Session expired or unauthorized');
          }
        }
        return data as ApiResponse<T>;
      }

      return data as ApiResponse<T>;
    } catch (err: any) {
      console.error(`API request error on ${url}:`, err);
      return {
        success: false,
        data: null as any,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message || 'Lỗi kết nối tới máy chủ API',
        },
      };
    }
  }

  health = () => this.request('/health');

  // ==========================================
  // 1. AUTHENTICATION & USER PROFILE
  // ==========================================
  auth = {
    register: (body: { email: string; password: string; full_name: string; phone?: string }) =>
      this.request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      this.request<{ user: any; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify(body) }
      ),

    getMe: () => this.request('/auth/me', { method: 'GET' }),

    forgotPassword: (email: string) =>
      this.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (body: { token: string; newPassword: string }) =>
      this.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    updateProfile: (body: { fullName?: string; phoneNumber?: string; avatarUrl?: string; targetBand?: string }) =>
      this.request('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      this.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  };

  // ==========================================
  // 2. EXAMS & QUESTIONS
  // ==========================================
  exams = {
    getAll: (params?: { page?: number; limit?: number; skill?: string; isPro?: boolean; source?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.skill) query.append('skill', params.skill);
      if (params?.isPro !== undefined) query.append('isPro', String(params.isPro));
      if (params?.source) query.append('source', params.source);
      const qs = query.toString();
      return this.request(`/exams${qs ? `?${qs}` : ''}`);
    },

    getById: (id: string) => this.request(`/exams/${id}`),

    getQuestions: (id: string) => this.request(`/exams/${id}/questions`),

    customBuilder: (body: { title: string; skill_types: string[]; duration_minutes: number }) =>
      this.request('/exams/custom-builder', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  };

  // ==========================================
  // 3. EXAM SUBMISSIONS & ROOM LIFECYCLE
  // ==========================================
  submissions = {
    start: (examId: string) =>
      this.request('/submissions', {
        method: 'POST',
        body: JSON.stringify({ examId }),
      }),

    autosave: (
      submissionId: string,
      answers: Array<{
        questionId: string;
        selectedOption?: string | null;
        textAnswer?: string | null;
        audioUrl?: string | null;
        audioDuration?: number | null;
      }> | { question_id: string; selected_option?: string; text_answer?: string }
    ) => {
      // Chuẩn hoá nếu truyền object đơn
      const payload = Array.isArray(answers)
        ? { answers }
        : {
            answers: [
              {
                questionId: (answers as any).question_id || (answers as any).questionId,
                selectedOption: (answers as any).selected_option || (answers as any).selectedOption,
                textAnswer: (answers as any).text_answer || (answers as any).textAnswer,
              },
            ],
          };
      return this.request(`/submissions/${submissionId}/autosave`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },

    heartbeat: (submissionId: string, tabSwitches: number) =>
      this.request(`/submissions/${submissionId}/heartbeat`, {
        method: 'POST',
        body: JSON.stringify({ tabSwitchCount: tabSwitches }),
      }),

    resume: (submissionId: string) => this.request(`/submissions/${submissionId}/resume`),

    submit: (submissionId: string) =>
      this.request(`/submissions/${submissionId}/submit`, { method: 'POST' }),

    getResult: (submissionId: string) => this.request(`/submissions/${submissionId}`),

    getMyHistory: (params?: { page?: number; limit?: number; skill?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.skill) q.append('skill', params.skill);
      if (params?.search) q.append('search', params.search);
      const query = q.toString() ? `?${q.toString()}` : '';
      return this.request(`/submissions/my-history${query}`);
    },
  };

  // ==========================================
  // 3.1. STUDENT DASHBOARD & PROGRESS STATS
  // ==========================================
  student = {
    getDashboardStats: () => this.request('/student/dashboard-stats'),
    getStreak: () => this.request('/student/streak'),
    getGoal: () => this.request('/student/goal'),
    updateGoal: (data: { aim?: string; examDate?: string; dailyTarget?: number }) =>
      this.request('/student/goal', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };

  // ==========================================
  // 4. DICTATION & VOCABULARY
  // ==========================================
  dictation = {
    getLevels: () => this.request('/dictation/levels'),

    getLessons: (level?: string) => {
      const q = level ? `?level=${level}` : '';
      return this.request(`/dictation/lessons${q}`);
    },

    getLessonDetail: (lessonId: string) => this.request(`/dictation/lessons/${lessonId}`),

    checkSentence: (
      sentenceId: string,
      body: {
        submittedText: string;
        mode?: 'DICTATION' | 'SHADOWING' | 'HYBRID';
        audioUrl?: string;
      }
    ) =>
      this.request(`/dictation/sentences/${sentenceId}/check`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    sentenceCheck: (body: {
      lesson_id: string;
      sentence_index: number;
      user_input: string;
      time_spent_seconds?: number;
    }) =>
      this.request('/dictation/sentence-check', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  };

  vocabulary = {
    getSets: () => this.request('/vocabulary/sets'),

    getWords: (setId: string) => this.request(`/vocabulary/sets/${setId}/words`),

    createSet: (body: { title: string; category: string; is_free?: boolean }) =>
      this.request('/vocabulary/sets', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    deleteSet: (id: string) =>
      this.request(`/vocabulary/sets/${id}`, {
        method: 'DELETE',
      }),

    createWord: (
      setId: string,
      body: {
        word: string;
        phonetic?: string;
        meaning_vi: string;
        example_sentence?: string;
        cefr_level?: string;
      }
    ) =>
      this.request(`/vocabulary/sets/${setId}/words`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    updateWord: (
      wordId: string,
      body: {
        word?: string;
        phonetic?: string;
        meaning_vi?: string;
        example_sentence?: string;
        cefr_level?: string;
      }
    ) =>
      this.request(`/vocabulary/words/${wordId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    deleteWord: (wordId: string) =>
      this.request(`/vocabulary/words/${wordId}`, {
        method: 'DELETE',
      }),

    importWords: (setId: string, words: any[]) =>
      this.request(`/vocabulary/sets/${setId}/import`, {
        method: 'POST',
        body: JSON.stringify({ words }),
      }),

    saveNotebook: (wordId: string) =>
      this.request('/vocabulary/notebook', {
        method: 'POST',
        body: JSON.stringify({ word_id: wordId }),
      }),

    toggleMemorized: (notebookId: string, isMemorized: boolean) =>
      this.request(`/vocabulary/notebook/${notebookId}/memorize`, {
        method: 'PUT',
        body: JSON.stringify({ is_memorized: isMemorized }),
      }),
  };

  // ==========================================
  // 5. PAYMENT & SEPAY SUBSCRIPTIONS
  // ==========================================
  payment = {
    getPlans: () => this.request('/payment/plans'),

    initiate: (planId: string) =>
      this.request<{
        order_code: string;
        amount: number;
        bank_name: string;
        bank_account: string;
        account_name: string;
        qr_code_url: string;
        payment_status: string;
      }>('/payment/initiate', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId }),
      }),

    getMySubscription: () => this.request('/payment/my-subscription'),

    getTransactions: () => this.request('/payment/transactions'),

    verify: (orderCode: string) =>
      this.request(`/payment/verify/${orderCode}`, {
        method: 'POST',
      }),

    reportIssue: (
      orderCode: string,
      body: {
        bankTransId: string;
        transferAmount: number;
        senderBank?: string;
        senderAccount?: string;
        transferTime?: string;
        receiptImageUrl?: string;
        note?: string;
        contactPhone?: string;
      }
    ) =>
      this.request(`/payment/report-issue/${orderCode}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    getOrderStatus: (orderCode: string) =>
      this.request(`/payment/order-status/${orderCode}`),
  };

  // ==========================================
  // 6. CMS & PUBLIC DATA
  // ==========================================
  cms = {
    getPage: (slug: string) => this.request(`/cms/pages/${slug}`),
    getReviews: (includePending?: boolean) =>
      this.request(`/cms/reviews${includePending ? '?all=true' : ''}`),
    createReview: (body: {
      examId?: string;
      rating: number;
      scoreAchieved?: string;
      comment: string;
      examLocation?: string;
      examDate?: string;
    }) =>
      this.request('/cms/reviews', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateReview: (id: string, body: { isApproved?: boolean; teacherNote?: string; status?: string; rewardQuota?: number }) =>
      this.request(`/cms/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    approveReview: (id: string, body?: { teacherNote?: string; rewardQuota?: number }) =>
      this.request(`/cms/reviews/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify(body || {}),
      }),
    deleteReview: (id: string) =>
      this.request(`/cms/reviews/${id}`, {
        method: 'DELETE',
      }),
    getHallOfFame: () => this.request('/cms/hall-of-fame'),
  };

  // ==========================================
  // 7. TEACHER PORTAL
  // ==========================================
  teacher = {
    getGradingQueue: () => this.request('/teacher/grading-queue'),
    getSubmissionDetail: (id: string) => this.request(`/teacher/submissions/${id}`),
    gradeSubmission: (
      id: string,
      body: {
        score: number;
        feedback: string;
        answers: Array<{ question_id: string; score: number; feedback: string }>;
      }
    ) =>
      this.request(`/teacher/submissions/${id}/grade`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    getStats: () => this.request('/teacher/stats'),
    getClassrooms: () => this.request('/teacher/classrooms'),
    createClassroom: (body: { name: string; description?: string }) =>
      this.request('/teacher/classrooms', { method: 'POST', body: JSON.stringify(body) }),
    joinClassroom: (classCode: string) =>
      this.request('/teacher/classrooms/join', {
        method: 'POST',
        body: JSON.stringify({ classCode: classCode.trim().toUpperCase() }),
      }),
    getMyClassrooms: () => this.request<any[]>('/teacher/classrooms/my'),
    getClassroomMembers: (classroomId: string) =>
      this.request(`/teacher/classrooms/${classroomId}/members`),
  };

  // ==========================================
  // 8. ADMIN PORTAL (SPRINT 7)
  // ==========================================
  admin = {
    getDashboardKPIs: (params?: { period?: string; fromDate?: string; toDate?: string }) => {
      const query = new URLSearchParams();
      if (params?.period) query.append('period', params.period);
      if (params?.fromDate) query.append('fromDate', params.fromDate);
      if (params?.toDate) query.append('toDate', params.toDate);
      const qs = query.toString();
      return this.request<any>(`/admin/dashboard/stats${qs ? `?${qs}` : ''}`);
    },

    exportDashboardReportUrl: (params?: { period?: string; fromDate?: string; toDate?: string }) => {
      const query = new URLSearchParams();
      if (params?.period) query.append('period', params.period);
      if (params?.fromDate) query.append('fromDate', params.fromDate);
      if (params?.toDate) query.append('toDate', params.toDate);
      const qs = query.toString();
      return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/dashboard/export${qs ? `?${qs}` : ''}`;
    },

    getUsers: (params?: { search?: string; role?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.role && params.role !== 'ALL') query.append('role', params.role);
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      const qs = query.toString();
      return this.request(`/admin/users${qs ? `?${qs}` : ''}`);
    },

    createUser: (body: {
      email: string;
      password: string;
      fullName: string;
      role: 'STUDENT' | 'TEACHER' | 'ADMIN';
      phoneNumber?: string;
      targetBand?: 'B1_TARGET' | 'B2_TARGET' | 'C_TARGET';
      internalNotes?: string;
    }) =>
      this.request('/admin/users', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    bulkImportUsers: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return this.request('/admin/users/bulk-import', {
        method: 'POST',
        body: formData,
      });
    },

    updateUserStatus: (id: string, isActive: boolean) =>
      this.request(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),

    grantVip: (id: string, body: { planId?: string; days?: number; reason?: string }) =>
      this.request(`/admin/users/${id}/grant-vip`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    resetPassword: (id: string, body?: { newPassword?: string }) =>
      this.request(`/admin/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify(body || {}),
      }),

    adjustQuota: (id: string, body: { aiQuota: number; teacherQuota?: number; reason?: string }) =>
      this.request(`/admin/users/${id}/adjust-quota`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    getUserSummary: (id: string) => this.request(`/admin/users/${id}/summary`),

    getTransactions: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.status && params.status !== 'ALL') query.append('status', params.status);
      const qs = query.toString();
      return this.request(`/admin/transactions${qs ? `?${qs}` : ''}`);
    },

    resolveTransaction: (id: string, body: { status: string; note?: string; targetUserId?: string }) =>
      this.request(`/admin/transactions/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    createManualTransaction: (body: {
      userId: string;
      amount: number;
      planId?: string;
      paymentMethod?: string;
      note?: string;
    }) =>
      this.request('/admin/transactions/manual', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    getExams: (params?: { page?: number; limit?: number; skill?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.skill && params.skill !== 'ALL') query.append('skill', params.skill);
      const qs = query.toString();
      return this.request(`/admin/exams${qs ? `?${qs}` : ''}`);
    },

    createExam: (body: any) =>
      this.request('/admin/exams', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    deleteExam: (id: string) =>
      this.request(`/admin/exams/${id}`, {
        method: 'DELETE',
      }),

    updateExam: (id: string, body: any) =>
      this.request(`/admin/exams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    duplicateExam: (id: string) =>
      this.request(`/admin/exams/${id}/duplicate`, {
        method: 'POST',
      }),

    // ── Content Editor ──────────────────────────────────────────
    getExamFull: (id: string) => this.request(`/admin/exams/${id}/full`),

    updatePart: (partId: string, body: {
      title?: string; instructions?: string;
      passageText?: string; audioUrl?: string; imageUrl?: string;
    }) =>
      this.request(`/admin/parts/${partId}`, {
        method: 'PATCH', body: JSON.stringify(body),
      }),

    addPart: (examId: string, body: {
      title?: string; instructions?: string; partNumber?: number;
      passageText?: string; audioUrl?: string; imageUrl?: string;
    }) =>
      this.request(`/admin/exams/${examId}/parts`, {
        method: 'POST', body: JSON.stringify(body),
      }),

    deletePart: (partId: string) =>
      this.request(`/admin/parts/${partId}`, { method: 'DELETE' }),

    updateQuestion: (questionId: string, body: {
      prompt?: string; questionType?: string; options?: string[];
      correctAnswer?: string; explanation?: string; maxScore?: number; questionNumber?: number;
    }) =>
      this.request(`/admin/questions/${questionId}`, {
        method: 'PATCH', body: JSON.stringify(body),
      }),

    addQuestion: (partId: string, body: {
      prompt?: string; questionType?: string; options?: string[];
      correctAnswer?: string; explanation?: string; maxScore?: number; questionNumber?: number;
    }) =>
      this.request(`/admin/parts/${partId}/questions`, {
        method: 'POST', body: JSON.stringify(body),
      }),

    deleteQuestion: (questionId: string) =>
      this.request(`/admin/questions/${questionId}`, { method: 'DELETE' }),

    getPlans: () => this.request('/admin/plans'),

    updatePlan: (
      id: string,
      body: { price_vnd?: number; ai_quota?: number; teacher_quota?: number; is_active?: boolean }
    ) =>
      this.request(`/admin/plans/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  };

  // ==========================================
  // 9. AUDIT LOGS (ENTERPRISE AUDIT TRAIL)
  // ==========================================
  audit = {
    getLogs: (params?: { action?: string; entityType?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.action && params.action !== 'ALL') query.append('action', params.action);
      if (params?.entityType) query.append('entityType', params.entityType);
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      const qs = query.toString();
      return this.request(`/audit${qs ? `?${qs}` : ''}`);
    },

    getStats: () => this.request('/audit/stats'),
  };

  // ==========================================
  // 10. AI GRADING
  // ==========================================
  aiGrading = {
    evaluate: (submissionId: string) =>
      this.request(`/ai-grading/${submissionId}/evaluate-ai`, { method: 'POST' }),
    getFeedback: (submissionId: string) =>
      this.request(`/ai-grading/${submissionId}/ai-feedback`, { method: 'GET' }),
  };

  // ==========================================
  // 11. NOTIFICATIONS SYSTEM
  // ==========================================
  notifications = {
    getAll: (params?: { page?: number; limit?: number; isRead?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (typeof params?.isRead === 'boolean') q.append('isRead', params.isRead.toString());
      const qs = q.toString() ? `?${q.toString()}` : '';
      return this.request(`/notifications${qs}`);
    },
    getUnreadCount: () => this.request<{ unreadCount: number }>('/notifications/unread-count'),
    markAsRead: (id: string) => this.request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllAsRead: () => this.request<{ updatedCount: number }>('/notifications/read-all', { method: 'PATCH' }),
  };
}

export const api = new ApiClient();
