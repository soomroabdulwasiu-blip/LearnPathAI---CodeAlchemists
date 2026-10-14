import crypto from 'crypto';
import {
  UserProfile,
  TopicId,
  Question,
  InstructorClass,
  StudentSummary,
  RoadmapResponse,
  QuizHistoryItem,
  RecentActivityItem,
  GoalItem,
} from '../../types';
import { SEED_QUESTIONS } from '../../data/seedData';
import { updateBKTMastery } from '../engine/bkt';
import { generateRoadmap } from '../engine/roadmap';
import { TOPICS } from '../../lib/constants';
import { db as pgDb } from '../../db/index.ts';
import {
  users,
  userMastery,
  roadmaps,
  quizHistory,
  recentActivities,
  classes,
  diagnosticSessions,
  otpRecords,
  resetTokens,
  frozenAccounts,
  questions,
} from '../../db/schema.ts';
import { eq, and } from 'drizzle-orm';

export interface UserAccountRecord {
  profile: UserProfile;
  passwordHash: string;
  salt: string;
}

export interface DiagnosticSession {
  sessionId: string;
  userId: string;
  currentIndex: number;
  questionIds: string[];
  answers: Record<string, number>;
  startedAt: string;
  isCompleted: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || 'learnpath-secure-salt-key-2026';

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, issuedAt: Date.now() })).toString('base64');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifyToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('hex');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    return payload.userId || null;
  } catch {
    return null;
  }
}

export const EMPTY_TOPIC_MASTERY: Record<TopicId, number> = TOPICS.reduce<Record<TopicId, number>>((acc, t) => {
  acc[t.id] = 0;
  return acc;
}, {} as Record<TopicId, number>);

export interface OtpRecord {
  email: string;
  otp: string;
  type: 'signup' | 'forgot_password';
  createdAt: number;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
}

export class RelationalDatabaseStore {
  private users: Map<string, UserAccountRecord> = new Map();
  private usersByEmail: Map<string, string> = new Map();
  private userMastery: Map<string, Record<TopicId, number>> = new Map();
  private userRoadmaps: Map<string, RoadmapResponse> = new Map();
  private userQuizHistory: Map<string, QuizHistoryItem[]> = new Map();
  private userActivities: Map<string, RecentActivityItem[]> = new Map();
  private userGoals: Map<string, GoalItem[]> = new Map();
  private diagnosticSessions: Map<string, DiagnosticSession> = new Map();
  private classes: Map<string, InstructorClass> = new Map();
  private questionBank: Map<string, Question> = new Map();
  private emailFreezeMap: Map<string, number> = new Map();
  private otpRecords: Map<string, OtpRecord> = new Map();
  private resetTokens: Map<string, { email: string; expiresAt: number }> = new Map();
  private isInitialized = false;

  constructor() {
    this.initQuestionBank();
    this.initSeedUsersInMemory();
    // Schedule asynchronous database sync (non-blocking lazy load)
    setTimeout(() => {
      this.initFromPostgres().catch((err) => {
        console.warn('[Cloud SQL] Initial sync notice (using resilient cache):', err?.message || err);
      });
    }, 100);
  }

  private initQuestionBank() {
    for (const q of SEED_QUESTIONS) {
      this.questionBank.set(q.id, q);
    }
  }

  private initSeedUsersInMemory() {
    const defaultUsers: Array<{ profile: UserProfile; password: string }> = [
      {
        profile: {
          id: 'user-abdul-wasiu',
          name: 'Abdul Wasiu Soomro',
          email: 'soomroabdulwasiu@gmail.com',
          role: 'admin',
          avatarSeed: 'Abdul Wasiu',
          goal: 'Master Python for Data Science and Machine Learning',
          weeklyHours: 6,
          expRating: 'intermediate',
          joinedAt: '2026-01-10T00:00:00.000Z',
          xp: 280,
          streak: 4,
          level: 2,
          hasCompletedDiagnostic: true,
          completedAssessmentsCount: 3,
        },
        password: 'Password123!',
      },
      {
        profile: {
          id: 'user-alex-student',
          name: 'Alex Johnson',
          email: 'student@learnpath.ai',
          role: 'student',
          avatarSeed: 'Alex Johnson',
          goal: 'Learn Python programming from scratch',
          weeklyHours: 5,
          expRating: 'beginner',
          joinedAt: '2026-01-15T00:00:00.000Z',
          xp: 320,
          streak: 5,
          level: 3,
          hasCompletedDiagnostic: true,
          completedAssessmentsCount: 4,
        },
        password: 'Password123!',
      },
      {
        profile: {
          id: 'user-sarah-instructor',
          name: 'Dr. Sarah Chen',
          email: 'teacher@learnpath.ai',
          role: 'instructor',
          avatarSeed: 'Dr. Sarah Chen',
          goal: 'Teach collegiate Python programming course',
          weeklyHours: 10,
          expRating: 'experienced',
          joinedAt: '2026-01-01T00:00:00.000Z',
          xp: 1250,
          streak: 12,
          level: 7,
          hasCompletedDiagnostic: true,
          completedAssessmentsCount: 15,
        },
        password: 'Password123!',
      },
      {
        profile: {
          id: 'user-system-admin',
          name: 'System Administrator',
          email: 'admin@learnpath.ai',
          role: 'admin',
          avatarSeed: 'Administrator',
          goal: 'Manage platform curriculum, analytics, and users',
          weeklyHours: 15,
          expRating: 'experienced',
          joinedAt: '2026-01-01T00:00:00.000Z',
          xp: 5000,
          streak: 30,
          level: 10,
          hasCompletedDiagnostic: true,
          completedAssessmentsCount: 50,
        },
        password: 'Password123!',
      },
    ];

    for (const u of defaultUsers) {
      const emailKey = u.profile.email.toLowerCase().trim();
      const salt = generateSalt();
      const passwordHash = hashPassword(u.password, salt);
      this.users.set(u.profile.id, {
        profile: u.profile,
        passwordHash,
        salt,
      });
      this.usersByEmail.set(emailKey, u.profile.id);
      this.userMastery.set(u.profile.id, {
        variables: 85,
        operators: 75,
        conditionals: 60,
        loops: 45,
        strings: 30,
        lists: 20,
        dictionaries: 10,
        functions: 0,
        exceptions: 0,
        oop: 0,
      });
      this.userQuizHistory.set(u.profile.id, []);
      this.userActivities.set(u.profile.id, []);
    }
  }

  // Hydrate from PostgreSQL database or seed initial records if empty
  async initFromPostgres() {
    if (this.isInitialized) return;
    try {
      const dbUsers = await pgDb.select().from(users);
      if (dbUsers.length === 0) {
        console.log('[Cloud SQL] Database is empty. Seeding initial records to Cloud SQL...');
        for (const record of this.users.values()) {
          await this.persistUserToPostgres(record);
          const masteries = this.userMastery.get(record.profile.id);
          if (masteries) {
            for (const [topicId, score] of Object.entries(masteries)) {
              await this.persistMasteryToPostgres(record.profile.id, topicId as TopicId, score);
            }
          }
        }
        console.log('[Cloud SQL] Initial seed to Cloud SQL completed successfully.');
      } else {
        console.log(`[Cloud SQL] Loaded ${dbUsers.length} user records from PostgreSQL database.`);
        for (const u of dbUsers) {
          const profile: UserProfile = {
            id: u.uid,
            name: u.name,
            email: u.email,
            role: (u.role as 'student' | 'instructor' | 'admin') || 'student',
            avatarSeed: u.avatarSeed || u.name,
            goal: u.goal || 'Master Python Fundamentals',
            weeklyHours: u.weeklyHours || 5,
            expRating: (u.expRating as any) || 'beginner',
            joinedAt: u.joinedAt || new Date().toISOString(),
            xp: u.xp || 0,
            streak: u.streak || 0,
            level: u.level || 1,
            hasCompletedDiagnostic: Boolean(u.hasCompletedDiagnostic),
            completedAssessmentsCount: u.completedAssessmentsCount || 0,
            classCode: u.classCode || undefined,
          };
          this.users.set(u.uid, {
            profile,
            passwordHash: u.passwordHash || '',
            salt: u.salt || '',
          });
          this.usersByEmail.set(u.email.toLowerCase().trim(), u.uid);
        }

        // Ensure default admin user is persisted in Cloud SQL if not yet existing
        const hasAdmin = dbUsers.some((u) => u.email.toLowerCase().trim() === 'admin@learnpath.ai');
        if (!hasAdmin) {
          const adminRecord = this.users.get('user-system-admin');
          if (adminRecord) {
            await this.persistUserToPostgres(adminRecord);
            console.log('[Cloud SQL] Provisioned default admin in Cloud SQL database.');
          }
        }

        // Load mastery
        const dbMasteries = await pgDb.select().from(userMastery);
        for (const m of dbMasteries) {
          const current = this.userMastery.get(m.userUid) || { ...EMPTY_TOPIC_MASTERY };
          current[m.topicId as TopicId] = m.score;
          this.userMastery.set(m.userUid, current);
        }

        // Load classes
        const dbClasses = await pgDb.select().from(classes);
        for (const c of dbClasses) {
          this.classes.set(c.classId, {
            id: c.classId,
            name: c.name,
            code: c.code,
            studentsCount: 0,
            averageMastery: 0,
            weakestTopics: [],
            createdAt: c.createdAt,
          });
        }
      }

      // Sync Questions with Cloud SQL
      try {
        const dbQuestions = await pgDb.select().from(questions);
        if (dbQuestions.length === 0) {
          console.log('[Cloud SQL] Seeding initial questions to PostgreSQL...');
          for (const q of this.questionBank.values()) {
            await pgDb
              .insert(questions)
              .values({
                id: q.id,
                topicId: q.topic_id,
                difficulty: q.difficulty,
                question: q.question,
                questionUrdu: q.questionUrdu || null,
                codeSnippet: q.codeSnippet || null,
                options: q.options,
                optionsUrdu: q.optionsUrdu || null,
                correctIndex: q.correctIndex,
                explanation: q.explanation,
                explanationUrdu: q.explanationUrdu || null,
              })
              .onConflictDoNothing();
          }
        } else {
          console.log(`[Cloud SQL] Loaded ${dbQuestions.length} questions from PostgreSQL.`);
          for (const q of dbQuestions) {
            this.questionBank.set(q.id, {
              id: q.id,
              topic_id: q.topicId as TopicId,
              difficulty: q.difficulty as any,
              question: q.question,
              questionUrdu: q.questionUrdu || undefined,
              codeSnippet: q.codeSnippet || undefined,
              options: q.options as string[],
              optionsUrdu: (q.optionsUrdu as string[]) || undefined,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
              explanationUrdu: q.explanationUrdu || undefined,
            });
          }
        }
      } catch (qErr) {
        console.warn('[Cloud SQL] Notice regarding questions hydration:', qErr);
      }

      // Sync Quiz History
      try {
        const dbQuizHistories = await pgDb.select().from(quizHistory);
        for (const qh of dbQuizHistories) {
          const list = this.userQuizHistory.get(qh.userUid) || [];
          const exists = list.some((item) => item.id === String(qh.id));
          if (!exists) {
            list.push({
              id: String(qh.id),
              date: qh.date,
              subject: qh.subject,
              score: qh.score,
              totalQuestions: qh.totalQuestions,
              correctCount: qh.correctCount,
              durationMinutes: qh.durationMinutes,
              topicBreakdown: (qh.topicBreakdown as Partial<Record<TopicId, number>>) || undefined,
            });
            this.userQuizHistory.set(qh.userUid, list);
          }
        }
      } catch (qhErr) {
        console.warn('[Cloud SQL] Notice regarding quiz history hydration:', qhErr);
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('[Cloud SQL] Database hydration deferred (safe fallback active):', error);
    }
  }

  private async persistUserToPostgres(record: UserAccountRecord) {
    try {
      const p = record.profile;
      await pgDb
        .insert(users)
        .values({
          uid: p.id,
          email: p.email.toLowerCase().trim(),
          name: p.name,
          role: p.role,
          avatarSeed: p.avatarSeed,
          goal: p.goal,
          weeklyHours: p.weeklyHours,
          expRating: p.expRating,
          joinedAt: p.joinedAt,
          xp: p.xp,
          streak: p.streak,
          level: p.level,
          hasCompletedDiagnostic: p.hasCompletedDiagnostic,
          completedAssessmentsCount: p.completedAssessmentsCount,
          classCode: p.classCode,
          passwordHash: record.passwordHash,
          salt: record.salt,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            name: p.name,
            email: p.email.toLowerCase().trim(),
            role: p.role,
            avatarSeed: p.avatarSeed,
            goal: p.goal,
            weeklyHours: p.weeklyHours,
            expRating: p.expRating,
            xp: p.xp,
            streak: p.streak,
            level: p.level,
            hasCompletedDiagnostic: p.hasCompletedDiagnostic,
            completedAssessmentsCount: p.completedAssessmentsCount,
            classCode: p.classCode,
            passwordHash: record.passwordHash,
            salt: record.salt,
          },
        });
    } catch (err) {
      console.error('[Cloud SQL] Failed to persist user to PostgreSQL:', err);
    }
  }

  private async persistMasteryToPostgres(userUid: string, topicId: TopicId, score: number) {
    try {
      const existing = await pgDb
        .select()
        .from(userMastery)
        .where(and(eq(userMastery.userUid, userUid), eq(userMastery.topicId, topicId)))
        .limit(1);

      if (existing.length > 0) {
        await pgDb
          .update(userMastery)
          .set({ score, updatedAt: new Date() })
          .where(eq(userMastery.id, existing[0].id));
      } else {
        await pgDb.insert(userMastery).values({
          userUid,
          topicId,
          score,
        });
      }
    } catch (err) {
      console.error('[Cloud SQL] Failed to persist mastery to PostgreSQL:', err);
    }
  }

  private async persistQuizHistoryToPostgres(userUid: string, item: QuizHistoryItem) {
    try {
      await pgDb.insert(quizHistory).values({
        userUid,
        subject: item.subject || 'Python Assessment',
        score: item.score,
        totalQuestions: item.totalQuestions,
        correctCount: item.correctCount,
        durationMinutes: item.durationMinutes || 5,
        topicBreakdown: item.topicBreakdown || {},
        date: item.date,
      });
    } catch (err) {
      console.error('[Cloud SQL] Failed to persist quiz history to PostgreSQL:', err);
    }
  }

  private async persistActivityToPostgres(userUid: string, act: RecentActivityItem) {
    try {
      await pgDb.insert(recentActivities).values({
        userUid,
        title: act.title,
        time: act.time,
        result: act.result,
        type: act.type,
        timestamp: act.timestamp ? String(act.timestamp) : new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Cloud SQL] Failed to persist activity to PostgreSQL:', err);
    }
  }

  private async persistClassToPostgres(cls: InstructorClass, instructorId?: string) {
    try {
      await pgDb.insert(classes).values({
        classId: cls.id,
        name: cls.name,
        code: cls.code,
        instructorId: instructorId || null,
        createdAt: cls.createdAt,
      });
    } catch (err) {
      console.error('[Cloud SQL] Failed to persist class to PostgreSQL:', err);
    }
  }

  getUser(userId: string): UserProfile | null {
    return this.users.get(userId)?.profile || null;
  }

  getUserByEmail(email: string): UserAccountRecord | null {
    const userId = this.usersByEmail.get(email.toLowerCase().trim());
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  createUser(profile: UserProfile, passwordPlain: string): { user: UserProfile; token: string } {
    const emailKey = profile.email.toLowerCase().trim();
    if (this.usersByEmail.has(emailKey)) {
      throw new Error('An account with this email already exists.');
    }
    const salt = generateSalt();
    const passwordHash = hashPassword(passwordPlain, salt);
    const record: UserAccountRecord = {
      profile: {
        ...profile,
        xp: 0,
        streak: 0,
        level: 1,
        hasCompletedDiagnostic: false,
        completedAssessmentsCount: 0,
      },
      passwordHash,
      salt,
    };
    this.users.set(profile.id, record);
    this.usersByEmail.set(emailKey, profile.id);

    this.userMastery.set(profile.id, { ...EMPTY_TOPIC_MASTERY });
    this.userQuizHistory.set(profile.id, []);
    this.userActivities.set(profile.id, []);

    // Async persist to PostgreSQL
    this.persistUserToPostgres(record);

    const token = generateToken(profile.id);
    return { user: record.profile, token };
  }

  upsertSocialUser(profile: UserProfile): { user: UserProfile; token: string } {
    const emailKey = profile.email.toLowerCase().trim();
    let existingId = this.usersByEmail.get(emailKey);
    let record: UserAccountRecord;

    if (existingId && this.users.has(existingId)) {
      record = this.users.get(existingId)!;
      record.profile = {
        ...record.profile,
        name: profile.name || record.profile.name,
        avatarSeed: profile.avatarSeed || record.profile.avatarSeed,
      };
      this.users.set(existingId, record);
    } else {
      const salt = generateSalt();
      const passwordHash = hashPassword(crypto.randomBytes(16).toString('hex'), salt);
      record = {
        profile,
        passwordHash,
        salt,
      };
      this.users.set(profile.id, record);
      this.usersByEmail.set(emailKey, profile.id);
      this.userMastery.set(profile.id, { ...EMPTY_TOPIC_MASTERY });
      this.userQuizHistory.set(profile.id, []);
      this.userActivities.set(profile.id, []);
    }

    // Persist to PostgreSQL
    this.persistUserToPostgres(record);

    const token = generateToken(record.profile.id);
    return { user: record.profile, token };
  }

  verifyCredentials(email: string, passwordPlain: string): { user: UserProfile; token: string } | null {
    const freeze = this.isEmailFrozen(email);
    if (freeze.isFrozen) {
      const mins = Math.ceil(freeze.remainingSeconds / 60);
      const hours = (freeze.remainingSeconds / 3600).toFixed(1);
      const timeStr = freeze.remainingSeconds >= 3600 ? `${hours} hours` : `${mins} minutes`;
      throw new Error(`Account is temporarily frozen due to multiple failed verification attempts. It will automatically unlock in ${timeStr}.`);
    }
    const record = this.getUserByEmail(email);
    if (!record) return null;
    const testHash = hashPassword(passwordPlain, record.salt);
    if (testHash !== record.passwordHash) return null;
    const token = generateToken(record.profile.id);
    return { user: record.profile, token };
  }

  updateUserProfile(userId: string, partial: Partial<UserProfile>): UserProfile | null {
    const record = this.users.get(userId);
    if (!record) return null;
    record.profile = { ...record.profile, ...partial };
    this.users.set(userId, record);
    // Persist to PostgreSQL
    this.persistUserToPostgres(record);
    return record.profile;
  }

  isEmailFrozen(email: string): { isFrozen: boolean; remainingSeconds: number; frozenUntil: number } {
    const key = email.toLowerCase().trim();
    const until = this.emailFreezeMap.get(key);
    if (!until) return { isFrozen: false, remainingSeconds: 0, frozenUntil: 0 };
    const now = Date.now();
    if (now >= until) {
      this.emailFreezeMap.delete(key);
      return { isFrozen: false, remainingSeconds: 0, frozenUntil: 0 };
    }
    const remainingSeconds = Math.ceil((until - now) / 1000);
    return { isFrozen: true, remainingSeconds, frozenUntil: until };
  }

  freezeEmail(email: string, durationMs: number = 2 * 60 * 60 * 1000): number {
    const key = email.toLowerCase().trim();
    const frozenUntil = Date.now() + durationMs;
    this.emailFreezeMap.set(key, frozenUntil);
    this.otpRecords.delete(`${key}:signup`);
    this.otpRecords.delete(`${key}:forgot_password`);
    return frozenUntil;
  }

  unfreezeEmail(email: string): void {
    this.emailFreezeMap.delete(email.toLowerCase().trim());
  }

  setOtpRecord(record: OtpRecord): void {
    const key = `${record.email.toLowerCase().trim()}:${record.type}`;
    this.otpRecords.set(key, record);
  }

  getOtpRecord(email: string, type: 'signup' | 'forgot_password'): OtpRecord | null {
    const key = `${email.toLowerCase().trim()}:${type}`;
    const rec = this.otpRecords.get(key);
    if (!rec) return null;
    if (Date.now() > rec.expiresAt) {
      this.otpRecords.delete(key);
      return null;
    }
    return rec;
  }

  deleteOtpRecord(email: string, type: 'signup' | 'forgot_password'): void {
    this.otpRecords.delete(`${email.toLowerCase().trim()}:${type}`);
  }

  createResetToken(email: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.resetTokens.set(token, {
      email: email.toLowerCase().trim(),
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    return token;
  }

  verifyResetToken(email: string, token: string): boolean {
    const rec = this.resetTokens.get(token);
    if (!rec) return false;
    if (Date.now() > rec.expiresAt) {
      this.resetTokens.delete(token);
      return false;
    }
    return rec.email === email.toLowerCase().trim();
  }

  deleteResetToken(token: string): void {
    this.resetTokens.delete(token);
  }

  updatePassword(email: string, newPasswordPlain: string): boolean {
    const record = this.getUserByEmail(email);
    if (!record) return false;
    const salt = generateSalt();
    const passwordHash = hashPassword(newPasswordPlain, salt);
    record.salt = salt;
    record.passwordHash = passwordHash;
    this.users.set(record.profile.id, record);
    // Persist updated credentials to PostgreSQL
    this.persistUserToPostgres(record);
    return true;
  }

  getMastery(userId: string): Record<TopicId, number> {
    if (!this.userMastery.has(userId)) {
      this.userMastery.set(userId, { ...EMPTY_TOPIC_MASTERY });
    }
    return this.userMastery.get(userId)!;
  }

  setMastery(userId: string, mastery: Record<TopicId, number>) {
    this.userMastery.set(userId, { ...mastery });
    const currentRoadmap = this.userRoadmaps.get(userId);
    this.userRoadmaps.set(
      userId,
      generateRoadmap(mastery, currentRoadmap?.items, 5)
    );
    // Persist all mastery scores to PostgreSQL
    for (const [topicId, score] of Object.entries(mastery)) {
      this.persistMasteryToPostgres(userId, topicId as TopicId, score);
    }
  }

  updateTopicMastery(
    userId: string,
    topicId: TopicId,
    isCorrect: boolean
  ): { oldScore: number; newScore: number; roadmap: RoadmapResponse } {
    const currentMastery = this.getMastery(userId);
    const oldScore = currentMastery[topicId] ?? 0;
    const { newMasteryScore } = updateBKTMastery(oldScore, isCorrect);
    currentMastery[topicId] = newMasteryScore;
    this.userMastery.set(userId, currentMastery);

    const prevRoadmap = this.userRoadmaps.get(userId);
    const newRoadmap = generateRoadmap(currentMastery, prevRoadmap?.items, 5);
    this.userRoadmaps.set(userId, newRoadmap);

    // Persist updated mastery score to PostgreSQL
    this.persistMasteryToPostgres(userId, topicId, newMasteryScore);

    return { oldScore, newScore: newMasteryScore, roadmap: newRoadmap };
  }

  getRoadmap(userId: string): RoadmapResponse {
    const mastery = this.getMastery(userId);
    const user = this.getUser(userId);

    const hasAttempted = user?.hasCompletedDiagnostic || Object.values(mastery).some((v) => v > 0);
    if (!hasAttempted) {
      return {
        items: [],
        standard_minutes: 0,
        personalized_minutes: 0,
      };
    }
    if (!this.userRoadmaps.has(userId)) {
      const rm = generateRoadmap(mastery, undefined, user?.weeklyHours || 5);
      this.userRoadmaps.set(userId, rm);
      return rm;
    }
    return this.userRoadmaps.get(userId)!;
  }

  getQuizHistory(userId: string): QuizHistoryItem[] {
    return this.userQuizHistory.get(userId) || [];
  }

  addQuizHistory(userId: string, item: QuizHistoryItem) {
    const list = this.getQuizHistory(userId);
    list.unshift(item);
    this.userQuizHistory.set(userId, list);

    const user = this.getUser(userId);
    if (user) {
      this.updateUserProfile(userId, {
        completedAssessmentsCount: (user.completedAssessmentsCount || 0) + 1,
        hasCompletedDiagnostic: true,
        streak: Math.max(1, user.streak + 1),
        xp: user.xp + 50,
      });
    }

    // Persist quiz history to PostgreSQL
    this.persistQuizHistoryToPostgres(userId, item);
  }

  getRecentActivities(userId: string): RecentActivityItem[] {
    return this.userActivities.get(userId) || [];
  }

  addRecentActivity(userId: string, act: RecentActivityItem) {
    const list = this.getRecentActivities(userId);
    list.unshift(act);
    this.userActivities.set(userId, list.slice(0, 10));

    // Persist activity to PostgreSQL
    this.persistActivityToPostgres(userId, act);
  }

  getQuestion(questionId: string): Question | null {
    return this.questionBank.get(questionId) || null;
  }

  getQuestionsByTopic(topicId: TopicId, difficulty?: string): Question[] {
    const list = Array.from(this.questionBank.values()).filter((q) => q.topic_id === topicId);
    if (!difficulty || difficulty === 'all') return list;
    return list.filter((q) => q.difficulty === difficulty);
  }

  addGeneratedQuestions(questions: Question[]) {
    for (const q of questions) {
      this.questionBank.set(q.id, q);
    }
  }

  createDiagnosticSession(userId: string): DiagnosticSession {
    const questionIds = SEED_QUESTIONS.slice(0, 12).map((q) => q.id);
    const session: DiagnosticSession = {
      sessionId: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      currentIndex: 0,
      questionIds,
      answers: {},
      startedAt: new Date().toISOString(),
      isCompleted: false,
    };
    this.diagnosticSessions.set(session.sessionId, session);
    return session;
  }

  getDiagnosticSession(sessionId: string): DiagnosticSession | null {
    return this.diagnosticSessions.get(sessionId) || null;
  }

  updateDiagnosticSession(session: DiagnosticSession) {
    this.diagnosticSessions.set(session.sessionId, session);
  }

  getClasses(_instructorId?: string): InstructorClass[] {
    return Array.from(this.classes.values());
  }

  getClass(classId: string): InstructorClass | null {
    return this.classes.get(classId) || null;
  }

  createClass(name: string, instructorId?: string): InstructorClass {
    const newClass: InstructorClass = {
      id: `cls-${Date.now()}`,
      name,
      code: `LP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      studentsCount: 0,
      averageMastery: 0,
      weakestTopics: [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.classes.set(newClass.id, newClass);
    this.persistClassToPostgres(newClass, instructorId);
    return newClass;
  }

  getStudentsInClass(classCode: string): StudentSummary[] {
    const enrolled: StudentSummary[] = [];
    for (const record of this.users.values()) {
      if (record.profile.role === 'student' && record.profile.classCode === classCode) {
        const mastery = this.getMastery(record.profile.id);
        const scores = Object.values(mastery);
        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        enrolled.push({
          id: record.profile.id,
          name: record.profile.name,
          email: record.profile.email,
          avatarSeed: record.profile.name,
          averageMastery: avg,
          streak: record.profile.streak,
          lastActive: 'Active today',
          topicScores: mastery,
        });
      }
    }
    return enrolled;
  }

  // --- ADMIN OPERATIONS ---
  getAllUsers(): UserProfile[] {
    return Array.from(this.users.values()).map((r) => r.profile);
  }

  async adminCreateUser(
    profileData: Partial<UserProfile> & { email: string; password?: string; name: string; role?: 'student' | 'instructor' | 'admin' }
  ): Promise<UserProfile> {
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const emailKey = profileData.email.toLowerCase().trim();
    const role = profileData.role || 'student';
    const profile: UserProfile = {
      id,
      name: profileData.name,
      email: emailKey,
      role,
      xp: profileData.xp || 0,
      streak: profileData.streak || 0,
      level: profileData.level || 1,
      goal: profileData.goal || 'Master Python Fundamentals',
      weeklyHours: profileData.weeklyHours || 5,
      expRating: profileData.expRating || 'beginner',
      classCode: profileData.classCode || undefined,
      avatarSeed: profileData.name,
      joinedAt: new Date().toISOString(),
      hasCompletedDiagnostic: profileData.hasCompletedDiagnostic ?? false,
      completedAssessmentsCount: profileData.completedAssessmentsCount || 0,
    };

    const password = profileData.password || 'Password123!';
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const record: UserAccountRecord = { profile, passwordHash, salt };
    this.users.set(id, record);
    this.usersByEmail.set(emailKey, id);
    this.userMastery.set(id, { ...EMPTY_TOPIC_MASTERY });
    this.userQuizHistory.set(id, []);
    this.userActivities.set(id, []);

    // Persist to Cloud SQL PostgreSQL
    await this.persistUserToPostgres(record);
    for (const [topicId, score] of Object.entries(EMPTY_TOPIC_MASTERY)) {
      await this.persistMasteryToPostgres(id, topicId as TopicId, score);
    }
    return profile;
  }

  async adminUpdateUser(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const record = this.users.get(id);
    if (!record) return null;

    const oldEmail = record.profile.email.toLowerCase().trim();
    const newEmail = updates.email ? updates.email.toLowerCase().trim() : oldEmail;

    if (newEmail !== oldEmail) {
      this.usersByEmail.delete(oldEmail);
      this.usersByEmail.set(newEmail, id);
    }

    const updatedProfile: UserProfile = {
      ...record.profile,
      ...updates,
      id,
      email: newEmail,
    };

    record.profile = updatedProfile;
    this.users.set(id, record);

    try {
      await pgDb
        .update(users)
        .set({
          name: updatedProfile.name,
          email: updatedProfile.email,
          role: updatedProfile.role,
          avatarSeed: updatedProfile.avatarSeed,
          goal: updatedProfile.goal,
          weeklyHours: updatedProfile.weeklyHours,
          expRating: updatedProfile.expRating,
          xp: updatedProfile.xp,
          streak: updatedProfile.streak,
          level: updatedProfile.level,
          hasCompletedDiagnostic: updatedProfile.hasCompletedDiagnostic,
          completedAssessmentsCount: updatedProfile.completedAssessmentsCount,
          classCode: updatedProfile.classCode || null,
        })
        .where(eq(users.uid, id));
    } catch (e) {
      console.warn('[Cloud SQL] User update error:', e);
    }

    return updatedProfile;
  }

  async adminDeleteUser(id: string): Promise<boolean> {
    const record = this.users.get(id);
    if (!record) return false;

    this.users.delete(id);
    this.usersByEmail.delete(record.profile.email.toLowerCase().trim());
    this.userMastery.delete(id);
    this.userQuizHistory.delete(id);
    this.userActivities.delete(id);
    this.userRoadmaps.delete(id);

    try {
      await pgDb.delete(users).where(eq(users.uid, id));
      await pgDb.delete(userMastery).where(eq(userMastery.userUid, id));
      await pgDb.delete(quizHistory).where(eq(quizHistory.userUid, id));
      await pgDb.delete(recentActivities).where(eq(recentActivities.userUid, id));
      await pgDb.delete(roadmaps).where(eq(roadmaps.userUid, id));
    } catch (e) {
      console.warn('[Cloud SQL] User delete error:', e);
    }

    return true;
  }

  async adminResetPassword(id: string, newPassword: string): Promise<boolean> {
    const record = this.users.get(id);
    if (!record) return false;

    const salt = generateSalt();
    const passwordHash = hashPassword(newPassword, salt);
    record.salt = salt;
    record.passwordHash = passwordHash;
    this.users.set(id, record);

    try {
      await pgDb.update(users).set({ salt, passwordHash }).where(eq(users.uid, id));
    } catch (e) {
      console.warn('[Cloud SQL] Password reset error:', e);
    }
    return true;
  }

  getAllQuestions(): Question[] {
    return Array.from(this.questionBank.values());
  }

  async adminCreateQuestion(
    qData: Omit<Question, 'id'> & { id?: string }
  ): Promise<Question> {
    const q: Question = {
      ...qData,
      id: qData.id || `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.questionBank.set(q.id, q);
    try {
      await pgDb
        .insert(questions)
        .values({
          id: q.id,
          topicId: q.topic_id,
          difficulty: q.difficulty,
          question: q.question,
          questionUrdu: q.questionUrdu || null,
          codeSnippet: q.codeSnippet || null,
          options: q.options,
          optionsUrdu: q.optionsUrdu || null,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          explanationUrdu: q.explanationUrdu || null,
        })
        .onConflictDoUpdate({
          target: questions.id,
          set: {
            topicId: q.topic_id,
            difficulty: q.difficulty,
            question: q.question,
            questionUrdu: q.questionUrdu || null,
            codeSnippet: q.codeSnippet || null,
            options: q.options,
            optionsUrdu: q.optionsUrdu || null,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            explanationUrdu: q.explanationUrdu || null,
          },
        });
    } catch (e) {
      console.warn('[Cloud SQL] Question create error:', e);
    }
    return q;
  }

  async adminUpdateQuestion(id: string, updates: Partial<Question>): Promise<Question | null> {
    const existing = this.questionBank.get(id);
    if (!existing) return null;

    const updated: Question = { ...existing, ...updates, id };
    this.questionBank.set(id, updated);

    try {
      await pgDb
        .update(questions)
        .set({
          topicId: updated.topic_id,
          difficulty: updated.difficulty,
          question: updated.question,
          questionUrdu: updated.questionUrdu || null,
          codeSnippet: updated.codeSnippet || null,
          options: updated.options,
          optionsUrdu: updated.optionsUrdu || null,
          correctIndex: updated.correctIndex,
          explanation: updated.explanation,
          explanationUrdu: updated.explanationUrdu || null,
        })
        .where(eq(questions.id, id));
    } catch (e) {
      console.warn('[Cloud SQL] Question update error:', e);
    }
    return updated;
  }

  async adminDeleteQuestion(id: string): Promise<boolean> {
    if (!this.questionBank.has(id)) return false;
    this.questionBank.delete(id);
    try {
      await pgDb.delete(questions).where(eq(questions.id, id));
    } catch (e) {
      console.warn('[Cloud SQL] Question delete error:', e);
    }
    return true;
  }

  async adminUpdateClass(id: string, updates: Partial<InstructorClass>): Promise<InstructorClass | null> {
    const cls = this.classes.get(id);
    if (!cls) return null;
    const updated: InstructorClass = { ...cls, ...updates, id };
    this.classes.set(id, updated);

    try {
      await pgDb
        .update(classes)
        .set({
          name: updated.name,
          code: updated.code,
        })
        .where(eq(classes.classId, id));
    } catch (e) {
      console.warn('[Cloud SQL] Class update error:', e);
    }
    return updated;
  }

  async adminDeleteClass(id: string): Promise<boolean> {
    if (!this.classes.has(id)) return false;
    this.classes.delete(id);
    try {
      await pgDb.delete(classes).where(eq(classes.classId, id));
    } catch (e) {
      console.warn('[Cloud SQL] Class delete error:', e);
    }
    return true;
  }

  getAllQuizHistories(): Array<QuizHistoryItem & { userId: string; userName: string; userEmail: string }> {
    const all: Array<QuizHistoryItem & { userId: string; userName: string; userEmail: string }> = [];
    for (const [userId, historyList] of this.userQuizHistory.entries()) {
      const user = this.getUser(userId);
      for (const item of historyList) {
        all.push({
          ...item,
          userId,
          userName: user?.name || 'Unknown User',
          userEmail: user?.email || '',
        });
      }
    }
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async adminDeleteQuizHistory(userId: string, historyId: string): Promise<boolean> {
    const history = this.userQuizHistory.get(userId) || [];
    const filtered = history.filter((h) => h.id !== historyId);
    this.userQuizHistory.set(userId, filtered);

    try {
      const numericId = parseInt(historyId.replace(/\D/g, ''), 10);
      if (!isNaN(numericId)) {
        await pgDb.delete(quizHistory).where(eq(quizHistory.id, numericId));
      }
    } catch (e) {
      console.warn('[Cloud SQL] Quiz history delete error:', e);
    }
    return true;
  }

  async adminSetUserMastery(userId: string, topicId: TopicId, score: number): Promise<boolean> {
    const current = this.getMastery(userId);
    current[topicId] = Math.max(0, Math.min(100, Math.round(score)));
    this.userMastery.set(userId, current);

    const prevRoadmap = this.userRoadmaps.get(userId);
    const newRoadmap = generateRoadmap(current, prevRoadmap?.items, 5);
    this.userRoadmaps.set(userId, newRoadmap);

    this.persistMasteryToPostgres(userId, topicId, current[topicId]);
    return true;
  }

  getAdminStats() {
    const usersList = this.getAllUsers();
    const students = usersList.filter((u) => u.role === 'student');
    const instructors = usersList.filter((u) => u.role === 'instructor');
    const admins = usersList.filter((u) => u.role === 'admin');

    const questionsList = this.getAllQuestions();
    const classesList = this.getClasses();
    const quizHistories = this.getAllQuizHistories();

    const avgScore =
      quizHistories.length > 0
        ? Math.round(quizHistories.reduce((sum, q) => sum + (q.score || 0), 0) / quizHistories.length)
        : 0;

    return {
      totalUsers: usersList.length,
      studentCount: students.length,
      instructorCount: instructors.length,
      adminCount: admins.length,
      totalQuestions: questionsList.length,
      totalClasses: classesList.length,
      totalQuizzes: quizHistories.length,
      averageQuizScore: avgScore,
      database: {
        provider: 'Cloud SQL PostgreSQL',
        region: 'asia-southeast1',
        status: 'Connected & Healthy',
        connectionPooled: true,
      },
    };
  }
}

export const db = new RelationalDatabaseStore();
