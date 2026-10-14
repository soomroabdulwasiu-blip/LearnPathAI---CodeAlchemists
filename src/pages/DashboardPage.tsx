import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { TOPICS, TOPIC_MAP, getMasteryLevel } from '../lib/constants';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressRing } from '../components/ui/ProgressRing';
import { AICopilotPanel } from '../components/ai/AICopilotPanel';
import { api } from '../api/client';
import { RecentActivityItem, QuizHistoryItem } from '../types';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Sparkles,
  Flame,
  Zap,
  Play,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  FileQuestion,
  ChevronRight,
  Compass,
  BarChart2,
  Activity,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, masteryMap, roadmap, setTopicMastery, setUser } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadStudentData() {
      try {
        const [me, realMastery, realRoadmap, realHistory, realActivities] = await Promise.allSettled([
          api.getMe(),
          api.getMastery(),
          api.getRoadmap(),
          api.getHistory(),
          api.getActivities(),
        ]);
        if (!mounted) return;
        if (me.status === 'fulfilled' && me.value) {
          setUser(me.value);
        }
        if (realMastery.status === 'fulfilled' && Array.isArray(realMastery.value)) {
          realMastery.value.forEach((m) => {
            setTopicMastery(m.topic_id, m.mastery);
          });
        }
        if (realHistory.status === 'fulfilled' && Array.isArray(realHistory.value)) {
          setQuizHistory(realHistory.value);
        }
        if (realActivities.status === 'fulfilled' && Array.isArray(realActivities.value)) {
          setActivities(realActivities.value);
        }
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadStudentData();
    return () => {
      mounted = false;
    };
  }, []);

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const hasScores = Object.values(masteryMap).some((val) => val > 0);
  const hasCompletedDiagnostic = Boolean(user?.hasCompletedDiagnostic || hasScores || quizHistory.length > 0);

  const totalTopics = TOPICS.length;
  const masteredCount = TOPICS.filter((t) => (masteryMap[t.id] ?? 0) >= 80).length;
  const overallProgress = hasCompletedDiagnostic
    ? Math.round(Object.values(masteryMap).reduce((acc, curr) => acc + curr, 0) / totalTopics)
    : 0;

  const averageQuizScore =
    quizHistory.length > 0
      ? Math.round(quizHistory.reduce((acc, curr) => acc + curr.score, 0) / quizHistory.length)
      : null;

  const recommendedItem = hasCompletedDiagnostic && roadmap.items.length > 0
    ? roadmap.items.find((i) => i.status !== 'locked' && i.status !== 'skip') || roadmap.items[0]
    : null;
  const recMeta = recommendedItem ? TOPIC_MAP[recommendedItem.topic_id] : null;

  const weeklyActivityData = [
    { day: 'Mon', hours: 0 },
    { day: 'Tue', hours: 0 },
    { day: 'Wed', hours: 0 },
    { day: 'Thu', hours: 0 },
    { day: 'Fri', hours: 0 },
    { day: 'Sat', hours: 0 },
    { day: 'Sun', hours: 0 },
  ];

  if (quizHistory.length > 0) {
    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const match = weeklyActivityData.find((d) => d.day === todayDayName);
    if (match) {
      const totalMinutes = quizHistory.reduce((acc, q) => acc + (q.durationMinutes || 8), 0);
      match.hours = Math.round((totalMinutes / 60) * 10) / 10;
    }
  }

  const totalWeeklyHours = weeklyActivityData.reduce((acc, d) => acc + d.hours, 0);

  const getSkillBarClass = (score: number) => {
    if (score >= 80) return 'bg-[#10B981]';
    if (score >= 60) return 'bg-[#06B6D4]';
    if (score >= 40) return 'bg-[#F59E0B]';
    return 'bg-[#F87171]';
  };

  const getSkillLabel = (score: number) => {
    if (!hasCompletedDiagnostic && score === 0) {
      return { label: 'Unassessed', color: 'text-[var(--muted)]' };
    }
    if (score >= 80) return { label: 'Mastered', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 60) return { label: 'Developing', color: 'text-cyan-600 dark:text-cyan-400' };
    if (score >= 40) return { label: 'Needs Practice', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Needs Attention', color: 'text-rose-600 dark:text-rose-400' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* 1. Personalized Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Calendar className="w-3.5 h-3.5 text-[#2D5BFF]" />
            <span className="font-semibold">{todayStr}</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)] tracking-tight">
            {user?.name ? `Welcome, ${user.name}!` : 'Welcome to LearnPath AI!'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] max-w-xl leading-relaxed">
            {hasCompletedDiagnostic
              ? 'Your personalized Python learning trajectory is active. Every practice session updates your Bayesian knowledge graph.'
              : 'Your personalized Python learning journey starts here. Complete your diagnostic assessment to discover your strengths and areas for improvement.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            onClick={() => navigate('/diagnostic')}
            className="font-bold shadow-md shadow-[#2D5BFF]/25 cursor-pointer"
          >
            <FileQuestion className="w-4 h-4 fill-white" />
            <span>{hasCompletedDiagnostic ? 'Retake Diagnostic' : 'Start Diagnostic Quiz'}</span>
          </Button>
          {hasCompletedDiagnostic && recommendedItem && (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(`/practice?topic=${recommendedItem.topic_id}`)}
              className="font-semibold cursor-pointer"
            >
              <Play className="w-4 h-4 text-[#2D5BFF]" />
              <span>Continue Learning</span>
            </Button>
          )}
        </div>
      </motion.div>

      {/* 2. Top Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card
            variant="interactive"
            className="p-5 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-xs flex items-center justify-between group"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-[var(--muted)] font-display uppercase tracking-wider">
                Learning Progress
              </span>
              <div className="font-display font-black text-2xl text-[var(--ink)]">
                {overallProgress}%
              </div>
              <span className="text-[11px] text-[var(--muted)] block">
                {hasCompletedDiagnostic
                  ? `${masteredCount} of ${totalTopics} topics mastered`
                  : 'Diagnostic assessment pending'}
              </span>
            </div>
            <div className="group-hover:scale-105 transition-transform duration-300">
              <ProgressRing progress={overallProgress} size={54} strokeWidth={5} color="#2D5BFF" />
            </div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card
            variant="interactive"
            className="p-5 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-xs flex items-center justify-between group"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-[var(--muted)] font-display uppercase tracking-wider">
                Skills Mastered
              </span>
              <div className="font-display font-black text-2xl text-[#10B981]">
                {masteredCount} / {totalTopics}
              </div>
              <span className="text-[11px] text-[var(--muted)] block">
                {hasCompletedDiagnostic ? 'Requires ≥ 80% mastery' : 'Awaiting diagnostic'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card
            variant="interactive"
            className="p-5 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-xs flex items-center justify-between group"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-[var(--muted)] font-display uppercase tracking-wider">
                Study Streak
              </span>
              <div className="font-display font-black text-2xl text-[#FF6B57]">
                {user?.streak ?? 0} {user?.streak === 1 ? 'Day' : 'Days'}
              </div>
              <span className="text-[11px] text-[var(--muted)] block">
                Target: {user?.weeklyHours ?? 5}h / week
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B57]/10 text-[#FF6B57] flex items-center justify-center font-bold text-lg group-hover:scale-110 group-hover:bg-[#FF6B57]/20 transition-all duration-300">
              <Flame className="w-6 h-6 fill-[#FF6B57]" />
            </div>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card
            variant="interactive"
            className="p-5 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-xs flex items-center justify-between group"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-[var(--muted)] font-display uppercase tracking-wider">
                Average Quiz Score
              </span>
              <div className="font-display font-black text-2xl text-[var(--ink)]">
                {averageQuizScore !== null ? `${averageQuizScore}%` : '—'}
              </div>
              <span className="text-[11px] text-[var(--muted)] block">
                {quizHistory.length > 0 ? `${quizHistory.length} quiz completed` : 'No quizzes completed'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/10 text-[#0891B2] dark:text-[#22D3EE] flex items-center justify-center font-bold text-lg group-hover:scale-110 group-hover:bg-[#06B6D4]/20 transition-all duration-300">
              <Zap className="w-6 h-6" />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 3. Skill Strength Analysis & Recommended Next Step */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <Card className="h-full p-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">
                  Your Skill Overview
                </h3>
                <p className="text-xs text-[var(--muted)]">Topic-wise Bayesian mastery calibration</p>
              </div>
              <button
                onClick={() => navigate('/progress')}
                className="text-xs font-bold text-[#2D5BFF] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View Detailed Analysis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {TOPICS.slice(0, 6).map((topic) => {
                const score = masteryMap[topic.id] ?? 0;
                const { label, color } = getSkillLabel(score);
                return (
                  <div key={topic.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--ink)]">{topic.title}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${color}`}>{label}</span>
                        <span className="font-mono font-bold text-[var(--ink)]">
                          {hasCompletedDiagnostic ? `${score}%` : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden border border-[var(--line)]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: hasCompletedDiagnostic ? `${score}%` : '0%' }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${getSkillBarClass(score)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center gap-4 text-[10px] text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Mastered (80%+)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#06B6D4]" /> Developing (60-79%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Needs Practice (40-59%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F87171]" /> Needs Attention (&lt;40%)
              </span>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-6">
          {hasCompletedDiagnostic && recommendedItem && recMeta ? (
            <div className="h-full p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#2D5BFF] via-[#4338CA] to-[#3730A3] text-white shadow-lg shadow-[#2D5BFF]/25 flex flex-col justify-between space-y-6 relative overflow-hidden group">
              <div className="space-y-4 relative z-1">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md flex items-center gap-1.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                    Recommended Next Step
                  </span>
                  <span className="text-xs text-white/80 font-medium">Rank #{recommendedItem.rank} Priority</span>
                </div>
                <div className="space-y-1.5">
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                    {recMeta.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-md">
                    {recommendedItem.why}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md grid grid-cols-3 gap-3 text-center relative z-1">
                <div>
                  <span className="text-[10px] text-white/70 block uppercase font-bold">Topic</span>
                  <span className="text-xs font-bold text-white mt-0.5 block truncate">{recMeta.title.split(' ')[0]}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/70 block uppercase font-bold">Duration</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{recommendedItem.est_minutes} mins</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/70 block uppercase font-bold">Current Score</span>
                  <span className="text-xs font-bold text-[#FFB92E] mt-0.5 block">
                    {masteryMap[recommendedItem.topic_id] ?? 0}%
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 relative z-1">
                <Button
                  size="lg"
                  onClick={() => navigate(`/topics/${recommendedItem.topic_id}`)}
                  className="bg-white text-[#2D5BFF] hover:bg-white/90 hover:text-[#1E40AF] font-bold shadow-md cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Start Lesson</span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(`/practice?topic=${recommendedItem.topic_id}`)}
                  className="border-white/40 text-white hover:bg-white/10 font-semibold cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Practice This Topic</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#2D5BFF]/10 via-[#7C3AED]/10 to-[var(--surface)] border border-[#2D5BFF]/25 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#2D5BFF] text-white flex items-center justify-center shadow-md shadow-[#2D5BFF]/30">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-black text-xl sm:text-2xl text-[var(--ink)]">
                    Diagnostic Calibration Required
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                    Take your 12-question diagnostic assessment to unlock your personalized recommendation queue. Our Bayesian Knowledge Tracing model will evaluate your answers in real time.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] text-xs text-[var(--muted)] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                  <Sparkles className="w-4 h-4 text-[#2D5BFF]" />
                  What you will discover:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px]">
                  <li>Exact competency across 10 Python Fundamentals modules</li>
                  <li>Prerequisite knowledge gaps preventing forward momentum</li>
                  <li>Personalized DAG learning roadmap tailored to your baseline</li>
                </ul>
              </div>

              <Button
                size="lg"
                onClick={() => navigate('/diagnostic')}
                className="w-full font-bold shadow-md shadow-[#2D5BFF]/25 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white mr-1" />
                <span>Start Diagnostic Assessment</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Roadmap & Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <Card className="h-full p-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">
                  Learning Roadmap Preview
                </h3>
                <p className="text-xs text-[var(--muted)]">Prerequisite progression for Python Fundamentals</p>
              </div>
              {hasCompletedDiagnostic && (
                <button
                  onClick={() => navigate('/roadmap')}
                  className="text-xs font-bold text-[#2D5BFF] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>View Full Learning Path</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {hasCompletedDiagnostic && roadmap.items.length > 0 ? (
              <div className="space-y-3">
                {roadmap.items.slice(0, 4).map((item, idx) => {
                  const meta = TOPIC_MAP[item.topic_id];
                  if (!meta) return null;
                  const isCompleted = item.status === 'skip';
                  const inProgress = item.status === 'learn' || item.status === 'practice';
                  return (
                    <div
                      key={item.topic_id}
                      onClick={() => navigate(`/topics/${item.topic_id}`)}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer hover:-translate-y-0.5 ${
                        inProgress
                          ? 'bg-[#2D5BFF]/5 border-[#2D5BFF]/45 shadow-xs'
                          : 'bg-[var(--surface-muted)] border-[var(--line)] hover:border-[#2D5BFF]/40 hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : inProgress
                              ? 'bg-[#2D5BFF] text-white shadow-xs'
                              : 'bg-[var(--line)] text-[var(--muted)]'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xs text-[var(--ink)]">
                            {meta.title}
                          </h4>
                          <span className="text-[10px] text-[var(--muted)]">{item.est_minutes} min estimated</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          size="sm"
                          variant={
                            isCompleted
                              ? 'success'
                              : inProgress
                              ? 'info'
                              : 'outline'
                          }
                        >
                          {item.status}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[var(--surface-muted)] border border-dashed border-[var(--line)] text-center space-y-3">
                <Compass className="w-8 h-8 text-[var(--muted)] mx-auto opacity-60" />
                <h4 className="font-display font-bold text-sm text-[var(--ink)]">
                  Your personalized learning path will appear after you complete your diagnostic assessment.
                </h4>
                <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
                  Take the diagnostic quiz to generate a dynamic DAG roadmap based on your actual responses.
                </p>
                <Button size="sm" onClick={() => navigate('/diagnostic')} className="mt-2 font-semibold">
                  Start Diagnostic Quiz
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="h-full p-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">
                  Weekly Learning Activity
                </h3>
                <p className="text-xs text-[var(--muted)]">Study time across last 7 days</p>
              </div>
              <span className="text-xs font-bold text-[#2D5BFF]">
                {totalWeeklyHours > 0 ? `${totalWeeklyHours} hrs total` : '0 hrs this week'}
              </span>
            </div>

            {hasCompletedDiagnostic && totalWeeklyHours > 0 ? (
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                    <XAxis dataKey="day" stroke="var(--muted)" fontSize={11} />
                    <YAxis stroke="var(--muted)" fontSize={11} />
                    <Tooltip />
                    <Bar
                      dataKey="hours"
                      fill="#2D5BFF"
                      radius={[6, 6, 0, 0]}
                      name="Hours"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-[var(--surface-muted)] rounded-2xl border border-dashed border-[var(--line)] space-y-2">
                <BarChart2 className="w-8 h-8 text-[var(--muted)] opacity-60" />
                <p className="font-display font-bold text-xs text-[var(--ink)]">
                  Your learning analytics will appear as you complete assessments and lessons.
                </p>
                <span className="text-[11px] text-[var(--muted)]">
                  Active study hours and progress trends are tracked automatically from your sessions.
                </span>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 5. Activities & Copilot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <Card className="p-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[var(--ink)]">
                Recent Learning Activity
              </h3>
              <span className="text-xs text-[var(--muted)]">Verified Event Log</span>
            </div>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)] hover:border-[#2D5BFF]/30 transition-all flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 bg-[#2D5BFF] shadow-xs">
                      {act.type === 'diagnostic' ? (
                        <FileQuestion className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display font-bold text-xs text-[var(--ink)]">
                          {act.title}
                        </h4>
                        <span className="text-[10px] text-[var(--muted)]">{act.time}</span>
                      </div>
                      <p className="text-xs text-[var(--muted)]">{act.result}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[var(--surface-muted)] border border-dashed border-[var(--line)] text-center space-y-2">
                <Activity className="w-7 h-7 text-[var(--muted)] mx-auto opacity-60" />
                <p className="text-xs font-semibold text-[var(--ink)]">
                  You haven't completed any quizzes or activities yet.
                </p>
                <p className="text-[11px] text-[var(--muted)]">
                  Activity logs update automatically as you take diagnostic assessments and solve practice drills.
                </p>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-5">
          <AICopilotPanel />
        </div>
      </div>
    </div>
  );
};
