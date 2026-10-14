export type TopicId =
  | 'variables'
  | 'operators'
  | 'conditionals'
  | 'loops'
  | 'strings'
  | 'lists'
  | 'dictionaries'
  | 'functions'
  | 'exceptions'
  | 'oop';

export type MasteryStatus = 'learn' | 'practice' | 'review' | 'skip' | 'mastered' | 'locked';

export type UserRole = 'student' | 'instructor' | 'admin';

export interface TopicMeta {
  id: TopicId;
  title: string;
  titleUrdu: string;
  description: string;
  descriptionUrdu: string;
  hue: string;
  iconName: string;
  standardEstMinutes: number;
  prerequisites: TopicId[];
}

export interface TopicMastery {
  topic_id: TopicId;
  mastery: number; // 0 to 100
  confidence: number; // 0 to 1
  status: MasteryStatus;
  last_practiced: string | null;
  history?: { date: string; score: number }[];
}

export interface RoadmapItem {
  topic_id: TopicId;
  rank: number; // 1 to 10
  status: MasteryStatus;
  why: string;
  whyUrdu: string;
  est_minutes: number;
  week: number;
  previous_rank?: number;
}

export interface RoadmapDiff {
  topic_id: TopicId;
  from_rank: number;
  to_rank: number;
  reason: string;
  reasonUrdu: string;
}

export interface RoadmapResponse {
  items: RoadmapItem[];
  standard_minutes: number;
  personalized_minutes: number;
  diff?: RoadmapDiff[];
}

export interface Question {
  id: string;
  topic_id: TopicId;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question: string;
  questionUrdu?: string;
  codeSnippet?: string;
  options: string[];
  optionsUrdu?: string[];
  correctIndex: number;
  explanation: string;
  explanationUrdu?: string;
}

export interface DiagnosticAnswerPayload {
  session_id: string;
  question_id: string;
  optionIndex: number;
  time_ms: number;
}

export interface DiagnosticAnswerResponse {
  correct: boolean;
  explanation: string;
  explanationUrdu?: string;
  next_question: Question | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  mastery: Record<TopicId, number>;
  isCompleted: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  xp: number;
  streak: number;
  level: number;
  goal: string;
  weeklyHours: number;
  expRating: 'beginner' | 'intermediate' | 'experienced';
  classCode?: string;
  joinedAt: string;
  avatarSeed?: string;
  hasCompletedDiagnostic?: boolean;
  completedAssessmentsCount?: number;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  time: string;
  result: string;
  type: 'diagnostic' | 'practice' | 'roadmap';
  timestamp?: number;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: string[];
  suggestedFollowUps?: string[];
  timestamp: number;
}

export interface CodeLabChallenge {
  id: string;
  topic_id: TopicId;
  title: string;
  titleUrdu: string;
  description: string;
  descriptionUrdu: string;
  starterCode: string;
  solution: string;
  hints: string[];
  hintsUrdu?: string[];
  testCases: {
    description: string;
    input?: string;
    expectedOutput: string;
  }[];
}

export interface SpacedReviewItem {
  topic_id: TopicId;
  dueDaysAgo: number;
  retentionPercent: number;
  dueDate: string;
  status: 'critical' | 'due' | 'upcoming';
}

export interface StudentSummary {
  id: string;
  name: string;
  email: string;
  avatarSeed: string;
  averageMastery: number;
  streak: number;
  lastActive: string;
  topicScores: Record<TopicId, number>;
}

export interface InstructorClass {
  id: string;
  name: string;
  code: string;
  studentsCount: number;
  averageMastery: number;
  weakestTopics: TopicId[];
  createdAt: string;
  instructorId?: string;
  studentUids?: string[];
}

export interface ResourceItem {
  id: string;
  title: string;
  topic_id?: TopicId;
  type: 'lesson' | 'doc' | 'video' | 'code' | 'exercise' | 'interactive';
  duration: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  url: string;
  description: string;
  recommendedForMe?: boolean;
}

export interface LessonContent {
  topicId: TopicId;
  overview: string;
  overviewUrdu: string;
  keyConcepts: { title: string; body: string; code?: string }[];
  commonPitfalls: string[];
  resources: ResourceItem[];
}

export interface QuizHistoryItem {
  id: string;
  date: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  durationMinutes: number;
  topicBreakdown: Partial<Record<TopicId, number>>;
}

export interface GoalItem {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  category: 'daily' | 'weekly' | 'milestone';
}

export interface GmailConfigStatus {
  isConfigured: boolean;
  senderEmail: string | null;
  method: 'gmail';
  lastTestedAt?: string | null;
  lastError?: string | null;
}
