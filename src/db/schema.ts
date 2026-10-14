import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users Table (MANDATORY uid for Firebase Auth)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or internal unique identifier
  email: text('email').notNull(),
  name: text('name').notNull().default('Python Explorer'),
  role: text('role').notNull().default('student'),
  avatarSeed: text('avatar_seed'),
  goal: text('goal'),
  weeklyHours: integer('weekly_hours').notNull().default(5),
  expRating: text('exp_rating').notNull().default('beginner'),
  joinedAt: text('joined_at'),
  xp: integer('xp').notNull().default(0),
  streak: integer('streak').notNull().default(0),
  level: integer('level').notNull().default(1),
  hasCompletedDiagnostic: boolean('has_completed_diagnostic').notNull().default(false),
  completedAssessmentsCount: integer('completed_assessments_count').notNull().default(0),
  classCode: text('class_code'),
  passwordHash: text('password_hash'),
  salt: text('salt'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. User Topic Mastery Table
export const userMastery = pgTable('user_mastery', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  topicId: text('topic_id').notNull(),
  score: integer('score').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. User Roadmaps Table
export const roadmaps = pgTable('roadmaps', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  items: jsonb('items').notNull(),
  standardMinutes: integer('standard_minutes').notNull().default(0),
  personalizedMinutes: integer('personalized_minutes').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Quiz History Table
export const quizHistory = pgTable('quiz_history', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  subject: text('subject').notNull().default('Python Assessment'),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  correctCount: integer('correct_count').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(5),
  topicBreakdown: jsonb('topic_breakdown'),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Recent Activity Table
export const recentActivities = pgTable('recent_activities', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  time: text('time').notNull(),
  result: text('result').notNull(),
  type: text('type').notNull(),
  timestamp: text('timestamp'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Instructor Classes Table
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  classId: text('class_id').notNull().unique(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  instructorId: text('instructor_id'),
  createdAt: text('created_at').notNull(),
});

// 7. Diagnostic Sessions Table
export const diagnosticSessions = pgTable('diagnostic_sessions', {
  sessionId: text('session_id').primaryKey(),
  userUid: text('user_uid').notNull(),
  currentIndex: integer('current_index').notNull().default(0),
  questionIds: jsonb('question_ids').notNull(),
  answers: jsonb('answers').notNull(),
  startedAt: text('started_at').notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
});

// 8. One-Time Passwords (OTP) Table
export const otpRecords = pgTable('otp_records', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  otp: text('otp').notNull(),
  type: text('type').notNull(),
  expiresAt: text('expires_at').notNull(),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Password Reset Tokens Table
export const resetTokens = pgTable('reset_tokens', {
  token: text('token').primaryKey(),
  email: text('email').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Account Freeze Table (Brute-force protection)
export const frozenAccounts = pgTable('frozen_accounts', {
  email: text('email').primaryKey(),
  frozenUntil: text('frozen_until').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Questions Bank Table
export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  topicId: text('topic_id').notNull(),
  difficulty: text('difficulty').notNull().default('beginner'),
  question: text('question').notNull(),
  questionUrdu: text('question_urdu'),
  codeSnippet: text('code_snippet'),
  options: jsonb('options').notNull(),
  optionsUrdu: jsonb('options_urdu'),
  correctIndex: integer('correct_index').notNull().default(0),
  explanation: text('explanation').notNull(),
  explanationUrdu: text('explanation_urdu'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  masteries: many(userMastery),
  roadmaps: many(roadmaps),
  quizHistories: many(quizHistory),
  activities: many(recentActivities),
}));

export const userMasteryRelations = relations(userMastery, ({ one }) => ({
  user: one(users, {
    fields: [userMastery.userUid],
    references: [users.uid],
  }),
}));

export const roadmapsRelations = relations(roadmaps, ({ one }) => ({
  user: one(users, {
    fields: [roadmaps.userUid],
    references: [users.uid],
  }),
}));

export const quizHistoryRelations = relations(quizHistory, ({ one }) => ({
  user: one(users, {
    fields: [quizHistory.userUid],
    references: [users.uid],
  }),
}));

export const recentActivitiesRelations = relations(recentActivities, ({ one }) => ({
  user: one(users, {
    fields: [recentActivities.userUid],
    references: [users.uid],
  }),
}));
