import {
  UserProfile,
  TopicId,
  TopicMastery,
  RoadmapResponse,
  Question,
  DiagnosticAnswerResponse,
  InstructorClass,
  StudentSummary,
  SpacedReviewItem,
  QuizHistoryItem,
  RecentActivityItem,
  GmailConfigStatus,
} from '../types';
import { saveStoredUser, saveStoredToken } from '../lib/storage';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('learnpath_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> || {}),
    };

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (err: any) {
      throw new Error(`Unable to connect to LearnPath backend (${err.message || 'Connection refused'}). Please verify the server is running.`);
    }

    if (!res.ok) {
      let errMsg = `Request failed with status ${res.status}`;
      let errData: any = {};
      try {
        errData = await res.json();
        if (errData?.error) {
          errMsg = errData.error;
        }
      } catch {
        if (res.statusText) errMsg = res.statusText;
      }
      if (res.status === 401) {
        if (endpoint !== '/auth/login' && endpoint !== '/auth/signup') {
          saveStoredToken(null);
          saveStoredUser(null);
        }
      }
      const error = new Error(errMsg) as any;
      error.data = errData;
      error.isFrozen = errData.isFrozen;
      error.remainingAttempts = errData.remainingAttempts;
      error.remainingSeconds = errData.remainingSeconds;
      error.waitSeconds = errData.waitSeconds;
      error.frozenUntil = errData.frozenUntil;
      throw error;
    }
    return res.json();
  }

  // --- Authentication ---
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await this.request<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveStoredToken(res.token);
    saveStoredUser(res.user);
    return res;
  }

  async signup(data: {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'instructor';
    classCode?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const res = await this.request<{ user: UserProfile; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    saveStoredToken(res.token);
    saveStoredUser(res.user);
    return res;
  }

  // --- Forgot Password Flow ---
  async requestForgotPasswordOtp(email: string): Promise<{
    success: boolean;
    message: string;
    cooldownSeconds: number;
    method: 'gmail';
    senderEmail?: string;
    attemptsRemaining: number;
  }> {
    return this.request('/auth/forgot-password/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resendForgotPasswordOtp(email: string): Promise<{
    success: boolean;
    message: string;
    cooldownSeconds: number;
    method: 'gmail';
    attemptsRemaining: number;
  }> {
    return this.request('/auth/forgot-password/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyForgotPasswordOtp(email: string, otp: string): Promise<{ success: boolean; resetToken: string; message: string }> {
    return this.request('/auth/forgot-password/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async resetForgotPassword(data: {
    email: string;
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkFreezeStatus(email: string): Promise<{ email: string; isFrozen: boolean; remainingSeconds: number; frozenUntil: number }> {
    return this.request(`/auth/freeze-status?email=${encodeURIComponent(email)}`, {
      method: 'GET',
    });
  }

  // --- Live Gmail SMTP Sender Management ---
  async getGmailConfigStatus(): Promise<GmailConfigStatus> {
    return this.request<GmailConfigStatus>('/auth/gmail-config/status', { method: 'GET' });
  }

  async saveGmailConfig(data: { gmailUser: string; gmailAppPassword: string; sendOtpTo?: string }): Promise<GmailConfigStatus & { otpDispatched?: boolean; message?: string }> {
    return this.request<GmailConfigStatus & { otpDispatched?: boolean; message?: string }>('/auth/gmail-config/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async testGmailConnection(recipientEmail: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/gmail-config/test', {
      method: 'POST',
      body: JSON.stringify({ recipientEmail }),
    });
  }

  async loginWithGoogle(email: string, name?: string, idToken?: string): Promise<{ user: UserProfile; token: string }> {
    const res = await this.request<{ user: UserProfile; token: string }>('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ email, name, idToken }),
    });
    saveStoredToken(res.token);
    saveStoredUser(res.user);
    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      saveStoredToken(null);
      saveStoredUser(null);
    }
  }

  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me', { method: 'GET' });
  }

  // --- Diagnostic Assessment ---
  async startDiagnostic(): Promise<{ session_id: string; total_questions: number; first_question: Question }> {
    return this.request('/diagnostic/start', { method: 'POST' });
  }

  async answerDiagnostic(sessionId: string, questionId: string, optionIndex: number): Promise<DiagnosticAnswerResponse> {
    return this.request<DiagnosticAnswerResponse>('/diagnostic/answer', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, question_id: questionId, option: optionIndex }),
    });
  }

  // --- Mastery & Roadmap ---
  async getMastery(): Promise<TopicMastery[]> {
    return this.request<TopicMastery[]>('/mastery', { method: 'GET' });
  }

  async getRoadmap(): Promise<RoadmapResponse> {
    return this.request<RoadmapResponse>('/roadmap', { method: 'GET' });
  }

  // --- Practice ---
  async getNextPractice(topicId?: TopicId, difficulty?: string): Promise<Question> {
    const query = new URLSearchParams();
    if (topicId) query.set('topic_id', topicId);
    if (difficulty && difficulty !== 'all') query.set('difficulty', difficulty);
    return this.request<Question>(`/practice/next?${query.toString()}`, { method: 'GET' });
  }

  async submitPractice(questionId: string, optionIndex: number): Promise<{
    correct: boolean;
    explanation: string;
    explanationUrdu?: string;
    mastery: Record<TopicId, number>;
    roadmap: RoadmapResponse;
    diff: any[];
  }> {
    return this.request('/practice/submit', {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, option: optionIndex }),
    });
  }

  // --- History & Activities ---
  async getHistory(): Promise<QuizHistoryItem[]> {
    return this.request<QuizHistoryItem[]>('/history', { method: 'GET' });
  }

  async getActivities(): Promise<RecentActivityItem[]> {
    return this.request<RecentActivityItem[]>('/history/activities', { method: 'GET' });
  }

  // --- Review & Spaced Repetition ---
  async getDueReviews(): Promise<SpacedReviewItem[]> {
    return this.request<SpacedReviewItem[]>('/review/due', { method: 'GET' });
  }

  async advanceTime(days: number): Promise<{ success: boolean; newOffsetDays: number }> {
    return this.request('/dev/advance-time', {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  }

  // --- Instructor ---
  async getClasses(): Promise<InstructorClass[]> {
    return this.request<InstructorClass[]>('/instructor/classes', { method: 'GET' });
  }

  async createClass(name: string): Promise<InstructorClass> {
    return this.request<InstructorClass>('/instructor/classes', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getClassHeatmap(classId: string): Promise<{ students: StudentSummary[]; topics: TopicId[] }> {
    return this.request(`/instructor/classes/${classId}/heatmap`, { method: 'GET' });
  }

  async getStudentDetail(studentId: string): Promise<StudentSummary> {
    return this.request<StudentSummary>(`/instructor/students/${studentId}`, { method: 'GET' });
  }

  // --- AI Provider Services ---
  async getAIStatus() {
    return this.request<any>('/ai/status', { method: 'GET' });
  }

  async askAITutor(data: { topic_id?: TopicId; question_id?: string; query: string; code?: string }) {
    return this.request<any>('/ai/tutor', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async explainConcept(questionId: string, answerText?: string): Promise<{ text: string; sources: string[] }> {
    return this.request<{ text: string; sources: string[] }>('/tutor/explain', {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, answer: answerText }),
    });
  }

  async explainWeakTopics(masteryMap: Record<TopicId, number>, topWeakestCount?: number) {
    return this.request<any>('/ai/explain-weak-topics', {
      method: 'POST',
      body: JSON.stringify({ masteryMap, topWeakestCount }),
    });
  }

  async generatePracticeQuestions(topicId: TopicId, difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate', count: number = 2) {
    return this.request<any>('/ai/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ topic_id: topicId, difficulty, count }),
    });
  }

  async explainMistake(questionId: string, optionIndex: number) {
    return this.request<any>('/ai/explain-mistake', {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, option_index: optionIndex }),
    });
  }

  async getPersonalizedStudyPlan(masteryMap: Record<TopicId, number>, weeklyHours: number = 5) {
    return this.request<any>('/ai/study-plan', {
      method: 'POST',
      body: JSON.stringify({ masteryMap, weeklyHours }),
    });
  }

  async explainPythonCode(code: string, focusArea?: string) {
    return this.request<any>('/ai/explain-code', {
      method: 'POST',
      body: JSON.stringify({ code, focus_area: focusArea }),
    });
  }

  // --- Admin API Methods ---
  async getAdminStats() {
    return this.request<{
      totalUsers: number;
      studentCount: number;
      instructorCount: number;
      adminCount: number;
      totalQuestions: number;
      totalClasses: number;
      totalQuizzes: number;
      averageQuizScore: number;
      database: {
        provider: string;
        region: string;
        status: string;
        connectionPooled: boolean;
      };
    }>('/admin/stats');
  }

  async getAdminUsers(params?: { search?: string; role?: string }) {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.role && params.role !== 'all') qs.set('role', params.role);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<{ users: UserProfile[] }>(`/admin/users${query}`);
  }

  async createAdminUser(userData: Partial<UserProfile> & { password?: string }) {
    return this.request<{ user: UserProfile }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateAdminUser(id: string, updates: Partial<UserProfile>) {
    return this.request<{ user: UserProfile }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAdminUser(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async resetAdminUserPassword(id: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async getAdminQuestions(params?: { topic?: string; difficulty?: string; search?: string }) {
    const qs = new URLSearchParams();
    if (params?.topic && params.topic !== 'all') qs.set('topic', params.topic);
    if (params?.difficulty && params.difficulty !== 'all') qs.set('difficulty', params.difficulty);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<{ questions: Question[] }>(`/admin/questions${query}`);
  }

  async createAdminQuestion(questionData: Partial<Question>) {
    return this.request<{ question: Question }>('/admin/questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  }

  async updateAdminQuestion(id: string, updates: Partial<Question>) {
    return this.request<{ question: Question }>(`/admin/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAdminQuestion(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/questions/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminClasses() {
    return this.request<{ classes: InstructorClass[] }>('/admin/classes');
  }

  async createAdminClass(data: { name: string; instructorId?: string }) {
    return this.request<{ class: InstructorClass }>('/admin/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminClass(id: string, updates: Partial<InstructorClass>) {
    return this.request<{ class: InstructorClass }>(`/admin/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAdminClass(id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/classes/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminQuizzes() {
    return this.request<{
      quizzes: Array<QuizHistoryItem & { userId: string; userName: string; userEmail: string }>;
    }>('/admin/quizzes');
  }

  async deleteAdminQuiz(userId: string, id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/quizzes/${userId}/${id}`, {
      method: 'DELETE',
    });
  }

  async setAdminUserMastery(userId: string, topicId: TopicId, score: number) {
    return this.request<{ success: boolean; topicId: string; score: number }>(
      `/admin/mastery/${userId}/${topicId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ score }),
      }
    );
  }

  async getAdminUserMastery(userId: string) {
    return this.request<{ userId: string; mastery: Record<TopicId, number> }>(`/admin/mastery/${userId}`);
  }

  async exportAdminData() {
    return this.request<any>('/admin/export');
  }
}

export const api = new ApiClient();
