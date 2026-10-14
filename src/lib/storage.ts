import { TopicId, UserProfile, RoadmapResponse, QuizHistoryItem, GoalItem } from '../types';
import { TOPICS } from './constants';
import { generateRoadmap } from './knowledgeTracing';

const STORAGE_KEYS = {
  USER: 'learnpath_user_profile',
  TOKEN: 'learnpath_auth_token',
  MASTERY: 'learnpath_mastery_map',
  ROADMAP: 'learnpath_roadmap_cache',
  THEME: 'learnpath_theme',
  LANG: 'learnpath_language',
  REDUCED_MOTION: 'learnpath_reduced_motion',
  DIAGNOSTIC: 'learnpath_diagnostic_state',
  QUIZ_HISTORY: 'learnpath_quiz_history',
  GOALS: 'learnpath_user_goals',
  TIME_OFFSET_DAYS: 'learnpath_time_offset_days',
};

export const EMPTY_MASTERY_MAP: Record<TopicId, number> = TOPICS.reduce<Record<TopicId, number>>((acc, t) => {
  acc[t.id] = 0;
  return acc;
}, {} as Record<TopicId, number>);

export const EMPTY_USER_PROFILE: UserProfile = {
  id: '',
  name: '',
  email: '',
  role: 'student',
  xp: 0,
  streak: 0,
  level: 1,
  goal: 'Master Python Fundamentals',
  weeklyHours: 5,
  expRating: 'beginner',
  joinedAt: new Date().toISOString().split('T')[0],
  hasCompletedDiagnostic: false,
  completedAssessmentsCount: 0,
};

export function loadStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

export function saveStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  } catch (e) {
    console.error('Failed to save auth token', e);
  }
}

export function loadStoredUser(): UserProfile | null {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return null;
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.id) {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        return null;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse stored user profile', e);
  }
  return null;
}

export function saveStoredUser(profile: UserProfile | null): void {
  try {
    if (profile && profile.id) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  } catch (e) {
    console.error('Failed to save user profile', e);
  }
}

export function loadStoredMastery(): Record<TopicId, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MASTERY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load mastery map', e);
  }
  return { ...EMPTY_MASTERY_MAP };
}

export function saveStoredMastery(map: Record<TopicId, number>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MASTERY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save mastery map', e);
  }
}

export function loadStoredRoadmap(mastery: Record<TopicId, number>, weeklyHours: number = 5): RoadmapResponse {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROADMAP);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.items && Array.isArray(parsed.items)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load roadmap cache', e);
  }

  const hasScores = Object.values(mastery).some((v) => v > 0);
  if (!hasScores) {
    return {
      items: [],
      standard_minutes: 0,
      personalized_minutes: 0,
    };
  }

  const fresh = generateRoadmap(mastery, undefined, weeklyHours);
  saveStoredRoadmap(fresh);
  return fresh;
}

export function saveStoredRoadmap(roadmap: RoadmapResponse): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROADMAP, JSON.stringify(roadmap));
  } catch (e) {
    console.error('Failed to save roadmap', e);
  }
}

export function loadStoredQuizHistory(): QuizHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load quiz history', e);
  }
  return [];
}

export function saveStoredQuizHistory(items: QuizHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save quiz history', e);
  }
}

export function loadTimeOffsetDays(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIME_OFFSET_DAYS);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveTimeOffsetDays(days: number): void {
  localStorage.setItem(STORAGE_KEYS.TIME_OFFSET_DAYS, String(days));
}

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.MASTERY);
  localStorage.removeItem(STORAGE_KEYS.ROADMAP);
  localStorage.removeItem(STORAGE_KEYS.DIAGNOSTIC);
  localStorage.removeItem(STORAGE_KEYS.QUIZ_HISTORY);
  localStorage.removeItem(STORAGE_KEYS.GOALS);
  localStorage.removeItem(STORAGE_KEYS.TIME_OFFSET_DAYS);
}
