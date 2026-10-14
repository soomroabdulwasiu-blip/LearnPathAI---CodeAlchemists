import { Question, TopicId } from '../../types';
import { TOPIC_MAP } from '../../lib/constants';

const VALID_TOPIC_IDS: TopicId[] = [
  'variables',
  'operators',
  'conditionals',
  'loops',
  'strings',
  'lists',
  'dictionaries',
  'functions',
  'exceptions',
  'oop',
];

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export function validateQuestionSchema(raw: any, fallbackTopicId?: TopicId): { isValid: boolean; question?: Question; error?: string } {
  if (!raw || typeof raw !== 'object') {
    return { isValid: false, error: 'Question must be a non-null object' };
  }

  let topicId: TopicId = raw.topic_id || raw.topicId || fallbackTopicId;
  if (!topicId || !VALID_TOPIC_IDS.includes(topicId)) {
    topicId = fallbackTopicId || 'loops';
  }

  let difficulty: 'beginner' | 'intermediate' | 'advanced' = raw.difficulty;
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    difficulty = 'intermediate';
  }

  const questionText = typeof raw.question === 'string' ? raw.question.trim() : '';
  if (questionText.length < 5) {
    return { isValid: false, error: 'Question text too short or missing' };
  }

  if (!Array.isArray(raw.options) || raw.options.length < 3) {
    return { isValid: false, error: 'Options must be an array of at least 3-4 options' };
  }

  const options: string[] = raw.options
    .slice(0, 4)
    .map((opt: any) => (typeof opt === 'string' ? opt.trim() : String(opt || '').trim()));

  if (options.some((opt) => opt.length === 0)) {
    return { isValid: false, error: 'All option values must be non-empty strings' };
  }

  let correctIndex: number = Number(raw.correctIndex ?? raw.correct_index ?? 0);
  if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
    correctIndex = 0;
  }

  const explanation =
    typeof raw.explanation === 'string' && raw.explanation.trim().length > 0
      ? raw.explanation.trim()
      : `In Python, option ${correctIndex + 1} is correct based on language semantics for ${TOPIC_MAP[topicId]?.title || 'Python'}.`;

  const validQuestion: Question = {
    id: raw.id && typeof raw.id === 'string' ? raw.id : `gen-${topicId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    topic_id: topicId,
    difficulty,
    question: questionText,
    codeSnippet: typeof raw.codeSnippet === 'string' ? raw.codeSnippet : raw.code_snippet,
    options,
    correctIndex,
    explanation,
    explanationUrdu: typeof raw.explanationUrdu === 'string' ? raw.explanationUrdu : raw.explanation_urdu,
  };

  return { isValid: true, question: validQuestion };
}

export function extractAndValidateQuestions(content: string, fallbackTopicId: TopicId): Question[] {
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
      } catch {
        // continue
      }
    }
    if (!parsed) {
      const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        try {
          parsed = JSON.parse(arrayMatch[0]);
        } catch {
          // continue
        }
      }
    }
  }

  if (!parsed) return [];
  const rawList = Array.isArray(parsed) ? parsed : Array.isArray(parsed.questions) ? parsed.questions : [parsed];
  const validQuestions: Question[] = [];

  for (const item of rawList) {
    const res = validateQuestionSchema(item, fallbackTopicId);
    if (res.isValid && res.question) {
      validQuestions.push(res.question);
    }
  }

  return validQuestions;
}

export function sanitizeUserInput(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}
