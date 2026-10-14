import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { GoalItem } from '../types';
import { Button } from '../components/ui/Button';
import { ProgressRing } from '../components/ui/ProgressRing';
import {
  Target,
  Clock,
  Calendar,
  Award,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export const GoalsPage: React.FC = () => {
  const { user, setUser } = useAppStore();
  const [dailyMinutes, setDailyMinutes] = useState(45);
  const [weeklyHours, setWeeklyHours] = useState(user?.weeklyHours || 5);
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const userGoals: GoalItem[] = [
    {
      id: 'g-1',
      title: 'Complete Diagnostic Assessment',
      target: 1,
      current: user?.hasCompletedDiagnostic ? 1 : 0,
      unit: 'assessment',
      category: 'milestone',
    },
    {
      id: 'g-2',
      title: 'Earn Weekly Knowledge Points',
      target: 200,
      current: user?.xp ?? 0,
      unit: 'XP',
      category: 'weekly',
    },
    {
      id: 'g-3',
      title: 'Study Streak Consistency',
      target: 7,
      current: user?.streak ?? 0,
      unit: 'days',
      category: 'daily',
    },
  ];

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ weeklyHours });
    setSavedSuccess(true);
    toast.success('Goals & study targets updated successfully');
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#2D5BFF]/10 text-[#2D5BFF] mb-2">
          <Target className="w-3.5 h-3.5" />
          <span>Goal Tracking & Milestones</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
          My Learning Goals
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
          Set study durations, target milestones, and monitor your progress across daily and weekly horizons.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>Targets updated and synchronized with your adaptive roadmap.</span>
        </div>
      )}

      <form
        onSubmit={handleSaveTargets}
        className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-6"
      >
        <h3 className="font-display font-bold text-base text-[var(--ink)]">
          Calibrate Target Durations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2D5BFF]" />
              Daily Study Target (Minutes)
            </label>
            <input
              type="number"
              min="15"
              max="180"
              step="5"
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF] font-mono font-bold"
            />
            <span className="text-[10px] text-[var(--muted)]">Recommended: 45 min/day</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
              Weekly Target (Hours)
            </label>
            <input
              type="number"
              min="2"
              max="30"
              step="1"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#7C3AED] font-mono font-bold"
            />
            <span className="text-[10px] text-[var(--muted)]">Calculates weekly roadmap groups</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#10B981]" />
              Target Fluency Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#10B981] font-mono"
            />
            <span className="text-[10px] text-[var(--muted)]">Milestone trajectory target</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" size="md" className="font-bold cursor-pointer">
            Update Targets
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-display font-extrabold text-lg text-[var(--ink)]">
          Active Milestone Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {userGoals.map((g) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            return (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold font-display uppercase tracking-wider text-[var(--muted)]">
                      {g.category} Target
                    </span>
                    <h4 className="font-display font-bold text-sm text-[var(--ink)] mt-0.5">
                      {g.title}
                    </h4>
                  </div>
                  <ProgressRing progress={pct} size={42} strokeWidth={4} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[var(--ink)]">
                      {g.current} / {g.target} {g.unit}
                    </span>
                    <span className="text-[#2D5BFF] font-bold font-mono">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden border border-[var(--line)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2D5BFF] to-[#10B981] transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
