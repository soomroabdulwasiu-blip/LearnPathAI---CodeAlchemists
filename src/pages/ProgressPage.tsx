import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { TOPICS, getMasteryLevel } from '../lib/constants';
import { Button } from '../components/ui/Button';
import { api } from '../api/client';
import { QuizHistoryItem } from '../types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  Flame,
  Star,
  Play,
  BarChart2,
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, masteryMap } = useAppStore();
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getHistory().then((items) => {
      if (mounted) {
        setQuizHistory(items);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const hasScores = Object.values(masteryMap).some((val) => val > 0);
  const hasCompletedDiagnostic = Boolean(user?.hasCompletedDiagnostic || hasScores || quizHistory.length > 0);

  const overallCompetency = hasCompletedDiagnostic
    ? Math.round(Object.values(masteryMap).reduce((a, b) => a + b, 0) / TOPICS.length)
    : 0;

  const masteredCount = TOPICS.filter((t) => (masteryMap[t.id] ?? 0) >= 80).length;
  const closureRate = Math.round((masteredCount / TOPICS.length) * 100);

  const masteryProgression = quizHistory.map((q, idx) => ({
    attempt: `Quiz #${idx + 1}`,
    score: q.score,
  })).reverse();

  const studyTimeData = [
    { day: 'Mon', hours: 0 },
    { day: 'Tue', hours: 0 },
    { day: 'Wed', hours: 0 },
    { day: 'Thu', hours: 0 },
    { day: 'Fri', hours: 0 },
    { day: 'Sat', hours: 0 },
    { day: 'Sun', hours: 0 },
  ];

  if (quizHistory.length > 0) {
    const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const entry = studyTimeData.find((d) => d.day === todayDay);
    if (entry) {
      const totalMins = quizHistory.reduce((acc, q) => acc + (q.durationMinutes || 8), 0);
      entry.hours = Math.round((totalMins / 60) * 10) / 10;
    }
  }

  const achievements = [
    {
      id: 'ach-1',
      title: 'Diagnostic Baseline',
      desc: 'Completed initial adaptive diagnostic calibration.',
      unlocked: hasCompletedDiagnostic,
      color: '#2D5BFF',
    },
    {
      id: 'ach-2',
      title: 'Streak Starter',
      desc: 'Maintained 3+ consecutive study days.',
      unlocked: (user?.streak ?? 0) >= 3,
      color: '#FF6B57',
    },
    {
      id: 'ach-3',
      title: 'Core Foundations Master',
      desc: 'Reached 80%+ mastery in Variables & Data Types.',
      unlocked: (masteryMap.variables ?? 0) >= 80,
      color: '#12C99B',
    },
    {
      id: 'ach-4',
      title: 'Conditionals Explorer',
      desc: 'Demonstrated mastery in Conditional Statements.',
      unlocked: (masteryMap.conditionals ?? 0) >= 80,
      color: '#8A5CF6',
    },
    {
      id: 'ach-5',
      title: 'Iteration Pro',
      desc: 'Closed foundational gaps in Loops and Iteration.',
      unlocked: (masteryMap.loops ?? 0) >= 80,
      color: '#FFB92E',
    },
    {
      id: 'ach-6',
      title: 'OOP Achiever',
      desc: 'Reached 80%+ mastery in Object-Oriented Programming.',
      unlocked: (masteryMap.oop ?? 0) >= 80,
      color: '#06B6D4',
    },
  ];

  if (!hasCompletedDiagnostic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="p-8 sm:p-12 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#2D5BFF]/10 text-[#2D5BFF] flex items-center justify-center mx-auto shadow-xs">
            <BarChart2 className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
              Your learning analytics will appear as you complete assessments and lessons.
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Complete your diagnostic assessment to generate your personalized knowledge trajectory and begin tracking your mastery growth.
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="lg"
              onClick={() => navigate('/diagnostic')}
              className="font-bold shadow-md shadow-[#2D5BFF]/25 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white mr-1.5" />
              <span>Start Diagnostic Quiz</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
          Learning Analytics & Mastery Growth
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
          Quantitative tracking powered by continuous Bayesian knowledge updates.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Overall Competency</span>
            <TrendingUp className="w-4 h-4 text-[#2D5BFF]" />
          </div>
          <div className="font-display font-black text-3xl text-[var(--ink)]">
            {overallCompetency}%
          </div>
          <span className="text-[11px] text-emerald-500 font-semibold">
            {hasCompletedDiagnostic ? 'Calibrated baseline' : 'Pending'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Target Study Hours</span>
            <Clock className="w-4 h-4 text-[#FFB92E]" />
          </div>
          <div className="font-display font-black text-3xl text-[var(--ink)]">
            {user?.weeklyHours ?? 5} hrs
          </div>
          <span className="text-[11px] text-[var(--muted)]">Target: {user?.weeklyHours ?? 5} hrs/wk</span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Topic Mastery Rate</span>
            <CheckCircle2 className="w-4 h-4 text-[#12C99B]" />
          </div>
          <div className="font-display font-black text-3xl text-[var(--ink)]">
            {closureRate}%
          </div>
          <span className="text-[11px] text-[var(--muted)]">{masteredCount} of 10 topics mastered</span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-[#FF6B57]" />
          </div>
          <div className="font-display font-black text-3xl text-[#FF6B57]">
            {user?.streak ?? 0} Days
          </div>
          <span className="text-[11px] text-[var(--muted)]">Active study streak</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-[var(--ink)]">
            Assessment Score History
          </h3>
          {masteryProgression.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={masteryProgression}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="attempt" stroke="var(--muted)" fontSize={11} />
                  <YAxis stroke="var(--muted)" fontSize={11} domain={[0, 100]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#2D5BFF"
                    fill="#2D5BFF"
                    fillOpacity={0.25}
                    name="Score %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-[var(--muted)]">
              Complete more assessments to view progress trends over time.
            </div>
          )}
        </div>

        <div className="lg:col-span-5 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-[var(--ink)]">
            Daily Study Distribution (Hours)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="day" stroke="var(--muted)" fontSize={11} />
                <YAxis stroke="var(--muted)" fontSize={11} />
                <Tooltip />
                <Bar dataKey="hours" fill="#8A5CF6" radius={[6, 6, 0, 0]} name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
        <div>
          <h3 className="font-display font-extrabold text-lg text-[var(--ink)]">
            Topic Competency Status
          </h3>
          <p className="text-xs text-[var(--muted)]">Current calibrated Bayesian mastery per curriculum module</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TOPICS.map((topic) => {
            const current = masteryMap[topic.id] ?? 0;
            const tier = getMasteryLevel(current);
            return (
              <div
                key={topic.id}
                className="p-3.5 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: topic.hue }} />
                  <span className="font-semibold text-[var(--ink)]">{topic.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${tier.badgeBg}`}>
                    {current}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#F59E0B]" />
          <h3 className="font-display font-extrabold text-lg text-[var(--ink)]">
            Badges & Milestones Gallery
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                ach.unlocked
                  ? 'bg-[var(--surface-muted)] border-[var(--line)]'
                  : 'bg-[var(--surface)] border-dashed border-[var(--line)] opacity-50'
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                style={{ backgroundColor: ach.unlocked ? ach.color : '#94A3B8' }}
              >
                <Star className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-sm text-[var(--ink)]">
                    {ach.title}
                  </h4>
                  {ach.unlocked && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded-sm">
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">
                  {ach.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
