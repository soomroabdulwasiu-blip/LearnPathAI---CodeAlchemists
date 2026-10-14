import { create } from 'zustand';
import { TopicId, UserProfile, RoadmapResponse, RoadmapDiff, Question, TutorMessage } from '../types';
import {
  loadStoredUser,
  saveStoredUser,
  loadStoredToken,
  saveStoredToken,
  loadStoredMastery,
  saveStoredMastery,
  loadStoredRoadmap,
  saveStoredRoadmap,
  loadTimeOffsetDays,
  saveTimeOffsetDays,
  resetAllData,
  EMPTY_USER_PROFILE,
  EMPTY_MASTERY_MAP,
} from '../lib/storage';
import { updateBKTMastery, generateRoadmap } from '../lib/knowledgeTracing';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'diff' | 'achievement' | 'reminder';
}

interface AppState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  language: 'en' | 'ur';
  reducedMotion: boolean;
  masteryMap: Record<TopicId, number>;
  roadmap: RoadmapResponse;
  latestDiff: RoadmapDiff[] | null;
  activeDiffDismissed: boolean;
  timeOffsetDays: number;
  tutorDrawerOpen: boolean;
  tutorActiveTopic: TopicId | null;
  tutorActiveQuestion: Question | null;
  tutorMessages: TutorMessage[];
  commandPaletteOpen: boolean;
  notifications: NotificationItem[];

  loginUser: (user: UserProfile, token: string) => void;
  logoutUser: () => void;
  setUser: (user: Partial<UserProfile>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'ur') => void;
  setReducedMotion: (reduced: boolean) => void;
  setTopicMastery: (topicId: TopicId, score: number) => void;
  applyAnswerEvaluation: (topicId: TopicId, isCorrect: boolean) => {
    oldScore: number;
    newScore: number;
    diff: RoadmapDiff[];
  };
  dismissDiffBanner: () => void;
  openTutor: (topicId?: TopicId, question?: Question) => void;
  closeTutor: () => void;
  addTutorMessage: (msg: TutorMessage) => void;
  setCommandPalette: (open: boolean) => void;
  advanceTime: (days: number) => void;
  addNotification: (n: Omit<NotificationItem, 'id' | 'read' | 'time'>) => void;
  markNotificationsAsRead: () => void;
  resetProgress: () => void;
}

const initialUser = loadStoredUser();
const hasToken = Boolean(loadStoredToken());
const initialMastery = loadStoredMastery();
const initialRoadmap = loadStoredRoadmap(initialMastery, initialUser?.weeklyHours || 5);
const initialTimeOffset = loadTimeOffsetDays();

export const useAppStore = create<AppState>((set, get) => ({
  user: initialUser,
  isAuthenticated: Boolean(initialUser && hasToken),
  theme: (localStorage.getItem('learnpath_theme') as 'light' | 'dark') || 'light',
  language: (localStorage.getItem('learnpath_language') as 'en' | 'ur') || 'en',
  reducedMotion: localStorage.getItem('learnpath_reduced_motion') === 'true',
  masteryMap: initialMastery,
  roadmap: initialRoadmap,
  latestDiff: initialRoadmap.diff || null,
  activeDiffDismissed: false,
  timeOffsetDays: initialTimeOffset,
  tutorDrawerOpen: false,
  tutorActiveTopic: null,
  tutorActiveQuestion: null,
  tutorMessages: [
    {
      id: 'msg-init',
      role: 'assistant',
      text: "Hello! I am your LearnPath AI Socratic Tutor. Ask me any conceptual question about Python, explore edge cases, or ask why a specific answer option was correct or incorrect.",
      sources: ['Python Standard Docs', 'Official Python Tutorial'],
      suggestedFollowUps: [
        'Why does a string multiply in Python repeat it instead of casting to int?',
        'What is the difference between shallow copy and deep copy in lists?',
        'How does Bayesian Knowledge Tracing calibrate my roadmap?',
      ],
      timestamp: Date.now(),
    },
  ],
  commandPaletteOpen: false,
  notifications: [],

  loginUser: (user, token) => {
    saveStoredToken(token);
    saveStoredUser(user);
    set({
      user,
      isAuthenticated: true,
    });
  },

  logoutUser: () => {
    saveStoredToken(null);
    saveStoredUser(null);
    set({
      user: null,
      isAuthenticated: false,
      masteryMap: { ...EMPTY_MASTERY_MAP },
      roadmap: { items: [], standard_minutes: 0, personalized_minutes: 0 },
      latestDiff: null,
      notifications: [],
    });
  },

  setUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    saveStoredUser(updated);
    set({ user: updated });
  },

  setTheme: (theme) => {
    localStorage.setItem('learnpath_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  setLanguage: (language) => {
    localStorage.setItem('learnpath_language', language);
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
    set({ language });
  },

  setReducedMotion: (reducedMotion) => {
    localStorage.setItem('learnpath_reduced_motion', String(reducedMotion));
    set({ reducedMotion });
  },

  setTopicMastery: (topicId, score) => {
    const updated = { ...get().masteryMap, [topicId]: score };
    saveStoredMastery(updated);
    const newRoadmap = generateRoadmap(updated, get().roadmap.items, get().user?.weeklyHours || 5);
    saveStoredRoadmap(newRoadmap);
    set({
      masteryMap: updated,
      roadmap: newRoadmap,
      latestDiff: newRoadmap.diff || null,
      activeDiffDismissed: false,
    });
  },

  applyAnswerEvaluation: (topicId, isCorrect) => {
    const currentScore = get().masteryMap[topicId] ?? 0;
    const { newMasteryScore } = updateBKTMastery(currentScore, isCorrect);
    const updatedMastery = {
      ...get().masteryMap,
      [topicId]: newMasteryScore,
    };
    saveStoredMastery(updatedMastery);
    const previousItems = get().roadmap.items;
    const newRoadmap = generateRoadmap(updatedMastery, previousItems, get().user?.weeklyHours || 5);
    saveStoredRoadmap(newRoadmap);

    const currentUser = get().user;
    let updatedUser = currentUser;
    if (currentUser) {
      const xpGain = isCorrect ? 35 : 10;
      const newXp = (currentUser.xp || 0) + xpGain;
      updatedUser = {
        ...currentUser,
        xp: newXp,
        level: Math.floor(newXp / 500) + 1,
        hasCompletedDiagnostic: true,
      };
      saveStoredUser(updatedUser);
    }

    const diff = newRoadmap.diff || [];
    set({
      user: updatedUser,
      masteryMap: updatedMastery,
      roadmap: newRoadmap,
      latestDiff: diff.length > 0 ? diff : null,
      activeDiffDismissed: false,
    });

    if (diff.length > 0) {
      get().addNotification({
        title: 'Roadmap Re-sequenced',
        desc: diff[0].reason,
        type: 'diff',
      });
    }

    return {
      oldScore: currentScore,
      newScore: newMasteryScore,
      diff,
    };
  },

  dismissDiffBanner: () => set({ activeDiffDismissed: true }),

  openTutor: (topicId, question) => {
    set({
      tutorDrawerOpen: true,
      tutorActiveTopic: topicId || null,
      tutorActiveQuestion: question || null,
    });
  },

  closeTutor: () => set({ tutorDrawerOpen: false }),

  addTutorMessage: (msg) => {
    set((state) => ({
      tutorMessages: [...state.tutorMessages, msg],
    }));
  },

  setCommandPalette: (open) => set({ commandPaletteOpen: open }),

  advanceTime: (days) => {
    const nextDays = get().timeOffsetDays + days;
    saveTimeOffsetDays(nextDays);
    const currentMastery = get().masteryMap;
    const decayed: Record<TopicId, number> = { ...currentMastery };
    (Object.keys(decayed) as TopicId[]).forEach((tid) => {
      const score = decayed[tid];
      if (score > 0) {
        const decayFactor = 0.94 ** days;
        decayed[tid] = Math.max(10, Math.round(score * decayFactor));
      }
    });
    saveStoredMastery(decayed);
    const newRoadmap = generateRoadmap(decayed, get().roadmap.items, get().user?.weeklyHours || 5);
    saveStoredRoadmap(newRoadmap);
    set({
      timeOffsetDays: nextDays,
      masteryMap: decayed,
      roadmap: newRoadmap,
      latestDiff: newRoadmap.diff || null,
      activeDiffDismissed: false,
    });
  },

  addNotification: (n) => {
    const newNotif: NotificationItem = {
      ...n,
      id: `notif-${Date.now()}`,
      time: 'Just now',
      read: false,
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
    }));
  },

  markNotificationsAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  resetProgress: () => {
    resetAllData();
    set({
      user: null,
      isAuthenticated: false,
      masteryMap: { ...EMPTY_MASTERY_MAP },
      roadmap: { items: [], standard_minutes: 0, personalized_minutes: 0 },
      latestDiff: null,
      timeOffsetDays: 0,
      notifications: [],
    });
  },
}));
