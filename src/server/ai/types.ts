import { TopicId, Question } from '../../types';

export type AIProviderType = 'gemini' | 'fallback';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}

export interface ProviderStatus {
  provider: AIProviderType;
  model: string;
  isConfigured: boolean;
  status: 'active' | 'awaiting_configuration' | 'fallback_mode';
  message: string;
  features: string[];
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  readonly type: AIProviderType;
  isConfigured(): boolean;
  chat(messages: ChatMessage[], options?: CompletionOptions): Promise<string>;
}

export interface ExplainConceptRequest {
  topicId?: TopicId;
  questionId?: string;
  userQuery: string;
  contextCode?: string;
}

export interface ExplainConceptResponse {
  explanation: string;
  codeExample?: string;
  keyTakeaway: string;
  suggestedFollowUps: string[];
  sources: string[];
  providerUsed: string;
}

export interface ExplainWeakTopicsRequest {
  masteryMap: Record<TopicId, number>;
  topWeakestCount?: number;
}

export interface WeakTopicAnalysis {
  topicId: TopicId;
  topicTitle: string;
  currentMastery: number;
  status: string;
  rootCauseMisconception: string;
  actionableStep: string;
  prerequisiteGaps: string[];
}

export interface ExplainWeakTopicsResponse {
  summary: string;
  weakTopics: WeakTopicAnalysis[];
  studyAdvice: string;
  priorityTopic: TopicId;
  providerUsed: string;
}

export interface GenerateQuestionsRequest {
  topicId: TopicId;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  count?: number;
}

export interface GenerateQuestionsResponse {
  topicId: TopicId;
  difficulty: string;
  questions: Question[];
  validationPassed: boolean;
  providerUsed: string;
}

export interface ExplainMistakeRequest {
  questionId: string;
  selectedOptionIndex: number;
}

export interface ExplainMistakeResponse {
  questionId: string;
  questionText: string;
  selectedOptionText: string;
  correctOptionText: string;
  misconceptionAnalysis: string;
  stepByStepTrace: string;
  correctApproach: string;
  providerUsed: string;
}

export interface StudyPlanRequest {
  masteryMap: Record<TopicId, number>;
  weeklyHours?: number;
}

export interface StudyPlanMilestone {
  week: number;
  focusTopic: TopicId;
  topicTitle: string;
  allocatedHours: number;
  targetObjective: string;
  dailyMicroGoals: string[];
}

export interface StudyPlanResponse {
  totalWeeks: number;
  targetDate: string;
  weeklyHours: number;
  strategySummary: string;
  milestones: StudyPlanMilestone[];
  providerUsed: string;
}

export interface ExplainCodeRequest {
  code: string;
  focusArea?: string;
}

export interface ExplainCodeResponse {
  summary: string;
  stepByStepExecution: { lineOrBlock: string; description: string; variableState?: string }[];
  expectedOutput: string;
  commonPitfalls: string[];
  providerUsed: string;
}
