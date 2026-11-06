/**
 * API Client for Aptis ESOL Premier E-learning Platform
 * Connects Next.js Frontend with Node.js/Express Backend (Port 5000)
 */

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('aptisesolpremier.com')) {
      return 'https://api.aptisesolpremier.com/api';
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
}

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
  private refreshPromise: Promise<string | null> | null = null;

  private getStoredAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('aptis_token')
    );
  }

  /**
   * Kiểm tra xem JWT accessToken đã hết hạn hoặc sắp hết hạn trong vòng 2 phút tới chưa
   */
  private isTokenExpiredOrExpiringSoon(token: string, bufferSeconds = 120): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      if (typeof payload.exp !== 'number') return false;
      return payload.exp * 1000 <= Date.now() + bufferSeconds * 1000;
    } catch {
      return false;
    }
  }

  private getAuthHeader(): Record<string, string> {
    const token = this.getStoredAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Tự động làm mới accessToken bằng refreshToken (Silent Auto-refresh)
   * Sử dụng Mutex Promise để tránh nhiều request gọi refresh trùng lặp đồng thời
   */
  public async refreshAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          return null;
        }

        const url = `${getApiBaseUrl()}/auth/refresh`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          // CHỈ xóa token khi server xác nhận 401/403 (Refresh token hết hạn sau 30 ngày hoặc bị thu hồi)
          // Không xóa khi lỗi 500/502/503 tạm thời lúc server đang khởi động lại
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
          return null;
        }

        const json = await res.json();
        if (json.success && json.data?.accessToken) {
          const newAccessToken = json.data.accessToken;
          const newRefreshToken = json.data.refreshToken;
          localStorage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          return newAccessToken;
        }

        return null;
      } catch (err) {
        console.error('[ApiClient] Lỗi mạng tạm thời khi làm mới phiên đăng nhập:', err);
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<ApiResponse<T>> {
    const isAuthEndpoint =
      endpoint === '/auth/login' ||
      endpoint === '/auth/refresh' ||
      endpoint === '/auth/register' ||
      endpoint === '/auth/google';

    // Proactive Refresh: Nếu accessToken sắp/đã hết hạn hoặc bị thiếu nhưng còn refreshToken,
    // chủ động làm mới trước khi gửi request (đặc biệt quan trọng cho các route optionalAuthGuard như GET /exams)
    if (typeof window !== 'undefined' && !isRetry && !isAuthEndpoint) {
      const currentToken = this.getStoredAccessToken();
      const hasRefresh = Boolean(localStorage.getItem('refreshToken'));
      if (hasRefresh && (!currentToken || this.isTokenExpiredOrExpiringSoon(currentToken))) {
        await this.refreshAccessToken();
      }
    }

    const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
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

      // Nếu 401 Unauthorized và chưa thử refresh, tự động gia hạn token ngầm và gửi lại request
      if (
        response.status === 401 &&
        !isRetry &&
        endpoint !== '/auth/login' &&
        endpoint !== '/auth/refresh' &&
        endpoint !== '/auth/register' &&
        typeof window !== 'undefined'
      ) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          return this.request<T>(endpoint, options, true);
        }
      }

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
          if (endpoint !== '/auth/login' && endpoint !== '/auth/me' && endpoint !== '/auth/refresh') {
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
    register: (body: { email: string; password: string; full_name?: string; fullName?: string; phone?: string; phoneNumber?: string }) => {
      const payload = {
        email: body.email,
        password: body.password,
        fullName: body.fullName || body.full_name || '',
        phoneNumber: body.phoneNumber || body.phone,
      };
      return this.request<{ user: any; tokens: { accessToken: string; refreshToken: string } }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    login: (body: { email: string; password: string }) =>
      this.request<{ user: any; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify(body) }
      ),

    googleConfig: () =>
      this.request<{ clientId: string }>('/auth/google-config', { method: 'GET' }),

    googleAuth: (credential: string) =>
      this.request<{ user: any; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/google',
        { method: 'POST', body: JSON.stringify({ credential }) }
      ),

    getMe: () => this.request('/auth/me', { method: 'GET' }),

    refresh: (refreshToken: string) =>
      this.request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),

    forgotPassword: (email: string) =>
      this.request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (body: { token: string; newPassword: string }) =>
      this.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    updateProfile: (body: { fullName?: string; phoneNumber?: string; avatarUrl?: string | null; targetBand?: string }) =>
      this.request('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      this.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    verifyEmail: (token: string) =>
      this.request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),

    resendVerification: () =>
      this.request('/auth/resend-verification', {
        method: 'POST',
      }),
  };

  // ==========================================
  // 2. EXAMS & QUESTIONS
  // ==========================================
  exams = {
    getAll: (params?: { page?: number; limit?: number; skill?: string; isPro?: boolean; isHot?: boolean; hotLevel?: number; source?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.skill) query.append('skill', params.skill);
      if (params?.isPro !== undefined) query.append('isPro', String(params.isPro));
      if (params?.isHot !== undefined) query.append('isHot', String(params.isHot));
      if (params?.hotLevel !== undefined) query.append('hotLevel', String(params.hotLevel));
      if (params?.source) query.append('source', params.source);
      const qs = query.toString();
      return this.request(`/exams${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
    },

    getById: (id: string) => this.request(`/exams/${id}`),

    getQuestions: (id: string, options?: { mode?: string }) =>
      this.request(`/exams/${id}/questions${options?.mode ? `?mode=${encodeURIComponent(options.mode)}` : ''}`),

    getMarathon: (skill: string) =>
      this.request(`/exams/marathon?skill=${encodeURIComponent(skill)}`),

    gradeGuest: (
      id: string,
      answers: Array<{
        questionId: string;
        selectedOption?: string | null;
        textAnswer?: string | null;
      }>
    ) =>
      this.request(`/exams/${id}/grade-guest`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }),

    reportQuestion: (
      id: string,
      body: {
        questionId?: string;
        questionNumber?: number;
        reason: string;
        note?: string;
      }
    ) =>
      this.request(`/exams/${id}/report-question`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    customBuilder: (body: { title: string; skill_types: string[]; duration_minutes: number }) =>
      this.request('/exams/custom-builder', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  };

  marathon = {
    getCatalog: (skill: string, part: number) =>
      this.request(`/marathon/catalog?skill=${encodeURIComponent(skill)}&part=${part}`),

    getBatch: (skill: string, part: number, indices: number[]) =>
      this.request(
        `/marathon/batch?skill=${encodeURIComponent(skill)}&part=${part}&indices=${indices.join(',')}`
      ),

    getProgress: (skill: string, part: number) =>
      this.request(`/marathon/progress?skill=${encodeURIComponent(skill)}&part=${part}`),

    autosave: (data: {
      skill: string;
      partNumber: number;
      currentExamIndex: number;
      currentExamId?: string;
      currentDraftAnswers?: Record<string, any>;
      currentDraftOrders?: Record<string, any>;
      additionalTimeSeconds?: number;
    }) =>
      this.request('/marathon/progress/autosave', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    completeExam: (data: {
      skill: string;
      partNumber: number;
      examId: string;
      examIndex: number;
      answers: Record<string, string>;
      orders?: Record<string, string[]>;
      timeSpentSeconds?: number;
    }) =>
      this.request('/marathon/progress/complete-exam', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    resetProgress: (data: {
      skill: string;
      partNumber: number;
      scope?: 'EXAM' | 'ALL';
      examId?: string;
    }) =>
      this.request('/marathon/progress/reset', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // ==========================================
  // 3. EXAM SUBMISSIONS & ROOM LIFECYCLE
  // ==========================================
  submissions = {
    start: (examId: string, forceNew = false) =>
      this.request('/submissions', {
        method: 'POST',
        body: JSON.stringify({ examId, forceNew }),
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
  // 3.2. COURSES, BATCHES & SOCIAL FEEDBACK
  // ==========================================
  courses = {
    getFeaturedFasttrack: () => this.request('/courses/featured-fasttrack'),
    registerLead: (body: {
      courseId?: string;
      courseCode?: string;
      batchId?: string;
      batchDateStr?: string;
      fullName: string;
      phoneNumber: string;
      email?: string;
      targetBand?: string;
      note?: string;
    }) =>
      this.request('/courses/leads/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  };

  feedbacks = {
    getFeatured: () => this.request('/cms/featured-feedbacks'),
  };

  settings = {
    getPublic: () => this.request('/settings/public', { cache: 'no-store' }),
    update: (body: { settings: Array<{ key: string; value: string; description?: string }> }) =>
      this.request('/settings', {
        method: 'PUT',
        body: JSON.stringify(body),
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

    translate: (text: string) =>
      this.request<{
        originalText: string;
        translatedText: string;
        isWord: boolean;
        phonetic?: string | null;
        audioUrl?: string | null;
        partOfSpeech?: string | null;
        definitionEn?: string | null;
        exampleEn?: string | null;
        cefrLevel?: string;
        wordId?: string | null;
        isSavedInNotebook: boolean;
      }>('/vocabulary/translate', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),

    quickSaveToNotebook: (data: {
      word: string;
      meaning_vi: string;
      phonetic?: string;
      example_sentence?: string;
      cefr_level?: string;
      audio_url?: string;
    }) =>
      this.request('/vocabulary/notebook/quick-save', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getNotebook: () => this.request('/vocabulary/notebook'),
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

    getFeaturedPromo: () =>
      this.request<{
        id: string;
        code: string;
        title: string;
        description?: string;
        codeType: string;
        durationDays: number;
        aiQuota: number;
        discountAmount?: number;
        discountPercent?: number;
        expiresAt?: string;
        planName?: string;
      } | null>('/payment/featured-promo'),

    redeemPromoCode: (code: string) =>
      this.request('/payment/redeem-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
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
    updateQuestionExplanation: (questionId: string, explanation: string) =>
      this.request(`/teacher/questions/${questionId}/explanation`, {
        method: 'PATCH',
        body: JSON.stringify({ explanation }),
      }),
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
      return `${getApiBaseUrl()}/admin/dashboard/export${qs ? `?${qs}` : ''}`;
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

    getExams: (params?: { page?: number; limit?: number; skill?: string; search?: string; partNumber?: number; hotLevel?: number | string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.skill && params.skill !== 'ALL') query.append('skill', params.skill);
      if (params?.search && params.search.trim()) query.append('search', params.search.trim());
      if (params?.partNumber) query.append('partNumber', params.partNumber.toString());
      if (params?.hotLevel !== undefined && params.hotLevel !== 'ALL') query.append('hotLevel', params.hotLevel.toString());
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

    bulkUpdateHotLevel: (body: {
      examIds?: string[];
      hotLevel?: number;
      isPublished?: boolean;
      skill?: string;
      rules?: Array<{ keywords: string[]; hotLevel: number }>;
    }) =>
      this.request<{ updated: number; unmatched: string[]; matched: any[] }>(
        '/admin/exams/bulk-hot-level',
        { method: 'PATCH', body: JSON.stringify(body) }
      ),

    duplicateExam: (id: string) =>
      this.request(`/admin/exams/${id}/duplicate`, {
        method: 'POST',
      }),

    rerandomizeExam: (id: string) =>
      this.request(`/admin/exams/${id}/rerandomize`, {
        method: 'POST',
      }),

    generateFullTestExams: () =>
      this.request('/admin/exams/generate-fulltests', {
        method: 'POST',
      }),

    getImportTemplates: () => this.request<any>('/admin/exams/import/templates'),

    validateImportExamFile: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return this.request<any>('/admin/exams/import/validate', {
        method: 'POST',
        body: formData,
      }).then((res) => {
        if (!res.success) throw new Error(res.message || 'Lỗi khi kiểm định tập tin');
        return res.data;
      });
    },

    confirmImportExams: (exams: any[]) =>
      this.request<any>('/admin/exams/import/confirm', {
        method: 'POST',
        body: JSON.stringify({ exams }),
      }),

    uploadExamImage: (image: File, category?: string, previousUrl?: string) => {
      const formData = new FormData();
      formData.append('image', image);
      if (category) formData.append('category', category);
      if (previousUrl) formData.append('previousUrl', previousUrl);
      return this.request<any>('/admin/exams/upload-image', {
        method: 'POST',
        body: formData,
      }).then((res) => {
        if (!res.success) throw new Error(res.message || 'Lỗi khi tải ảnh lên');
        return res.data;
      });
    },

    deleteExamImage: (url: string) => {
      return this.request<any>('/admin/exams/delete-image', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    },

    uploadExamAudio: (audio: File, category?: string, previousUrl?: string) => {
      const formData = new FormData();
      formData.append('audio', audio);
      if (category) formData.append('category', category);
      if (previousUrl) formData.append('previousUrl', previousUrl);
      return this.request<any>('/admin/exams/upload-audio', {
        method: 'POST',
        body: formData,
      }).then((res) => {
        if (!res.success) throw new Error(res.message || 'Lỗi khi tải âm thanh lên');
        return res.data;
      });
    },

    deleteExamAudio: (url: string) => {
      return this.request<any>('/admin/exams/delete-audio', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    },

    generateAudioTts: (data: { text: string; voice?: string; prefix?: string; previousUrl?: string }) => {
      return this.request<any>('/admin/exams/generate-audio-tts', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.success) throw new Error(res.message || 'Lỗi khi tạo âm thanh AI');
        return res.data;
      });
    },

    uploadImportImage: (image: File) => {
      const formData = new FormData();
      formData.append('image', image);
      return this.request<any>('/admin/exams/import/upload-image', {
        method: 'POST',
        body: formData,
      }).then((res) => {
        if (!res.success) throw new Error(res.message || 'Lỗi khi tải ảnh lên');
        return res.data;
      });
    },

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
      prompt?: string; questionType?: string; options?: any;
      correctAnswer?: string; explanation?: string; maxScore?: number; questionNumber?: number;
    }) =>
      this.request(`/admin/questions/${questionId}`, {
        method: 'PATCH', body: JSON.stringify(body),
      }),

    generateSpeakingHints: (questionId: string) =>
      this.request<{
        partNumber: 2 | 3;
        topicTitle: string;
        keywords: string[];
        startingPhrases: string[];
        linkingPhrases: string[];
        aiImagePrompts: {
          image1Prompt: string;
          image2Prompt?: string;
        };
      }>(`/admin/questions/${questionId}/generate-speaking-hints`, {
        method: 'POST',
      }),

    getSpeakingHintsOverview: () =>
      this.request<{
        summary: {
          totalParts: number;
          completedCount: number;
          pendingCount: number;
          missingImageCount: number;
          completionRate: number;
        };
        items: Array<{
          partId: string;
          partNumber: 2 | 3;
          partTitle: string;
          examId: string;
          examTitle: string;
          examCode: string;
          skill: string;
          imageUrl: string | null;
          secondImageUrl: string | null;
          hasImage: boolean;
          status: 'COMPLETED' | 'PENDING' | 'MISSING_IMAGE';
          questionCount: number;
          firstQuestionId: string | null;
          vocabularyHints: any | null;
          questions: Array<{
            id: string;
            question_number: number;
            prompt: string;
          }>;
        }>;
      }>('/admin/speaking-hints/overview'),

    generatePartSpeakingHints: (partId: string) =>
      this.request<any>(`/admin/parts/${partId}/generate-speaking-hints`, { method: 'POST' }),

    savePartSpeakingHints: (partId: string, hints: any) =>
      this.request<{ success: boolean }>(`/admin/parts/${partId}/speaking-hints`, {
        method: 'POST',
        body: JSON.stringify({ hints }),
      }),

    suggestPartImages: (partId: string) =>
      this.request<{
        partId: string;
        partNumber: 2 | 3;
        topicTitle: string;
        analysis: {
          summary: string;
          concept1: string;
          concept2?: string;
          searchQuery1: string;
          searchQuery2?: string;
        };
        candidatePairs: Array<{
          id: string;
          title: string;
          image1: {
            id: string;
            title: string;
            previewUrl: string;
            downloadUrl: string;
            source: string;
            photographer?: string;
          };
          image2?: {
            id: string;
            title: string;
            previewUrl: string;
            downloadUrl: string;
            source: string;
            photographer?: string;
          };
        }>;
      }>(`/admin/parts/${partId}/suggest-images`, { method: 'POST' }),

    applySuggestedPartImages: (
      partId: string,
      data: { image1SourceUrl: string; image2SourceUrl?: string }
    ) =>
      this.request<{
        partId: string;
        newImageUrl: string;
      }>(`/admin/parts/${partId}/apply-suggested-images`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    batchGenerateAllSpeakingHints: (body?: { skipExisting?: boolean; delayMs?: number; partIds?: string[] }) =>
      this.request<{
        processed: number;
        succeeded: number;
        skipped: number;
        failed: number;
        errors: Array<{ partId: string; examTitle: string; partNumber: number; error: string }>;
      }>('/admin/speaking-hints/batch-all', {
        method: 'POST',
        body: JSON.stringify(body || {}),
      }),

    batchGenerateSpeakingHints: (examId: string) =>
      this.request<{ updatedCount: number; totalCount: number }>(
        `/admin/exams/${examId}/batch-generate-speaking-hints`,
        { method: 'POST' }
      ),

    addQuestion: (partId: string, body: {
      prompt?: string; questionType?: string; options?: string[];
      correctAnswer?: string; explanation?: string; maxScore?: number; questionNumber?: number;
    }) =>
      this.request(`/admin/parts/${partId}/questions`, {
        method: 'POST', body: JSON.stringify(body),
      }),

    deleteQuestion: (questionId: string) =>
      this.request(`/admin/questions/${questionId}`, { method: 'DELETE' }),

    searchQuestions: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      skill?: string;
      partNumber?: number;
      questionType?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.search && params.search.trim()) query.append('search', params.search.trim());
      if (params?.skill && params.skill !== 'ALL') query.append('skill', params.skill);
      if (params?.partNumber) query.append('partNumber', params.partNumber.toString());
      if (params?.questionType && params.questionType !== 'ALL') query.append('questionType', params.questionType);
      const qs = query.toString();
      return this.request<any>(`/admin/questions${qs ? `?${qs}` : ''}`);
    },

    getPlans: () => this.request('/admin/plans'),

    updatePlan: (
      id: string,
      body: { price_vnd?: number; ai_quota?: number; teacher_quota?: number; is_active?: boolean }
    ) =>
      this.request(`/admin/plans/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    backups: {
      getStats: () => this.request<any>('/admin/backups/stats'),
      list: () => this.request<any>('/admin/backups'),
      create: (type: 'full' | 'sql' | 'json' = 'full', retentionCount = 10) =>
        this.request<any>('/admin/backups', {
          method: 'POST',
          body: JSON.stringify({ type, retentionCount }),
        }),
      restore: (filename: string) =>
        this.request<any>('/admin/backups/restore', {
          method: 'POST',
          body: JSON.stringify({ filename }),
        }),
      delete: (filename: string) =>
        this.request<any>(`/admin/backups/${encodeURIComponent(filename)}`, {
          method: 'DELETE',
        }),
      getDownloadUrl: (filename: string) =>
        `${getApiBaseUrl()}/admin/backups/${encodeURIComponent(filename)}/download`,
    },

    
    // ── Promotions & Voucher Management ──────────────────────
    promotions: {
      list: () => this.request<any[]>('/admin/promotions'),
      create: (data: any) =>
        this.request<any>('/admin/promotions', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: any) =>
        this.request<any>(`/admin/promotions/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        this.request<any>(`/admin/promotions/${id}`, {
          method: 'DELETE',
        }),
      getRedemptions: (id: string) =>
        this.request<any>(`/admin/promotions/${id}/redemptions`),
    },

    dataSync: {
      getOverview: () => this.request<any>('/admin/data-sync/overview'),
      runStandardize: () =>
        this.request<any>('/admin/data-sync/standardize', {
          method: 'POST',
        }),
      runAudit: (sampleLimit = 35) =>
        this.request<any>('/admin/data-sync/audit', {
          method: 'POST',
          body: JSON.stringify({ sampleLimit }),
        }),
      syncBatch: (body: {
        snapshotId?: 'aptisacademy' | 'aptiskytich';
        exams?: any[];
        defaultSource?: string;
        dryRun?: boolean;
        limit?: number;
      }) =>
        this.request<any>('/admin/data-sync/sync-batch', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      resolveExam: (body: {
        action: 'OVERWRITE' | 'CREATE_VARIANT' | 'SKIP';
        incomingExam: any;
        existingExamId?: string;
        variantTag?: string;
      }) =>
        this.request<any>('/admin/data-sync/resolve-exam', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
    },

    // ── Topic Tagging & Auto-Propagation ───────────────────────
    getTopicRules: () => this.request<any>('/admin/topic-tags'),
    previewTopicMatches: (body: { keywords: string[]; skill?: string }) =>
      this.request<any>('/admin/topic-tags/preview-matches', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    saveTopicRule: (body: any) =>
      this.request<any>('/admin/topic-tags', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    syncAllTopicRules: () =>
      this.request<any>('/admin/topic-tags/sync-all', {
        method: 'POST',
      }),
        getReports: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.status) query.append('status', params.status);
      if (params?.search) query.append('search', params.search);
      const qs = query.toString();
      return this.request<any>(`/admin/reports${qs ? `?${qs}` : ''}`);
    },
    resolveReport: (id: string, data: { status: string; note?: string; resolutionNote?: string }) => {
      return this.request<any>(`/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
deleteTopicRule: (id: string, resetHot?: boolean) =>
      this.request<any>(`/admin/topic-tags/${id}?reset=${Boolean(resetHot)}`, {
        method: 'DELETE',
      }),
  };

  // ==========================================
  // 9. AUDIT LOGS (ENTERPRISE AUDIT TRAIL)
  // ==========================================
  audit = {
    getLogs: (params?: { action?: string; entityType?: string; search?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.action && params.action !== 'ALL') query.append('action', params.action);
      if (params?.entityType) query.append('entityType', params.entityType);
      if (params?.search) query.append('search', params.search);
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
